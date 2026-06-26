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
                'QTY_BTB', COALESCE(TO_VARCHAR(QTY_BTB),'')
            ) AS DATA 
            FROM NEW_DEV_SFA_OUTSYSTEMS.Bronze.V_API_BTB 
            WHERE CABANG = ? AND TANGGAL_BTB = ?
        `;

        // Bindings hanya butuh 2: CABANG dan TANGGAL
        const bindings: any = {
            "1": { "type": "TEXT", "value": params.CABANG },
            "2": { "type": "TEXT", "value": params.CALL_PLAN_START_DATE }
        };

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
            {
                headers: {
                    'Authorization': `Bearer ${TOKEN}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Snowflake-Authorization-Token-Type': 'PROGRAMMATIC_ACCESS_TOKEN'
                }
            }
        );

        // Parsing hasil flat array
        return response.data.data.map((row) => JSON.parse(row[0]) as BTBFlatItem);

    } catch (error) {
        console.error("Gagal mengambil data BTB:", error);
        throw new Error("Terjadi kesalahan saat berkomunikasi dengan server Snowflake.");
    }
};