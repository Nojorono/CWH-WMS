export const formatDateTimeIndo = (date: Date | string | null): string => {
  if (!date) return "";

  const d = new Date(date);

  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(d);

  const get = (type: string) => parts.find((p) => p.type === type)?.value || "";

  return `${get("day")}-${get("month")}-${get("year")}, ${get("hour")}:${get("minute")}:${get("second")}`;
};
