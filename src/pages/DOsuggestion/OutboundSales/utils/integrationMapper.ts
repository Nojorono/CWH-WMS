import dayjs from "dayjs";

export const mapToSimpleOraclePayload = (groupedData: any[], currentUser: any) => {
  const payloads: any[] = [];

  // Loop setiap Grup Supervisor
  groupedData.forEach((spvGroup) => {
    
    // Loop setiap SPB di dalam grup tersebut
    spvGroup.salesmenDO.forEach((spb: any) => {
      
      // 1. FILTER: Buang barang yang Final Qty-nya 0
      const validDetails = spb.details.filter(
        (detail: any) => Number(detail.item_qty_final) > 0
      );

      // Jika SPB kosong setelah difilter, lewati.
      if (validDetails.length === 0) return;

      // 2. MAPPING LINES (Detail Barang)
      const mappedLines = validDetails.map((detail: any, index: number) => {
        return {
          LINE_NUMBER: index + 1, // Nomor urut 1, 2, 3...
          ORGANIZATION_ID: Number(spb.organization.organization_id), // cth: 243
          INVENTORY_ITEM_ID: Number(detail.inventory_item_id), // cth: 4114
          FROM_SUBINVENTORY_CODE: "KECIL", // ✅ Hardcode sementara (Biasanya gudang utama)
          TO_SUBINVENTORY_CODE: "CANVAS",  // ❌ BELUM TERSEDIA di JSON (Biasanya sub-inv tujuan)
          
          FROM_LOCATOR_ID: null, // ❌ BELUM TERSEDIA (Butuh ID lokasi rak gudang)
          TO_LOCATOR_ID: null,   // ❌ BELUM TERSEDIA (Butuh ID lokasi tujuan/mobil)
          
          UOM_CODE: "BKS",
          QUANTITY: Number(detail.item_qty_final),
          DATE_REQUIRED: dayjs(spb.spb_date).format("YYYY-MM-DD"),
          TRANSACTION_TYPE_ID: 121, // ✅ Hardcode sesuai contoh payload Anda
          TRANSACTION_SOURCE_TYPE_ID: 4, // ✅ Hardcode
          LINE_STATUS: 7, // ✅ Hardcode (Ready)
          STATUS_DATE: dayjs(spb.spb_date).format("YYYY-MM-DD"),
          
          LOT_NUMBER: "", // ❌ BELUM TERSEDIA (Jika ada lot number)
          
          SOURCE_LINE_ID: detail.id, // UUID untuk tracing
          IFACE_STATUS: "READY",
          OPERATION: "CREATE",
          DB_FLAG: "T"
        };
      });

      // 3. MAPPING HEADER
      const headerPayload = {
        REQUEST_NUMBER: spb.spb_number,
        TRANSACTION_TYPE_ID: 121, // ✅ Hardcode
        MOVE_ORDER_TYPE: 1,       // ✅ Hardcode
        ORGANIZATION_ID: Number(spb.organization.organization_id), // cth: 243
        DATE_REQUIRED: dayjs(spb.spb_date).format("YYYY-MM-DD"),
        FROM_SUBINVENTORY_CODE: "KECIL", // ✅ Hardcode
        TO_SUBINVENTORY_CODE: "CANVAS",  // ❌ BELUM TERSEDIA (Sama seperti di line)
        HEADER_STATUS: 7,
        STATUS_DATE: dayjs(spb.spb_date).format("YYYY-MM-DD"),
        ATTRIBUTE_CATEGORY: "FPPR Tambahan", // ✅ Hardcode sesuai contoh
        
        // ATTRIBUTE biasanya dipakai untuk menyimpan data tracking tambahan di Oracle
        ATTRIBUTE7: dayjs(spb.callplan_date_start).format("YYYY-MM-DD"), 
        ATTRIBUTE8: dayjs(spb.callplan_date_end).format("YYYY-MM-DD"),
        ATTRIBUTE9: spb.sales_nik,
        ATTRIBUTE10: spb.sales_spv_nik,
        ATTRIBUTE11: spb.trip_type,
        ATTRIBUTE12: "CVS", // ✅ Hardcode tipe sales
        ATTRIBUTE13: spb.callplan_number,
        ATTRIBUTE14: spb.spb_number,
        
        OPERATION: "CREATE",
        DB_FLAG: "T",
        SOURCE_SYSTEM: "DMS",
        SOURCE_HEADER_ID: spb.spb_number,
        SOURCE_LINE_ID: "", // Biasanya kosong untuk Header
        SOURCE_BATCH_ID: "", // ❌ BELUM TERSEDIA (Jika Anda butuh ID batching)
        IFACE_STATUS: "READY",
        IFACE_MODE: "MOVE_ORDER",
        TOTAL_LINES: mappedLines.length,
        CREATION_DATE: dayjs().format("YYYY-MM-DD"),
        CREATED_BY: currentUser?.employee_id || 1234, // ❌ Datang dari context login
        LAST_UPDATE_DATE: dayjs().format("YYYY-MM-DD"),
        LAST_UPDATED_BY: currentUser?.employee_id || 1234, // ❌ Datang dari context login
        
        // --- DATA BERSARANG ---
        lines: mappedLines,
        userId: currentUser?.employee_id || 1234,     // ❌ Datang dari context login
        userName: currentUser?.name || "John Doe"     // ❌ Datang dari context login
      };

      payloads.push(headerPayload);
    });
  });

  return payloads;
};