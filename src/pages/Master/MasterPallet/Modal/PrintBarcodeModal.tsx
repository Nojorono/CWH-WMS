import React, { useState, useEffect } from "react";
import Barcode from "react-barcode";
import { QRCodeSVG } from "qrcode.react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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

function palletLabel(item: Item): string {
  const n = item.name?.trim();
  return n || String(item.pallet_code);
}

const buildPrintStyles = (
  stickerW: number,
  stickerH: number,
  codeSize: number,
  labelH: number,
) => `
  @page { margin: 0; size: ${stickerW}cm ${stickerH}cm; }
  body { font-family: system-ui, sans-serif; margin: 0; padding: 0; }
  #print-area { display: flex; flex-direction: column; align-items: flex-start; gap: 0; }
  .sticker {
    box-sizing: border-box;
    width: ${stickerW}cm;
    height: ${stickerH}cm;
    padding: 5mm;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    page-break-after: always;
    break-after: page;
  }
  .sticker:last-child { page-break-after: auto; break-after: auto; }
  .sticker .code-area {
    width: ${codeSize}cm;
    height: ${codeSize}cm;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .sticker .code-area svg { display: block; width: ${codeSize}cm !important; height: ${codeSize}cm !important; }
  .sticker .label-area {
    width: ${stickerW}cm;
    height: ${labelH}cm;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .sticker .label-area p {
    margin: 0;
    font-size: 14pt;
    font-weight: bold;
    text-align: center;
    color: black;
  }
  .sticker-barcode .code-area svg,
  .sticker-barcode .code-area img {
    max-width: ${codeSize}cm;
    height: auto;
  }
`;

const clamp = (val: number, min: number, max: number) =>
  Math.min(Math.max(val, min), max);

const CM_TO_PX = 37.7952;

const PRESETS = [
  { label: "10×10 cm", w: 10, h: 10, code: 8, lbl: 2 },
  { label: "8×8 cm", w: 8, h: 8, code: 6.5, lbl: 1.5 },
  { label: "10×6 cm", w: 10, h: 6, code: 4.5, lbl: 1.5 },
  { label: "A6 (10.5×14.8)", w: 10.5, h: 14.8, code: 9, lbl: 2 },
  { label: "A5 (14.8×21)", w: 14.8, h: 21, code: 13, lbl: 2.5 },
  { label: "Custom", w: null, h: null, code: null, lbl: null },
] as const;

type PresetLabel = (typeof PRESETS)[number]["label"];

const PrintBarcodeModal: React.FC<Props> = ({
  open,
  onClose,
  items,
  useQRCode = false,
  defaultSize = 200,
}) => {
  const [stickerW, setStickerW] = useState(10);
  const [stickerH, setStickerH] = useState(10);
  const [codeSize, setCodeSize] = useState(8);
  const [labelH, setLabelH] = useState(2);
  const [barcodeHeightPx, setBarcodeHeightPx] = useState(defaultSize);
  const [activePreset, setActivePreset] = useState<PresetLabel>("10×10 cm");

  const [isExporting, setIsExporting] = useState(false);
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
      setBarcodeHeightPx(defaultSize);
      setGlobalCopies(4);
      setPerItemCopies({});
      setActiveTab("settings");
      setActivePreset("10×10 cm");
    }
  }, [open, defaultSize]);

  if (!open) return null;

  // Setter yang otomatis pindah highlight ke "Custom"
  const setCustomStickerW = (v: number) => {
    setStickerW(v);
    setActivePreset("Custom");
  };
  const setCustomStickerH = (v: number) => {
    setStickerH(v);
    setActivePreset("Custom");
  };
  const setCustomCodeSize = (v: number) => {
    setCodeSize(v);
    setActivePreset("Custom");
  };
  const setCustomLabelH = (v: number) => {
    setLabelH(v);
    setActivePreset("Custom");
  };

  const safeCodeSize = clamp(codeSize, 1, Math.min(stickerW, stickerH) - 0.5);
  const safeLabelH = clamp(labelH, 0.5, stickerH - safeCodeSize);
  const codeSizePx = safeCodeSize * CM_TO_PX;

  const getCopies = (itemId: string | number) =>
    perItemCopies[itemId] ?? globalCopies;
  const setItemCopies = (itemId: string | number, val: number) =>
    setPerItemCopies((prev) => ({ ...prev, [itemId]: clamp(val, 1, 99) }));
  const handleGlobalCopies = (val: number) => {
    setGlobalCopies(clamp(val, 1, 99));
    setPerItemCopies({});
  };

  const expandedItems = items.flatMap((item) =>
    Array.from({ length: getCopies(item.id) }, (_, i) => ({
      ...item,
      _key: `${item.id}-copy-${i}`,
    })),
  );
  const totalPages = expandedItems.length;

  const PRINT_STYLES = buildPrintStyles(
    stickerW,
    stickerH,
    safeCodeSize,
    safeLabelH,
  );

  const handlePrint = () => {
    const printArea = document.getElementById("print-area");
    if (!printArea) return;
    const printWindow = window.open("", "", "width=800,height=600");
    if (printWindow) {
      const clone = printArea.cloneNode(true) as HTMLElement;
      printWindow.document.title = useQRCode
        ? "Print QR Pallet"
        : "Print Barcode";
      printWindow.document.head.innerHTML = `<meta charset="utf-8"><style>${PRINT_STYLES}</style>`;
      printWindow.document.body.innerHTML = "";
      printWindow.document.body.appendChild(clone);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  };

  const handleExportPDF = async () => {
    const printArea = document.getElementById("print-area");
    if (!printArea) return;
    setIsExporting(true);
    try {
      const widthMm = stickerW * 10;
      const heightMm = stickerH * 10;
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [widthMm, heightMm],
      });
      const stickers = printArea.querySelectorAll(".sticker");
      for (let i = 0; i < stickers.length; i++) {
        const element = stickers[i] as HTMLElement;
        const canvas = await html2canvas(element, {
          scale: 3,
          useCORS: true,
          logging: false,
          width: element.offsetWidth,
          height: element.offsetHeight,
        });
        const imgData = canvas.toDataURL("image/png");
        if (i > 0) pdf.addPage([widthMm, heightMm], "portrait");
        pdf.addImage(imgData, "PNG", 0, 0, widthMm, heightMm);
      }
      pdf.save(useQRCode ? "qr-pallets.pdf" : "barcodes.pdf");
    } catch (error) {
      console.error("PDF Export failed", error);
    } finally {
      setIsExporting(false);
    }
  };

  const renderStickerContent = (item: Item) => {
    if (useQRCode) {
      return (
        <>
          <div
            className="code-area"
            style={{
              width: `${safeCodeSize}cm`,
              height: `${safeCodeSize}cm`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <QRCodeSVG
              value={item.pallet_code}
              width={codeSizePx}
              height={codeSizePx}
            />
          </div>
          <div
            className="label-area"
            style={{
              width: `${stickerW}cm`,
              height: `${safeLabelH}cm`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "14pt",
                fontWeight: "bold",
                textAlign: "center",
                color: "black",
              }}
            >
              {palletLabel(item)}
            </p>
          </div>
        </>
      );
    }
    return (
      <>
        <div
          className="code-area"
          style={{
            width: `${safeCodeSize}cm`,
            height: `${safeCodeSize}cm`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          <Barcode
            value={item.pallet_code}
            width={2}
            height={barcodeHeightPx / 2}
            displayValue={false}
            margin={0}
          />
        </div>
        <div
          className="label-area"
          style={{
            width: `${stickerW}cm`,
            height: `${safeLabelH}cm`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "14pt",
              fontWeight: "bold",
              textAlign: "center",
              color: "black",
            }}
          >
            {item.pallet_code}
          </p>
        </div>
      </>
    );
  };

  const CmInput = ({
    label,
    value,
    onChange,
    min = 1,
    max = 30,
    step = 0.5,
    hint,
  }: {
    label: string;
    value: number;
    onChange: (v: number) => void;
    min?: number;
    max?: number;
    step?: number;
    hint?: string;
  }) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {label}
      </label>
      <div className="flex items-center gap-1">
        <button
          onClick={() =>
            onChange(clamp(parseFloat((value - step).toFixed(2)), min, max))
          }
          className="w-7 h-7 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-base leading-none"
        >
          −
        </button>
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) =>
            onChange(clamp(parseFloat(e.target.value) || min, min, max))
          }
          className="w-16 text-center border rounded px-1 py-1 text-sm font-bold focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={() =>
            onChange(clamp(parseFloat((value + step).toFixed(2)), min, max))
          }
          className="w-7 h-7 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-base leading-none"
        >
          +
        </button>
        <span className="text-xs text-gray-400 ml-1">
          cm{hint ? ` · ${hint}` : ""}
        </span>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl w-full max-w-[900px] h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* HEADER */}
        <div className="flex-shrink-0 px-6 pt-5 pb-0 bg-white border-b">
          <h2 className="text-lg font-bold mb-4">
            {useQRCode ? "Preview QR Pallet" : "Preview Barcode Pallet"}
          </h2>

          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
              <span className="text-sm font-semibold text-blue-700">
                🖨️ Jumlah Cetak (Semua):
              </span>
              <button
                onClick={() => handleGlobalCopies(globalCopies - 1)}
                className="w-7 h-7 rounded bg-blue-200 hover:bg-blue-300 text-blue-800 font-bold text-base leading-none"
              >
                −
              </button>
              <input
                type="number"
                min={1}
                max={99}
                value={globalCopies}
                onChange={(e) => handleGlobalCopies(Number(e.target.value))}
                className="w-14 text-center border border-blue-300 rounded px-1 py-0.5 text-sm font-bold focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => handleGlobalCopies(globalCopies + 1)}
                className="w-7 h-7 rounded bg-blue-200 hover:bg-blue-300 text-blue-800 font-bold text-base leading-none"
              >
                +
              </button>
              <span className="text-xs text-blue-500">sisi/pallet</span>
            </div>

            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
              <span className="text-sm text-gray-500">Total halaman PDF:</span>
              <span className="text-sm font-bold text-gray-800">
                {totalPages} halaman
              </span>
            </div>

            <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
              <span className="text-xs text-emerald-600 font-semibold">
                📐 Stiker:
              </span>
              <span className="text-xs font-bold text-emerald-800">
                {stickerW}×{stickerH}cm
              </span>
              <span className="text-xs text-emerald-400 mx-1">|</span>
              <span className="text-xs text-emerald-600 font-semibold">
                {useQRCode ? "QR" : "Barcode"}:
              </span>
              <span className="text-xs font-bold text-emerald-800">
                {safeCodeSize}×{safeCodeSize}cm
              </span>
              <span className="text-xs text-emerald-400 mx-1">|</span>
              <span className="text-xs text-emerald-600 font-semibold">
                Label:
              </span>
              <span className="text-xs font-bold text-emerald-800">
                {safeLabelH}cm
              </span>
            </div>
          </div>

          <div className="flex gap-0 border-b -mx-6 px-6">
            {(["settings", "size", "preview"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === tab
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab === "settings" && "⚙️ Jumlah Cetak"}
                {tab === "size" && "📐 Ukuran Kertas"}
                {tab === "preview" && "👁️ Preview Sticker"}
              </button>
            ))}
          </div>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {activeTab === "settings" && (
            <div className="p-6">
              <table className="w-full text-sm border rounded-lg overflow-hidden">
                <thead className="bg-gray-100 sticky top-0 z-10">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-semibold text-gray-600">
                      Kode Pallet
                    </th>
                    <th className="text-center px-4 py-2.5 font-semibold text-gray-600">
                      Jumlah Cetak
                    </th>
                    <th className="text-center px-4 py-2.5 font-semibold text-gray-600">
                      Subtotal Halaman
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item) => {
                    const copies = getCopies(item.id);
                    const isOverride = perItemCopies[item.id] !== undefined;
                    return (
                      <tr
                        key={item.id}
                        className={
                          isOverride
                            ? "bg-yellow-50"
                            : "bg-white hover:bg-gray-50"
                        }
                      >
                        <td className="px-4 py-2.5 font-mono font-medium text-gray-800">
                          {item.pallet_code}
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setItemCopies(item.id, copies - 1)}
                              className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-sm leading-none"
                            >
                              −
                            </button>
                            <input
                              type="number"
                              min={1}
                              max={99}
                              value={copies}
                              onChange={(e) =>
                                setItemCopies(item.id, Number(e.target.value))
                              }
                              className="w-12 text-center border rounded px-1 py-0.5 text-sm focus:ring-2 focus:ring-blue-400"
                            />
                            <button
                              onClick={() => setItemCopies(item.id, copies + 1)}
                              className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-sm leading-none"
                            >
                              +
                            </button>
                            {isOverride && (
                              <button
                                onClick={() =>
                                  setPerItemCopies((prev) => {
                                    const n = { ...prev };
                                    delete n[item.id];
                                    return n;
                                  })
                                }
                                className="ml-1 text-xs text-red-400 hover:text-red-600 underline"
                              >
                                reset
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <span className="inline-block bg-blue-100 text-blue-700 font-semibold rounded px-2 py-0.5 text-xs">
                            {copies} halaman
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "size" && (
            <div className="p-6 space-y-6">
              {/* Preset buttons */}
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-3">
                  🏷️ Preset Ukuran Stiker Umum
                </p>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map((p) => {
                    const isActive = activePreset === p.label;
                    return (
                      <button
                        key={p.label}
                        onClick={() => {
                          if (p.w !== null) {
                            setStickerW(p.w);
                            setStickerH(p.h!);
                            setCodeSize(p.code!);
                            setLabelH(p.lbl!);
                          }
                          setActivePreset(p.label);
                        }}
                        className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all duration-150 ${
                          isActive
                            ? "bg-blue-600 text-white border-blue-600 shadow-md scale-105"
                            : "bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:text-blue-600"
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Input manual */}
              <div className="grid grid-cols-2 gap-6 p-5 bg-gray-50 rounded-xl border">
                <div className="space-y-5">
                  <p className="text-sm font-bold text-gray-700">
                    📄 Ukuran Kertas Stiker
                  </p>
                  <CmInput
                    label="Lebar Stiker"
                    value={stickerW}
                    onChange={setCustomStickerW}
                    min={3}
                    max={30}
                  />
                  <CmInput
                    label="Tinggi Stiker"
                    value={stickerH}
                    onChange={setCustomStickerH}
                    min={3}
                    max={30}
                  />
                </div>
                <div className="space-y-5">
                  <p className="text-sm font-bold text-gray-700">
                    {useQRCode ? "🔲 Ukuran QR Code" : "📊 Ukuran Barcode"}
                  </p>
                  <CmInput
                    label={useQRCode ? "Ukuran QR (P×L)" : "Lebar Area Barcode"}
                    value={safeCodeSize}
                    onChange={setCustomCodeSize}
                    min={1}
                    max={Math.min(stickerW, stickerH) - 0.5}
                    hint={`maks ${(Math.min(stickerW, stickerH) - 0.5).toFixed(1)}cm`}
                  />
                  <CmInput
                    label="Tinggi Area Label"
                    value={safeLabelH}
                    onChange={setCustomLabelH}
                    min={0.5}
                    max={stickerH - safeCodeSize}
                    hint={`maks ${(stickerH - safeCodeSize).toFixed(1)}cm`}
                  />
                  {!useQRCode && (
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Tinggi Batang Barcode
                      </label>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() =>
                            setBarcodeHeightPx(
                              clamp(barcodeHeightPx - 10, 50, 500),
                            )
                          }
                          className="w-7 h-7 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-base leading-none"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min={50}
                          max={500}
                          step={10}
                          value={barcodeHeightPx}
                          onChange={(e) =>
                            setBarcodeHeightPx(
                              clamp(Number(e.target.value), 50, 500),
                            )
                          }
                          className="w-16 text-center border rounded px-1 py-1 text-sm font-bold focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={() =>
                            setBarcodeHeightPx(
                              clamp(barcodeHeightPx + 10, 50, 500),
                            )
                          }
                          className="w-7 h-7 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-base leading-none"
                        >
                          +
                        </button>
                        <span className="text-xs text-gray-400 ml-1">px</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Visualisasi proporsi */}
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-3">
                  🔍 Proporsi Stiker (skala relatif)
                </p>
                <div className="flex items-start gap-4">
                  <div
                    className="relative bg-white border-2 border-dashed border-gray-400 rounded flex flex-col items-center justify-center"
                    style={{
                      width: `${Math.min(stickerW * 20, 200)}px`,
                      height: `${Math.min(stickerH * 20, 200) * (stickerH / stickerW)}px`,
                    }}
                  >
                    <div
                      className="bg-blue-100 border border-blue-400 rounded flex items-center justify-center"
                      style={{
                        width: `${(safeCodeSize / stickerW) * Math.min(stickerW * 20, 200)}px`,
                        height: `${(safeCodeSize / stickerH) * Math.min(stickerH * 20, 200) * (stickerH / stickerW)}px`,
                      }}
                    >
                      <span className="text-[8px] text-blue-600 font-bold">
                        {useQRCode ? "QR" : "BC"}
                      </span>
                    </div>
                    <div
                      className="bg-gray-200 border border-gray-400 rounded flex items-center justify-center mt-0.5"
                      style={{
                        width: `${Math.min(stickerW * 20, 200) * 0.9}px`,
                        height: `${(safeLabelH / stickerH) * Math.min(stickerH * 20, 200) * (stickerH / stickerW)}px`,
                      }}
                    >
                      <span className="text-[7px] text-gray-500">Label</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 space-y-1 pt-1">
                    <div>
                      📄 Stiker:{" "}
                      <strong>
                        {stickerW} × {stickerH} cm
                      </strong>
                    </div>
                    <div>
                      🔲 {useQRCode ? "QR" : "Barcode"}:{" "}
                      <strong>
                        {safeCodeSize} × {safeCodeSize} cm
                      </strong>
                    </div>
                    <div>
                      🏷️ Label:{" "}
                      <strong>
                        {stickerW} × {safeLabelH} cm
                      </strong>
                    </div>
                    <div>
                      📏 PDF:{" "}
                      <strong>
                        {stickerW * 10} × {stickerH * 10} mm
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "preview" && (
            <div className="p-6 bg-gray-50">
              <div id="print-area" className="flex flex-col items-center gap-6">
                {expandedItems.map((item) => (
                  <div
                    key={item._key}
                    className={`sticker bg-white border shadow-sm ${useQRCode ? "sticker-qr" : "sticker-barcode"}`}
                    style={{
                      width: `${stickerW}cm`,
                      height: `${stickerH}cm`,
                      padding: "5mm",
                      boxSizing: "border-box",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {renderStickerContent(item)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="flex-shrink-0 px-6 py-4 bg-white border-t flex items-center justify-between gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.08)]">
          <span className="text-sm text-gray-400">
            {items.length} pallet ·{" "}
            <strong className="text-gray-700">{totalPages} halaman</strong> ·{" "}
            {stickerW}×{stickerH}cm
          </span>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              disabled={isExporting}
              onClick={handleExportPDF}
              className={`px-5 py-2 rounded-lg text-white font-medium transition-colors ${isExporting ? "bg-emerald-400 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700"}`}
            >
              {isExporting ? "Processing..." : "⬇️ Export PDF"}
            </button>
            <button
              onClick={handlePrint}
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
            >
              🖨️ Print
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintBarcodeModal;
