import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// ============================================================
//  TYPE DEFINITIONS
// ============================================================

export type ExportType = "SKU" | "PALLET";

export interface ExportInboundParams {
    type: ExportType;
    data: any[];
    startDate: string;
    endDate: string;
}

// ============================================================
//  INTERNAL HELPERS
// ============================================================

/**
 * Membangun baris metadata header (judul, tanggal, type storage)
 * yang ditampilkan di atas tabel pada file Excel.
 */
function buildHeaderMetadata(
    startDate: string,
    endDate: string,
    type: ExportType,
    totalColumns: number,
): any[][] {
    const lastCol = totalColumns - 1;

    return [
        ["REPORT PENERIMAAN BARANG"],
        [],
        [
            "TANGGAL AWAL",
            `: ${startDate}`,
            ...Array(lastCol - 4).fill(""),
            "PRINT DATE",
            `: ${new Date().toLocaleDateString("id-ID")}`,
        ],
        [
            "TANGGAL AKHIR",
            `: ${endDate}`,
            ...Array(lastCol - 4).fill(""),
            "PRINT BY",
            ": USER WMS",
        ],
        ["TYPE STORAGE", `: ${type}`],
        [],
    ];
}

// ============================================================
//  COLUMN HEADERS PER TYPE
// ============================================================

const TABLE_HEADERS: Record<ExportType, string[]> = {
    SKU: [
        "TANGGAL INBOUND",
        "NO SURAT JALAN",
        "NO PO",
        "PENGIRIM",
        "PENERIMA",
        "EXPEDISI",
        "NOPOL",
        "KODE ITEM",
        "DESKRIPSI",
        "QTY",
        "UOM",
        "NO RECEIPT",
        "TGL RECEIPT"
    ],
    PALLET: [
        "TANGGAL INBOUND PLANNING",
        "NO SURAT JALAN",
        "NO PO",
        "PENGIRIM",
        "PENERIMA",
        "EXPEDISI",
        "NOPOL",
        "KODE ITEM",
        "DESKRIPSI",
        "QTY",
        "UOM",
        "KODE PRODUKSI",
        "NO PALLET",
        "WAKTU UPDATE PALLET",
        "USER LOADING",
        "NO RECEIPT",
        "TGL RECEIPT",
        "RECEIPT BY",
    ],
};

// ============================================================
//  ROW MAPPERS PER TYPE
// ============================================================

/**
 * Memetakan satu item data SKU menjadi satu baris array untuk Excel.
 * Urutan kolom harus sesuai dengan TABLE_HEADERS["SKU"].
 */
function mapRowSKU(item: any): any[] {
    return [
        item.arrival_date
            ? new Date(item.arrival_date).toLocaleDateString("id-ID")
            : "-",
        item.inbound_do_number,
        item.inbound_po_number,
        item.principal,
        item.penerima,
        item.expedition,
        item.license_plate,
        item.item_number,
        item.description,
        item.quantity,
        item.uom,
        item.inbound_number,
        item.tgl_receipt
    ];
}

/**
 * Memetakan satu item data PALLET menjadi satu baris array untuk Excel.
 * Urutan kolom harus sesuai dengan TABLE_HEADERS["PALLET"].
 */
function mapRowPallet(item: any): any[] {
    return [
        item.arrival_date
            ? new Date(item.arrival_date).toLocaleDateString("id-ID")
            : "-",
        item.inbound_do_number,
        item.inbound_po_number,
        item.principal,
        item.penerima,
        item.expedition,
        item.license_plate,
        item.item_number,
        item.description,
        item.quantity,
        item.uom,
        item.kode_produksi,
        item.no_pallet,
        item.waktu_update_pallet,
        item.user_loading,
        item.inbound_number,
        item.tgl_receipt,
        item.receipt_by,
    ];
}

const ROW_MAPPERS: Record<ExportType, (item: any) => any[]> = {
    SKU: mapRowSKU,
    PALLET: mapRowPallet,
};

// ============================================================
//  MAIN EXPORT FUNCTION
// ============================================================

/**
 * Mengekspor data inbound (SKU atau PALLET) ke file Excel (.xlsx).
 *
 * Untuk menambah/mengubah kolom:
 *   1. Edit TABLE_HEADERS["SKU"] atau TABLE_HEADERS["PALLET"]
 *   2. Edit mapRowSKU() atau mapRowPallet() sesuai urutan kolom baru
 *
 * Untuk mengubah format metadata header:
 *   Edit fungsi buildHeaderMetadata() di atas.
 */
export function exportInboundToExcel({
    type,
    data,
    startDate,
    endDate,
}: ExportInboundParams): void {
    const headers = TABLE_HEADERS[type];
    const mapRow = ROW_MAPPERS[type];
    const totalColumns = headers.length;

    const headerMetadata = buildHeaderMetadata(
        startDate,
        endDate,
        type,
        totalColumns,
    );

    const tableRows = data.map(mapRow);

    const worksheet = XLSX.utils.aoa_to_sheet([
        ...headerMetadata,
        headers,
        ...tableRows,
    ]);

    // Merge sel judul "REPORT PENERIMAAN BARANG" sepanjang semua kolom
    if (!worksheet["!merges"]) worksheet["!merges"] = [];
    worksheet["!merges"].push({
        s: { r: 0, c: 0 },
        e: { r: 0, c: totalColumns - 1 },
    });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");

    const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
    });

    saveAs(
        new Blob([excelBuffer]),
        `Report_${type}_${new Date().getTime()}.xlsx`,
    );
}