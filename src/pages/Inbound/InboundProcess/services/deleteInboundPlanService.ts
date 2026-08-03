import axiosInstance from "../../../../DynamicAPI/AxiosInstance";

export const deleteInboundPlanService = async (inboundId: string | number) => {
  try {
    const res = await axiosInstance.delete(`inbound/${inboundId}`);
    return res.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message || "Gagal menghapus Inbound Plan",
    );
  }
};
