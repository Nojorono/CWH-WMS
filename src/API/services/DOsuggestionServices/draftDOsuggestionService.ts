import axiosInstance from "../../../DynamicAPI/AxiosInstance";
import { EndPoint } from "../../../utils/EndPoint";
import { DOSuggestionResponse } from "../../types/draftDOsuggestion";

export const getDOSuggestionByCallplan = async (
    callPlanNumber: string
): Promise<DOSuggestionResponse> => {
    try {
        const response = await axiosInstance.post<DOSuggestionResponse>(
            `${EndPoint}do-suggestion/callplan/find`,
            {
                callplanNumber: callPlanNumber,
            }
        );

        return response.data;
    } catch (error: any) {
        console.error(error);
        throw error;
    }
};

/**
 * Mengambil semua data DO Suggestion (List untuk History / Submitted)
 */
export const getSubmittedSuggestions = async (
    dateStart: string,
    organizationId: string,
    status: string
): Promise<DOSuggestionResponse> => {
    try {
        const response = await axiosInstance.get<DOSuggestionResponse>(
            `${EndPoint}do-suggestion/callplan/date-start/${dateStart}/organization/${organizationId}`,
            {
                params: { status }
            }
        );

        return response.data;
    } catch (error) {
        console.error(`Error fetching DO Suggestions:`, error);
        throw error;
    }
};