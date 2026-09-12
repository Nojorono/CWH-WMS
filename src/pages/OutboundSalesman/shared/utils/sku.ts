export const resolveSku = (item: any): string =>
    (item.item_code && item.item_code !== "null" ? item.item_code : null) ||
    item.item_number ||
    String(item.inventory_item_id || "");

export const safeParse = (val: any): number => parseFloat(val) || 0;