import React, { useState, useEffect } from "react";
import Barcode from "react-barcode";
import { QRCodeSVG } from "qrcode.react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { showErrorToast } from "../../../../components/toast";

type Item = {
  id: string | number;
  pallet_code: string;
  name?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  items: Item[];
  useQRCode?: boolean;
  defaultSize?: number;
};

// --- Konstanta & Helper ---
const MAX_PAGES_LIMIT = 100;
const CM_TO_PX = 37.7952;
const clamp = (val: number, min: number, max: number) =>
  Math.min(Math.max(val, min), max);

const PRESETS = [
  { label: "10×10 cm", w: 10, h: 10, code: 8, lbl: 2, fontPt: 14 },
  { label: "8×8 cm", w: 8, h: 8, code: 6.5, lbl: 1.5, fontPt: 12 },
  { label: "10×6 cm", w: 10, h: 6, code: 4.5, lbl: 1.5, fontPt: 11 },
  { label: "A6 (10.5×14.8)", w: 10.5, h: 14.8, code: 9, lbl: 2, fontPt: 14 },
  { label: "Custom", w: null, h: null, code: null, lbl: null, fontPt: null },
] as const;

const PrintBarcodeModal: React.FC<Props> = ({
  open,
  onClose,
  items,
  useQRCode = false,
  defaultSize = 150,
}) => {
  const [stickerW, setStickerW] = useState(10);
  const [stickerH, setStickerH] = useState(10);
  const [codeSize, setCodeSize] = useState(8);
  const [labelH, setLabelH] = useState(2);
  const [labelFontPt, setLabelFontPt] = useState(14);
  const [activePreset, setActivePreset] = useState<string>("10×10 cm");
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [globalCopies, setGlobalCopies] = useState<number>(4);
  const [perItemCopies, setPerItemCopies] = useState<
    Record<string | number, number>
  >({});
  const [activeTab, setActiveTab] = useState<"settings" | "size" | "preview">(
    "settings",
  );

  useEffect(() => {
    if (open) {
      setStickerW(10);
      setStickerH(10);
      setCodeSize(8);
      setLabelH(2);
      setLabelFontPt(14);
      setGlobalCopies(4);
      setPerItemCopies({});
      setActiveTab("settings");
      setActivePreset("10×10 cm");
    }
  }, [open]);

  if (!open) return null;

  const safeCodeSize = clamp(codeSize, 1, Math.min(stickerW, stickerH) - 0.5);
  const safeLabelH = clamp(labelH, 0.5, stickerH - safeCodeSize);
  const safeLabelFontPt = clamp(labelFontPt, 6, 48);
  const codeSizePx = safeCodeSize * CM_TO_PX;
  /** Skala font preview mockup agar proporsional dengan ukuran stiker di layar */
  const previewLabelFontPx =
    (safeLabelFontPt / 72) * 96 * (25 / CM_TO_PX);

  const getCopies = (itemId: string | number) =>
    perItemCopies[itemId] ?? globalCopies;

  const expandedItems = items.flatMap((item) =>
    Array.from({ length: getCopies(item.id) }, (_, i) => ({
      ...item,
      _key: `${item.id}-copy-${i}`,
    })),
  );
  const totalPages = expandedItems.length;

  const PRINT_STYLES = `
    @page { margin: 0; size: ${stickerW}cm ${stickerH}cm; }
    body { margin: 0; padding: 0; }
    .sticker {
      width: ${stickerW}cm; height: ${stickerH}cm;
      box-sizing: border-box; padding: 5mm;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      page-break-after: always;
    }
    .sticker .code-area svg { width: ${safeCodeSize}cm !important; height: ${safeCodeSize}cm !important; }
    .sticker .label-area p { margin: 0; font-size: ${safeLabelFontPt}pt; font-weight: bold; text-align: center; }
  `;

  const handlePrint = () => {
    const printArea = document.getElementById("print-area-hidden");
    if (!printArea) return;

    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write(
      `<html><head><style>${PRINT_STYLES}</style></head><body><div>${printArea.innerHTML}</div><script>window.onload=()=>{window.print();setTimeout(()=>{window.frameElement.remove()},100)}</script></body></html>`,
    );
    doc.close();
  };

  const handleExportPDF = async () => {
    if (totalPages > MAX_PAGES_LIMIT) {
      showErrorToast(
        `Limitasi: Maksimal ekspor adalah ${MAX_PAGES_LIMIT} halaman. Saat ini: ${totalPages}.`,
      );
      return;
    }
    const printArea = document.getElementById("print-area-hidden");
    if (!printArea) return;

    setIsExporting(true);
    setExportProgress(0);

    try {
      const widthMm = stickerW * 10;
      const heightMm = stickerH * 10;
      const pdf = new jsPDF({
        orientation: stickerW > stickerH ? "landscape" : "portrait",
        unit: "mm",
        format: [widthMm, heightMm],
        compress: true,
      });

      const stickers = printArea.querySelectorAll(".sticker");
      for (let i = 0; i < stickers.length; i++) {
        setExportProgress(Math.round(((i + 1) / stickers.length) * 100));
        const canvas = await html2canvas(stickers[i] as HTMLElement, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
        });
        const imgData = canvas.toDataURL("image/jpeg", 0.8);
        if (i > 0) pdf.addPage([widthMm, heightMm]);
        pdf.addImage(imgData, "JPEG", 0, 0, widthMm, heightMm);
        canvas.width = 0;
        canvas.height = 0;
      }
      pdf.save(`pallet-labels-${Date.now()}.pdf`);
    } catch (err) {
      showErrorToast("Ekspor gagal.");
    } finally {
      setIsExporting(false);
    }
  };

  const PtInput = ({ label, value, onChange, min, max, step = 1 }: any) => (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
        {label}
      </label>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onChange(clamp(value - step, min, max))}
          className="w-8 h-8 rounded bg-gray-100 border text-gray-600 font-bold"
        >
          -
        </button>
        <input
          type="number"
          value={value}
          onChange={(e) =>
            onChange(clamp(parseFloat(e.target.value) || min, min, max))
          }
          className="w-14 text-center border rounded h-8 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <button
          type="button"
          onClick={() => onChange(clamp(value + step, min, max))}
          className="w-8 h-8 rounded bg-gray-100 border text-gray-600 font-bold"
        >
          +
        </button>
        <span className="text-[10px] font-semibold text-slate-400">pt</span>
      </div>
    </div>
  );

  const CmInput = ({ label, value, onChange, min, max, step = 0.5 }: any) => (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
        {label}
      </label>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(clamp(value - step, min, max))}
          className="w-8 h-8 rounded bg-gray-100 border text-gray-600 font-bold"
        >
          -
        </button>
        <input
          type="number"
          value={value}
          onChange={(e) =>
            onChange(clamp(parseFloat(e.target.value) || min, min, max))
          }
          className="w-14 text-center border rounded h-8 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <button
          onClick={() => onChange(clamp(value + step, min, max))}
          className="w-8 h-8 rounded bg-gray-100 border text-gray-600 font-bold"
        >
          +
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-[900px] h-[85vh] flex flex-col overflow-hidden shadow-2xl">
        {/* HEADER */}
        <div className="px-6 py-4 border-b bg-slate-50/50">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-extrabold text-slate-900">
              Config Label Pallet
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400"
            >
              ✕
            </button>
          </div>
          <div className="flex gap-4">
            {(["settings", "size", "preview"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-2 px-2 text-sm font-bold transition-all border-b-2 ${activeTab === tab ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-600"}`}
              >
                {tab === "settings" && "⚙️ Item & Qty"}
                {tab === "size" && "📏 Layout"}
                {tab === "preview" && "👁️ Preview Mockup"}
              </button>
            ))}
          </div>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto relative bg-white">
          {/* 1. Tab Settings */}
          {activeTab === "settings" && (
            <div className="p-6">
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mb-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-blue-900">
                    Jumlah Cetak Per Pallet (Global)
                  </p>
                  <p className="text-xs text-blue-600 italic">
                    Gunakan ini untuk mengatur semua pallet sekaligus
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setGlobalCopies(clamp(globalCopies - 1, 1, 99))
                    }
                    className="w-8 h-8 bg-white border rounded shadow-sm font-bold"
                  >
                    -
                  </button>
                  <span className="w-10 text-center font-bold">
                    {globalCopies}
                  </span>
                  <button
                    onClick={() =>
                      setGlobalCopies(clamp(globalCopies + 1, 1, 99))
                    }
                    className="w-8 h-8 bg-white border rounded shadow-sm font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              <table className="w-full text-sm">
                <thead className="text-slate-500 border-b">
                  <tr>
                    <th className="text-left py-3 px-2 font-bold uppercase text-[10px]">
                      Kode Pallet
                    </th>
                    <th className="text-center py-3 px-2 font-bold uppercase text-[10px]">
                      Jumlah Cetak
                    </th>
                    <th className="text-right py-3 px-2 font-bold uppercase text-[10px]">
                      Total Per Item
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-3 px-2 font-mono font-bold text-slate-700">
                        {item.pallet_code}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex justify-center items-center gap-2">
                          <button
                            onClick={() =>
                              setPerItemCopies({
                                ...perItemCopies,
                                [item.id]: clamp(getCopies(item.id) - 1, 1, 99),
                              })
                            }
                            className="w-6 h-6 border rounded text-xs font-bold"
                          >
                            -
                          </button>
                          <span className="w-6 text-center text-xs font-bold">
                            {getCopies(item.id)}
                          </span>
                          <button
                            onClick={() =>
                              setPerItemCopies({
                                ...perItemCopies,
                                [item.id]: clamp(getCopies(item.id) + 1, 1, 99),
                              })
                            }
                            className="w-6 h-6 border rounded text-xs font-bold"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-right text-xs font-bold text-blue-500">
                        {getCopies(item.id)} Hal
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 2. Tab Size */}
          {activeTab === "size" && (
            <div className="p-6 space-y-8 animate-in fade-in duration-300">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-3 block tracking-widest">
                  Preset Ukuran Stiker
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map((p) => (
                    <button
                      key={p.label}
                      onClick={() => {
                        if (p.w) {
                          setStickerW(p.w);
                          setStickerH(p.h!);
                          setCodeSize(p.code!);
                          setLabelH(p.lbl!);
                          if (p.fontPt) setLabelFontPt(p.fontPt);
                        }
                        setActivePreset(p.label);
                      }}
                      className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${activePreset === p.label ? "bg-slate-900 text-white border-slate-900 shadow-md scale-105" : "bg-white border-slate-200 text-slate-600 hover:border-slate-400"}`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-700">
                    📄 Dimensi Kertas
                  </h4>
                  <CmInput
                    label="Lebar Stiker (W)"
                    value={stickerW}
                    onChange={(v: any) => {
                      setStickerW(v);
                      setActivePreset("Custom");
                    }}
                    min={3}
                    max={30}
                  />
                  <CmInput
                    label="Tinggi Stiker (H)"
                    value={stickerH}
                    onChange={(v: any) => {
                      setStickerH(v);
                      setActivePreset("Custom");
                    }}
                    min={3}
                    max={30}
                  />
                </div>
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-700">
                    📊 Ukuran {useQRCode ? "QR Code" : "Barcode"}
                  </h4>
                  <CmInput
                    label="Ukuran Kode"
                    value={safeCodeSize}
                    onChange={(v: any) => {
                      setCodeSize(v);
                      setActivePreset("Custom");
                    }}
                    min={1}
                    max={Math.min(stickerW, stickerH) - 0.5}
                  />
                  <CmInput
                    label="Tinggi Label Nama"
                    value={safeLabelH}
                    onChange={(v: any) => {
                      setLabelH(v);
                      setActivePreset("Custom");
                    }}
                    min={0.5}
                    max={stickerH - safeCodeSize}
                  />
                  <PtInput
                    label="Font Pallet Code"
                    value={safeLabelFontPt}
                    onChange={(v: number) => {
                      setLabelFontPt(v);
                      setActivePreset("Custom");
                    }}
                    min={6}
                    max={48}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 3. Tab Preview (Smart Dummy) */}
          {activeTab === "preview" && (
            <div className="p-8 bg-slate-100 h-full flex items-center justify-center animate-in zoom-in-95 duration-200">
              <div className="flex flex-col items-center gap-6">
                <div className="bg-white/80 backdrop-blur-sm px-4 py-1.5 rounded-full border border-slate-200 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                    Mockup Ukuran Sebenarnya
                  </p>
                </div>

                <div
                  className="bg-white shadow-2xl border border-slate-300 flex flex-col items-center justify-center overflow-hidden"
                  style={{
                    width: `${stickerW * 25}px`,
                    height: `${stickerH * 25}px`,
                    padding: "10px",
                  }}
                >
                  <div className="flex-1 flex items-center justify-center w-full">
                    {useQRCode ? (
                      <QRCodeSVG
                        value="DUMMY-SAMPLE"
                        style={{
                          width: `${(safeCodeSize / stickerW) * 100}%`,
                          height: "auto",
                          maxWidth: "100%",
                        }}
                      />
                    ) : (
                      <div className="w-full flex justify-center scale-110">
                        <Barcode
                          value="DUMMY-SAMPLE"
                          width={1.5}
                          height={40}
                          displayValue={false}
                        />
                      </div>
                    )}
                  </div>
                  <div
                    className="w-full flex items-center justify-center border-t border-dashed"
                    style={{ height: `${(safeLabelH / stickerH) * 100}%` }}
                  >
                    <p
                      className="font-mono font-bold text-slate-900 text-center leading-tight"
                      style={{ fontSize: `${previewLabelFontPx}px` }}
                    >
                      {items[0]?.pallet_code || "SAMPLE"}
                    </p>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-sm font-bold text-slate-700">
                    {stickerW} x {stickerH} cm
                  </p>
                  {/* <p className="text-[10px] text-slate-400 font-medium italic">
                    Data dummy digunakan untuk simulasi visual
                  </p> */}
                </div>
              </div>
            </div>
          )}

          {/* HIDDEN PRINT AREA (Selalu di DOM agar bisa diproses Export/Print asli) */}
          <div
            id="print-area-hidden"
            className="fixed top-[-9999px] left-[-9999px]"
          >
            {expandedItems.map((item) => (
              <div
                key={item._key}
                className="sticker"
                style={{
                  width: `${stickerW}cm`,
                  height: `${stickerH}cm`,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "5mm",
                }}
              >
                <div
                  className="code-area"
                  style={{
                    height: `${safeCodeSize}cm`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {useQRCode ? (
                    <QRCodeSVG
                      value={item.pallet_code}
                      width={codeSizePx}
                      height={codeSizePx}
                    />
                  ) : (
                    <Barcode
                      value={item.pallet_code}
                      width={2}
                      height={100}
                      displayValue={false}
                    />
                  )}
                </div>
                <div
                  className="label-area"
                  style={{
                    height: `${safeLabelH}cm`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontSize: `${safeLabelFontPt}pt`,
                      fontWeight: "bold",
                    }}
                  >
                    {item.pallet_code}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-6 border-t bg-white flex justify-between items-center shadow-[0_-4px_10px_rgba(0,0,0,0.03)]">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">
              Total Output
            </span>
            <span
              className={`text-sm font-bold ${totalPages > MAX_PAGES_LIMIT ? "text-red-500" : "text-slate-800"}`}
            >
              {totalPages} Halaman{" "}
              {totalPages > MAX_PAGES_LIMIT && "(Melebihi Limit)"}
            </span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200"
            >
              Batal
            </button>
            <button
              disabled={
                isExporting || totalPages === 0 || totalPages > MAX_PAGES_LIMIT
              }
              onClick={handleExportPDF}
              className="px-6 py-2 rounded-xl text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-slate-200 transition-all flex items-center gap-2 shadow-lg shadow-emerald-200"
            >
              {isExporting ? `Proses ${exportProgress}%` : "⬇️ Export PDF"}
            </button>
            <button
              onClick={handlePrint}
              disabled={totalPages === 0 || totalPages > MAX_PAGES_LIMIT}
              className="px-6 py-2 rounded-xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-200 transition-all shadow-lg shadow-blue-200"
            >
              🖨️ Direct Print
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintBarcodeModal;
