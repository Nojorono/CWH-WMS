import axios from "axios";

const API_BASE_URL = "http://10.0.29.47:9005";

export interface AssignedGateResponse {
    success: boolean;
    message?: string;
    data: any[]; // nanti bisa kamu ganti ke type hasil mapping UI
}

/**
 * Fetch Assigned Gate List
 */
export async function fetchAssignedGate(): Promise<AssignedGateResponse> {
    try {
        const token = localStorage.getItem("token"); // sesuaikan key token kamu

        if (!token) {
            throw new Error("Token not found in localStorage");
        }

        const response = await axios.get(
            // `${API_BASE_URL}/assigned-gate?status=DONE`,
            `${API_BASE_URL}/assigned-gate`,

            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            }
        );

        return response.data;
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
