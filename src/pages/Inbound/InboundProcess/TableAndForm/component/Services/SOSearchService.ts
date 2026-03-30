import { Server47 } from "../../../../../../utils/EndPoint";
import { ItemForm } from "../formTypes";
import { UomOption } from "./POSearchService";

export interface SOSearchResult {
  vendorName: string;
  items: ItemForm[];
}

function normalizeUom(raw: string, uomList: UomOption[]): string {
  const match = uomList.find(
    (u) => u.code.toUpperCase() === raw.toUpperCase()
  );
  return match?.code ?? raw.toUpperCase();
}

export async function searchSO(
  soNo: string,
  masterItems: any[], // ✅ pakai any[]
  uomList: UomOption[]
): Promise<SOSearchResult> {
  const res = await fetch(`${Server47}/api/v1/sales-order?order_number=${soNo}`);
  const json = await res.json();
  const data = json?.data?.data?.[0];

  if (!data) throw new Error(`SO ${soNo} tidak ditemukan.`);

  const vendorName = data.ORG_NAME?.toUpperCase() ?? "";

  const items: ItemForm[] = (data.ITEM ?? [])
    .map((it: any) => {
      const master = masterItems.find(
        (m) =>
          m.item_number === it.ITEM_NUMBER ||
          String(m.id) === String(it.INVENTORY_ITEM_ID)
      );
      if (!master) return null;

      return {
        item_id: String(master.id),
        item_name: master.description || it.ITEM_DESC,
        sku: master.sku || it.ITEM_CODE,
        item_number: master.item_number || it.ITEM_NUMBER,
        description: master.description || it.ITEM_DESC,
        qty: Number(it.ORDERED_QUANTITY),
        qty_plan: Number(it.ORDERED_QUANTITY), // ✅ required di ItemForm
        uom: normalizeUom(it.ORDER_QUANTITY_UOM || "DUS", uomList),
        id: String(master.id),
      } satisfies ItemForm;
    })
    .filter(Boolean) as ItemForm[];

  return { vendorName, items };
}