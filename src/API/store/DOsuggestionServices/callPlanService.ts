import axios from 'axios';
import { CallPlanBindings, SupervisorData, SnowflakeApiResponse } from '../../types/callPlan';

const SNOWFLAKE_API = "https://A8518400981671-WY39536.snowflakecomputing.com/api/v2/statements";
const TOKEN = "eyJraWQiOiIxMTg0NDIzMTU4NzAyMTgiLCJhbGciOiJFUzI1NiJ9.eyJwIjoiMTgwNzI4Nzc2MToxODA3Mjg5MjIxIiwiaXNzIjoiU0Y6MTA1MCIsImV4cCI6MTgxMjA5ODQzOX0.be7v-M0MiipzPs3mew-eJ-bYjIIoSNyIqomQeNYUpDc4sIwqDyWJqL-oZ3hJfXEFMWuRgEX36c6GMEOkPq3DZw"

// Perhatikan return type sekarang adalah SupervisorData[]
export const getCallPlan = async (params: CallPlanBindings): Promise<SupervisorData[]> => {
    try {
        const response = await axios.post<SnowflakeApiResponse>(
            SNOWFLAKE_API,
            {
                "statement": "SELECT OBJECT_CONSTRUCT('SALES_SUPERVISOR_NIK', SALES_SUPERVISOR_NIK, 'SALES_SUPERVISOR_NAME', MAX(SALES_SUPERVISOR_NAME), 'DETAIL', ARRAY_AGG(OBJECT_CONSTRUCT('SALES_NIK', SALES_NIK, 'SALES_NAME', SALES_NAME, 'CALL_PLAN_NUMBER', CALL_PLAN_NUMBER, 'ROUTE_NUMBER', ROUTE_NUMBER, 'CABANG', CABANG))) AS DATA FROM DEV_SFA_OUTSYSTEMS.SFA.V_API_CALL_PLAN WHERE CALL_PLAN_START_DATE = ? AND CABANG = ? AND SALES_SUPERVISOR_NIK = ? GROUP BY SALES_SUPERVISOR_NIK",
                "database": "DEV_SFA_OUTSYSTEMS",
                "schema": "SFA",
                "warehouse": "TASK_SFA",
                "role": "ROLE_API",
                "bindings": {
                    "1": { "type": "TEXT", "value": params.CALL_PLAN_START_DATE },
                    "2": { "type": "TEXT", "value": params.CABANG },
                    "3": { "type": "TEXT", "value": params.SALES_SUPERVISOR_NIK }
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