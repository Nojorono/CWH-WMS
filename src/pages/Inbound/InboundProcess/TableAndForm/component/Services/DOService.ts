import { EndPoint } from "../../../../../../utils/EndPoint";

export const validateDOService = async (doNo: string) => {    
    const token = localStorage.getItem("token");
    const res = await fetch(`${EndPoint}inbound/do-validation/${doNo}`, {
        headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData?.message || "Gagal validasi Surat Jalan");
    }

    const data = await res.json();
    console.log("res data DO service", data);
    return data;
};