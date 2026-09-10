/** Format angka pack — 0 → "—" seperti Excel (kecuali forced) */
export const formatPack = (n: number | null | undefined, dashZero = true) => {
  if (n === null || n === undefined) return "—";
  if (dashZero && n === 0) return "—";
  const abs = Math.abs(n).toLocaleString("id-ID", { maximumFractionDigits: 0 });
  if (n < 0) return `(${abs})`;
  return abs;
};

export const formatSigned = (n: number) => {
  if (n === 0) return "0";
  const abs = Math.abs(n).toLocaleString("id-ID", { maximumFractionDigits: 0 });
  return n > 0 ? `+${abs}` : `−${abs}`;
};
