import { UIGateLoadingDO } from "./mapOutboundGateToUILoading";
import { getGateSkuCompositeKey } from "./gateSkuHelpers";

export function isGateLoadComplete(doData: UIGateLoadingDO): boolean {
    const requiredKeys = new Set<string>();

    doData.memos.forEach((memo) => {
        memo.pallets.forEach((pallet) => {
            pallet.skus.forEach((sku) => {
                requiredKeys.add(
                    `${memo.memo_id}|${pallet.pallet_id}|${getGateSkuCompositeKey(sku)}`,
                );
            });
        });
    });

    const loadedKeys = new Set<string>(
        doData.assigned_gate_loads.map(
            (l) =>
                `${l.outbound_memo_id}|${l.pallet_id}|${getGateSkuCompositeKey({
                    item_id: l.item_id,
                    uom: l.uom,
                    week_number: l.week_number,
                })}`,
        ),
    );

    for (const key of requiredKeys) {
        if (!loadedKeys.has(key)) {
            return false;
        }
    }

    return true;
}
