import axiosInstance from "../../AxiosInstance";


// helper biar konsisten - Normalisasi 3 tipe form ke 2 tipe API (PO / SO)
const getInboundType = (inbType: any): "PO" | "SO" => {
    const type = typeof inbType === "string" ? inbType : inbType?.value || "";
    if (type === "PO") return "PO";
    // SO_INTERNAL dan SO_SUBDIST menggunakan API yang sama
    return "SO";
};

export const validateDOservice = async (doNo: string, inbType: any) => {
    const type = getInboundType(inbType);
    const encodedDoNo = encodeURIComponent(doNo);

    try {
        const res = await axiosInstance.get(
            `inbound/do-validation/${type}?suratJalan=${encodedDoNo}`
        );
        return res.data;
    } catch (error: any) {
        throw new Error(error?.response?.data?.message || "Gagal validasi Surat Jalan");
    }
};
