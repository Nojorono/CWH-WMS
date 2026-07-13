import axiosInstance from "../../../../API/services/AxiosInstance";
import { S3EndPoint } from "../../../../utils/EndPoint";
import { showErrorToast } from "../../../../components/toast";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB

const ALLOWED_EXTENSIONS = ["pdf"];

export async function uploadManifestToS3(
    file: File,
    doId: string,
): Promise<string | null> {
    const fileExtension = file.name.split(".").pop()?.toLowerCase();

    if (!fileExtension || !ALLOWED_EXTENSIONS.includes(fileExtension)) {
        showErrorToast(
            "Format file tidak didukung! Harap unggah file PDF (.pdf).",
        );
        return null;
    }

    if (file.size > MAX_FILE_SIZE) {
        showErrorToast("Ukuran file melebihi batas 2 MB.");
        return null;
    }

    try {
        const formData = new FormData();
        formData.append("bucket", "wms-cwh");
        formData.append("key", `uploads/manifest-subdist/${doId}/${file.name}`);
        formData.append("file", file);
        formData.append("contentType", file.type || "application/pdf");
        formData.append("acl", "public-read");

        const res = await axiosInstance.post(`${S3EndPoint}/upload`, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });

        return res.data?.data?.url ?? null;
    } catch (err) {
        console.error("Upload manifest ke S3 gagal:", err);
        showErrorToast("Terjadi kesalahan saat mengunggah file manifest ke S3.");
        return null;
    }
}
