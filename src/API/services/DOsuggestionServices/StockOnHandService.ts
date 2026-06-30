import axiosInstance from "../../../DynamicAPI/AxiosInstance";
import { EndPoint } from "../../../utils/EndPoint";
import { StockOnHand } from "../../types/stockOnHand";

// 1. Definisikan Interface Wrapper untuk response API Anda
interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
    timestamp: string;
    path: string;
}

interface GetStockParams {
    organization_code: string;
    subinventory_code: string;
    date: string;
}

export const getStockOnHand = async (params: GetStockParams): Promise<StockOnHand[]> => {
    try {
        // 2. Gunakan ApiResponse<StockOnHand[]> sebagai tipe response axios
        const response = await axiosInstance.get<ApiResponse<StockOnHand[]>>(
            `${EndPoint}outbound-sales/on-hand`,
            {
                params: {
                    organization_code: params.organization_code,
                    subinventory_code: params.subinventory_code,
                    date: params.date,
                },
            }
        );

        return response.data?.data ?? [];
    } catch (error) {
        console.error("Error fetching Stock On Hand:", error);
        throw error;
    }
};