import dayjs from "dayjs";
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
}

export const getStockOnHand = async (params: GetStockParams): Promise<StockOnHand[]> => {

    // Menggunakan tanggal hari ini (now)
    const sohDate = dayjs().format('YYYY-MM-DD');

    try {
        const response = await axiosInstance.get<ApiResponse<StockOnHand[]>>(
            `${EndPoint}outbound-sales/on-hand`,
            {
                params: {
                    organization_code: params.organization_code,
                    subinventory_code: params.subinventory_code,
                    date: sohDate,
                },
            }
        );

        const rawData = response.data?.data ?? [];

        // Map untuk menyimpan data unik (ter-update)
        const uniqueStockMap = new Map<string, StockOnHand>();

        rawData.forEach((item) => {
            const orgCode = item.organization_code || "";
            const itemId = item.inventory_item_id || "";

            // Cukup gunakan orgCode dan itemId saja untuk key unik duplikasi
            const compositeKey = `${orgCode}_${itemId}`;
            const existingItem = uniqueStockMap.get(compositeKey);

            if (!existingItem) {
                uniqueStockMap.set(compositeKey, item);
            } else {
                // Parsing tanggal untuk dibandingkan
                const existingTime = new Date(existingItem.createdAt || 0).getTime();
                const newTime = new Date(item.createdAt || 0).getTime();

                if (newTime > existingTime) {
                    // Ambil yang paling baru secara tanggal
                    uniqueStockMap.set(compositeKey, item);
                } else if (newTime === existingTime) {
                    // Jika createdAt sama persis, gunakan ID (secara string/alfabetis) sebagai fallback sorting
                    if (String(item.id) > String(existingItem.id)) {
                        uniqueStockMap.set(compositeKey, item);
                    }
                }
            }
        });

        // Kembalikan data yang sudah bersih dari duplikasi
        const cleanedData = Array.from(uniqueStockMap.values());
        return cleanedData;

    } catch (error) {
        console.error("Error fetching Stock On Hand:", error);
        throw error;
    }
};