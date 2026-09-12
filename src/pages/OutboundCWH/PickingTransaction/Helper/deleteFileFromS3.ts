import axiosInstance from "../../../../API/services/AxiosInstance";
import { S3EndPoint } from "../../../../utils/EndPoint";

export async function deleteFileFromS3(fileUrl: string) {
    const url = new URL(fileUrl);
    const pathname = url.pathname;
    const parts = pathname.split("/");

    const bucket = parts[2];
    const path = parts.slice(3).join("/");

    await axiosInstance.delete(`${S3EndPoint}/${bucket}/${path}`);
}
