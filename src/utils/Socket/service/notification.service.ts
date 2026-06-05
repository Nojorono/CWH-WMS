import axiosInstance from "../../../DynamicAPI/AxiosInstance";

export const NotificationService = {
    async getByRecipient(userId: string) {
        try {
            const res = await axiosInstance.get(`notification-history/by-recipient/${userId}`);
            return res.data;
        } catch (error: any) {
            console.error("Error fetching notifications via axiosInstance:", error);

            throw error;
        }
    },
};