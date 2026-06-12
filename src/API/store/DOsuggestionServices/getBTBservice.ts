import axios from 'axios';
import { CallPlanBindings, SnowflakeApiResponse, BTBResponse } from '../../types/callPlan';
import { DWHCallplanAPI, DWHCallplanAPItoken } from '../../../utils/EndPoint'

const SNOWFLAKE_API = DWHCallplanAPI;
const TOKEN = DWHCallplanAPItoken;

export const getBTB = async (params: CallPlanBindings): Promise<BTBResponse[]> => {
    try {
        // 1. Tentukan apakah SALES_NIK disertakan
        const hasSalesNik = !!params.SALES_NIK;
        const salesNikFilter = hasSalesNik ? "AND cp.SALES_NIK = ?" : "";

        // 2. Susun base statement
        const statement = `
            SELECT OBJECT_CONSTRUCT(
                'AHOM_NAME', COALESCE(cp.AHOM_NAME,''), 
                'AHOM_NIK', COALESCE(cp.AHOM_NIK,''), 
                'CABANG', COALESCE(cp.CABANG,''), 
                'CALL_PLAN_END_DATE', COALESCE(cp.CALL_PLAN_END_DATE,''), 
                'CALL_PLAN_NUMBER', COALESCE(cp.CALL_PLAN_NUMBER,''), 
                'CALL_PLAN_START_DATE', COALESCE(cp.CALL_PLAN_START_DATE,''), 
                'ROUTE_NUMBER', COALESCE(cp.ROUTE_NUMBER,''), 
                'SALES_NAME', COALESCE(cp.SALES_NAME,''), 
                'SALES_NIK', COALESCE(cp.SALES_NIK,''), 
                'SALES_SUPERVISOR_NAME', COALESCE(cp.SALES_SUPERVISOR_NAME,''), 
                'SALES_SUPERVISOR_NIK', COALESCE(cp.SALES_SUPERVISOR_NIK,''), 
                'BTB', COALESCE(ARRAY_AGG(OBJECT_CONSTRUCT(
                    'BTB_NUMBER', COALESCE(b.BTB_NUMBER,''), 
                    'TGL_BTB', COALESCE(TO_VARCHAR(b.TANGGAL_BTB),''), 
                    'SKU_BTB', COALESCE(b.PRODUCT_SKU,''), 
                    'QTY_SKU', COALESCE(TO_VARCHAR(b.QTY_BTB),'')
                )) WITHIN GROUP (ORDER BY b.BTB_NUMBER, b.PRODUCT_SKU), ARRAY_CONSTRUCT())
            ) AS DATA 
            FROM DEV_SFA_OUTSYSTEMS.SFA.V_API_CALL_PLAN cp 
            LEFT JOIN DEV_SFA_OUTSYSTEMS.SFA.V_API_BTB b ON cp.CABANG = b.CABANG AND cp.SALES_NIK = b.SALES_NIK AND TO_DATE(cp.CALL_PLAN_START_DATE) = b.TANGGAL_BTB 
            WHERE cp.CABANG = ? 
            AND cp.SALES_SUPERVISOR_NIK = ? 
            AND (cp.CALL_PLAN_START_DATE = ? OR cp.CALL_PLAN_START_DATE IS NULL)
            ${salesNikFilter}
            GROUP BY cp.AHOM_NAME, cp.AHOM_NIK, cp.CABANG, cp.CALL_PLAN_END_DATE, cp.CALL_PLAN_NUMBER, cp.CALL_PLAN_START_DATE, cp.ROUTE_NUMBER, cp.SALES_NAME, cp.SALES_NIK, cp.SALES_SUPERVISOR_NAME, cp.SALES_SUPERVISOR_NIK
        `;

        // 3. Susun bindings dinamis
        let bindings: any = {
            "1": { "type": "TEXT", "value": params.CABANG },
            "2": { "type": "TEXT", "value": params.SALES_SUPERVISOR_NIK },
            "3": { "type": "TEXT", "value": params.CALL_PLAN_START_DATE }
        };

        if (hasSalesNik) {
            bindings["4"] = { "type": "TEXT", "value": params.SALES_NIK };
        }

        const response = await axios.post<SnowflakeApiResponse>(
            SNOWFLAKE_API,
            {
                statement,
                database: "DEV_SFA_OUTSYSTEMS",
                schema: "SFA",
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

        return response.data.data.map((row) => JSON.parse(row[0]) as BTBResponse);

    } catch (error) {
        console.error("Gagal mengambil data BTB:", error);
        throw new Error("Terjadi kesalahan saat berkomunikasi dengan server Snowflake.");
    }
};