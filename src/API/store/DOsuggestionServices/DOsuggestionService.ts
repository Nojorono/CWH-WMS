import axios from 'axios';
import { SnowflakeApiResponse } from '../../types/callPlan';
import { SuggestionSummary } from '../../types/DOsuggestion';
import { DWHCallplanAPI, DWHCallplanAPItoken } from '../../../utils/EndPoint';

const SNOWFLAKE_API = DWHCallplanAPI;
const TOKEN = DWHCallplanAPItoken;

// Ubah return type menjadi Promise<SuggestionSummary>
export const getDOsuggestion = async (params: any): Promise<SuggestionSummary> => {
    try {
        const response = await axios.post<SnowflakeApiResponse>(
            SNOWFLAKE_API,
            {
                "statement": "CALL NEW_DEV_SFA_OUTSYSTEMS.GOLD.SP_API_DO_SUGGESTION(START_PRED=>?, END_PRED=>?, V_CABANG=>?, V_RUTE=>?, V_CALLPLAN=>?, V_SALES=>?, V_NIK=>?)",
                "database": "NEW_DEV_SFA_OUTSYSTEMS",
                "schema": "GOLD",
                "warehouse": "TASK_SFA",
                "role": "ROLE_API",
                "bindings": {
                    "1": { "type": "TEXT", "value": params.CALL_PLAN_START_DATE },
                    "2": { "type": "TEXT", "value": params.CALL_PLAN_END_DATE },
                    "3": { "type": "TEXT", "value": params.CABANG },
                    "4": { "type": "TEXT", "value": null },
                    "5": { "type": "TEXT", "value": null },
                    "6": { "type": "TEXT", "value": null },
                    "7": { "type": "TEXT", "value": params.SALES_NIK }
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

        // Parsing logic:
        const rawJsonString = response.data.data[0][0];
        const parsedData: SuggestionSummary = JSON.parse(rawJsonString);


        console.log("parsedData", parsedData);

        return parsedData;

    } catch (error) {
        console.error("Gagal mengambil Suggestion Summary:", error);
        throw new Error("Terjadi kesalahan saat mengambil data suggestion dari Snowflake.");
    }
};