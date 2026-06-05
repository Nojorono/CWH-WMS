// utils/deleteFileFromS3.ts
import { S3EndPoint } from "../../../../../../utils/EndPoint";
import axiosInstance from "../../../../../../DynamicAPI/AxiosInstance";

export async function deleteFileFromS3(fileUrl: string) {
    try {
        const url = new URL(fileUrl);
        const pathname = url.pathname;
        const parts = pathname.split("/");

        const bucket = parts[2]; 
        const path = parts.slice(3).join("/");

        await axiosInstance.delete(`${S3EndPoint}/${bucket}/${path}`, {
        });
    } catch (err) {
        console.error("Gagal hapus file:", err);
        throw err;
    }
}
