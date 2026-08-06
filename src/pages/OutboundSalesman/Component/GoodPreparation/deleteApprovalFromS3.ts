import axiosInstance from "../../../../API/services/AxiosInstance";
import { S3EndPoint } from "../../../../utils/EndPoint";

/** Hapus file approval dari S3 berdasarkan URL publik hasil upload */
export async function deleteApprovalFromS3(fileUrl: string): Promise<void> {
  const url = new URL(fileUrl);
  const pathname = url.pathname;
  const parts = pathname.split("/");

  // contoh path: /wms-cwh/uploads/spb-adjust-approval/...
  const bucket = parts[2];
  const path = parts.slice(3).join("/");

  if (!bucket || !path) {
    throw new Error("URL file S3 tidak valid");
  }

  await axiosInstance.delete(`${S3EndPoint}/${bucket}/${path}`);
}
