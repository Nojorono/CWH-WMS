import React, { useEffect, useMemo, useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import { FaPrint, FaTimes } from "react-icons/fa";
import dayjs from "dayjs";
import "dayjs/locale/id";
import Swal from "sweetalert2";
import {
  convertTopUpBksToCaseBalSlopPack,
  findMasterItemBySkuAndInventory,
  type MasterItemForConversion,
} from "../../Report/hook/SKUconvertion";
import { useStoreItem } from "../../../../../DynamicAPI/stores/Store/MasterStore";
import { showErrorToast } from "../../../../../components/toast";
import { downloadSheetsAsPdf } from "../../Report/utils/downloadElementAsA4Pdf";
import {
  BKB_CONTINUOUS_FORM_HEIGHT_MM,
  BKB_CONTINUOUS_FORM_WIDTH_MM,
  BKB_PRINT_PAGE_STYLE,
} from "../../Report/GudangForm/printStyles";

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

/** Satuan tampilan BKB: Bal.Pres.Bks (case digabung ke Bal) */
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
  "border border-dashed border-black px-0.5 py-0.5 text-center text-[14px] font-bold leading-none text-black";
/** Header kolom ADJUSTMENT DO */
const thAdj =
  "border border-dashed border-black px-0.5 py-0.5 text-center text-[12px] font-bold leading-none text-black";
const tdBase =
  "border border-dashed border-black px-0.5 py-0.5 text-[10px] leading-none text-black";
/** NICK — naming bisa panjang */
const tdNick =
  "border border-dashed border-black px-0.5 py-0.5 text-center text-[15px] font-bold leading-tight text-black break-words";
/** SKU / Brand — lebih sempit */
const tdSku =
  "border border-dashed border-black px-0.5 py-0.5 text-center text-[15px] font-bold leading-tight text-black break-words";
/** Qty WH / SPB */
const tdQty =
  "border border-dashed border-black px-0.5 py-0.5 text-center text-[15px] font-bold leading-tight tabular-nums text-black";
/** Qty ADJUSTMENT DO (isian manual) */
const tdAdj =
  "border border-dashed border-black px-0.5 py-0.5 text-center text-[15px] font-bold leading-tight text-black";

/** Maks SKU per lembar Continuous Form (harus muat 1 halaman fisik) */
const SKU_PER_PAGE = 30;

const chunkRows = <T,>(items: T[], size: number): T[][] => {
  if (!items.length) return [[]];
  const pages: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    pages.push(items.slice(i, i + size));
  }
  return pages;
};

/** Tampilkan NICK ulang di awal tiap lembar (dan saat ganti nick) */
const withPageNickVisibility = (pageRows: BkbPrintRow[]): BkbPrintRow[] => {
  let prevNick = "";
  return pageRows.map((row) => {
    const showNick = row.nick !== prevNick;
    prevNick = row.nick;
    return { ...row, showNick };
  });
};

export const PrintBkbModal = ({
  isOpen,
  onClose,
  data,
  unmatchBTB = [],
}: PrintBkbModalProps) => {
  const printRef = useRef<HTMLDivElement>(null);
  const { fetchAll, list: itemList } = useStoreItem();
  const [isPreparing, setIsPreparing] = useState(false);

  useEffect(() => {
    if (isOpen) fetchAll();
  }, [isOpen, fetchAll]);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `BKB_${data?.spb_number || "Document"}`,
    pageStyle: BKB_PRINT_PAGE_STYLE,
  });

  const runPrintFlow = async () => {
    if (isPreparing) return;

    const confirm = await Swal.fire({
      title: "Konfirmasi Print BKB?",
      text: "Akan mencetak BKB ke Continuous Form Applied 3 (9.5\" × 11\") dan mengunduh PDF backup. Lanjutkan?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Print",
      cancelButtonText: "Batal",
      confirmButtonColor: "#F26522",
      cancelButtonColor: "#6b7280",
      reverseButtons: true,
      didOpen: () => {
        const container = Swal.getContainer();
        if (container) container.style.zIndex = "1600000";
      },
    });

    if (!confirm.isConfirmed) return;

    const el = printRef.current;
    if (!el) {
      showErrorToast("Konten print BKB tidak ditemukan");
      return;
    }

    setIsPreparing(true);
    try {
      const stamp = dayjs().format("YYYYMMDD_HHmmss");
      const spb = String(data?.spb_number || "Document").replace(
        /[^\w.\-]+/g,
        "_",
      );
      // Dialog print + unduh PDF (1 lembar HTML = 1 halaman PDF)
      handlePrint();
      const sheets = Array.from(
        el.querySelectorAll<HTMLElement>(".bkb-print-sheet"),
      );
      await downloadSheetsAsPdf(sheets, `BKB_${spb}_${stamp}`, {
        orientation: "portrait",
        marginMm: 8,
        pageSizeMm: [
          BKB_CONTINUOUS_FORM_WIDTH_MM,
          BKB_CONTINUOUS_FORM_HEIGHT_MM,
        ],
      });
    } catch (error) {
      console.error("Gagal unduh PDF BKB:", error);
      showErrorToast(
        error instanceof Error
          ? error.message
          : "Gagal mengunduh PDF backup BKB. Print tetap berjalan.",
      );
    } finally {
      setIsPreparing(false);
    }
  };

  const rows = useMemo((): BkbPrintRow[] => {
    if (!isOpen || !data) return [];
    const masters = Array.isArray(itemList) ? itemList : [];

    type SortableRow = BkbPrintRow & { _sortNick: string; _sortBrand: string };

    // Sisa Barang = BTB; Perhitungan = Qty Final; Top Up = submitted − BTB
    // Semua dikonversi Bal.Pres.Bks. ADJUSTMENT DO selalu kosong.
    const matched: SortableRow[] = [];
    (data.details || []).forEach((item: any) => {
      const sku = String(item.item_code || "").trim();
      const invId = item.inventory_item_id;
      const master = findMasterItemBySkuAndInventory(masters, sku, invId);
      const btb = Number(item.qty_btb) || 0;
      const submitted = Number(item.item_qty_submitted) || 0;
      const finalQty =
        Number(item.item_qty_final ?? item.item_qty_submitted) || 0;
      if (finalQty <= 0 && submitted <= 0 && btb <= 0) return;

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
          finalQty > 0 ? formatBalSlopPack(finalQty, master) : "",
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

  const pageChunks = useMemo(() => {
    const chunks = chunkRows(rows, SKU_PER_PAGE);
    return chunks.map((chunk) => withPageNickVisibility(chunk));
  }, [rows]);

  if (!isOpen || !data) return null;

  const orgName =
    data.organization?.organization_name ||
    data.organization?.organization_code ||
    "-";
  const doDate =
    data.callplan_date_start || data.spb_date || data.preparation_date;
  const totalPages = pageChunks.length;
  const printedAt = dayjs().format("DD-MMM-YYYY HH:mm:ss");

  const renderFormHeader = (pageIndex: number) => (
    <>
      <div className="mb-3 text-center text-black">
        <h2 className="text-[14px] font-bold uppercase tracking-wide text-black">
          Bukti Kirim Barang ( BKB )
        </h2>
        <p className="text-[13px] font-semibold text-black">
          Satuan ( Bal.Pres.Bks)
        </p>
        {totalPages > 1 && (
          <p className="text-[11px] font-bold text-black">
            Halaman {pageIndex + 1} / {totalPages}
          </p>
        )}
      </div>

      <div className="mb-5 flex justify-between gap-3 text-[12px] text-black">
        <div className="space-y-0">
          <div className="grid grid-cols-[92px_10px_1fr]">
            <span className="font-semibold">AMO</span>
            <span>:</span>
            <span className="font-bold text-black">{orgName}</span>
          </div>
          <div className="grid grid-cols-[92px_10px_1fr]">
            <span className="font-semibold">ID SALES</span>
            <span>:</span>
            <span className="font-bold text-black">
              {data.sales_nik || "-"}
            </span>
          </div>
          <div className="grid grid-cols-[92px_10px_1fr]">
            <span className="font-semibold">Nama Sales</span>
            <span>:</span>
            <span className="font-bold text-black">
              {data.sales_name || "-"}
            </span>
          </div>
          <div className="grid grid-cols-[92px_10px_1fr]">
            <span className="font-semibold">SPB Number</span>
            <span>:</span>
            <span className="break-all font-bold text-black">
              {data.spb_number || "-"}
            </span>
          </div>
        </div>

        <div className="text-right">
          <div className="inline-grid grid-cols-[64px_10px_1fr] text-left text-[12px] text-black">
            <span className="font-semibold">Tgl DO</span>
            <span>:</span>
            <span className="font-bold text-black">
              {formatDoDate(doDate)}
            </span>
          </div>
        </div>
      </div>
    </>
  );

  const renderTable = (pageRows: BkbPrintRow[]) => (
    <table className="w-full border-collapse text-black table-fixed">
      <colgroup>
        {/* NICK — naming lebih panjang, kolom lebih lebar */}
        <col style={{ width: "15%" }} />
        {/* BRAND — lebih sempit */}
        <col style={{ width: "9%" }} />
        {/* BTB / Top up / Qty Final / Diterima SPB */}
        <col style={{ width: "12%" }} />
        <col style={{ width: "12%" }} />
        <col style={{ width: "12%" }} />
        <col style={{ width: "11%" }} />
        {/* ADJUSTMENT: Tambah / Kurang / Diterima */}
        <col style={{ width: "10%" }} />
        <col style={{ width: "10%" }} />
        <col style={{ width: "12%" }} />
      </colgroup>
      <thead>
        <tr>
          <th rowSpan={2} className={thBase}>
            NICK
          </th>
          <th rowSpan={2} className={thBase}>
            BRAND
          </th>
          <th colSpan={2} className={thBase}>
            Informasi WH
          </th>
          <th colSpan={2} className={thBase}>
            SPB
          </th>
          <th colSpan={3} className={thBase}>
            ADJUSMENT DO
          </th>
        </tr>
        <tr>
          <th className={thBase}>BTB</th>
          <th className={thBase}>Top up</th>
          <th className={thBase}>Qty Final</th>
          <th className={thBase}>Diterima</th>
          <th className={thAdj}>Tambah</th>
          <th className={thAdj}>Kurang</th>
          <th className={thAdj}>Diterima</th>
        </tr>
      </thead>
      <tbody>
        {pageRows.length === 0 ? (
          <tr>
            <td colSpan={9} className={`${tdBase} py-4 text-center italic`}>
              Tidak ada item
            </td>
          </tr>
        ) : (
          pageRows.map((row) => (
            <tr key={row.id} className="break-inside-avoid">
              <td className={tdNick}>{row.showNick ? row.nick : ""}</td>
              <td className={tdSku}>{row.brand}</td>
              <td className={tdQty}>{row.sisaBarang}</td>
              <td className={tdQty}>{row.topUp}</td>
              <td className={tdQty}>{row.perhitungan}</td>
              <td className={tdQty}>{row.diterimaDo}</td>
              <td className={tdAdj}>{row.tambah}</td>
              <td className={tdAdj}>{row.retur}</td>
              <td className={tdAdj}>{row.diterimaAdj}</td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );

  const renderFooter = () => (
    <>
      <div className="mt-10 grid grid-cols-3 gap-3 text-center text-[12px] text-black">
        <div>
          <p className="mb-10 text-[12px] font-bold text-black">Warehouse</p>
          <p className="text-[11px]">(--------------------)</p>
   
        </div>
        <div>
          <p className="mb-10 text-[12px] font-bold text-black">Salesman</p>
          <p className="text-[11px]">(--------------------)</p>
  
        </div>
        <div>
          <p className=" text-[10px] font-bold text-black">
            * Jika ada adjusment
          </p>
          <p className="mb-6 text-[12px] font-bold text-black">Supervisor</p>
          <p className="text-[11px]">(--------------------)</p>
        </div>
      </div>

      <div className="mt-2 flex justify-between text-[12px] font-semibold text-black">
        <span>WMS-SYSTEM // CONTINUOUS FORM APPLIED 3</span>
        <span>Printed: {printedAt}</span>
      </div>
    </>
  );

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm print:hidden">
      <div className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        {isPreparing && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/70 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="size-10 animate-spin rounded-full border-4 border-slate-100 border-t-orange-600" />
              <p className="text-sm font-semibold text-slate-700">
                Menyiapkan print & PDF backup…
              </p>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <FaPrint className="text-orange-500" />
            Preview Bukti Kirim Barang (BKB)
            {totalPages > 1 && (
              <span className="rounded bg-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                {rows.length} SKU · {totalPages} lembar
              </span>
            )}
          </h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isPreparing}
              onClick={onClose}
              className="rounded-md border border-slate-300 bg-white px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isPreparing}
              onClick={() => void runPrintFlow()}
              className="inline-flex items-center gap-2 rounded-md bg-orange-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FaPrint size={12} /> Print
            </button>
            <button
              type="button"
              disabled={isPreparing}
              onClick={onClose}
              className="rounded p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 disabled:opacity-50"
            >
              <FaTimes size={14} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-slate-200 p-4">
          <div
            ref={printRef}
            className="bkb-print-root mx-auto w-full max-w-[910px] print:max-w-none"
            style={{
              fontFamily: "Consolas, 'Courier New', monospace",
              color: "#000000",
            }}
          >
            {pageChunks.map((pageRows, pageIndex) => {
              const isLast = pageIndex === totalPages - 1;
              return (
                <div
                  key={`bkb-page-${pageIndex}`}
                  className={`bkb-print-sheet bg-white p-3 text-black print:p-0 ${
                    isLast ? "" : "bkb-page-break mb-4 print:mb-0"
                  }`}
                >
                  {renderFormHeader(pageIndex)}
                  {renderTable(pageRows)}
                  {isLast ? renderFooter() : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
