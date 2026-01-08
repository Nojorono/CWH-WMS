import { UIGateLoadingDO } from "./mapOutboundGateToUILoading";

export function isGateLoadComplete(doData: UIGateLoadingDO): boolean {
    // 1. semua SKU wajib
    const requiredKeys = new Set<string>();

    doData.memos.forEach((memo) => {
        memo.pallets.forEach((pallet) => {
            pallet.skus.forEach((sku) => {
                requiredKeys.add(
                    `${memo.memo_id}|${pallet.pallet_id}|${sku.item_id}`
                );
            });
        });
    });

    // 2. semua SKU yang sudah diload
    const loadedKeys = new Set<string>(
        doData.assigned_gate_loads.map(
            (l) =>
                `${l.outbound_memo_id}|${l.pallet_id}|${l.item_id}`
        )
    );

    // 3. cek semua required ada di loaded
    for (const key of requiredKeys) {
        if (!loadedKeys.has(key)) {
            return false;
        }
    }

    return true;
}
