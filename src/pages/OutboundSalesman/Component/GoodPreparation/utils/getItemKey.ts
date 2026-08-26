export const getItemKey = (item: {
  inventory_item_id?: string | number | null;
  item_code?: string | null;
  sku?: string | null;
  item_number?: string | null;
}) => {
  if (
    item.inventory_item_id !== undefined &&
    item.inventory_item_id !== null &&
    String(item.inventory_item_id).trim() !== ""
  ) {
    return String(item.inventory_item_id).trim();
  }
  return String(item.item_code || item.sku || item.item_number || "").trim();
};
