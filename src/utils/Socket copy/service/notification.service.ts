import axiosInstance from "../../../DynamicAPI/AxiosInstance";

export const NotificationService = {
    async getByRecipient(userId: string) {
        try {
            const res = await axiosInstance.get(`notification-history/by-recipient/${userId}`);
            return res.data;
        } catch (error) {
            console.error("Error fetching notifications via axiosInstance:", error);
            throw error;
        }
    },

    async markAsRead(id: string) {
        try {
            const res = await axiosInstance.patch("notification-history/mark-as-read", {
                id
            });
            return res.data;
        } catch (error) {
            console.error("Error marking notification as read via axiosInstance:", error);
            throw error;
        }
    },
};