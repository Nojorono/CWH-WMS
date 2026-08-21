import React, { useMemo } from "react";
import dayjs from "dayjs";
import "dayjs/locale/id";

export type PermintaanBarangRow = {
  code: string;
  name: string;
  sisaBarang: number; // BTB qty
  finalDo: number; // Submitted QTY
  topUp: number; // Submitted QTY - BTB Qty
  caseQty?: number | null;
  balQty?: number | null;
  slopQty?: number | null;
  packQty?: number | null;
};

interface PermintaanBarangProps {
  onClose: () => void;
  organizationName?: string;
  requestDate?: string; // YYYY-MM-DD — hari/tanggal permintaan
  doDate?: string; // YYYY-MM-DD — untuk DO
  rows?: PermintaanBarangRow[];
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

const PermintaanBarang = ({
  onClose,
  organizationName = "-",
  requestDate,
  doDate,
  rows = [],
}: PermintaanBarangProps) => {
  const totals = useMemo(() => {
    return rows.reduce(
      (acc, row) => ({
        sisaBarang: acc.sisaBarang + (Number(row.sisaBarang) || 0),
        finalDo: acc.finalDo + (Number(row.finalDo) || 0),
        topUp: acc.topUp + (Number(row.topUp) || 0),
        caseQty: acc.caseQty + (Number(row.caseQty) || 0),
        balQty: acc.balQty + (Number(row.balQty) || 0),
        slopQty: acc.slopQty + (Number(row.slopQty) || 0),
        packQty: acc.packQty + (Number(row.packQty) || 0),
      }),
      {
        sisaBarang: 0,
        finalDo: 0,
        topUp: 0,
        caseQty: 0,
        balQty: 0,
        slopQty: 0,
        packQty: 0,
      },
    );
  }, [rows]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-1500000 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-11/12 max-w-6xl h-[90vh] bg-gray-100 rounded-lg shadow-2xl flex flex-col overflow-hidden print:w-full print:h-auto print:bg-white print:shadow-none">
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b print:hidden">
          <div className="flex items-center space-x-2">
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              ></path>
            </svg>
            <h2 className="text-lg font-semibold text-gray-800">
              Preview Permintaan Ke Gudang Utama
            </h2>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-md hover:bg-orange-600"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                ></path>
              </svg>
              Print
            </button>
            <button
              onClick={onClose}
              className="p-2 ml-4 text-gray-400 hover:text-gray-600"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-8 print:p-0">
          <div className="max-w-5xl mx-auto bg-white border-2 border-gray-400 p-10 print:border-none print:p-0 print:m-0">
            <h1 className="text-2xl font-bold text-center mb-8 uppercase tracking-wide">
              Form PERMINTAAN ke Gudang Utama
            </h1>

            <div className="mb-6 space-y-1">
              <h2 className="text-lg font-bold">{organizationName}</h2>
              <div className="grid grid-cols-[220px_1fr] text-sm">
                <span>Hari / Tanggal permintaan</span>
                <span className="font-semibold">
                  : {formatDisplayDate(requestDate)}
                </span>

                <span>Untuk DO Hari / Tanggal</span>
                <span className="font-semibold">
                  : {formatDisplayDate(doDate)}
                </span>
              </div>
            </div>

            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th
                    rowSpan={2}
                    className="border-2 border-dashed border-gray-800 p-2 text-left uppercase w-20"
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
                    Form PERMINTAAN ke Gudang Utama
                  </th>
                </tr>
                <tr>
                  <th className="border-2 border-dashed border-gray-800 p-2 text-center text-xs font-semibold w-24">
                    Sisa barang
                  </th>
                  <th className="border-2 border-dashed border-gray-800 p-2 text-center text-xs font-semibold w-24">
                    Final DO
                  </th>
                  <th className="border-2 border-dashed border-gray-800 p-2 text-center text-xs font-semibold w-24">
                    Top Up
                  </th>
                  <th className="border-2 border-dashed border-gray-800 p-2 text-center text-xs font-semibold w-20">
                    Case
                  </th>
                  <th className="border-2 border-dashed border-gray-800 p-2 text-center text-xs font-semibold w-20">
                    Bal
                  </th>
                  <th className="border-2 border-dashed border-gray-800 p-2 text-center text-xs font-semibold w-20">
                    Slop
                  </th>
                  <th className="border-2 border-dashed border-gray-800 p-2 text-center text-xs font-semibold w-20">
                    Pack
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="border-2 border-dashed border-gray-800 p-6 text-center text-slate-400 italic"
                    >
                      Tidak ada data permintaan
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
                      <td className="border-2 border-dashed border-gray-800 p-2 text-center text-blue-600">
                        {formatQty(row.sisaBarang)}
                      </td>
                      <td className="border-2 border-dashed border-gray-800 p-2 text-center text-blue-600">
                        {formatQty(row.finalDo)}
                      </td>
                      <td className="border-2 border-dashed border-gray-800 p-2 text-center text-blue-600">
                        {formatQty(row.topUp)}
                      </td>
                      <td className="border-2 border-dashed border-gray-800 p-2 text-center text-blue-500">
                        {formatQty(row.caseQty ?? null)}
                      </td>
                      <td className="border-2 border-dashed border-gray-800 p-2 text-center text-blue-500">
                        {formatQty(row.balQty ?? null)}
                      </td>
                      <td className="border-2 border-dashed border-gray-800 p-2 text-center text-blue-500">
                        {formatQty(row.slopQty ?? null)}
                      </td>
                      <td className="border-2 border-dashed border-gray-800 p-2 text-center text-blue-500">
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
                  <td className="border-2 border-dashed border-gray-800 p-2 text-center font-bold">
                    {formatQty(totals.sisaBarang)}
                  </td>
                  <td className="border-2 border-dashed border-gray-800 p-2 text-center font-bold">
                    {formatQty(totals.finalDo)}
                  </td>
                  <td className="border-2 border-dashed border-gray-800 p-2 text-center font-bold">
                    {formatQty(totals.topUp)}
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

export default PermintaanBarang;
