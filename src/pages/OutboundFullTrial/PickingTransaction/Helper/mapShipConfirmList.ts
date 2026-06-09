import {
    MemoItemUI,
    MemoUI,
    OutboundDoUI,
} from "../../../../DynamicAPI/types/ShipConfirmType";

export const mapShipConfirmList = (flatData: any[]): OutboundDoUI[] => {
    if (!flatData || !Array.isArray(flatData) || flatData.length === 0) return [];

    const doMap = new Map<string, any>();

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
                    outbound_memo_items: [] as MemoItemUI[],
                });
            }

            if (row.outbound_memo_item) {
                const {
                    outbound_do,
                    outbound_memo,
                    outbound_memo_item,
                    id: integration_id,
                    ...integrationDataRest
                } = row;

                const enrichedItem: MemoItemUI = {
                    ...outbound_memo_item,
                    integration_data: {
                        integration_id,
                        ...integrationDataRest,
                    },
                };

                currentDo.tempMemoMap
                    .get(memoId)
                    .outbound_memo_items.push(enrichedItem);
            }
        }
    });

    // 5. Konversi Map dan Kalkulasi Flag Status Proses
    return Array.from(doMap.values()).map((doItem) => {

        // --- PROSES LEVEL MEMO ---
        const memosArray = Array.from(doItem.tempMemoMap.values()).map((memo: any) => {

            // 1. Cek: Apakah SEMUA item sudah berhasil Pick Release?
            const isPickReleaseSuccess = memo.outbound_memo_items.every((item: MemoItemUI) => {
                return item.integration_data?.pick_release_status === "S";
            });

            // 2. Cek: Apakah SEMUA item SIAP untuk Ship Confirm?
            // (Syarat: Sudah Pick Release DAN Belum Ship Confirm)
            const isReadyShipConfirm = memo.outbound_memo_items.every((item: MemoItemUI) => {
                const intg = item.integration_data;
                return intg?.pick_release_status === "S" && intg?.ship_confirm_status === "U";
            });

            return {
                ...memo,
                is_success_pick_release: isPickReleaseSuccess,
                is_ready_ship_confirm: isReadyShipConfirm,
            } as MemoUI;
        });

        delete doItem.tempMemoMap;

        // --- PROSES LEVEL DO (HEADER) ---
        // DO dianggap sukses Pick Release jika SEMUA memonya sukses
        const isDoPickReleaseSuccess = memosArray.length > 0 &&
            memosArray.every((memo: MemoUI) => memo.is_success_pick_release);

        // DO dianggap siap Ship Confirm jika SEMUA memonya siap
        const isDoReadyShipConfirm = memosArray.length > 0 &&
            memosArray.every((memo: MemoUI) => memo.is_ready_ship_confirm);

        return {
            ...doItem,
            outbound_memos: memosArray,
            is_success_pick_release: isDoPickReleaseSuccess,
            is_ready_ship_confirm: isDoReadyShipConfirm,
        } as OutboundDoUI;
    });
};