
import { UIGateAssignedGateLoad } from "./mapOutboundGateToUILoading";

export const isMemoGateLoadComplete = (
    memo: any,
    assignedGateLoads: UIGateAssignedGateLoad[]
) => {
    return memo.pallets.every((pallet: any) =>
        pallet.skus.every((sku: any) =>
            assignedGateLoads.some(
                (l) =>
                    l.item_id === sku.item_id &&
                    l.pallet_id === pallet.pallet_id &&
                    l.outbound_memo_id === memo.memo_id
            )
        )
    );
};
