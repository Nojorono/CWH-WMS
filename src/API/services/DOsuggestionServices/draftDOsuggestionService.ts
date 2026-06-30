import axiosInstance from "../../../DynamicAPI/AxiosInstance";
import { EndPoint } from "../../../utils/EndPoint";
import { DOSuggestionResponse } from "../../types/draftDOsuggestion";

/**
 * Mengambil data DO Suggestion berdasarkan callplan_number
 */
export const getDOSuggestionByCallplan = async (
    callPlanNumber: string
): Promise<DOSuggestionResponse> => {
    try {
        const encodedNumber = encodeURIComponent(callPlanNumber);
        const response = await axiosInstance.get<DOSuggestionResponse>(
            `${EndPoint}do-suggestion/callplan/${encodedNumber}`
        );
        return response.data;
    } catch (error) {
        console.error(`Error fetching DO Suggestion for ${callPlanNumber}:`, error);
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

        console.log("res get DO", response);
        
        return response.data;
    } catch (error) {
        console.error(`Error fetching DO Suggestions:`, error);
        throw error;
    }
};