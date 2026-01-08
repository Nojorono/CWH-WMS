import {
  ReviewGroup,
  ReviewSuggestionDetail,
  ReviewStatus,
  RawSuggestionReview
} from "../Types/suggestTableTypes";

interface RawSuggestion {
  item_id: string;
  item_code: string;
  item_name: string;
  uom: string;
  week_number: number;
  picked_qty: number;
  required_qty: number;
  already_picked_qty: number;
  source_zone: string;
  source_bin: string;
}

export const prepareReviewGroups = (
  raws: RawSuggestionReview[]
): ReviewGroup[] => {
  const map: Record<
    string,
    ReviewGroup & { uomSet: Set<string> }
  > = {};

  for (const r of raws) {
    if (!map[r.item_id]) {
      const remaining = r.required_qty - r.already_picked_qty;

      map[r.item_id] = {
        item_id: r.item_id,
        item_code: r.item_code,
        item_name: r.item_name,
        uom: r.uom,

        required_qty: r.required_qty,
        already_picked_qty: r.already_picked_qty,
        remaining_qty: remaining,

        total_picked_qty: 0,
        status: "OK",
        details: [],
        uomSet: new Set(),
      };
    }

    const group = map[r.item_id];

    group.total_picked_qty += r.picked_qty;
    group.uomSet.add(r.uom);

    const detail: ReviewSuggestionDetail = {
      item_id: r.item_id,
      item_code: r.item_code,
      item_name: r.item_name,

      uom: r.uom,
      week_number: r.week_number,
      picked_qty: r.picked_qty,

      source_zone: r.source_zone,
      source_bin: r.source_bin,
    };

    group.details.push(detail);
  }

  // ===== FINAL VALIDATION =====
  return Object.values(map).map((g) => {
    let status: ReviewStatus = "OK";

    if (g.uomSet.size > 1) status = "UOM_MISMATCH";
    else if (g.total_picked_qty > g.remaining_qty) status = "OVER";
    else if (g.total_picked_qty < g.remaining_qty) status = "LESS";

    return {
      ...g,
      status,
    };
  });
};

