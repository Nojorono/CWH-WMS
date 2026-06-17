import axiosInstance from "../AxiosInstance";
import { showErrorToast } from "../../../components/toast";
import { LoginPayload, ApiResponse, AuthData } from "../../types/persistAuth.types";

export const persistLoginService = async (payload: LoginPayload): Promise<ApiResponse<AuthData>> => {
  try {
    const { data } = await axiosInstance.post<ApiResponse<AuthData>>("/auth/login", payload);
    return data;
  } catch (error: any) {
    const msg = error.response?.data?.message || "Gagal login, periksa koneksi.";
    showErrorToast(msg === "Internal Server Error" ? "Server bermasalah." : msg);
    throw error;
  }
};