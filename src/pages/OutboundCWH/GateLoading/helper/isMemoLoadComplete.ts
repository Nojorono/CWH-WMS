
import { UIGateAssignedGateLoad } from "./mapOutboundGateToUILoading";
import { gateLoadMatchesSku } from "./gateSkuHelpers";

export const isMemoGateLoadComplete = (
    memo: any,
    assignedGateLoads: UIGateAssignedGateLoad[]
) => {
    return memo.pallets.every((pallet: any) =>
        pallet.skus.every((sku: any) =>
            assignedGateLoads.some((l) =>
                gateLoadMatchesSku(
                    l,
                    sku,
                    pallet.pallet_id,
                    memo.memo_id,
                ),
            ),
        ),
    );
};
