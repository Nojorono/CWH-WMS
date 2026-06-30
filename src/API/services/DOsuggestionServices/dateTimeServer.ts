import axiosInstance from "../../../DynamicAPI/AxiosInstance";

export interface ServerTimeResponse {
    success: boolean;
    message: string;
    data: {
        utc: string;
        timezone: string;
        local: string;
        date: string;
        time: string;
        timestamp: number;
    };
    timestamp: string;
    path: string;
}

export const getServerDatetime = async (): Promise<ServerTimeResponse> => {
    const response = await axiosInstance.get("/common/server-datetime");
    console.log("GET TIME SERVER", response.data);

    return response.data;
};