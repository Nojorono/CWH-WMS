import axios from "axios";
import axiosInstance from "../../../DynamicAPI/AxiosInstance";
import { EndPoint } from "../../../utils/EndPoint";
import { DOSuggestionPayload } from "../../types/DOsuggestion";

const getErrorMessage = (error: unknown): string => {
    if (axios.isAxiosError(error)) {
        const data = error.response?.data;

        if (Array.isArray(data?.message)) {
            return data.message.join(", ");
        }

        if (typeof data?.message === "string") {
            return data.message;
        }

        if (typeof data?.error === "string") {
            return data.error;
        }

        return error.message;
    }

    return error instanceof Error ? error.message : "Terjadi kesalahan.";
};

export const postDOsuggestion = async (
    payload: DOSuggestionPayload,
): Promise<any> => {
    try {
        const response = await axiosInstance.post(
            `${EndPoint}do-suggestion`,
            payload,
        );
        return response.data;
    } catch (error) {
        const message = getErrorMessage(error);
        console.error("Gagal melakukan POST DO Suggestion:", message);
        throw new Error(message);
    }
};

export const updateDO = async (payload: any) => {
    try {
        const response = await axiosInstance.post(
            `${EndPoint}do-suggestion`,
            payload,
        );
        return response.data;
    } catch (error) {
        const message = getErrorMessage(error);
        console.error("Gagal melakukan UPDATE DO Suggestion:", message);
        throw new Error(message);
    }
};

export const updateBatchDO = async (payload: any) => {
    try {
        const response = await axiosInstance.post(
            `${EndPoint}do-suggestion/batch`,
            payload,
        );
        return response.data;
    } catch (error) {
        const message = getErrorMessage(error);
        console.error("Gagal melakukan UPDATE Batch DO Suggestion:", message);
        throw new Error(message);
    }
};