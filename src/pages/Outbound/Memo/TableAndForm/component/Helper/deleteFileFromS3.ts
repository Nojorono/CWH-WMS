// utils/deleteFileFromS3.ts
import axios from "axios";
import { S3EndPoint } from "../../../../../../utils/EndPoint";

export async function deleteFileFromS3(fileUrl: string) {
    try {
        const token = localStorage.getItem("token");
        const url = new URL(fileUrl);
        const pathname = url.pathname;
        const parts = pathname.split("/");

        const bucket = parts[2]; // "wms-cwh"
        const path = parts.slice(3).join("/"); // "uploads/file.pdf"

        await axios.delete(`${S3EndPoint}/${bucket}/${path}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
    } catch (err) {
        console.error("Gagal hapus file:", err);
        throw err;
    }
}
