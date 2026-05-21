/* =======================
  UI TYPES
======================= */

export interface UIGateLoadingDO {
  main_status: string;
  assigned_gate_id: string;
  do_id: string;
  do_number: string;
  status: string;
  expedition: string;
  origin: string;
  destination_date: string | null;
  outboundType: string;

  driver: {
    name: string;
    phone: string;
    license_plate: string;
  };

  gate: {
    gate_id: string;
    gate_name: string;
    gate_code: string;
  };

  assigned_helpers: UIGateUser[];
  assigned_pallets: UIGatePallet[];
  assigned_gate_loads: UIGateAssignedGateLoad[];
  memos: UIMemo[];
}

export interface UIGateUser {
  [x: string]: string;
  user_id: string;
  username: string;
  name: string;
  phone: string;
}

export interface UIGatePallet {
  pallet_id: string;
  pallet_code: string;
  capacity: number;
  currentQuantity: number;
  status: string;
  currentItems: {
    item_id: string;
    item_name: string;
    quantity: number;
    uom: string;
    week_number: number | null;
    production_date?: string;
  }[];
}

export interface UIGateAssignedGateLoad {
  id: string;
  outbound_memo_id: string;
  pallet_id: string;
  item_id: string;
  quantity_loaded: number;
  status: string;
  uom: string;
}

export interface UIMemo {
  memo_id: string;
  memo_number: string;
  origin: string;
  destination: string;
  ship_to: string;
  status: string;
  has_do: boolean;

  memo_items: {
    item_id: string;
    quantity_plan: number;
    uom: string;
    status: string;
  }[];

  pallets: UIPallet[];
}

export interface UIPallet {
  pallet_id: string;
  pallet_code: string;
  status: string;
  skus: UISKU[];
}

export interface UISKU {
  item_id: string;
  item_name: string;
  uom: string;
  week_number: number | null;
  production_date?: string;
  pickings: UIPicking[];
}

export interface UIPicking {
  picking_id: string;
  quantity: number;
  status: string;
  scans: UIScanPicking[];
}

export interface UIScanPicking {
  scan_id: string;
  pallet_source_id: string;
  pallet_use_id: string;
  quantity_picked: number;
  uom: string;
  status: string;
  inspected_by: string;
}

/* =======================
  SAFE HELPERS
======================= */

const safeArray = <T = any,>(v: any): T[] => (Array.isArray(v) ? v : []);
const safeObject = <T = any,>(v: any): T =>
  v && typeof v === "object" ? v : ({} as T);

/* =======================
  MAIN MAPPER
======================= */

export function mapOutboundGateToUILoading(
  data: any[] = [],
): UIGateLoadingDO[] {
  return safeArray(data).map((gateItem) => {
    const doData = safeObject(gateItem?.outbound_do);

    const assignedGateUsers = safeArray(gateItem?.assigned_gate_users);
    const assignedGatePallets = safeArray(gateItem?.assigned_gate_pallets);
    // baru: ambil assigned_gate_helpers jika ada
    const assignedGateHelpers = safeArray(gateItem?.assigned_gate_helpers);

    /* =======================
     PALLET LOOKUP
   ======================= */
    const palletLookup = new Map<string, any>();
    assignedGatePallets.forEach((p) => {
      if (p?.pallet?.id) {
        palletLookup.set(p.pallet.id, p);
      }
    });

    return {
      assigned_gate_id: gateItem?.id ?? "",
      do_id: doData?.id ?? "",
      do_number: doData?.outbound_do_number ?? "-",
      status: doData?.status ?? "",
      expedition: doData?.expedition ?? "-",
      origin: doData?.origin ?? "-",
      destination_date: doData?.delivery_date ?? null,
      outboundType: doData?.outbound_type ?? "-",

      main_status: gateItem?.status ?? "",
      main_createdAt: gateItem?.createdAt ?? "",
      main_updatedAt: gateItem?.updatedAt ?? "",

      driver: {
        name: doData?.driver_name ?? "-",
        phone: doData?.driver_phone ?? "-",
        license_plate: doData?.license_plate ?? "-",
      },

      gate: {
        gate_id: gateItem?.gate?.id ?? "",
        gate_name: gateItem?.gate?.name ?? "-",
        gate_code: gateItem?.gate?.code ?? "-",
      },

      /* =======================
      ASSIGNED USERS (gabungkan assigned_gate_users + assigned_gate_helpers)
    ======================= */
      assigned_helpers: [
        // mapping dari assigned_gate_users (existing structure)
        ...assignedGateUsers.map((u) => ({
          user_id: u?.user_id ?? "",
          username: u?.user?.username ?? "-",
          name: u?.user_name ?? "-",
          phone: u?.user_phone ?? "-",
        })),

        // mapping dari assigned_gate_helpers (baru)
        ...assignedGateHelpers.map((h) => ({
          user_id: h?.id ?? "",
          username: "Helper", // tidak tersedia pada helper payload
          name: h?.helper_name ?? "-",
          phone: h?.helper_phone ?? "-",
        })),
      ],

      /* =======================
      ASSIGNED PALLETS
    ======================= */
      assigned_pallets: assignedGatePallets.map((p) => ({
        pallet_id: p?.pallet?.id ?? "",
        pallet_code: p?.pallet?.pallet_code ?? "-",
        capacity: p?.pallet?.capacity ?? 0,
        currentQuantity: p?.pallet?.currentQuantity ?? 0,
        status: p?.status ?? "UNKNOWN",
        currentItems: safeArray(p?.pallet?.currentItems).map((i) => ({
          item_id: i?.item_id ?? "",
          item_name: i?.item_name ?? "-",
          quantity: i?.current_quantity ?? 0,
          uom: i?.uom ?? "-",
          week_number: i?.week_number ?? null,
          production_date: i?.production_date ?? null,
        })),
      })),

      /* =======================
      ASSIGNED GATE ALREADY LOADED
    ======================= */
      assigned_gate_loads: safeArray(gateItem?.assigned_gate_loads).map(
        (l) => ({
          id: l?.id ?? "",
          outbound_memo_id: l?.outbound_memo_id ?? "",
          pallet_id: l?.pallet_id ?? "",
          item_id: l?.item_id ?? "",
          quantity_loaded: l?.quantity_loaded ?? 0,
          status: l?.status ?? "PENDING",
          uom: l?.uom ?? "",
        }),
      ),

      /* =======================
      MEMOS
    ======================= */
      memos: safeArray(doData?.outbound_memos).map((memo) => {
        const palletMap = new Map<string, UIPallet>();

        safeArray(memo?.transaction_pickings)
          .filter((picking) => picking?.status !== "CANCELLED")
          .forEach((picking) => {
            safeArray(picking?.transactionScanPicking).forEach((scan) => {
              const palletId = scan?.pallet_use_id;
              if (!palletId) return;

              const assignedPallet = palletLookup.get(palletId);

              if (!palletMap.has(palletId)) {
                palletMap.set(palletId, {
                  pallet_id: palletId,
                  pallet_code:
                    scan?.palletUse?.pallet_code ??
                    assignedPallet?.pallet?.pallet_code ??
                    "-",
                  status: assignedPallet?.status ?? "IDLE",
                  skus: [],
                });
              }

              const pallet = palletMap.get(palletId)!;

              /* =======================
            SKU LEVEL
          ======================= */
              let sku = pallet.skus.find((s) => s.item_id === scan?.item_id);

              if (!sku) {
                sku = {
                  item_id: scan?.item_id ?? "",
                  // PERBAIKAN DI SINI: Ambil dari scan.item.description
                  item_name: scan?.item?.code ?? scan?.item?.sku ?? "-",
                  uom: scan?.uom ?? picking?.uom ?? "-",
                  week_number:
                    scan?.week_number ?? picking?.week_number ?? null,
                  production_date:
                    scan?.production_date ?? picking?.production_date ?? null,
                  pickings: [],
                };
                pallet.skus.push(sku);
              }

              /* =======================
            PICKING LEVEL
          ======================= */
              let pickingUI = sku.pickings.find(
                (p) => p.picking_id === picking?.id,
              );

              if (!pickingUI) {
                pickingUI = {
                  picking_id: picking?.id ?? "",
                  quantity: picking?.quantity ?? 0,
                  status: picking?.status ?? "UNKNOWN",
                  scans: [],
                };
                sku.pickings.push(pickingUI);
              }

              pickingUI.scans.push({
                scan_id: scan?.id ?? "",
                pallet_source_id: scan?.pallet_source_id ?? "",
                pallet_use_id: scan?.pallet_use_id ?? "",
                quantity_picked: scan?.quantity_picked ?? 0,
                uom: scan?.uom ?? "-",
                status: scan?.status ?? "UNKNOWN",
                inspected_by: scan?.inspection_by ?? "-",
              });
            });
          });

        return {
          memo_id: memo?.id ?? "",
          memo_number: memo?.outbound_memo_number ?? "-",
          origin: memo?.origin ?? "-",
          destination: memo?.destination ?? "-",
          ship_to: memo?.ship_to ?? "-",
          status: memo?.status ?? "UNKNOWN",
          has_do: memo?.has_do ?? false,

          memo_items: safeArray(memo?.outbound_memo_items).map((i) => ({
            item_id: i?.item_id ?? "",
            quantity_plan: i?.quantity_plan ?? 0,
            uom: i?.uom ?? "-",
            status: i?.status ?? "UNKNOWN",
          })),

          pallets: Array.from(palletMap.values()),
        };
      }),
    };
  });
}
