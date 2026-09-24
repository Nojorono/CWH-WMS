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
  /**
   * Custom page size [widthMm, heightMm].
   * Jika diisi, mengabaikan format A4 (untuk Continuous Form, dll).
   */
  pageSizeMm?: [number, number];
};

const sanitizeFileName = (name: string) =>
  String(name || "document")
    .trim()
    .replace(/[^\w.\-]+/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 120) || "document";

const resolvePageSize = (options?: DownloadA4PdfOptions) => {
  const orientation = options?.orientation ?? "portrait";
  const customSize = options?.pageSizeMm;
  const pageW = customSize
    ? customSize[0]
    : orientation === "portrait"
      ? A4_WIDTH_MM
      : A4_HEIGHT_MM;
  const pageH = customSize
    ? customSize[1]
    : orientation === "portrait"
      ? A4_HEIGHT_MM
      : A4_WIDTH_MM;
  const pdfFormat: [number, number] | "a4" = customSize
    ? [pageW, pageH]
    : "a4";
  return { orientation, pageW, pageH, pdfFormat };
};

/**
 * Capture elemen HTML → unduh PDF (multi-page jika konten panjang).
 * Default A4; bisa custom pageSizeMm (mis. Continuous Form BKB).
 */
export const downloadElementAsA4Pdf = async (
  element: HTMLElement,
  fileName: string,
  options?: DownloadA4PdfOptions,
): Promise<void> => {
  const margin = options?.marginMm ?? 10;
  const { orientation, pageW, pageH, pdfFormat } = resolvePageSize(options);

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
    format: pdfFormat,
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
    pdf.addPage(pdfFormat, orientation);
    pdf.addImage(imgData, "JPEG", margin, position, imgW, imgH);
    heightLeft -= contentH;
  }

  const base = sanitizeFileName(fileName);
  const withExt = base.toLowerCase().endsWith(".pdf") ? base : `${base}.pdf`;
  pdf.save(withExt);
};

/**
 * Satu PDF page per sheet HTML (untuk BKB multi-lembar).
 * Mencegah SKU terpotong karena slicing satu canvas panjang.
 * Tiap sheet di-scale agar muat 1 halaman.
 */
export const downloadSheetsAsPdf = async (
  sheets: HTMLElement[],
  fileName: string,
  options?: DownloadA4PdfOptions,
): Promise<void> => {
  const list = sheets.filter(Boolean);
  if (!list.length) {
    throw new Error("Tidak ada lembar untuk diunduh");
  }

  const margin = options?.marginMm ?? 5;
  const { orientation, pageW, pageH, pdfFormat } = resolvePageSize(options);
  const contentW = pageW - margin * 2;
  const contentH = pageH - margin * 2;

  const pdf = new jsPDF({
    orientation,
    unit: "mm",
    format: pdfFormat,
    compress: true,
  });

  for (let i = 0; i < list.length; i += 1) {
    const sheet = list[i];
    const canvas = await html2canvas(sheet, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.92);
    // Prioritas: isi lebar penuh agar margin kiri=kanan proporsional
    let ratio = contentW / canvas.width;
    let imgW = contentW;
    let imgH = canvas.height * ratio;
    if (imgH > contentH) {
      ratio = contentH / canvas.height;
      imgW = canvas.width * ratio;
      imgH = contentH;
    }
    const offsetX = margin + (contentW - imgW) / 2;
    const offsetY = margin;

    if (i > 0) pdf.addPage(pdfFormat, orientation);
    pdf.addImage(imgData, "JPEG", offsetX, offsetY, imgW, imgH);
  }

  const base = sanitizeFileName(fileName);
  const withExt = base.toLowerCase().endsWith(".pdf") ? base : `${base}.pdf`;
  pdf.save(withExt);
};
