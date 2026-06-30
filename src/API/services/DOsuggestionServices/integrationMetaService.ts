import { MoveOrderIntegrationParams, MoveOrderIntegrationResponse } from "../../types/DOsuggestionIntegration";
import axiosInstance from "../AxiosInstance";


export const getMoveOrderIntegration = async (
    params: MoveOrderIntegrationParams
): Promise<MoveOrderIntegrationResponse> => {
    try {
        const response = await axiosInstance.get("/move-order-integration", {
            params: {
                page: params.page,
                limit: params.limit,
                sortOrder: params.sortOrder || "DESC",
                iface_status: params.iface_status,
                source_system: params.source_system || "WMS",
            },
        });

        // Sesuaikan dengan struktur asli dari response JSON backend-mu
        return response.data;
    } catch (error) {
        throw error;
    }
};