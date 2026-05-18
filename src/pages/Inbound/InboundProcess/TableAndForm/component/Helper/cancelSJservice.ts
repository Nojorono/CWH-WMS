import axiosInstance from "../../../../../../DynamicAPI/AxiosInstance";

export const cancelSJservice = async (idDO: any) => {
    try {
        const res = await axiosInstance.patch(
            `inbound/cancel-inbound-do/${idDO}`
        );

        console.log("res cancel SJ", res);
        return res.data;
    } catch (error: any) {
        throw new Error(error?.response?.data?.message || "Gagal Cancel Surat Jalan");
    }
};