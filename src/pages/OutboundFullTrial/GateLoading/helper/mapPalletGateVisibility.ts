export interface PalletGateVisibility {
  pallet_id: string;
  pallet_code: string;
  total_qty: number;
  uom: string;
  is_full: boolean;

  summary: {
    total_sku: number;
    total_memo: number;
  };

  memo_breakdown: MemoBreakdown[];

  flags: {
    multi_memo: boolean;
    multi_sku: boolean;
    has_unapproved_memo: boolean;
    has_unapproved_scan: boolean;
    is_assigned_to_gate: boolean;
    ready_to_load: boolean;
  };

  references: {
    transaction_scan_ids: string[];
    memo_ids: string[];
    item_ids: string[];
  };
}

interface MemoBreakdown {
  memo_id: string;
  memo_number: string;
  memo_status: string;
  items: {
    item_id: string;
    item_name: string;
    qty: number;
    uom: string;
    week_number?: string;
    scan_ids: string[];
  }[];
}

export function mapPalletGateVisibility(
  pallet: any,
  outboundDO: any,
  assignedGatePalletIds: Set<string>
): PalletGateVisibility {
  const memoMap = new Map<string, MemoBreakdown>();
  const scanIds = new Set<string>();
  const memoIds = new Set<string>();
  const itemIds = new Set<string>();

  let totalQty = 0;
  let hasUnapprovedScan = false;
  let hasUnapprovedMemo = false;

  outboundDO.outbound_memos.forEach((memo: any) => {
    memo.transaction_pickings?.forEach((picking: any) => {
      picking.transactionScanPicking?.forEach((scan: any) => {
        if (scan.pallet_use_id !== pallet.pallet_id) return;

        scanIds.add(scan.id);
        memoIds.add(memo.id);
        itemIds.add(scan.item_id);

        totalQty += scan.quantity_picked;

        if (scan.status !== "INSPECTION_APPROVED") {
          hasUnapprovedScan = true;
        }

        if (!memoMap.has(memo.id)) {
          memoMap.set(memo.id, {
            memo_id: memo.id,
            memo_number: memo.outbound_memo_number,
            memo_status: memo.status,
            items: [],
          });
        }

        const memoEntry = memoMap.get(memo.id)!;

        let itemEntry = memoEntry.items.find(
          (i) => i.item_id === scan.item_id
        );

        if (!itemEntry) {
          itemEntry = {
            item_id: scan.item_id,
            item_name:
              pallet.pallet.currentItems?.find(
                (i: any) => i.item_id === scan.item_id
              )?.item_name || "UNKNOWN",
            qty: 0,
            uom: scan.uom,
            week_number: scan.week_number,
            scan_ids: [],
          };
          memoEntry.items.push(itemEntry);
        }

        itemEntry.qty += scan.quantity_picked;
        itemEntry.scan_ids.push(scan.id);
      });
    });

    if (memo.status !== "APPROVED") {
      hasUnapprovedMemo = true;
    }
  });

  const isAssignedToGate = assignedGatePalletIds.has(pallet.pallet_id);

  return {
    pallet_id: pallet.pallet_id,
    pallet_code: pallet.pallet.pallet_code,
    total_qty: totalQty,
    uom: pallet.pallet.uom,
    is_full: pallet.pallet.isFull,

    summary: {
      total_sku: itemIds.size,
      total_memo: memoIds.size,
    },

    memo_breakdown: Array.from(memoMap.values()),

    flags: {
      multi_memo: memoIds.size > 1,
      multi_sku: itemIds.size > 1,
      has_unapproved_memo: hasUnapprovedMemo,
      has_unapproved_scan: hasUnapprovedScan,
      is_assigned_to_gate: isAssignedToGate,
      ready_to_load:
        !hasUnapprovedMemo &&
        !hasUnapprovedScan &&
        isAssignedToGate,
    },

    references: {
      transaction_scan_ids: Array.from(scanIds),
      memo_ids: Array.from(memoIds),
      item_ids: Array.from(itemIds),
    },
  };
}
