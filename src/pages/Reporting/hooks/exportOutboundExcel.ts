import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

interface ExportProps {
    type: "SKU" | "PALLET";
    data: any[];
    startDate: string;
    endDate: string;
}

export const exportOutboundToExcel = ({
    type,
    data,
    startDate,
    endDate,
}: ExportProps) => {
    // 1. Tentukan Header Kolom berdasarkan Type (Sesuai Gambar)
    const headerMapping = type === "SKU"
        ? {
            no_surat_jalan: "NO. SURAT JALAN",
            tanggal_kirim: "TANGGAL KIRIM",
            pengirim: "PENGIRIM",
            penerima: "PENERIMA",
            jenis_pengiriman: "JENIS PENGIRIMAN",
            expedisi: "EKSPEDISI",
            nopol: "NOPOL",
            kode_item: "KODE ITEM",
            deskripsi: "DESKRIPSI",
            qty: "QTY",
            uom: "UOM",
        }
        : {
            tanggal_kirim: "TANGGAL KIRIM",
            no_surat_jalan: "NO. SURAT JALAN",
            penerima: "PENERIMA",
            kode_item: "KODE ITEM",
            qty: "QTY",
            no_pallet: "NO PALLET",
            waktu_out: "WAKTU KELUAR",
        };

    // 2. Transformasi data agar menggunakan Nama Header yang rapi
    const formattedData = data.map((item: any) => {
        const row: Record<string, any> = {};
        Object.entries(headerMapping).forEach(([key, label]) => {
            const value = item[key] ?? "-";

            // Cek jika label adalah QTY, paksa menjadi string agar rata kiri mengikuti teks lain
            if (label === "QTY") {
                row[label] = value.toString();
            } else {
                row[label] = value;
            }
        });

        return row;
    });

    // 3. Buat Worksheet
    const worksheet = XLSX.utils.json_to_sheet([]);

    // 4. Tambahkan Info Header Manual (Baris 1-4) seperti di Gambar
    XLSX.utils.sheet_add_aoa(worksheet, [
        ["REPORT PENGELUARAN BARANG"],
        [`TANGGAL AWAL : ${startDate}`],
        [`TANGGAL AKHIR : ${endDate}`],
        [`TYPE STORAGE : ${type}`],
        [], // Baris kosong pembatas
    ], { origin: "A1" });

    // 5. Tambahkan Data Tabel (Mulai dari baris ke-6)
    XLSX.utils.sheet_add_json(worksheet, formattedData, {
        origin: "A6",
        skipHeader: false,
    });

    // 6. Atur Lebar Kolom (Opsional agar tidak berdempetan)
    const wscols = Object.keys(headerMapping).map(() => ({ wch: 20 }));
    worksheet["!cols"] = wscols;

    // 7. Buat Workbook dan Export
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Outbound Report");

    // Proses Write File
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const finalData = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });

    saveAs(finalData, `Report_Outbound_${type}_${startDate}.xlsx`);
};