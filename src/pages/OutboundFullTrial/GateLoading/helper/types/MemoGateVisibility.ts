import { PalletGateVisibility } from "./PalletGateVisibility";
import { PickingVisibility } from "./PickingVisibility";

export interface MemoGateVisibility {
    memo_id: string;
    memo_number: string;
    memo_status: string;

    requestor: string;
    origin: string;
    ship_to: string;
    destination: string;

    pickings: PickingVisibility[];

    pallets: PalletGateVisibility[];
}
