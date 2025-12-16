import { MemoGateVisibility } from "./MemoGateVisibility";

export interface DoGateVisibility {
    do_id: string;
    do_number: string;
    do_status: string;
    outbound_type: string;

    logistics: {
        expedition: string;
        origin: string;
        license_plate: string;
        driver_name: string;
        driver_phone: string;
        delivery_date: string;
    };

    memos: MemoGateVisibility[];

    summary: {
        total_pallet: number;
        total_memo: number;
        total_sku: number;
        total_pickings: number;
    };

    flags: {
        ready_to_load: boolean;
        has_cancelled_picking: boolean;
    };

    references: {
        pallet_ids: string[];
        memo_ids: string[];
        picking_ids: string[];
        transaction_scan_ids: string[];
    };
}
