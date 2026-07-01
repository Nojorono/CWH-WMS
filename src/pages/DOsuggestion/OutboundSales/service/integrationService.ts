import axiosInstance from "../../../../DynamicAPI/AxiosInstance";

export const checkAndIntegrateSPB = async (sourceHeaderId: string) => {
    try {
        // 1. Cek status integrasi terlebih dahulu
        const { data: response } = await axiosInstance.get(
            `/move-order-integration/find-by-source-header-id/${sourceHeaderId}`
        );

        const integrationData = response.data;

        console.log("integrationData", integrationData);
        
        // 2. Jika data sudah ada dan statusnya SUCCESS/INTEGRATED
        if (integrationData && (integrationData.iface_status === "SUCCESS" || integrationData.iface_status === "INTEGRATED")) {
            return { status: "READY", data: integrationData };
        }

        // 3. Jika statusnya ERROR, TIMEOUT, atau belum ada, jalankan integrasi (POST)
        const { data: integrationResponse } = await axiosInstance.post(
            `/do-suggestion/${sourceHeaderId}/integrate`
        );

        return { status: "PROCESSED", data: integrationResponse };

    } catch (error: any) {
        // Jika GET mengembalikan 404 (berarti belum pernah diintegrasikan),
        // kita bisa mencoba POST langsung.
        if (error.response?.status === 404) {
            const { data: integrationResponse } = await axiosInstance.post(
                `/do-suggestion/${sourceHeaderId}/integrate`
            );
            return { status: "PROCESSED", data: integrationResponse };
        }

        throw error;
    }
};