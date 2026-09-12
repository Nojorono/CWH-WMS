import { FormValues } from "../formTypes";
import { showErrorToast } from "../../../../../../components/toast";
import { usePersistAuthStore } from "../../../../../../API/store/AuthStore/PersistAuthStore";

const getNormalizedInboundType = (type: any) => {
  const rawType = typeof type === "string" ? type : type?.value || "";
  const apiType = rawType;
  return { rawType, apiType };
};

const isValidUuid = (value: unknown): value is string =>
  typeof value === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value.trim(),
  );

/**
 * Agregasi qty per item_id+uom.
 * Mode update: id baris DB hanya dari inbound_item_id (bukan id RHF).
 */
const mergeInboundItems = (
  items: any[],
  isUpdate: boolean,
  doId?: string,
  stripItemDbIds = false,
) => {
  const mergedItems: Record<string, any> = {};

  items.forEach((item) => {
    const key = item.uom
      ? `${item.item_id}_${item.uom}`
      : (item.item_id ?? "unknown");
    const qty = Number(item.qty) || 0;

    if (!mergedItems[key]) {
      const base: Record<string, any> = {
        item_id: item.item_id ?? "",
        quantity: qty,
        uom: item.uom ?? "",
        classification_id:
          item.classification_id || item.classification || null,
        ...(item.line_number !== null &&
        item.line_number !== undefined &&
        String(item.line_number).trim() !== ""
          ? { line_number: Number(item.line_number) }
          : {}),
      };

      const dbRowId = item.inbound_item_id || item.db_id;
      if (isUpdate && !stripItemDbIds && isValidUuid(dbRowId)) {
        base.id = dbRowId;
      }

      if (isUpdate) {
        if (isValidUuid(item.inbound_id)) base.inbound_id = item.inbound_id;
        if (isValidUuid(item.inbound_do_id || doId)) {
          base.inbound_do_id = item.inbound_do_id || doId;
        }
      }

      mergedItems[key] = base;
    } else {
      mergedItems[key].quantity += qty;
    }
  });

  Object.values(mergedItems).forEach((merged) => {
    if (!Number.isInteger(merged.quantity)) {
      showErrorToast(
        `Quantity total harus bilangan bulat. Ditemukan: ${merged.quantity}`,
      );
      throw new Error(`Quantity total error`);
    }
  });

  return Object.values(mergedItems).filter((i) => i.quantity > 0);
};

export type MapToPayloadOptions = {
  includeStatus?: boolean;
  isUpdate?: boolean;
};

/**
 * MAIN FUNCTION: mapToPayload
 */
export function mapToPayload(
  data: FormValues,
  options: MapToPayloadOptions = {},
): any {
  const { includeStatus = true, isUpdate = false } = options;

  const state = usePersistAuthStore.getState();
  const user = state.user;
  const organization_id =
    user?.userDetail?.organization?.id || data.organization_id;
  const organization_name = user?.userDetail?.organization?.organization_name;

  const { rawType, apiType } = getNormalizedInboundType(data.inbound_type);

  return {
    organization_id,
    inbound_id_reference: (data as any).inbound_id_reference || "",
    expedition:
      typeof data.expedition === "string"
        ? data.expedition
        : (data.expedition as any)?.value || "",
    origin: organization_name,
    license_plate:
      data.no_pol?.toUpperCase().replace(/\s+/g, "").trim() ?? "",
    driver_name: data.driver?.toUpperCase() ?? "",
    driver_phone: data.driver_phone ?? "",
    status: "CREATED",
    inbound_type: apiType,
    arrival_date: data.arrival_date
      ? new Date(data.arrival_date).toISOString()
      : "",
    inbound_dos: data.deliveryOrders.flatMap((DOs) =>
      DOs.pos.map((po) => {
        const doId = DOs.do_id || DOs.id;
        const currentDoc = String(
          rawType === "PO" ? po.po_no || "" : po.so_no || "",
        ).trim();
        const originalDoc = String(
          rawType === "PO"
            ? (po as any).original_po_no || ""
            : (po as any).original_so_no || "",
        ).trim();
        const docChanged =
          Boolean(originalDoc) &&
          Boolean(currentDoc) &&
          originalDoc !== currentDoc;

        const formItems = Array.isArray(po.items) ? po.items : [];
        // PO/SO diganti → hanya kirim item baru/manual (tanpa baris DB lama)
        const sourceItems = docChanged
          ? formItems.filter((it: any) => !it?.inbound_item_id)
          : formItems;

        const finalItems = mergeInboundItems(
          sourceItems,
          isUpdate,
          doId,
          docChanged,
        );

        // Catatan: JANGAN kirim quantity:0 sebagai "delete".
        // BE memvalidasi quantity harus positive → 400.
        // Replace penuh item lama saat ganti PO/SO harus ditangani BE
        // (omit = delete / hard-replace inbound_items), bukan qty 0 dari FE.

        const doPayload: Record<string, any> = {
          principal: (po as any).principal || (po as any).vendor_name || "",
          vendor_id: (po as any).vendor_id || null,
          vendor_site_id: (po as any).vendor_site_id || null,
          total_line_items: finalItems.length,
          validation_surat_jalan: (po as any).validation_surat_jalan ?? true,

          inbound_do_number: DOs.do_no ?? "",
          inbound_do_date: DOs.date ? new Date(DOs.date).toISOString() : "",
          attachment: DOs.attachment ?? "",

          inbound_po_number:
            rawType === "PO" ? (po.po_no ?? null) : (po.so_no ?? null),

          inbound_po_date: po.po_date
            ? new Date(po.po_date).toISOString()
            : null,
          flag_validated: (po as any).flag_validated ?? true,

          inbound_items: finalItems,
        };

        if (isUpdate) {
          if (isValidUuid(doId)) doPayload.id = doId;
          if (isValidUuid(data.id)) doPayload.inbound_id = data.id;
        }

        return doPayload;
      }),
    ),
  };
}
