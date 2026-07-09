import axiosInstance from "../../../API/services/AxiosInstance";
import { ItemForm, SOHeaderInfo } from "../../types/searchSO";

export interface SOSearchResult {
    vendorName: string;
    items: ItemForm[];
    headerInfo?: SOHeaderInfo;
}

export interface UomOption {
    id: number | string;
    code: string;
    name: string;
}

function normalizeUom(raw: string, uomList: UomOption[]): string {
    const match = uomList.find(
        (u) => u.code.toUpperCase() === raw.toUpperCase()
    );
    return match?.code ?? raw.toUpperCase();
}

export async function SOsearchService(
    soNo: string,
    masterItems: any[],
    uomList: UomOption[]
): Promise<SOSearchResult> {
    const response = await axiosInstance.get("inbound/sales-order", {
        params: {
            orderNumber: soNo,
        },
    });
    const json = response.data;
    const data = json.data.data[0];
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
                item_name: master.sku || it.ITEM_CODE,
                sku: master.sku || it.ITEM_CODE,
                item_number: master.item_number || it.ITEM_NUMBER,
                description: master.description || it.ITEM_DESC,
                qty: Number(it.ORDERED_QUANTITY),
                qty_plan: Number(it.ORDERED_QUANTITY),
                uom: normalizeUom(it.ORDER_QUANTITY_UOM || "DUS", uomList),
                id: String(master.id),
                line_number: Number(it.SO_LINE_NUMBER),
            } satisfies ItemForm;
        })
        .filter(Boolean) as ItemForm[];

    const headerInfo: SOHeaderInfo = {
        headerId: data.HEADER_ID,
        soType: data.SO_TYPE,
        orgId: data.ORG_ID,
        orgName: data.ORG_NAME,
        status: data.STATUS,
        orderNumber: data.ORDER_NUMBER,
        subinventoryFrom: data.SUBINVENTORY_FROM,
        subinventoryTo: data.SUBINVENTORY_TO,
        locationBill: data.LOCATION_BILL,
        locationShip: data.LOCATON_SHIP,
        invoiceToAddress: data.INVOICE_TO_ADDRESS1,
        orderedDate: data.ORDERED_DATE,
    };

    return { vendorName, items, headerInfo };
}