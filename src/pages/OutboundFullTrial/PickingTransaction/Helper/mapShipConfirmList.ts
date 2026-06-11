import {
    MemoItemUI,
    MemoUI,
    OutboundDoUI,
} from "../../../../DynamicAPI/types/ShipConfirmType";

export const mapShipConfirmList = (flatData: any[]): OutboundDoUI[] => {
    if (!flatData || !Array.isArray(flatData) || flatData.length === 0) return [];

    const doMap = new Map<string, any>();

    console.log("flatData", flatData);


    flatData.forEach((row) => {
        const doId = row.outbound_do_id;

        if (!doMap.has(doId)) {
            doMap.set(doId, {
                ...row.outbound_do,
                tempMemoMap: new Map<string, any>(),
            });
        }

        const currentDo = doMap.get(doId);

        if (row.outbound_memo) {
            const memoId = row.outbound_memo.id;

            if (!currentDo.tempMemoMap.has(memoId)) {
                currentDo.tempMemoMap.set(memoId, {
                    ...row.outbound_memo,
                    tempItemMap: new Map<string, any>(),
                });
            }

            const currentMemo = currentDo.tempMemoMap.get(memoId);

            if (row.outbound_memo_item) {
                const itemId = row.outbound_memo_item.id;

                const {
                    outbound_do,
                    outbound_memo,
                    outbound_memo_item,
                    id: integration_id,
                    ...integrationDataRest
                } = row;

                if (!currentMemo.tempItemMap.has(itemId)) {
                    currentMemo.tempItemMap.set(itemId, {
                        ...outbound_memo_item,
                        integration_data: {
                            integration_id,
                            ...integrationDataRest,
                        },
                    });
                }
            }
        }
    });

    // Konversi struktur Map kembali menjadi Array UI yang bersih untuk dikonsumsi Modal
    return Array.from(doMap.values()).map((doItem) => {
        const memosArray = Array.from(doItem.tempMemoMap.values()).map((memo: any) => {
            // Ambil list item yang sudah dijamin UNIK dari tempItemMap
            const itemsArray = Array.from(memo.tempItemMap.values());
            delete memo.tempItemMap; // Bersihkan properti penampung sementara

            // --- LOGIKA HITUNG FLAG STATUS ---
            const isPickReleaseSuccess = itemsArray.every((item: any) => {
                return item.integration_data?.pick_release_status === "S";
            });

            const isReadyShipConfirm = itemsArray.every((item: any) => {
                const intg = item.integration_data;
                return intg?.pick_release_status === "S" && intg?.ship_confirm_status === "U";
            });

            return {
                ...memo,
                outbound_memo_items: itemsArray, // Array unik tanpa double item
                is_success_pick_release: isPickReleaseSuccess,
                is_ready_ship_confirm: isReadyShipConfirm,
            } as MemoUI;
        });

        delete doItem.tempMemoMap;

        const isDoPickReleaseSuccess = memosArray.length > 0 && memosArray.every((m) => m.is_success_pick_release);
        const isDoReadyShipConfirm = memosArray.length > 0 && memosArray.every((m) => m.is_ready_ship_confirm);

        return {
            ...doItem,
            outbound_memos: memosArray,
            is_success_pick_release: isDoPickReleaseSuccess,
            is_ready_ship_confirm: isDoReadyShipConfirm,
        } as OutboundDoUI;
    });
};