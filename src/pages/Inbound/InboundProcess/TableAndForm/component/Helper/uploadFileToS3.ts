// utils/uploadFileToS3.ts
import { S3EndPoint } from "../../../../../../utils/EndPoint";
import { showErrorToast } from "../../../../../../components/toast";
import axiosInstance from "../../../../../../API/services/AxiosInstance";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB

export async function uploadFileToS3(file: File): Promise<string | null> {
    if (file.size > MAX_FILE_SIZE) {
        showErrorToast("File size exceeds 2 MB limit.");
        return null;
    }

    try {
        const formData = new FormData();

        formData.append("bucket", "wms-cwh");
        formData.append("key", `uploads/${file.name}`);
        formData.append("file", file);
        formData.append("contentType", file.type);
        formData.append("acl", "public-read");

        const res = await axiosInstance.post(`${S3EndPoint}/upload`, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });

        return res.data?.data?.url ?? null;
    } catch (err) {
        console.error("Upload gagal:", err);
        return null;
    }
}
