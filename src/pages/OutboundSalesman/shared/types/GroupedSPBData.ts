import { DOSuggestionData } from "../../../../API/types/draftDOsuggestion";

/** Tipe grup SPB untuk Calculation (ex-DOsuggestion MainTable) */
export interface GroupedSPBData {
  sales_spv_nik: string;
  sales_spv_name: string;
  salesmenDO: DOSuggestionData[];
}
