import { ScanVisibility } from "./ScanVisibility";

export interface PickingVisibility {
    picking_id: string;
    item_id: string;
    item_name?: string;

    quantity_plan: number;
    quantity_picked: number;
    uom: string;
    week_number?: number;

    status: "PENDING" | "CANCELLED" | "DONE";

    source: {
        warehouse_sub_id: string;
        bin_id: string;
    };

    destination: {
        warehouse_sub_id: string;
        bin_id: string;
    };

    scans: ScanVisibility[];
}
