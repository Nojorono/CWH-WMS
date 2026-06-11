import { OutboundDoUI } from "../../../../../DynamicAPI/types/ShipConfirmType";

export const mapShipConfirmLogList = (flatData: any[]): OutboundDoUI[] => {
  if (!flatData || !Array.isArray(flatData) || flatData.length === 0) return [];

  const doMap = new Map<string, any>();

  flatData.forEach((row) => {
    const doId = row.outbound_do_id;
    const txType = row.transaction_type || "UNKNOWN_TYPE";

    // 🔹 KUNCI UTAMA: Gabungkan DO ID dengan Transaction Type agar pecah jadi baris terpisah di tabel utama!
    const logDoKey = `${doId}_${txType}`;

    // 1. GROUPING LEVEL 1: Outbound DO + Tipe Transaksi
    if (!doMap.has(logDoKey)) {
      doMap.set(logDoKey, {
        ...row.outbound_do,
        // Kita timpa id-nya menggunakan logDoKey agar row tanstack table memiliki unique key yang valid
        id: logDoKey,
        real_do_id: doId, // Tetap simpan ID asli jika sewaktu-waktu butuh fetch detail
        log_transaction_type: txType, // Simpan tipe transaksi untuk dibaca langsung di kolom tabel utama
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

  // Konversi struktur Map kembali menjadi Array
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

    return {
      ...doItem,
      outbound_memos: memosArray,
    } as OutboundDoUI;
  });
};
