import { showErrorToast } from "../../../components/toast";
import axiosInstance from "../../../API/services/AxiosInstance";
import { ItemForm } from "../../types/searchPO";

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

export async function POsearchService(
    poNo: string,
    masterItems: any[],
    uomList: UomOption[]
): Promise<POSearchResult> {
    const response = await axiosInstance.get("inbound/purchase-order", {
        params: {
            nomorPO: poNo,
        },
    });
    const json = response.data;

    if (!json?.data || json.data.length === 0) {
        throw new Error(`Detail PO ${poNo} tidak ditemukan atau sudah Closed`);
    }

    const data = json.data.data[0];

    console.log("data PO", data);
    

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
                qty: Number(it.QTY_DUE),
                qty_plan: Number(it.QTY_DUE),
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