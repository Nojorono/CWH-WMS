import React, { useEffect, useMemo, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { FaPrint, FaTimes } from "react-icons/fa";
import dayjs from "dayjs";
import "dayjs/locale/id";
import {
  convertTopUpBksToCaseBalSlopPack,
  findMasterItemBySkuAndInventory,
  type MasterItemForConversion,
} from "../../Report/hook/SKUconvertion";
import { useStoreItem } from "../../../../../DynamicAPI/stores/Store/MasterStore";

type PrintBkbModalProps = {
  isOpen: boolean;
  onClose: () => void;
  data: any | null;
  unmatchBTB?: any[];
};

type BkbPrintRow = {
  id: string;
  nick: string;
  brand: string;
  showNick: boolean;
  sisaBarang: string;
  topUp: string;
  perhitungan: string;
  diterimaDo: string;
  tambah: string;
  retur: string;
  diterimaAdj: string;
};

const DAY_ID = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
];

const formatDoDate = (value?: string | null) => {
  if (!value) return "-";
  const parsed = dayjs(value);
  if (!parsed.isValid()) return String(value);
  const dayName = DAY_ID[parsed.day()] || "";
  return `${parsed.format("DD-MMM-YY")} (${dayName})`;
};

/** Satuan tampilan BKB: Bal.Slop.Pack (case digabung ke Bal) */
const formatBalSlopPack = (
  qtyBks: number,
  master?: MasterItemForConversion | null,
): string => {
  const abs = Math.abs(Math.floor(Number(qtyBks) || 0));
  if (abs === 0) return "";

  const converted = convertTopUpBksToCaseBalSlopPack(abs, master || undefined);
  const balPerDus = Number(master?.bal_per_dus) || 0;
  const totalBal =
    converted.balQty +
    (balPerDus > 0 ? converted.caseQty * balPerDus : converted.caseQty);

  return `${totalBal}.${converted.slopQty}.${converted.packQty}`;
};

const thBase =
  "border border-dashed border-black px-1 py-0.5 text-center text-[10px] font-bold leading-tight";
const tdBase =
  "border border-dashed border-black px-1 py-0.5 text-[10px] leading-tight";

export const PrintBkbModal = ({
  isOpen,
  onClose,
  data,
  unmatchBTB = [],
}: PrintBkbModalProps) => {
  const printRef = useRef<HTMLDivElement>(null);
  const { fetchAll, list: itemList } = useStoreItem();

  useEffect(() => {
    if (isOpen) fetchAll();
  }, [isOpen, fetchAll]);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `BKB_${data?.spb_number || "Document"}`,
    pageStyle: `
      @page { size: A4 landscape; margin: 8mm; }
      @media print {
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background: white !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }
    `,
  });

  const rows = useMemo((): BkbPrintRow[] => {
    if (!isOpen || !data) return [];
    const masters = Array.isArray(itemList) ? itemList : [];

    type SortableRow = BkbPrintRow & { _sortNick: string; _sortBrand: string };

    // Sisa Barang = BTB; Perhitungan = Qty Submitted; Top Up = submitted − BTB
    // Semua dikonversi Bal.Slop.Pack. ADJUSTMENT DO selalu kosong.
    const matched: SortableRow[] = [];
    (data.details || []).forEach((item: any) => {
      const sku = String(item.item_code || "").trim();
      const invId = item.inventory_item_id;
      const master = findMasterItemBySkuAndInventory(masters, sku, invId);
      const btb = Number(item.qty_btb) || 0;
      const submitted = Number(item.item_qty_submitted) || 0;
      if (submitted <= 0 && btb <= 0) return;

      const topUpQty = submitted - btb;
      const topUpFmt =
        topUpQty === 0
          ? ""
          : topUpQty < 0
            ? `-${formatBalSlopPack(Math.abs(topUpQty), master)}`
            : formatBalSlopPack(topUpQty, master);

      matched.push({
        id: String(item.id || sku),
        nick: String(master?.item_number || "").trim() || "-",
        brand: sku || "-",
        showNick: true,
        sisaBarang: btb > 0 ? formatBalSlopPack(btb, master) : "",
        topUp: topUpFmt,
        perhitungan:
          submitted > 0 ? formatBalSlopPack(submitted, master) : "",
        diterimaDo: "",
        tambah: "",
        retur: "",
        diterimaAdj: "",
        _sortNick: String(master?.item_number || "zzzz"),
        _sortBrand: sku,
      });
    });

    // BTB tanpa match SPB: tampilkan sisa saja (Adjustment tetap kosong)
    const unmatched: SortableRow[] = [];
    (unmatchBTB || []).forEach((item: any, idx: number) => {
      const sku = String(item.item_code || item.PRODUCT_SKU || "").trim();
      const invId = item.inventory_item_id;
      const master = findMasterItemBySkuAndInventory(masters, sku, invId);
      const btb = Number(item.btb_qty ?? item.QTY_BTB ?? item.qty_btb) || 0;
      if (btb <= 0) return;

      unmatched.push({
        id: `unmatch-${sku || idx}`,
        nick: String(master?.item_number || "").trim() || "-",
        brand: sku || "-",
        showNick: true,
        sisaBarang: formatBalSlopPack(btb, master),
        topUp: "",
        perhitungan: "",
        diterimaDo: "",
        tambah: "",
        retur: "",
        diterimaAdj: "",
        _sortNick: String(master?.item_number || "zzzz"),
        _sortBrand: sku,
      });
    });

    const sorted = [...matched, ...unmatched].sort((a, b) => {
      const nickCmp = a._sortNick.localeCompare(b._sortNick, undefined, {
        numeric: true,
      });
      if (nickCmp !== 0) return nickCmp;
      return a._sortBrand.localeCompare(b._sortBrand);
    });

    let prevNick = "";
    return sorted.map(({ _sortNick, _sortBrand, ...row }) => {
      const showNick = row.nick !== prevNick;
      prevNick = row.nick;
      return { ...row, showNick };
    });
  }, [isOpen, data, unmatchBTB, itemList]);

  if (!isOpen || !data) return null;

  const orgName =
    data.organization?.organization_name ||
    data.organization?.organization_code ||
    "-";
  const doDate =
    data.callplan_date_start || data.spb_date || data.preparation_date;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <FaPrint className="text-orange-500" />
            Preview Bukti Kirim Barang (BKB)
          </h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-300 bg-white px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handlePrint()}
              className="inline-flex items-center gap-2 rounded-md bg-orange-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-orange-600"
            >
              <FaPrint size={12} /> Print
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
            >
              <FaTimes size={14} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-slate-200 p-4">
          <div
            ref={printRef}
            className="mx-auto w-full max-w-[1100px] bg-white p-4 text-black print:max-w-none print:p-0"
            style={{ fontFamily: "Consolas, 'Courier New', monospace" }}
          >
            <div className="mb-3 text-center">
              <h2 className="text-base font-bold uppercase tracking-wide">
                Bukti Kirim Barang ( BKB )
              </h2>
              <p className="text-[11px]">Satuan ( Bal.Slop.Pack)</p>
            </div>

            <div className="mb-3 flex justify-between gap-4 text-[11px]">
              <div className="space-y-0.5">
                <div className="grid grid-cols-[88px_10px_1fr]">
                  <span>AMO</span>
                  <span>:</span>
                  <span className="font-semibold">{orgName}</span>
                </div>
                <div className="grid grid-cols-[88px_10px_1fr]">
                  <span>ID SALES</span>
                  <span>:</span>
                  <span className="font-semibold">{data.sales_nik || "-"}</span>
                </div>
                <div className="grid grid-cols-[88px_10px_1fr]">
                  <span>Nama Sales</span>
                  <span>:</span>
                  <span className="font-semibold">{data.sales_name || "-"}</span>
                </div>
                <div className="grid grid-cols-[88px_10px_1fr]">
                  <span>SPB Number</span>
                  <span>:</span>
                  <span className="font-semibold break-all">
                    {data.spb_number || "-"}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="inline-grid grid-cols-[64px_10px_1fr] text-left">
                  <span>Tgl DO</span>
                  <span>:</span>
                  <span className="font-semibold">{formatDoDate(doDate)}</span>
                </div>
              </div>
            </div>

            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th rowSpan={2} className={`${thBase} w-14`}>
                    NICK
                  </th>
                  <th rowSpan={2} className={`${thBase} w-16`}>
                    BRAND
                  </th>
                  <th colSpan={2} className={thBase}>
                    Informasi WH
                  </th>
                  <th colSpan={2} className={thBase}>
                    DO MATIC
                  </th>
                  <th colSpan={3} className={thBase}>
                    ADJUSMENT DO
                  </th>
                </tr>
                <tr>
                  <th className={thBase}>Sisa Barang</th>
                  <th className={thBase}>Top up</th>
                  <th className={thBase}>Perhitungan</th>
                  <th className={thBase}>Diterima</th>
                  <th className={thBase}>Tambah</th>
                  <th className={thBase}>Retur</th>
                  <th className={thBase}>Diterima</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className={`${tdBase} py-4 text-center italic`}
                    >
                      Tidak ada item
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                      <tr key={row.id} className="break-inside-avoid">
                        <td className={`${tdBase} text-center font-semibold`}>
                          {row.showNick ? row.nick : ""}
                        </td>
                        <td className={`${tdBase} text-center font-semibold`}>
                          {row.brand}
                        </td>
                        <td className={`${tdBase} text-center`}>
                          {row.sisaBarang}
                        </td>
                        <td className={`${tdBase} text-center`}>{row.topUp}</td>
                        <td className={`${tdBase} text-center`}>
                          {row.perhitungan}
                        </td>
                        <td className={`${tdBase} text-center`}>
                          {row.diterimaDo}
                        </td>
                        <td className={`${tdBase} text-center`}>{row.tambah}</td>
                        <td className={`${tdBase} text-center`}>{row.retur}</td>
                        <td className={`${tdBase} text-center`}>
                          {row.diterimaAdj}
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>

            <div className="mt-8 grid grid-cols-3 gap-4 text-center text-[11px]">
              <div>
                <p className="mb-10 font-semibold">Warehouse</p>
                <p>--------------------</p>
                <p>( &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; )</p>
              </div>
              <div>
                <p className="mb-10 font-semibold">Salesman</p>
                <p>--------------------</p>
                <p>( &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; )</p>
              </div>
              <div>
                <p className="mb-1 text-[10px] font-semibold text-red-600 print:text-red-600">
                  * Jika ada adjusment
                </p>
                <p className="mb-10 font-semibold">Supervisor</p>
                <p>--------------------</p>
                <p>( &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; )</p>
              </div>
            </div>

            <div className="mt-6 flex justify-between text-[9px] text-slate-600">
              <span>WMS-SYSTEM // PRINT_PREVIEW_MODE</span>
              <span>Printed: {dayjs().format("DD-MMM-YYYY HH:mm:ss")}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
