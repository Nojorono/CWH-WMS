import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { showErrorToast } from "../../../../components/toast";

export const exportSummaryToExcel = (
    enrichedData: any[],
    cabangName: string,
    targetDate: string,
    sohData?: any[] // 🚀 Parameter Baru untuk Data SOH
) => {
    if (!enrichedData || enrichedData.length === 0) {
        showErrorToast("Tidak ada data untuk diexport!");
        return;
    }

    // 1. Ekstrak semua SKU unik dari seluruh dokumen untuk dijadikan Kolom Header
    const skuSet = new Set<string>();
    enrichedData.forEach((doc) => {
        doc.details.forEach((detail: any) => {
            if (detail.item_code) {
                skuSet.add(detail.item_code);
            }
        });
    });
    const uniqueSKUs = Array.from(skuSet).sort();

    // 2. Buat Map data SOH (Stock On Hand) untuk pencarian cepat
    const sohMap = new Map<string, number>();
    if (sohData && Array.isArray(sohData)) {
        sohData.forEach((item: any) => {
            const code = item.item_code || item.PRODUCT_SKU;
            if (code) {
                sohMap.set(code, Number(item.quantity) || 0);
            }
        });
    }

    // 3. Persiapkan Array Rows untuk Excel
    const rows: any[][] = [];

    // --- HEADER SECTION ---
    rows.push(["SUMMARY PERMINTAAN SALESMAN"]);
    rows.push([]); // Baris kosong

    // Tugas 4: Menambah kolom "Quantity Ending Stock" sebelum kolom "Alias"
    const headers = ["SALESMAN", "CHANNEL", ...uniqueSKUs, "Quantity Ending Stock", "Alias"];
    rows.push(headers);

    // Persiapkan variabel penampung untuk kalkulasi Total di Footer
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
        // Tugas 1: Tampilkan data channel sesungguhnya (doc.channel)
        const row = [doc.sales_name || "Unknown", doc.channel || "-"];

        let totalSalesmanQty = 0;

        uniqueSKUs.forEach((sku) => {
            const detail = doc.details.find((d: any) => d.item_code === sku);

            const spbQty = detail ? Number(detail.item_qty_final) || 0 : 0;
            const btbQty = detail ? Number(detail.qty_btb) || 0 : 0;

            row.push(spbQty > 0 ? spbQty : "");

            // Akumulasi Qty untuk total baris Salesman & Footer
            totalSalesmanQty += spbQty;
            totals.spb[sku] += spbQty;
            totals.btb[sku] += btbQty;
        });

        // Masukkan Total Qty per Salesman ke kolom "Quantity Ending Stock"
        row.push(totalSalesmanQty > 0 ? totalSalesmanQty : "");
        row.push(""); // Kolom Alias kosong untuk Salesman
        rows.push(row);
    });

    // Tugas 5: Tambah baris kosong untuk "Additional SPB"
    const additionalRow = ["Additional SPB", "", ...uniqueSKUs.map(() => ""), "", ""];
    rows.push(additionalRow);

    // Hitung DAR (Total SPB - Total BTB)
    uniqueSKUs.forEach((sku) => {
        totals.dar[sku] = totals.spb[sku] - totals.btb[sku];
    });

    // --- FOOTER SUMMARY SECTION ---
    // Tugas 3: Baris "Stock ex preparation" telah DIHAPUS dari daftar di bawah
    const stockCabangRow: (string | number)[] = [`Stock by ${cabangName || "Cabang"}`, ""];
    const btbRow: (string | number)[] = ["Stock BTB H-1", ""];
    const spbRow: (string | number)[] = ["Total SPB H+1", ""];
    const darRow: (string | number)[] = ["Total DAR", ""];

    let totalSohSum = 0;
    let totalBtbSum = 0;
    let totalSpbSum = 0;
    let totalDarSum = 0;

    uniqueSKUs.forEach((sku) => {
        // Tugas 2: Masukkan nilai SOH riil dari sohMap ke dalam row "Stock by Cabang"
        const sohQty = sohMap.get(sku) || 0;
        stockCabangRow.push(sohQty);
        totalSohSum += sohQty;

        btbRow.push(totals.btb[sku] || 0);
        totalBtbSum += totals.btb[sku] || 0;

        spbRow.push(totals.spb[sku] || 0);
        totalSpbSum += totals.spb[sku] || 0;

        darRow.push(totals.dar[sku] || 0);
        totalDarSum += totals.dar[sku] || 0;
    });

    // Tambah nilai akumulasi total di kolom "Quantity Ending Stock" untuk baris summary
    stockCabangRow.push(totalSohSum);
    btbRow.push(totalBtbSum);
    spbRow.push(totalSpbSum);
    darRow.push(totalDarSum);

    // Keterangan Alias di kolom terakhir
    stockCabangRow.push("Stock OU");
    btbRow.push("BTB");
    spbRow.push("SPB");
    darRow.push("SPB - BTB - Sisa stock gd. Kecil");

    rows.push(stockCabangRow);
    rows.push(btbRow);
    rows.push(spbRow);
    rows.push(darRow);

    // 4. Generate Workbook & Worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(rows);

    // Merge cell untuk Judul (Baris 1)
    worksheet["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Summary Permintaan");

    // 5. Eksekusi Download
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const fileData = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(fileData, `Summary_SKU_${cabangName}_${targetDate}.xlsx`);
};