// src/services/notification.service.ts
import axios from "axios";
import { EndPoint } from "../../EndPoint";
import { showErrorToast } from "../../../components/toast";

const API_BASE_URL = EndPoint;
const BEARER_TOKEN = localStorage.getItem("token")

export const NotificationService = {
    async getByRecipient(userId: string) {

        if (!BEARER_TOKEN) {
            showErrorToast("Unauthorized");
            return;
        }

        try {
            const res = await axios.get(
                `${API_BASE_URL}notification-history/by-recipient/${userId}`,
                {
                    headers: {
                        Authorization: `Bearer ${BEARER_TOKEN}`,
                    },
                }
            );
            return res.data; // pastikan API memang mengembalikan array
        } catch (error) {
            console.error("Error fetching notifications:", error);
            throw error;
        }
    },

    // async markAsRead(id: string) {
    //     try {
    //         await axios.patch(`${API_BASE_URL}/notification-history/mark-as-read`, {
    //             id,
    //         }, {
    //             headers: {
    //                 Authorization: `Bearer ${BEARER_TOKEN}`,
    //             },
    //         });
    //     } catch (error) {
    //         console.error("Error marking as read:", error);
    //     }
    // },
};
