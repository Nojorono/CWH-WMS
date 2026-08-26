/** Shared @page / print CSS for Gudang forms (react-to-print pageStyle). */
export const GUDANG_FORM_PRINT_PAGE_STYLE = `
  @page {
    size: A4 portrait;
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
