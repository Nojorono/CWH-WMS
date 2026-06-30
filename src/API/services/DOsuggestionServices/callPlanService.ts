import axios from 'axios';
import { CallPlanBindings, SupervisorData, CallPlanDetail, SnowflakeApiResponse } from '../../types/callPlan';
import { DWHCallplanAPI, DWHCallplanAPItoken } from '../../../utils/EndPoint';
import { showErrorToast } from '../../../components/toast';

export const getCallPlan = async (params: CallPlanBindings): Promise<SupervisorData[]> => {
    try {
        const response = await axios.post<SnowflakeApiResponse>(
            DWHCallplanAPI,
            {
                "statement": "SELECT OBJECT_CONSTRUCT('AHOM_NAME', COALESCE(AHOM_NAME, ''), 'AHOM_NIK', COALESCE(AHOM_NIK, ''), 'CABANG', COALESCE(CABANG, ''),'ISLUARKOTA', COALESCE(ISLUARKOTA, FALSE), 'CALL_PLAN_END_DATE', COALESCE(CALL_PLAN_END_DATE, ''), 'CALL_PLAN_NUMBER', COALESCE(CALL_PLAN_NUMBER, ''), 'CALL_PLAN_START_DATE', COALESCE(CALL_PLAN_START_DATE, ''), 'ROUTE_NUMBER', COALESCE(ROUTE_NUMBER, ''), 'SALES_NAME', COALESCE(SALES_NAME, ''), 'SALES_NIK', COALESCE(SALES_NIK, ''), 'SALES_SUPERVISOR_NAME', COALESCE(SALES_SUPERVISOR_NAME, ''), 'SALES_SUPERVISOR_NIK', COALESCE(SALES_SUPERVISOR_NIK, '')) AS DATA FROM NEW_DEV_SFA_OUTSYSTEMS.Bronze.V_API_CALL_PLAN WHERE CABANG = ? AND SALES_SUPERVISOR_NIK = ? AND (CALL_PLAN_START_DATE = ? OR CALL_PLAN_START_DATE IS NULL)",
                "database": "NEW_DEV_SFA_OUTSYSTEMS",
                "schema": "Bronze",
                "warehouse": "TASK_SFA",
                "role": "ROLE_API",
                "bindings": {
                    "1": { "type": "TEXT", "value": params.CABANG },
                    "2": { "type": "TEXT", "value": params.SALES_SUPERVISOR_NIK },
                    "3": { "type": "TEXT", "value": params.CALL_PLAN_START_DATE },
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${DWHCallplanAPItoken}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Snowflake-Authorization-Token-Type': 'PROGRAMMATIC_ACCESS_TOKEN'
                }
            }
        );

        // 1. Parsing hasil flat dari Snowflake
        const flatRows = response.data.data.map((row) => JSON.parse(row[0]));

        // 2. Siapkan Map untuk Grouping menjadi SupervisorData
        const groupedMap = new Map<string, SupervisorData>();

        flatRows.forEach((item: any) => {
            const spvNik = item.SALES_SUPERVISOR_NIK;

            // Buat Header SPV jika belum ada di dalam Map
            if (!groupedMap.has(spvNik)) {
                groupedMap.set(spvNik, {
                    AHOM_NAME: item.AHOM_NAME,
                    AHOM_NIK: item.AHOM_NIK,
                    CABANG: item.CABANG,
                    SALES_SUPERVISOR_NAME: item.SALES_SUPERVISOR_NAME,
                    SALES_SUPERVISOR_NIK: item.SALES_SUPERVISOR_NIK,
                    DETAIL: []
                });
            }

            // Bentuk detail Salesman sesuai tipe CallPlanDetail
            const detailItem: CallPlanDetail = {
                CABANG: item.CABANG,
                CALL_PLAN_NUMBER: item.CALL_PLAN_NUMBER,
                ROUTE_NUMBER: item.ROUTE_NUMBER,
                SALES_NAME: item.SALES_NAME,
                SALES_NIK: item.SALES_NIK,
                CALL_PLAN_START_DATE: item.CALL_PLAN_START_DATE,
                CALL_PLAN_END_DATE: item.CALL_PLAN_END_DATE,
                is_active_plan: item.CALL_PLAN_NUMBER !== "",
                ISLUARKOTA: item.ISLUARKOTA
            };

            // Masukkan Salesman ke dalam array DETAIL milik SPV terkait
            groupedMap.get(spvNik)?.DETAIL.push(detailItem);
        });

        // 3. Kembalikan dalam bentuk Array of SupervisorData
        return Array.from(groupedMap.values());

    } catch (error) {
        showErrorToast("Gagal ambil Master Callplan,terjadi kesalahan saat berkomunikasi dengan server DWH.")
        console.error("Gagal mengambil Master Call Plan:", error);
        throw new Error("Terjadi kesalahan saat berkomunikasi dengan server DWH.");
    }
};