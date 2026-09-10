import React from "react";
import { LhsStockComputed } from "./types";
import { LhsTotals } from "./compute";
import { formatPack } from "./format";

type Props = {
  rows: LhsStockComputed[];
  totals: LhsTotals;
};

const th =
  "border border-slate-300 px-1.5 py-1.5 text-center text-[10px] font-bold leading-tight";
const td =
  "border border-slate-200 px-1.5 py-1.5 text-right text-[11px] tabular-nums text-slate-700";
const sticky =
  "sticky z-20 border border-slate-200 bg-white px-2 py-1.5 text-[11px]";

function LhsStockTable({ rows, totals }: Props) {
  return (
    <div className="overflow-auto rounded-lg border border-slate-300 bg-white shadow-sm">
      <table className="w-max min-w-full border-collapse text-[11px]">
        <thead>
          <tr>
            <th
              rowSpan={2}
              className={`${th} sticky left-0 z-30 bg-slate-200 text-slate-700`}
              style={{ minWidth: 56 }}
            >
              KODE
            </th>
            <th
              rowSpan={2}
              className={`${th} sticky z-30 bg-slate-200 text-slate-700`}
              style={{ left: 56, minWidth: 140 }}
            >
              SKU NAME
            </th>
            <th
              rowSpan={2}
              className={`${th} bg-slate-100 text-slate-700`}
              style={{ minWidth: 72 }}
            >
              STOCK
              <br />
              AWAL
            </th>
            <th
              colSpan={4}
              className={`${th} bg-rose-600 uppercase tracking-wide text-white`}
            >
              Incoming (Terima)
            </th>
            <th
              colSpan={5}
              className={`${th} bg-blue-800 uppercase tracking-wide text-white`}
            >
              Outgoing (Keluar)
            </th>
            <th
              rowSpan={2}
              className={`${th} bg-slate-100 text-slate-700`}
              style={{ minWidth: 76 }}
            >
              STOCK
              <br />
              AKHIR
            </th>
            <th
              rowSpan={2}
              className={`${th} bg-amber-300 text-amber-950`}
              style={{ minWidth: 72 }}
            >
              FISIK
              <br />
              Akhir hari
            </th>
            <th
              rowSpan={2}
              className={`${th} bg-cyan-300 text-cyan-950`}
              style={{ minWidth: 56 }}
            >
              VAR
            </th>
            <th
              rowSpan={2}
              className={`${th} bg-amber-300 text-amber-950`}
              style={{ minWidth: 64 }}
            >
              META
            </th>
          </tr>
          <tr>
            <th className={`${th} bg-rose-500 text-white`} style={{ minWidth: 70 }}>
              Central
              <br />
              (Inbound CWH)
            </th>
            <th className={`${th} bg-rose-500 text-white`} style={{ minWidth: 64 }}>
              Retur DO
            </th>
            <th className={`${th} bg-rose-500 text-white`} style={{ minWidth: 56 }}>
              BTB
            </th>
            <th className={`${th} bg-rose-700 text-white`} style={{ minWidth: 72 }}>
              TOTAL
              <br />
              Terima
            </th>
            <th className={`${th} bg-blue-700 text-white`} style={{ minWidth: 72 }}>
              Manual DO
              <br />
              (FPPR)
            </th>
            <th className={`${th} bg-blue-700 text-white`} style={{ minWidth: 64 }}>
              Relokasi
              <br />
              (GI)
            </th>
            <th className={`${th} bg-blue-700 text-white`} style={{ minWidth: 64 }}>
              DO MATIC
            </th>
            <th className={`${th} bg-blue-700 text-white`} style={{ minWidth: 72 }}>
              Add DO
              <br />
              MATIC
            </th>
            <th className={`${th} bg-blue-900 text-white`} style={{ minWidth: 72 }}>
              TOTAL
              <br />
              Keluar
            </th>
          </tr>
        </thead>

        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="hover:bg-slate-50/80">
              <td
                className={`${sticky} left-0 z-10 text-center font-semibold text-slate-800`}
              >
                {r.kode}
              </td>
              <td
                className={`${sticky} z-10 font-medium text-slate-700`}
                style={{ left: 56 }}
              >
                {r.skuName}
              </td>
              <td className={td}>{formatPack(r.stockAwal)}</td>
              <td className={`${td} bg-rose-50/40`}>
                {formatPack(r.centralInbound)}
              </td>
              <td className={`${td} bg-rose-50/40`}>
                {formatPack(r.returDo)}
              </td>
              <td className={`${td} bg-rose-50/40`}>{formatPack(r.btb)}</td>
              <td className={`${td} bg-rose-100/70 font-semibold`}>
                {formatPack(r.totalTerima)}
              </td>
              <td className={`${td} bg-blue-50/40`}>
                {formatPack(r.manualDo)}
              </td>
              <td className={`${td} bg-blue-50/40`}>
                {formatPack(r.relokasi)}
              </td>
              <td className={`${td} bg-blue-50/40`}>
                {formatPack(r.doMatic)}
              </td>
              <td className={`${td} bg-blue-50/40`}>
                {formatPack(r.addDoMatic)}
              </td>
              <td className={`${td} bg-blue-100/70 font-semibold`}>
                {formatPack(r.totalKeluar)}
              </td>
              <td className={`${td} font-bold`}>
                {formatPack(r.stockAkhir, false)}
              </td>
              <td className={`${td} bg-amber-50 text-slate-400`}>—</td>
              <td
                className={`${td} bg-cyan-50 font-semibold ${
                  r.variance !== 0 ? "text-rose-700" : "text-emerald-700"
                }`}
              >
                {formatPack(r.variance, false)}
              </td>
              <td className={`${td} bg-amber-50`}>{formatPack(r.meta)}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td
                colSpan={16}
                className="px-4 py-12 text-center text-sm text-slate-400"
              >
                Tidak ada data untuk tanggal / cabang ini.
              </td>
            </tr>
          )}
        </tbody>

        {rows.length > 0 && (
          <tfoot>
            <tr className="bg-slate-800 text-white">
              <td
                className={`${sticky} left-0 z-10 border-slate-700 bg-slate-800 text-center text-[10px] font-bold text-white`}
              >
                —
              </td>
              <td
                className={`${sticky} z-10 border-slate-700 bg-slate-800 text-[10px] font-bold uppercase tracking-wide text-white`}
                style={{ left: 56 }}
              >
                TOTAL
              </td>
              <td className={`${td} border-slate-600 text-white`}>
                {formatPack(totals.stockAwal, false)}
              </td>
              <td className={`${td} border-slate-600 text-white`}>
                {formatPack(totals.centralInbound, false)}
              </td>
              <td className={`${td} border-slate-600 text-white`}>
                {formatPack(totals.returDo, false)}
              </td>
              <td className={`${td} border-slate-600 text-white`}>
                {formatPack(totals.btb, false)}
              </td>
              <td className={`${td} border-slate-600 font-bold text-white`}>
                {formatPack(totals.totalTerima, false)}
              </td>
              <td className={`${td} border-slate-600 text-white`}>
                {formatPack(totals.manualDo, false)}
              </td>
              <td className={`${td} border-slate-600 text-white`}>
                {formatPack(totals.relokasi, false)}
              </td>
              <td className={`${td} border-slate-600 text-white`}>
                {formatPack(totals.doMatic, false)}
              </td>
              <td className={`${td} border-slate-600 text-white`}>
                {formatPack(totals.addDoMatic, false)}
              </td>
              <td className={`${td} border-slate-600 font-bold text-white`}>
                {formatPack(totals.totalKeluar, false)}
              </td>
              <td className={`${td} border-slate-600 font-bold text-white`}>
                {formatPack(totals.stockAkhir, false)}
              </td>
              <td className={`${td} border-slate-600 text-slate-400`}>—</td>
              <td className={`${td} border-slate-600 font-bold text-amber-200`}>
                {formatPack(totals.variance, false)}
              </td>
              <td className={`${td} border-slate-600 text-white`}>
                {formatPack(totals.meta, false)}
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

export default LhsStockTable;
