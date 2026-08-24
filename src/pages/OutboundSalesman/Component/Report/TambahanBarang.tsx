import React, { useMemo } from "react";
import dayjs from "dayjs";
import "dayjs/locale/id";

export type TambahanBarangRow = {
  code: string;
  name: string;
  finalDo: number;
  qtyTambahan: number; // item_qty_revision when revision is non-negative
  caseQty?: number | null;
  balQty?: number | null;
  slopQty?: number | null;
  packQty?: number | null;
};

interface TambahanBarangProps {
  onClose: () => void;
  organizationName?: string;
  tambahanDate?: string;
  doDate?: string;
  rows?: TambahanBarangRow[];
}

const formatDisplayDate = (value?: string) => {
  if (!value) return "-";
  const parsed = dayjs(value);
  if (!parsed.isValid()) return value;
  return parsed.locale("id").format("dddd, DD-MMM-YY");
};

const formatQty = (value?: number | null) => {
  if (value === null || value === undefined) return "-";
  return Number(value).toLocaleString("id-ID");
};

const TambahanBarang = ({
  onClose,
  organizationName = "-",
  tambahanDate,
  doDate,
  rows = [],
}: TambahanBarangProps) => {
  const totals = useMemo(() => {
    return rows.reduce(
      (acc, row) => ({
        finalDo: acc.finalDo + (Number(row.finalDo) || 0),
        qtyTambahan: acc.qtyTambahan + (Number(row.qtyTambahan) || 0),
        caseQty: acc.caseQty + (Number(row.caseQty) || 0),
        balQty: acc.balQty + (Number(row.balQty) || 0),
        slopQty: acc.slopQty + (Number(row.slopQty) || 0),
        packQty: acc.packQty + (Number(row.packQty) || 0),
      }),
      {
        finalDo: 0,
        qtyTambahan: 0,
        caseQty: 0,
        balQty: 0,
        slopQty: 0,
        packQty: 0,
      },
    );
  }, [rows]);

  return (
    <div className="fixed inset-0 z-[1500000] flex items-center justify-center bg-black bg-opacity-50">
      <div className="h-[90vh] w-11/12 max-w-6xl overflow-hidden rounded-lg bg-gray-100 shadow-2xl print:h-auto print:w-full print:bg-white print:shadow-none">
        <div className="flex items-center justify-between border-b bg-white px-6 py-4 print:hidden">
          <h2 className="text-lg font-semibold text-gray-800">
            Preview Form Tambahan ke Gudang Utama
          </h2>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => window.print()}
              className="rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
            >
              Print
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-8 print:p-0">
          <div className="mx-auto max-w-5xl border-2 border-gray-400 bg-white p-10 print:m-0 print:border-none print:p-0">
            <h1 className="mb-8 text-center text-2xl font-bold uppercase tracking-wide">
              Form TAMBAHAN ke Gudang Utama
            </h1>

            <div className="mb-6 space-y-1">
              <h2 className="text-lg font-bold">{organizationName}</h2>
              <div className="grid grid-cols-[220px_1fr] text-sm">
                <span>Hari / Tanggal Tambahan</span>
                <span className="font-semibold">
                  : {formatDisplayDate(tambahanDate)}
                </span>
                <span>Untuk DO Hari / Tanggal</span>
                <span className="font-semibold">: {formatDisplayDate(doDate)}</span>
              </div>
            </div>

            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th
                    rowSpan={2}
                    className="w-20 border-2 border-dashed border-gray-800 p-2 text-left uppercase"
                  >
                    Kode
                  </th>
                  <th
                    rowSpan={2}
                    className="border-2 border-dashed border-gray-800 p-2 text-left uppercase"
                  >
                    Jenis Rokok
                  </th>
                  <th
                    colSpan={3}
                    className="border-2 border-dashed border-gray-800 p-2 text-center uppercase"
                  >
                    Total Pack
                  </th>
                  <th
                    colSpan={4}
                    className="border-2 border-dashed border-gray-800 p-2 text-center uppercase"
                  >
                    Form Tambahan ke Gudang Utama
                  </th>
                </tr>
                <tr>
                  <th className="w-24 border-2 border-dashed border-gray-800 p-2 text-center text-xs font-semibold">
                    Sisa barang
                  </th>
                  <th className="w-24 border-2 border-dashed border-gray-800 p-2 text-center text-xs font-semibold">
                    Final DO
                  </th>
                  <th className="w-24 border-2 border-dashed border-gray-800 p-2 text-center text-xs font-semibold">
                    Tambahan
                  </th>
                  <th className="w-20 border-2 border-dashed border-gray-800 p-2 text-center text-xs font-semibold">
                    Case
                  </th>
                  <th className="w-20 border-2 border-dashed border-gray-800 p-2 text-center text-xs font-semibold">
                    Bal
                  </th>
                  <th className="w-20 border-2 border-dashed border-gray-800 p-2 text-center text-xs font-semibold">
                    Slop
                  </th>
                  <th className="w-20 border-2 border-dashed border-gray-800 p-2 text-center text-xs font-semibold">
                    Pack
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="border-2 border-dashed border-gray-800 p-6 text-center italic text-slate-400"
                    >
                      Tidak ada data tambahan
                    </td>
                  </tr>
                ) : (
                  rows.map((row, idx) => (
                    <tr key={`${row.code}-${idx}`}>
                      <td className="border-2 border-dashed border-gray-800 p-2">
                        {row.code || "-"}
                      </td>
                      <td className="border-2 border-dashed border-gray-800 p-2 font-bold">
                        {row.name || "-"}
                      </td>
                      <td className="border-2 border-dashed border-gray-800 p-2 text-center text-slate-400">
                        -
                      </td>
                      <td className="border-2 border-dashed border-gray-800 p-2 text-center text-blue-600">
                        {formatQty(row.finalDo)}
                      </td>
                      <td className="border-2 border-dashed border-gray-800 p-2 text-center font-bold text-emerald-600">
                        {formatQty(row.qtyTambahan)}
                      </td>
                      <td className="border-2 border-dashed border-gray-800 p-2 text-center text-emerald-500">
                        {formatQty(row.caseQty ?? null)}
                      </td>
                      <td className="border-2 border-dashed border-gray-800 p-2 text-center text-emerald-500">
                        {formatQty(row.balQty ?? null)}
                      </td>
                      <td className="border-2 border-dashed border-gray-800 p-2 text-center text-emerald-500">
                        {formatQty(row.slopQty ?? null)}
                      </td>
                      <td className="border-2 border-dashed border-gray-800 p-2 text-center text-emerald-500">
                        {formatQty(row.packQty ?? null)}
                      </td>
                    </tr>
                  ))
                )}

                <tr>
                  <td
                    colSpan={2}
                    className="border-2 border-dashed border-gray-800 p-2 font-bold uppercase"
                  >
                    Jumlah
                  </td>
                  <td className="border-2 border-dashed border-gray-800 p-2 text-center font-bold text-slate-400">
                    -
                  </td>
                  <td className="border-2 border-dashed border-gray-800 p-2 text-center font-bold">
                    {formatQty(totals.finalDo)}
                  </td>
                  <td className="border-2 border-dashed border-gray-800 p-2 text-center font-bold text-emerald-600">
                    {formatQty(totals.qtyTambahan)}
                  </td>
                  <td className="border-2 border-dashed border-gray-800 p-2 text-center font-bold">
                    {formatQty(totals.caseQty || null)}
                  </td>
                  <td className="border-2 border-dashed border-gray-800 p-2 text-center font-bold">
                    {formatQty(totals.balQty || null)}
                  </td>
                  <td className="border-2 border-dashed border-gray-800 p-2 text-center font-bold">
                    {formatQty(totals.slopQty || null)}
                  </td>
                  <td className="border-2 border-dashed border-gray-800 p-2 text-center font-bold">
                    {formatQty(totals.packQty || null)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TambahanBarang;
