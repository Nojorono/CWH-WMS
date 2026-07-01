import axios from 'axios';
import { CallPlanBindings, SnowflakeApiResponse } from '../../types/callPlan';
import { DWHCallplanAPI, DWHCallplanAPItoken } from '../../../utils/EndPoint';
import { BTBFlatItem } from '../../types/BTBdata';

const SNOWFLAKE_API = DWHCallplanAPI;
const TOKEN = DWHCallplanAPItoken;

export const getBTB = async (params: CallPlanBindings): Promise<BTBFlatItem[]> => {
    try {
        const statement = `
            SELECT OBJECT_CONSTRUCT(
                'BTB_NUMBER', COALESCE(BTB_NUMBER,''), 
                'TANGGAL_BTB', COALESCE(TO_VARCHAR(TANGGAL_BTB),'') , 
                'CABANG', COALESCE(CABANG,''), 
                'SALES_NIK', COALESCE(SALES_NIK,''), 
                'SALES_NAME', COALESCE(SALES_NAME,''), 
                'PRODUCT_SKU', COALESCE(PRODUCT_SKU,''), 
                'PRODUCT_NAME', COALESCE(PRODUCT_NAME,''),
                'INVENTORYID', COALESCE(INVENTORYID,''), 
                'QTY_BTB', COALESCE(TO_VARCHAR(QTY_BTB),'0')
            ) AS DATA 
            FROM NEW_DEV_SFA_OUTSYSTEMS.Bronze.V_API_BTB 
            WHERE CABANG = ? AND TANGGAL_BTB = ?
        `;

        const bindings: any = {
            "1": { "type": "TEXT", "value": params.CABANG },
            "2": { "type": "TEXT", "value": params.CALL_PLAN_START_DATE }
        };

        const headers = {
            'Authorization': `Bearer ${TOKEN}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Snowflake-Authorization-Token-Type': 'PROGRAMMATIC_ACCESS_TOKEN'
        };

        // 1. Eksekusi Request Pertama (POST)
        const response = await axios.post<SnowflakeApiResponse>(
            SNOWFLAKE_API,
            {
                statement,
                database: "NEW_DEV_SFA_OUTSYSTEMS",
                schema: "Bronze",
                warehouse: "TASK_SFA",
                role: "ROLE_API",
                bindings
            },
            { headers }
        );

        // Tampung data dari partisi pertama
        let allRows: any[] = response.data.data || [];

        const statementHandle = response.data.statementHandle;
        const partitionInfo = response.data.resultSetMetaData?.partitionInfo || [];
        const partitionCount = partitionInfo.length;

        // 2. Jika partisi lebih dari 1, fetch sisanya (Mulai dari index 1)
        if (partitionCount > 1) {
            const partitionPromises = [];

            // Siapkan promise array untuk mempercepat proses (Parallel Request)
            for (let i = 1; i < partitionCount; i++) {
                // Endpoint untuk partisi adalah {BASE_URL}/{statementHandle}?partition={index}
                const partitionUrl = `${SNOWFLAKE_API}/${statementHandle}?partition=${i}`;

                partitionPromises.push(
                    axios.get<SnowflakeApiResponse>(partitionUrl, { headers })
                );
            }

            // Tunggu semua request partisi selesai
            const partitionResponses = await Promise.all(partitionPromises);

            // Gabungkan semua data dari respons partisi ke allRows
            for (const pResp of partitionResponses) {
                if (pResp.data && pResp.data.data) {
                    allRows = allRows.concat(pResp.data.data);
                }
            }
        }

        // 3. Parsing hasil akhir flat array yang sudah lengkap
        return allRows.map((row) => JSON.parse(row[0]) as BTBFlatItem);

    } catch (error) {
        console.error("Gagal mengambil data BTB:", error);
        throw new Error("Terjadi kesalahan saat berkomunikasi dengan server Snowflake.");
    }
};