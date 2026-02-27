import { useState, useEffect } from "react";
import { showErrorToast } from "../../../../components/toast";
import { uploadFileToS3 } from "../../Helper/uploadFileToS3";
import { deleteFileFromS3 } from "../../Helper/deleteFileFromS3";

export const useDocumentUpload = (initialData?: any, mode?: string) => {
  const [documentUrls, setDocumentUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedThisSession, setUploadedThisSession] = useState<string[]>([]);

  useEffect(() => {
    if (initialData) {
      let docArr: string[] = [];
      if (
        typeof initialData.document === "string" &&
        initialData.document.trim() !== ""
      ) {
        docArr = initialData.document
          .split(",")
          .map((v: string) => v.trim())
          .filter(Boolean);
      } else if (Array.isArray(initialData.document)) {
        docArr = initialData.document;
      }
      setDocumentUrls(docArr);
    }
  }, [initialData]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const url = await uploadFileToS3(files[i]);
        if (url) uploadedUrls.push(url);
      }
      setDocumentUrls((prev) => [...prev, ...uploadedUrls]);
      setUploadedThisSession((prev) => [...prev, ...uploadedUrls]);
    } catch (error) {
      showErrorToast("Gagal memproses file");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleFileDelete = async (urlToDelete: string) => {
    if (!urlToDelete) return;
    if (!window.confirm("Hapus file ini?")) return;
    try {
      await deleteFileFromS3(urlToDelete);
      setDocumentUrls((prev) => prev.filter((url) => url !== urlToDelete));
      setUploadedThisSession((prev) =>
        prev.filter((url) => url !== urlToDelete),
      );
    } catch (error) {
      showErrorToast("Gagal menghapus file");
    }
  };

  const cleanupUploadedFiles = async () => {
    uploadedThisSession.forEach(async (url) => {
      try {
        await deleteFileFromS3(url);
      } catch {}
    });
  };

  const normalizeDocument = (doc: unknown): string => {
    if (Array.isArray(doc)) {
      return doc
        .map((v) => String(v).trim())
        .filter(Boolean)
        .join(", ");
    }

    if (typeof doc === "string") {
      const raw = doc.trim();
      if (raw.startsWith("{") && raw.endsWith("}")) {
        return raw
          .slice(1, -1)
          .split(",")
          .map((v) => v.trim().replace(/^"|"$/g, ""))
          .filter(Boolean)
          .join(", ");
      }
      return raw;
    }

    return "";
  };

  const hasDocumentChanged = (originalDoc: string) => {
    const normalizedCurrentDoc = documentUrls.join(", ");
    const normalizedOriginalDoc = (originalDoc || "")
      .split(",")
      .map((v: string) => v.trim())
      .filter(Boolean)
      .join(", ");

    return normalizedCurrentDoc !== normalizedOriginalDoc;
  };

  return {
    documentUrls,
    isUploading,
    uploadedThisSession,
    handleFileUpload,
    handleFileDelete,
    cleanupUploadedFiles,
    normalizeDocument,
    hasDocumentChanged,
  };
};
