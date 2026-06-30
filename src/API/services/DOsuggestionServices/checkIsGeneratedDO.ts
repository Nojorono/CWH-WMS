import axiosInstance from "../../../DynamicAPI/AxiosInstance";
import { EndPoint } from "../../../utils/EndPoint";


export const checkIsGenerated = async (callplanNumber: string): Promise<any | null> => {
    try {
        const encodedNumber = encodeURIComponent(callplanNumber);
        const response = await axiosInstance.get(`${EndPoint}do-suggestion/callplan/${encodedNumber}`);        

        if (response.data?.success && Array.isArray(response.data.data) && response.data.data.length > 0) {
            return response.data.data[0];
        }

        return null;
    } catch (error: any) {
        // Cek error menggunakan property dari error axios
        if (error.response?.status === 404) {
            return null;
        }

        console.error("Gagal cek status generate:", error);
        throw new Error("Gagal melakukan pengecekan status generate ke database lokal.");
    }
};