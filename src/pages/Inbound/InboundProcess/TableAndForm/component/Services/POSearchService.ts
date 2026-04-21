import { showErrorToast } from "../../../../../../components/toast";
import { Server47 } from "../../../../../../utils/EndPoint";
import { ItemForm } from "../formTypes";

export interface UomOption {
    id: number | string;
    code: string;
    name: string;
}

export interface POSearchResult {
    vendorName: string;
    vendorId: number;
    poDate: string;
    items: ItemForm[];
}

function normalizeUom(raw: string, uomList: UomOption[]): string {
    const match = uomList.find(
        (u) => u.code.toUpperCase() === raw.toUpperCase()
    );
    return match?.code ?? raw.toUpperCase();
}

export async function searchPO(
    poNo: string,
    masterItems: any[],
    uomList: UomOption[]
): Promise<POSearchResult> {
    const res = await fetch(`${Server47}/purchase-order?nomorPO=${poNo}`);

    if (!res.ok) throw new Error("Gagal mengambil data dari server.");

    const json = await res.json();
    const data = json?.data?.[0];

    if (!data) {
        console.error("Data array kosong atau struktur tidak sesuai:", json);
        throw new Error(`PO ${poNo} tidak ditemukan.`);
    }

    const vendorName = data.NAMA_VENDOR?.toUpperCase() ?? "";
    const vendorId = Number(data.ID_VENDOR);
    const poDate = data.TANGGAL_PEMBUATAN_PO ?? "";

    const items: ItemForm[] = (data.ITEM ?? [])
        .map((it: any) => {
            const master = masterItems.find(
                (m) => m.item_number === it.KODE_ITEM || m.sku === it.SKU
            );

            if (!master) {
                showErrorToast(`Item ${it.KODE_ITEM} tidak ditemukan di Master Item`);
                return null;
            }

            return {
                item_id: String(master.id),
                item_name: master.description,
                sku: master.sku,
                item_number: master.item_number,
                description: master.description,
                qty: Number(it.PO_LINE_QUANTITY),
                qty_plan: Number(it.PO_LINE_QUANTITY),
                uom: normalizeUom(it.UOM || "DUS", uomList),
                line_number: Number(it.PO_LINE_NUM),
                classification_id: master.classification_id || "",
                id: String(master.id),
            } satisfies ItemForm;
        })
        .filter(Boolean) as ItemForm[];

    return {
        vendorName,
        vendorId,
        poDate,
        items
    };
}