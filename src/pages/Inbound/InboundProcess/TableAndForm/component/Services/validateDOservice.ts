import { EndPoint } from "../../../../../../utils/EndPoint";

// helper biar konsisten (PO / SO)
const getInboundType = (inbType: any): "PO" | "SO" => {
    if (inbType === "PO" || inbType?.value === "PO") return "PO";
    return "SO";
};

export const validateDOservice = async (doNo: string, inbType: any) => {
    const token = localStorage.getItem("token");
    const type = getInboundType(inbType);
    const encodedDoNo = encodeURIComponent(doNo);

    const res = await fetch(
        `${EndPoint}inbound/do-validation/${type}/${encodedDoNo}`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData?.message || "Gagal validasi Surat Jalan");
    }

    const data = await res.json();
    console.log("res data DO service", data);

    return data;
};