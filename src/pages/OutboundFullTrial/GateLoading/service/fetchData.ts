// import axios from "axios";
import axiosInstance from "../../../../DynamicAPI/AxiosInstance";


const API_BASE_URL = "http://10.0.29.47:9005";

export interface AssignedGateResponse {
    success: boolean;
    message?: string;
    data: any[];
}

/**
 * Fetch Assigned Gate List
 */
// export async function fetchAssignedGate(): Promise<AssignedGateResponse> {
//     try {
//         const token = localStorage.getItem("token"); // sesuaikan key token kamu

//         if (!token) {
//             throw new Error("Token not found in localStorage");
//         }

//         const response = await axiosInstance.get(
//             `${API_BASE_URL}/assigned-gate`,

//             {
//                 headers: {
//                     Authorization: `Bearer ${token}`,
//                     "Content-Type": "application/json",
//                 },
//             }
//         );


//         console.log("Fetched assigned gate data:", response.data);


//         return response.data;
//     } catch (error: any) {
//         console.error("Failed to fetch assigned gate:", error);

//         return {
//             success: false,
//             message:
//                 error?.response?.data?.message ||
//                 error.message ||
//                 "Failed to fetch assigned gate",
//             data: [],
//         };
//     }
// }



export async function fetchAssignedGate(): Promise<AssignedGateResponse> {
    try {
        const token = localStorage.getItem("token");

        if (!token) {
            throw new Error("Token not found in localStorage");
        }

        const response = await axiosInstance.get(
            `${API_BASE_URL}/assigned-gate`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            }
        );

        const rawData = response.data.data || response.data;

        // Logika Filter: Buang data yang sudah "APPROVED"
        const filteredData = Array.isArray(rawData)
            ? rawData.filter((item: any) => item.status !== "APPROVED")
            : [];

        return {
            success: true,
            message: "Successfully fetched assigned gate",
            data: filteredData
        };

    } catch (error: any) {
        console.error("Failed to fetch assigned gate:", error);

        return {
            success: false,
            message: error?.response?.data?.message || error.message || "Failed to fetch assigned gate",
            data: [], // Return array kosong jika error agar map tidak pecah
        };
    }
}