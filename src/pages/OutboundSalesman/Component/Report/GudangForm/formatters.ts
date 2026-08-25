import dayjs from "dayjs";
import "dayjs/locale/id";

export const formatDisplayDate = (value?: string) => {
  if (!value) return "-";
  const parsed = dayjs(value);
  if (!parsed.isValid()) return value;
  return parsed.locale("id").format("dddd, DD-MMM-YY");
};

export const formatQty = (value?: number | null) => {
  if (value === null || value === undefined) return "-";
  return Number(value).toLocaleString("id-ID");
};
