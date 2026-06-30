import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// Sesuaikan tipe data dengan yang ada di aplikasi Anda
export const exportSummaryToExcel = (
    enrichedData: any[],
    cabangName: string,
    targetDate: string
) => {
    if (!enrichedData || enrichedData.length === 0) {
        alert("Tidak ada data untuk diexport!");
        return;
    }

    // 1. Ekstrak semua SKU unik dari seluruh dokumen untuk dijadikan Kolom Header
    const skuSet = new Set<string>();
    enrichedData.forEach((doc) => {
        doc.details.forEach((detail: any) => skuSet.add(detail.item_code));
    });
    const uniqueSKUs = Array.from(skuSet).sort(); // Sort abjad agar rapi (ROKOK A, ROKOK B, dst)

    // 2. Persiapkan Array Rows untuk Excel
    const rows: any[][] = [];

    // --- HEADER SECTION ---
    rows.push(["SUMMARY PERMINTAAN SALESMAN"]);
    rows.push([]); // Baris kosong

    const headers = ["SALESMAN", "CHANNEL", ...uniqueSKUs, "Alias"];
    rows.push(headers);

    // 3. Persiapkan variabel penampung untuk kalkulasi Total di Footer
    const totals = {
        spb: {} as Record<string, number>,
        btb: {} as Record<string, number>,
        dar: {} as Record<string, number>,
    };

    uniqueSKUs.forEach((sku) => {
        totals.spb[sku] = 0;
        totals.btb[sku] = 0;
    });

    // --- DATA SALESMAN SECTION ---
    enrichedData.forEach((doc) => {
        // Asumsi type channel ada di doc.trip_type, jika tidak ada set default "RRO"
        const row = [doc.sales_name || "Unknown", doc.trip_type || "RRO"];

        uniqueSKUs.forEach((sku) => {
            const detail = doc.details.find((d: any) => d.item_code === sku);

            const spbQty = detail ? Number(detail.item_qty_final) || 0 : 0;
            const btbQty = detail ? Number(detail.qty_btb) || 0 : 0;

            // Sesuai gambar, jika qty 0 biarkan kosong ("") agar rapi seperti tabel Excel aslinya
            row.push(spbQty > 0 ? spbQty : "");

            // Tambahkan ke total akumulasi
            totals.spb[sku] += spbQty;
            totals.btb[sku] += btbQty;
        });

        row.push(""); // Kolom Alias dikosongkan untuk baris Salesman
        rows.push(row);
    });

    // Hitung DAR (Total SPB - Total BTB)
    uniqueSKUs.forEach((sku) => {
        totals.dar[sku] = totals.spb[sku] - totals.btb[sku];
    });

    // --- FOOTER SUMMARY SECTION ---
    const stockCabangRow: (string | number)[] = [`Stock by ${cabangName || "Cabang"}`, ""];
    const stockExRow: (string | number)[] = ["Stock ex preparation", ""];
    const btbRow: (string | number)[] = ["Stock BTB H-1", ""];
    const spbRow: (string | number)[] = ["Total SPB H+1", ""];
    const darRow: (string | number)[] = ["Total DAR", ""];

    uniqueSKUs.forEach((sku) => {
        stockCabangRow.push("");
        stockExRow.push("");
        btbRow.push(totals.btb[sku] || 0);
        spbRow.push(totals.spb[sku] || 0);
        darRow.push(totals.dar[sku] || 0);
    });

    // Keterangan Alias di kolom terakhir
    stockCabangRow.push("Stock OU");
    stockExRow.push("Stock Gudang Kecil (Manual)");
    btbRow.push("BTB");
    spbRow.push("SPB");
    darRow.push("SPB - BTB - Sisa stock gd. Kecil");

    rows.push(stockCabangRow);
    rows.push(stockExRow);
    rows.push(btbRow);
    rows.push(spbRow);
    rows.push(darRow);

    // 4. Generate Workbook & Worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(rows);

    // Merge cell untuk Judul (Baris 1, merentang dari kolom A sampai ujung Alias)
    worksheet["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Summary Permintaan");

    // 5. Eksekusi Download
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, `Summary_SKU_${cabangName}_${targetDate}.xlsx`);
};