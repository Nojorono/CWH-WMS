"use client";
import React, { useEffect, useRef } from "react";
import { NotificationService } from "../Socket/service/notification.service";
import { showErrorToast, showSuccessToast } from "../../components/toast";

interface NotificationItem {
  id: string;
  type: string;
  message: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  createdAt: string;
  read: boolean;
}

const NotificationManager: React.FC<{ userId: string }> = ({ userId }) => {
  const lastSeenId = useRef<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const fetchNotifications = async () => {
      try {
        const data = await NotificationService.getByRecipient(userId);
        console.log("Fetched notifications:", data);

        const notifications: NotificationItem[] = Array.isArray(data)
          ? data
          : data?.data || [];

        if (!notifications.length) return;

        // cari notifikasi terbaru
        const latest = notifications[0];

        // // jika ID terbaru berbeda dari terakhir
        // if (lastSeenId.current !== latest.id) {
        //   lastSeenId.current = latest.id;

        //   if (latest.priority === "HIGH" || latest.priority === "URGENT") {
        //     showErrorToast(`⚠️ ${latest.type}: ${latest.message}`);
        //   } else {
        //     showSuccessToast(`${latest.type}: ${latest.message}`);
        //   }
        // }
      } catch (error) {
        console.error("Error loading notifications:", error);
      }
    };

    // jalankan pertama kali
    fetchNotifications();

    // polling tiap 15 detik
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [userId]);

  return null;
};

export default NotificationManager;
