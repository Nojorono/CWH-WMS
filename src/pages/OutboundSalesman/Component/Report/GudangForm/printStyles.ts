/** Shared @page / print CSS for Gudang forms — kertas A4 210mm × 297mm (portrait). */
export const GUDANG_FORM_PRINT_PAGE_STYLE = `
  @page {
    size: 210mm 297mm;
    margin: 12mm 10mm;
  }
  @media print {
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: white !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .gudang-form-sheet {
      width: 100%;
    }
    .gudang-form-table {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .gudang-form-table thead {
      display: table-header-group;
    }
    .gudang-form-table tr {
      break-inside: avoid;
      page-break-inside: avoid;
    }
  }
`;

/** Print BKB — Continuous Form Applied 3 (9.5" × 11" / 241mm × 279mm). */
export const BKB_CONTINUOUS_FORM_WIDTH_MM = 241;
export const BKB_CONTINUOUS_FORM_HEIGHT_MM = 279;

export const BKB_PRINT_PAGE_STYLE = `
  @page {
    size: ${BKB_CONTINUOUS_FORM_WIDTH_MM}mm ${BKB_CONTINUOUS_FORM_HEIGHT_MM}mm;
    /* margin kiri = kanan agar form center */
    margin: 6mm 12mm;
  }
  @media print {
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      background: white !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .bkb-print-root {
      width: 100% !important;
      max-width: none !important;
      margin: 0 auto !important;
    }
    .bkb-print-sheet {
      width: 100% !important;
      max-width: none !important;
      margin: 0 auto !important;
      padding: 0 !important;
      box-sizing: border-box !important;
      overflow: visible !important;
      page-break-inside: auto;
      break-inside: auto;
    }
    .bkb-print-sheet table {
      width: 100% !important;
      margin: 0 auto !important;
    }
    .bkb-print-sheet table thead {
      display: table-header-group;
    }
    .bkb-print-sheet tr {
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .bkb-page-break {
      page-break-after: always;
      break-after: page;
    }
  }
`;
