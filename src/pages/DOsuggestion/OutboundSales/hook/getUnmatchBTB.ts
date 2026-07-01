// File: src/helper/btbMatchingHelper.ts

import { BTBDetailLine, BTBSalesmanGroup } from "../../../../API/types/BTBdata";


/**
 * Fungsi untuk mencari item BTB yang TIDAK DIBUTUHKAN di DO (Excess/Unmatched Items)
 * 
 * @param btbData Data list BTB per salesman (dari hook useGetBTB)
 * @param doData Data list DO per salesman (sesuaikan dengan tipe data DO Anda)
 * @returns Array BTBSalesmanGroup yang 'details'-nya HANYA berisi item unmatch
 */
export const getUnmatchedBTBItems = (
    btbData: BTBSalesmanGroup[],
    doData: any[] // Ganti 'any' dengan tipe data DO Anda (misal: GroupedSPBData[])
): BTBSalesmanGroup[] => {
    const unmatchedResults: BTBSalesmanGroup[] = [];

    btbData.forEach((btbSalesman) => {
        // 1. Cari data DO untuk salesman ini berdasarkan NIK
        // (Pastikan field pencocokan DO Anda bernama 'sales_nik')
        const matchingDOSalesman = doData.find(
            (doSales) => doSales.sales_nik === btbSalesman.SALES_NIK
        );

        // 2. Kumpulkan semua SKU dari data DO ke dalam Set
        // (Pastikan field SKU di data DO Anda bernama 'item_code')
        const doSkuSet = new Set(
            matchingDOSalesman?.details?.map((doItem: any) => doItem.item_code) || []
        );

        // 3. Filter item BTB: Ambil HANYA yang SKU-nya TIDAK ADA di Set DO
        // Kita langsung mapping tipe datanya ke BTBDetailLine dan bisa sekalian isi flag-nya
        const unmatchedItems: BTBDetailLine[] = btbSalesman.details
            .filter((btbItem) => !doSkuSet.has(btbItem.PRODUCT_SKU))
            .map((item) => ({
                ...item,
                IS_MATCH_DO: false,
                STATUS_ITEM: "EXCESS", // Opsional: Beri status agar UI gampang membedakan
            }));

        // 4. Jika salesman ini punya item tak terpakai, masukkan ke hasil akhir
        if (unmatchedItems.length > 0) {
            unmatchedResults.push({
                ...btbSalesman,          // Copy data salesman (NIK, Name, BTB_NUMBER, dll)
                details: unmatchedItems, // Timpa array details HANYA dengan item yang unmatch
            });
        }
    });

    return unmatchedResults;
};