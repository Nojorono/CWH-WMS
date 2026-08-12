import axiosInstance from "../../../API/services/AxiosInstance";
import { showErrorToast } from "../../../components/toast";
import { S3EndPoint } from "../../../utils/EndPoint";

const MAX_FILE_SIZE = 1 * 1024 * 1024;

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
];

const ALLOWED_EXTENSIONS = ["pdf", "jpg", "jpeg", "png"];

export async function uploadApprovalToS3(
  file: File,
  callplanNumber?: string,
): Promise<string | null> {
  const fileExtension = file.name.split(".").pop()?.toLowerCase();

  if (
    !fileExtension ||
    !ALLOWED_EXTENSIONS.includes(fileExtension) ||
    !ALLOWED_MIME_TYPES.includes(file.type)
  ) {
    showErrorToast("Format file harus PDF, JPG, atau PNG");
    return null;
  }

  if (file.size > MAX_FILE_SIZE) {
    showErrorToast("Ukuran file maksimal 1MB");
    return null;
  }

  const folder = callplanNumber
    ? callplanNumber.replace(/[^a-zA-Z0-9._-]/g, "_")
    : "unknown";
  const key = `uploads/spb-adjust-approval/${folder}/${Date.now()}-${file.name}`;

  try {
    const formData = new FormData();
    formData.append("bucket", "wms-cwh");
    formData.append("key", key);
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
    console.error("Upload approval SPB ke S3 gagal:", err);
    showErrorToast("Terjadi kesalahan saat mengunggah file approval ke S3.");
    return null;
  }
}
