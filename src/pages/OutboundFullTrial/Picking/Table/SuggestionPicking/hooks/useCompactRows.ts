import { useMemo } from "react";
import { SuggestedItem, SuggestedLocation, CompactPickingRow } from "../../../Types/types";

export const useCompactRows = (suggestionItems: SuggestedItem[]) => {
  return useMemo<CompactPickingRow[]>(() => {
    return suggestionItems.flatMap((item) => {
      if (item.suggested_locations.length === 0) {
        return [
          {
            memo_id: item.memo_id,
            item_id: item.item_id,
            item_name: item.item_name,
            item_code: item.item_code,
            classification: "ROKOK",
            qty_plan: item.required_quantity.toString(),
            required_quantity: item.required_quantity,
            available_quantity: item.available_quantity,
            uom: "-",
            production_code: "-",
            zone: "-",
            bin: "-",
            qty_ready_to_pick: 0,
            location_data: {} as SuggestedLocation,
            note: item.notes,
          },
        ];
      }

      return item.suggested_locations.map((loc) => ({
        memo_id: item.memo_id,
        item_id: item.item_id,
        item_name: item.item_name,
        item_code: item.item_code,
        classification: "ROKOK",
        qty_plan: item.required_quantity.toString(),
        required_quantity: item.required_quantity,
        available_quantity: loc.available_quantity,
        uom: loc.uom,
        production_code: `WEEK ${loc.week_number}`,
        zone: loc.warehouse_sub_code,
        bin: loc.bin_code === "N/A" ? "-" : loc.bin_code,
        qty_ready_to_pick: loc.quantity_ready_to_pick,
        location_data: loc,
        note: item.notes,
      }));
    });
  }, [suggestionItems]);
};
