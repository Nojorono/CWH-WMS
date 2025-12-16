import { mapPalletGateVisibility } from "./mapPalletGateVisibility";

export interface DoGateVisibility {
  do_id: string;
  do_number: string;
  do_status: string;

  memos: {
    memo_id: string;
    memo_number: string;
    memo_status: string;
    pallets: ReturnType<typeof mapPalletGateVisibility>[];
  }[];

  summary: {
    total_pallet: number;
    total_memo: number;
    total_sku: number;
  };

  flags: {
    ready_to_load: boolean;
    has_unassigned_pallet: boolean;
  };

  references: {
    pallet_ids: string[];
    memo_ids: string[];
    transaction_scan_ids: string[];
  };
}

export function mapDoGateVisibility(
  assignedGate: any
): DoGateVisibility {
  const outboundDO = assignedGate.outbound_do;

  const memoMap = new Map<string, any>();

  const palletIds = new Set<string>();
  const memoIds = new Set<string>();
  const scanIds = new Set<string>();
  const itemIds = new Set<string>();

  const assignedGatePalletIds = new Set<string>(
    assignedGate.assigned_gate_pallets.map(
      (p: any) => p.pallet_id
    )
  );

  let readyToLoad = true;
  let hasUnassignedPallet = false;

  assignedGate.assigned_gate_pallets.forEach((pallet: any) => {
    const palletVisibility = mapPalletGateVisibility(
      pallet,
      outboundDO,
      assignedGatePalletIds
    );

    palletIds.add(palletVisibility.pallet_id);

    palletVisibility.references.memo_ids.forEach((id) =>
      memoIds.add(id)
    );
    palletVisibility.references.transaction_scan_ids.forEach(
      (id) => scanIds.add(id)
    );
    palletVisibility.references.item_ids.forEach((id) =>
      itemIds.add(id)
    );

    if (!palletVisibility.flags.is_assigned_to_gate) {
      hasUnassignedPallet = true;
      readyToLoad = false;
    }

    if (!palletVisibility.flags.ready_to_load) {
      readyToLoad = false;
    }

    palletVisibility.memo_breakdown.forEach((memo) => {
      if (!memoMap.has(memo.memo_id)) {
        memoMap.set(memo.memo_id, {
          memo_id: memo.memo_id,
          memo_number: memo.memo_number,
          memo_status: memo.memo_status,
          pallets: [],
        });
      }

      memoMap.get(memo.memo_id).pallets.push(palletVisibility);
    });
  });

  return {
    do_id: outboundDO.id,
    do_number: outboundDO.outbound_do_number,
    do_status: outboundDO.status,

    memos: Array.from(memoMap.values()),

    summary: {
      total_pallet: palletIds.size,
      total_memo: memoIds.size,
      total_sku: itemIds.size,
    },

    flags: {
      ready_to_load: readyToLoad,
      has_unassigned_pallet: hasUnassignedPallet,
    },

    references: {
      pallet_ids: Array.from(palletIds),
      memo_ids: Array.from(memoIds),
      transaction_scan_ids: Array.from(scanIds),
    },
  };
}
