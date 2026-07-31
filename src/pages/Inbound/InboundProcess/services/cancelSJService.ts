import axiosInstance from "../../../../DynamicAPI/AxiosInstance";

export const cancelSJService = async (idDO: string | number) => {
  try {
    const res = await axiosInstance.patch(`inbound/cancel-inbound-do/${idDO}`);
    return res.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message || "Gagal Cancel Surat Jalan",
    );
  }
};

/** @deprecated gunakan cancelSJService */
export const cancelSJservice = cancelSJService;
