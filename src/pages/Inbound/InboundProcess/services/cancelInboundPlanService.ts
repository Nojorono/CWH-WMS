import axiosInstance from "../../../../DynamicAPI/AxiosInstance";

export const cancelInboundPlanService = async (
  inboundId: string | number,
  notes: string,
) => {
  try {
    const res = await axiosInstance.patch(`inbound/${inboundId}/status`, {
      status: "CANCELLED",
      notes,
    });

    return res.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message || "Gagal Cancel Inbound Plan",
    );
  }
};
