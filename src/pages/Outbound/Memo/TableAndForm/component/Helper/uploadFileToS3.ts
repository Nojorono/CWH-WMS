// utils/uploadFileToS3.ts
import axios from "axios";
import { S3EndPoint } from "../../../../../../utils/EndPoint";

export async function uploadFileToS3(file: File): Promise<string | null> {
    try {
        const token = localStorage.getItem("token");
        const formData = new FormData();

        formData.append("bucket", "wms-cwh");
        formData.append("key", `uploads/${file.name}`);
        formData.append("file", file);
        formData.append("contentType", file.type);
        formData.append("acl", "public-read");

        const res = await axios.post(`${S3EndPoint}/upload`, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
        });

        console.log("Upload s3 res", res);

        return res.data?.data?.data?.url ?? null;
    } catch (err) {
        console.error("Upload gagal:", err);
        return null;
    }
}
