import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";

/** A4 ISO: 210mm × 297mm */
export const A4_WIDTH_MM = 210;
export const A4_HEIGHT_MM = 297;

export type DownloadA4PdfOptions = {
  /** default: portrait (21 × 29.7 cm) */
  orientation?: "portrait" | "landscape";
  marginMm?: number;
  fileName?: string;
};

const sanitizeFileName = (name: string) =>
  String(name || "document")
    .trim()
    .replace(/[^\w.\-]+/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 120) || "document";

/**
 * Capture elemen HTML → unduh PDF A4 (multi-page jika konten panjang).
 * Dipakai sebagai backup paralel saat print Form Gudang / BKB.
 * Pakai html2canvas-pro agar warna Tailwind v4 (oklch) ter-support.
 */
export const downloadElementAsA4Pdf = async (
  element: HTMLElement,
  fileName: string,
  options?: DownloadA4PdfOptions,
): Promise<void> => {
  const orientation = options?.orientation ?? "portrait";
  const margin = options?.marginMm ?? 10;
  const pageW = orientation === "portrait" ? A4_WIDTH_MM : A4_HEIGHT_MM;
  const pageH = orientation === "portrait" ? A4_HEIGHT_MM : A4_WIDTH_MM;

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: "#ffffff",
    logging: false,
  });

  const imgData = canvas.toDataURL("image/jpeg", 0.92);
  const pdf = new jsPDF({
    orientation,
    unit: "mm",
    format: "a4",
    compress: true,
  });

  const contentW = pageW - margin * 2;
  const contentH = pageH - margin * 2;
  const imgW = contentW;
  const imgH = (canvas.height * imgW) / canvas.width;

  let heightLeft = imgH;
  let position = margin;

  pdf.addImage(imgData, "JPEG", margin, position, imgW, imgH);
  heightLeft -= contentH;

  while (heightLeft > 1) {
    position = margin - (imgH - heightLeft);
    pdf.addPage("a4", orientation);
    pdf.addImage(imgData, "JPEG", margin, position, imgW, imgH);
    heightLeft -= contentH;
  }

  const base = sanitizeFileName(fileName);
  const withExt = base.toLowerCase().endsWith(".pdf") ? base : `${base}.pdf`;
  pdf.save(withExt);
};
