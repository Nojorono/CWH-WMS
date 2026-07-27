import { OutboundDoUI } from "../../../../../DynamicAPI/types/ShipConfirmType";

const isErrorStatus = (status?: string | null): boolean => {
  if (status == null || String(status).trim() === "") return false;
  const normalized = String(status).trim().toUpperCase();
  return normalized === "E" || normalized === "ERROR" || normalized === "FAILED";
};

export const mapShipConfirmLogList = (flatData: any[]): OutboundDoUI[] => {
  if (!flatData || !Array.isArray(flatData) || flatData.length === 0) return [];

  const doMap = new Map<string, any>();

  flatData.forEach((row) => {
    const doId = row.outbound_do_id;
    const txType = row.transaction_type || "UNKNOWN_TYPE";
    const logDoKey = `${doId}_${txType}`;

    // 1. GROUPING LEVEL 1: Outbound DO + Tipe Transaksi
    if (!doMap.has(logDoKey)) {
      doMap.set(logDoKey, {
        ...row.outbound_do,
        id: logDoKey,
        real_do_id: doId,
        log_transaction_type: txType,
        computed_status: "U",
        computed_req_id: "N/A",
        computed_error_message: null,
        tempMemoMap: new Map<string, any>(),
      });
    }
    const currentDo = doMap.get(logDoKey);

    // 2. GROUPING LEVEL 2: Outbound Memo
    if (row.outbound_memo) {
      const memoId = row.outbound_memo.id;

      if (!currentDo.tempMemoMap.has(memoId)) {
        currentDo.tempMemoMap.set(memoId, {
          ...row.outbound_memo,
          tempItemMap: new Map<string, any>(),
        });
      }
      const currentMemo = currentDo.tempMemoMap.get(memoId);

      // 3. GROUPING LEVEL 3: Item Memo
      if (row.outbound_memo_item) {
        const itemId = row.outbound_memo_item.id;

        const {
          outbound_do,
          outbound_memo,
          outbound_memo_item,
          ...integrationDataRest
        } = row;

        if (!currentMemo.tempItemMap.has(itemId)) {
          currentMemo.tempItemMap.set(itemId, {
            ...outbound_memo_item,
            current_transaction_type: txType,
            integration_data: {
              transaction_type: txType,
              ...integrationDataRest,
            },
          });
        }
      }
    }
  });

  // Konversi struktur Map kembali menjadi Array + Jalankan Pre-computation Status
  return Array.from(doMap.values()).map((doItem) => {
    const memosArray = Array.from(doItem.tempMemoMap.values()).map(
      (memo: any) => {
        const itemsArray = Array.from(memo.tempItemMap.values());
        delete memo.tempItemMap;

        return {
          ...memo,
          outbound_memo_items: itemsArray,
        };
      },
    );

    delete doItem.tempMemoMap;

    // =========================================================================
    // 🔹 ENGINE PARSER STATUS: SINKRONISASI DI LEVEL DATA (UI TERIMA BERSIH)
    // =========================================================================
    const firstItem = memosArray?.[0]?.outbound_memo_items?.[0];
    const intg = firstItem?.integration_data;
    const txType = doItem.log_transaction_type;

    let finalStatus = "U";
    let finalReqId = "N/A";
    let errorMessage = null;

    if (txType === "Outbound GS SO Subdist Pick Release") {
      // Cek Eror Berantai dari pilar Pick Release
      if (
        intg?.create_delivery_status === "E" ||
        intg?.update_delivery_status === "E" ||
        intg?.pick_release_status === "E"
      ) {
        finalStatus = "E";
        errorMessage =
          intg?.create_delivery_message ||
          intg?.update_delivery_message ||
          intg?.pick_release_message ||
          "Error Oracle Pick";
      } else {
        finalStatus = intg?.pick_release_status || "U";
      }
      finalReqId = intg?.pick_release_request_id || "N/A";
    } else if (txType === "Outbound GS SO Subdist Ship Confirm") {
      // Cek Eror Fase Akhir Pengiriman
      if (intg?.ship_confirm_status === "E") {
        finalStatus = "E";
        errorMessage =
          intg?.ship_confirm_message || "Error Oracle Ship Confirm";
      } else {
        finalStatus = intg?.ship_confirm_status || "U";
      }
      finalReqId = intg?.ship_confirm_request_id || "N/A";
    } else if (txType === "Outbound GS Mutasi SO Internal") {
      // Mutasi Internal: delivery error (create/update) → status utama E, bukan U
      if (
        isErrorStatus(intg?.create_delivery_status) ||
        isErrorStatus(intg?.update_delivery_status) ||
        isErrorStatus(intg?.ship_confirm_status) ||
        isErrorStatus(intg?.pick_release_status)
      ) {
        finalStatus = "E";
        errorMessage =
          intg?.create_delivery_message ||
          intg?.update_delivery_message ||
          intg?.ship_confirm_message ||
          intg?.pick_release_message ||
          "Error Internal Mutasi";
      } else {
        finalStatus =
          intg?.ship_confirm_status ||
          intg?.pick_release_status ||
          intg?.create_delivery_status ||
          intg?.update_delivery_status ||
          "U";
      }
      finalReqId =
        intg?.ship_confirm_request_id || intg?.pick_release_request_id || "N/A";
    }

    return {
      ...doItem,
      outbound_memos: memosArray,
      computed_status: finalStatus,
      computed_req_id: finalReqId,
      computed_error_message: errorMessage,
    } as any; 
  });
};
