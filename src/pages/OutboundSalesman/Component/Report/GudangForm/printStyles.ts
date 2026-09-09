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

/** Print BKB — kertas A4 (landscape agar tabel muat), tetap ukuran A4. */
export const BKB_PRINT_PAGE_STYLE = `
  @page {
    size: 297mm 210mm;
    margin: 8mm;
  }
  @media print {
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: white !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
  }
`;
