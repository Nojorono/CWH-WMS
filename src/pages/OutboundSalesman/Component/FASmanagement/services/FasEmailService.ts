import axios from "axios";
import axiosInstance from "../../../../../DynamicAPI/AxiosInstance";

const EMAIL_SEND_UPLOAD_PATH = "email/send-upload";

export type SendEmailUploadParams = {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  text?: string;
  html?: string;
  files?: File[];
};

type ApiErrorBody = {
  success?: boolean;
  message?: string | string[];
  error?: string;
};

export const parseFasEmailError = (
  error: unknown,
  fallback = "Gagal mengirim email",
): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiErrorBody | undefined;
    if (Array.isArray(data?.message) && data.message.length) {
      return data.message.join("\n");
    }
    if (typeof data?.message === "string" && data.message.trim()) {
      return data.message;
    }
    if (typeof data?.error === "string" && data.error.trim()) {
      return data.error;
    }
    return error.message || fallback;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

/**
 * POST /email/send-upload (multipart/form-data)
 * via axiosInstance (service-wms)
 */
export const fasEmailService = {
  sendUpload: async (params: SendEmailUploadParams) => {
    const to = params.to.map((e) => e.trim()).filter(Boolean);
    if (!to.length) {
      throw new Error("Minimal 1 penerima (To) wajib diisi");
    }
    if (!params.subject?.trim()) {
      throw new Error("Subject wajib diisi");
    }

    const formData = new FormData();
    formData.append("to", to.join(","));

    const cc = (params.cc || []).map((e) => e.trim()).filter(Boolean);
    if (cc.length) formData.append("cc", cc.join(","));

    const bcc = (params.bcc || []).map((e) => e.trim()).filter(Boolean);
    if (bcc.length) formData.append("bcc", bcc.join(","));

    formData.append("subject", params.subject.trim());

    if (params.text?.trim()) formData.append("text", params.text.trim());
    if (params.html?.trim()) formData.append("html", params.html.trim());

    (params.files || []).slice(0, 10).forEach((file) => {
      formData.append("files", file);
    });

    const response = await axiosInstance.post(
      EMAIL_SEND_UPLOAD_PATH,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120000,
      },
    );

    return response.data;
  },
};
