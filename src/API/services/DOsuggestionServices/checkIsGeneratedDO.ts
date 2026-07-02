import axiosInstance from "../../../DynamicAPI/AxiosInstance";
import { EndPoint } from "../../../utils/EndPoint";

export const checkIsGenerated = async (
    callplanNumber: string
): Promise<any | null> => {
    try {
        const response = await axiosInstance.post(
            `${EndPoint}do-suggestion/callplan/find`,
            { callplanNumber }
        );

        const result = response.data;

        if (!result?.success) {
            throw new Error(result?.message || "Gagal mengecek status generate.");
        }

        // Belum ada di DB
        if (!Array.isArray(result.data) || result.data.length === 0) {
            return null;
        }

        // Sudah ada di DB
        return result.data[0];
    } catch (error: any) {
        throw new Error(
            error.response?.data?.message ||
            error.message ||
            "Gagal melakukan pengecekan status generate."
        );
    }
};