import { EndPoint } from "../../../../utils/EndPoint";
import axiosInstance from "../../../../DynamicAPI/AxiosInstance";

export interface SubmitGateSkuPayload {
    assigned_gate_id: string;
    outbound_do_id: string;
    outbound_memo_id: string;
    pallet_id: string;
    item_id: string;
    uom: string;
    quantity_picked: number;
    quantity_loaded: number;
    quantity_unloaded: number;
    status: "PENDING";
    production_date?: string;
    week_number?: number;
}

export const updateSubmitLoadingGate = async (
    assgnGateId: string,
    payload: SubmitGateSkuPayload
) => {
    const token = localStorage.getItem("token")
    const res = await axiosInstance.patch(
        `${EndPoint}assigned-gate-load/${assgnGateId}`, // ✅ pakai ID di URL
        payload,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    return res.data;
};
