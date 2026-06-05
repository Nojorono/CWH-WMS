// utils/deleteFileFromS3.ts
import axios from "axios";
import { S3EndPoint } from "../../../utils/EndPoint";
import axiosInstance from "../../../DynamicAPI/AxiosInstance";

export async function deleteFileFromS3(fileUrl: string) {
    try {
        const url = new URL(fileUrl);
        const pathname = url.pathname;
        const parts = pathname.split("/");

        const bucket = parts[2]; // Contoh: "wms-cwh"
        const path = parts.slice(3).join("/");

        await axiosInstance.delete(`${S3EndPoint}/${bucket}/${path}`);

    } catch (err: any) {
        console.error("Gagal hapus file via axiosInstance S3:", err);
        throw err;
    }
}

// export async function deleteFileFromS3(fileUrl: string) {
//     try {
//         const url = new URL(fileUrl);
//         const pathname = url.pathname;
//         const parts = pathname.split("/");

//         const bucket = parts[2]; // "wms-cwh"
//         const path = parts.slice(3).join("/");

//         await axios.delete(`${S3EndPoint}/${bucket}/${path}`, {
//             headers: { Authorization: `Bearer ${token}` },
//         });
//     } catch (err) {
//         console.error("Gagal hapus file:", err);
//         throw err;
//     }
// }
