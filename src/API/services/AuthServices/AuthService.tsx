import axiosInstance from "../AxiosInstance";
import { showErrorToast } from "../../../components/toast";

interface LoginPayload {
  username?: string;
  password?: string;
  employee_id?: string;
  ip_address?: string;
  device_info?: string;
  platform?: string;
}

export const loginService = async (payload: LoginPayload) => {
  try {
    const { data } = await axiosInstance.post("/auth/login", payload);
    return data;
  } catch (error: any) {
    showErrorToast(
      `Error response: ${error.response?.data?.message || "Unknown error"}`
    );
    console.error("Error response:", error.response?.data);
    throw new Error(error.response?.data?.message || "Login failed");
  }
};
