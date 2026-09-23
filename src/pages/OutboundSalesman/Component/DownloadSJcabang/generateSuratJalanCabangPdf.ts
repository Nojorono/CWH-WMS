import jsPDF from "jspdf";

export type SuratJalanItem = {
  namaBarang: string;
  banyaknya: string;
};

export type SuratJalanCabangData = {
  amo: string;
  namaPengirim: string;
  nomorSuratJalan: string;
  nomorKendaraan: string;
  tujuan: string;
  noSegel: string;
  alamatPenerima: string;
  tanggal: string;
  keterangan: string;
  items: SuratJalanItem[];
  total: string;
  diterimaTgl: string;
};

const BLUE = { r: 30, g: 58, b: 138 };
const FILL = { r: 239, g: 246, b: 255 };
const BORDER = { r: 100, g: 116, b: 139 };

const drawField = (
  pdf: jsPDF,
  label: string,
  value: string,
  x: number,
  y: number,
  labelW: number,
  valueW: number,
  h = 7,
) => {
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(30, 30, 30);
  pdf.text(label, x, y + 4.5);
  pdf.text(":", x + labelW, y + 4.5);

  const boxX = x + labelW + 3;
  pdf.setFillColor(FILL.r, FILL.g, FILL.b);
  pdf.setDrawColor(BORDER.r, BORDER.g, BORDER.b);
  pdf.setLineWidth(0.2);
  pdf.rect(boxX, y, valueW, h, "FD");

  if (value) {
    pdf.setFontSize(9);
    pdf.setTextColor(15, 23, 42);
    pdf.text(value, boxX + 2, y + 4.8, {
      maxWidth: valueW - 4,
    });
  }
};

const drawSignBox = (
  pdf: jsPDF,
  title: string,
  x: number,
  y: number,
  w: number,
  h: number,
) => {
  pdf.setDrawColor(BORDER.r, BORDER.g, BORDER.b);
  pdf.setLineWidth(0.35);
  pdf.setFillColor(255, 255, 255);
  pdf.rect(x, y, w, h, "S");

  // header
  pdf.setFillColor(248, 250, 252);
  pdf.rect(x, y, w, 8, "FD");
  pdf.line(x, y + 8, x + w, y + 8);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(30, 30, 30);
  pdf.text(title, x + w / 2, y + 5.5, { align: "center" });

  // sign area fill
  pdf.setFillColor(FILL.r, FILL.g, FILL.b);
  pdf.rect(x + 0.3, y + 8.3, w - 0.6, h - 8.6, "F");

  // dashed name line
  pdf.setDrawColor(BORDER.r, BORDER.g, BORDER.b);
  pdf.setLineDashPattern([1.2, 1.2], 0);
  pdf.line(x + 6, y + h - 8, x + w - 6, y + h - 8);
  pdf.setLineDashPattern([], 0);
};

/**
 * Generate PDF template Surat Jalan Cabang (A4 Landscape)
 * dari data form UI.
 */
export const generateSuratJalanCabangPdf = (data: SuratJalanCabangData) => {
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageW = pdf.internal.pageSize.getWidth();
  const margin = 12;
  const contentW = pageW - margin * 2;
  let y = 12;

  // Header
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.setTextColor(BLUE.r, BLUE.g, BLUE.b);
  pdf.text("PT Niaga Nusa Abadi", margin, y + 5);

  drawField(pdf, "AMO", data.amo, pageW - margin - 70, y, 12, 50, 8);
  y += 14;

  // Info 2 kolom
  const colGap = 14;
  const colW = (contentW - colGap) / 2;
  const labelW = 38;
  const valueW = colW - labelW - 5;
  const leftX = margin;
  const rightX = margin + colW + colGap;
  const rowH = 9;

  const leftFields: [string, string][] = [
    ["Nama Pengirim", data.namaPengirim],
    ["Nomor Kendaraan", data.nomorKendaraan],
    ["No Segel", data.noSegel],
  ];
  const rightFields: [string, string][] = [
    ["Nomor Surat Jalan", data.nomorSuratJalan],
    ["Tujuan", data.tujuan],
    ["Alamat Penerima", data.alamatPenerima],
    ["Tanggal", data.tanggal],
  ];

  leftFields.forEach(([label, value], i) => {
    drawField(pdf, label, value, leftX, y + i * rowH, labelW, valueW);
  });
  rightFields.forEach(([label, value], i) => {
    drawField(pdf, label, value, rightX, y + i * rowH, labelW, valueW);
  });

  y += Math.max(leftFields.length, rightFields.length) * rowH + 6;

  // Judul
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.setTextColor(BLUE.r, BLUE.g, BLUE.b);
  pdf.text("SURAT JALAN", pageW / 2, y, { align: "center" });
  y += 8;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(30, 30, 30);
  pdf.text("Harap diterima dengan baik barang sebagai berikut :", margin, y);
  y += 5;

  // Table
  const items = [...data.items];
  while (items.length < 5) {
    items.push({ namaBarang: "", banyaknya: "" });
  }
  const rows = items.slice(0, 5);

  const colNo = 12;
  const colQty = 42;
  const colKet = 70;
  const colNama = contentW - colNo - colQty - colKet;
  const rowHeight = 9;
  const headerH = 8;
  const tableH = headerH + rows.length * rowHeight + rowHeight; // + total

  const tableX = margin;
  const tableY = y;

  // header bg
  pdf.setFillColor(248, 250, 252);
  pdf.setDrawColor(BORDER.r, BORDER.g, BORDER.b);
  pdf.setLineWidth(0.35);
  pdf.rect(tableX, tableY, contentW, tableH, "S");
  pdf.rect(tableX, tableY, contentW, headerH, "FD");

  // vertical lines
  let vx = tableX + colNo;
  pdf.line(vx, tableY, vx, tableY + tableH);
  vx += colNama;
  pdf.line(vx, tableY, vx, tableY + tableH);
  vx += colQty;
  pdf.line(vx, tableY, vx, tableY + tableH);

  // header texts
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(30, 30, 30);
  pdf.text("No", tableX + colNo / 2, tableY + 5.5, { align: "center" });
  pdf.text("Nama Barang", tableX + colNo + 3, tableY + 5.5);
  pdf.text("Banyaknya", tableX + colNo + colNama + colQty / 2, tableY + 5.5, {
    align: "center",
  });
  pdf.text("Keterangan", tableX + colNo + colNama + colQty + 3, tableY + 5.5);

  // body rows
  pdf.setFont("helvetica", "normal");
  rows.forEach((item, i) => {
    const ry = tableY + headerH + i * rowHeight;
    pdf.line(tableX, ry, tableX + contentW - colKet, ry);

    // row fill for nama/qty
    pdf.setFillColor(FILL.r, FILL.g, FILL.b);
    pdf.rect(tableX + colNo + 0.4, ry + 0.4, colNama - 0.8, rowHeight - 0.8, "F");
    pdf.rect(
      tableX + colNo + colNama + 0.4,
      ry + 0.4,
      colQty - 0.8,
      rowHeight - 0.8,
      "F",
    );

    pdf.setTextColor(30, 30, 30);
    pdf.text(String(i + 1), tableX + colNo / 2, ry + 6, { align: "center" });
    if (item.namaBarang) {
      pdf.text(item.namaBarang, tableX + colNo + 2, ry + 6, {
        maxWidth: colNama - 4,
      });
    }
    if (item.banyaknya) {
      pdf.text(
        item.banyaknya,
        tableX + colNo + colNama + colQty / 2,
        ry + 6,
        { align: "center" },
      );
    }
  });

  // keterangan merged cell fill + text
  const ketX = tableX + colNo + colNama + colQty;
  const ketY = tableY + headerH;
  const ketH = rows.length * rowHeight;
  pdf.setFillColor(FILL.r, FILL.g, FILL.b);
  pdf.rect(ketX + 0.4, ketY + 0.4, colKet - 0.8, ketH - 0.8, "F");
  if (data.keterangan) {
    pdf.setFontSize(9);
    pdf.setTextColor(30, 30, 30);
    const lines = pdf.splitTextToSize(data.keterangan, colKet - 4);
    pdf.text(lines, ketX + 2, ketY + 5);
  }

  // total row
  const totalY = tableY + headerH + rows.length * rowHeight;
  pdf.line(tableX, totalY, tableX + contentW, totalY);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.text("Total", tableX + (colNo + colNama) / 2, totalY + 6, {
    align: "center",
  });
  pdf.setFillColor(FILL.r, FILL.g, FILL.b);
  pdf.rect(
    tableX + colNo + colNama + 0.4,
    totalY + 0.4,
    colQty - 0.8,
    rowHeight - 0.8,
    "F",
  );
  if (data.total) {
    pdf.setFont("helvetica", "bold");
    pdf.text(
      data.total,
      tableX + colNo + colNama + colQty / 2,
      totalY + 6,
      { align: "center" },
    );
  }

  y = tableY + tableH + 8;

  // Diterima tgl
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(30, 30, 30);
  pdf.text("Diterima Tgl :", margin, y + 4.5);
  pdf.setFillColor(FILL.r, FILL.g, FILL.b);
  pdf.setDrawColor(BORDER.r, BORDER.g, BORDER.b);
  pdf.rect(margin + 32, y, 48, 7, "FD");
  if (data.diterimaTgl) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.text(data.diterimaTgl, margin + 34, y + 4.8);
  }
  y += 10;

  pdf.setFont("helvetica", "italic");
  pdf.setFontSize(8);
  pdf.setTextColor(100, 116, 139);
  pdf.text(
    "* Isikan tanggal diterimanya barang di lokasi tujuan.",
    margin,
    y,
  );
  y += 6;

  // Signature boxes
  const signGap = 8;
  const signW = (contentW - signGap * 2) / 3;
  const signH = 38;
  const titles = ["Penerima", "Transporter", "Pengirim"];
  titles.forEach((title, i) => {
    drawSignBox(pdf, title, margin + i * (signW + signGap), y, signW, signH);
  });

  const fileName = data.nomorSuratJalan?.trim()
    ? `Surat_Jalan_${data.nomorSuratJalan.trim().replace(/[\\/:*?"<>|]/g, "_")}.pdf`
    : "Surat_Jalan_Cabang.pdf";

  pdf.save(fileName);
};
