import axios from 'axios';
import { CallPlanBindings, SupervisorData, SnowflakeApiResponse } from '../../types/callPlan';
import { DWHCallplanAPI, DWHCallplanAPItoken } from '../../../utils/EndPoint'

const SNOWFLAKE_API = DWHCallplanAPI;
const TOKEN = DWHCallplanAPItoken;

export const generateCallPlan = async (params: CallPlanBindings): Promise<SupervisorData[]> => {
    try {
        const response = await axios.post<SnowflakeApiResponse>(
            SNOWFLAKE_API,
            {
                "statement": "SELECT OBJECT_CONSTRUCT('AHOM_NAME', COALESCE(AHOM_NAME, ''), 'AHOM_NIK', COALESCE(AHOM_NIK, ''), 'CABANG', COALESCE(CABANG, ''), 'CALL_PLAN_END_DATE', COALESCE(CALL_PLAN_END_DATE, ''), 'CALL_PLAN_NUMBER', COALESCE(CALL_PLAN_NUMBER, ''), 'CALL_PLAN_START_DATE', COALESCE(CALL_PLAN_START_DATE, ''), 'ROUTE_NUMBER', COALESCE(ROUTE_NUMBER, ''), 'SALES_NAME', COALESCE(SALES_NAME, ''), 'SALES_NIK', COALESCE(SALES_NIK, ''), 'SALES_SUPERVISOR_NAME', COALESCE(SALES_SUPERVISOR_NAME, ''), 'SALES_SUPERVISOR_NIK', COALESCE(SALES_SUPERVISOR_NIK, '')) AS DATA FROM DEV_SFA_OUTSYSTEMS.SFA.V_API_CALL_PLAN WHERE CABANG = ? AND SALES_SUPERVISOR_NIK = ? AND (CALL_PLAN_START_DATE = ? OR CALL_PLAN_START_DATE IS NULL)",
                "database": "DEV_SFA_OUTSYSTEMS",
                "schema": "SFA",
                "warehouse": "TASK_SFA",
                "role": "ROLE_API",
                "bindings": {
                    "1": { "type": "TEXT", "value": params.CABANG },
                    "2": { "type": "TEXT", "value": params.SALES_SUPERVISOR_NIK },
                    "3": { "type": "TEXT", "value": params.CALL_PLAN_START_DATE }
                }
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

        // Parsing hierarkis: Mengubah setiap row menjadi SupervisorData
        return response.data.data.map((row) => JSON.parse(row[0]) as SupervisorData);

    } catch (error) {
        console.error("Gagal mengambil Call Plan:", error);
        throw new Error("Terjadi kesalahan saat berkomunikasi dengan server Snowflake.");
    }
};