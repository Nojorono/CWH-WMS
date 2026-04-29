// import axios from "axios";
import axiosInstance from "../../../../DynamicAPI/AxiosInstance";
import { EndPoint } from "../../../../utils/EndPoint";

export interface AssignedGateResponse {
    success: boolean;
    message?: string;
    data: any[];
}

export async function fetchAssignedGate(): Promise<AssignedGateResponse> {
    try {
        const token = localStorage.getItem("token");

        if (!token) {
            throw new Error("Token not found in localStorage");
        }

        // Ambil gate_id dari localStorage
        const rawGateId = localStorage.getItem("warehouse_sub_id"); // atau "gate_id" jika key Anda memang itu
        const gateId =
            rawGateId &&
                rawGateId !== "undefined" &&
                rawGateId !== "null" &&
                rawGateId.trim() !== ""
                ? rawGateId
                : null;

        const response = await axiosInstance.get(`${EndPoint}assigned-gate`, {
            params: gateId ? { gate_id: gateId } : undefined,
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        const rawData = response.data.data || response.data;
        const filteredData = Array.isArray(rawData)
            ? rawData.filter((item: any) => item.status !== "APPROVED")
            : [];

        return {
            success: true,
            message: "Successfully fetched assigned gate",
            data: filteredData,
        };
    } catch (error: any) {
        console.error("Failed to fetch assigned gate:", error);

        return {
            success: false,
            message:
                error?.response?.data?.message ||
                error.message ||
                "Failed to fetch assigned gate",
            data: [],
        };
    }
}
