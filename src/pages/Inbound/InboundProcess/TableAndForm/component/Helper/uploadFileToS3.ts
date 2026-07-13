import { S3EndPoint } from "../../../../../../utils/EndPoint";
import { showErrorToast } from "../../../../../../components/toast";
import axiosInstance from "../../../../../../API/services/AxiosInstance";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB

// 1. Daftar MIME type yang diperbolehkan
const ALLOWED_MIME_TYPES = [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png"
];

// 2. Daftar Ekstensi yang diperbolehkan (huruf kecil)
const ALLOWED_EXTENSIONS = ["pdf", "jpg", "jpeg", "png", "xlsx", "xls"];

export async function uploadFileToS3(file: File): Promise<string | null> {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    // VALIDASI 1: Cek Ekstensi File & MIME Type
    if (!fileExtension || !ALLOWED_EXTENSIONS.includes(fileExtension) || !ALLOWED_MIME_TYPES.includes(file.type)) {
        showErrorToast("Format file tidak didukung! Hanya diperbolehkan PDF, JPG, JPEG, atau PNG.");
        return null;
    }

    // VALIDASI 2: Cek Ukuran File
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
        showErrorToast("Terjadi kesalahan saat mengunggah file.");
        return null;
    }
}