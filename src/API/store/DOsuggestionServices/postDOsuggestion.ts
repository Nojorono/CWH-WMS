import axiosInstance from "../../../DynamicAPI/AxiosInstance";
import { EndPoint } from "../../../utils/EndPoint"; // Pastikan path benar
import { DOSuggestionPayload } from "../../types/DOsuggestion";

export const postDOsuggestion = async (payload: DOSuggestionPayload): Promise<any> => {

    try {
        const response = await axiosInstance.post(`${EndPoint}do-suggestion`, payload);
        return response.data;
    } catch (error) {
        console.error("Gagal melakukan POST DO Suggestion:", error);
        throw error;
    }
};

// Di dalam useDOSuggestion atau file service terkait
export const updateDO = async (payload: any) => {

    try {
        return await axiosInstance.post(`${EndPoint}do-suggestion`, payload);
    } catch (error) {
        console.error("Gagal melakukan UPDATE DO Suggestion:", error);
        throw error;
    }
};