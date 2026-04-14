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

const PRINT_STYLES = `
  @page { margin: 8mm; }
  body { font-family: system-ui, sans-serif; margin: 0; padding: 0; }
  #print-area { display: flex; flex-direction: column; align-items: flex-start; gap: 12px; }
  .sticker { box-sizing: border-box; page-break-after: always; break-after: page; }
  .sticker:last-child { page-break-after: auto; break-after: auto; }
  .sticker-qr .qr-box svg { display: block; width: 8cm !important; height: 8cm !important; }
  .sticker-barcode img, .sticker-barcode svg { max-width: 100%; height: auto; }
`;

const PrintBarcodeModal: React.FC<Props> = ({
  open,
  onClose,
  items,
  useQRCode = false,
  defaultSize = 200,
}) => {
  const [size, setSize] = useState(defaultSize);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (open) setSize(defaultSize);
  }, [open, defaultSize]);

  if (!open) return null;

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
      const widthMm = useQRCode ? 100 : 80;
      const heightMm = 100;
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

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
      {/* MODAL CONTAINER: flex-col & overflow-hidden agar footer bisa sticky */}
      <div className="bg-white rounded-xl w-full max-w-[1000px] max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* HEADER: Berisi Judul & Input Size */}
        <div className="p-6 border-b bg-white">
          <h2 className="text-lg font-bold">
            {useQRCode ? "Preview QR Pallet" : "Preview Barcode Pallet"}
          </h2>
          {!useQRCode && (
            <div className="mt-3 flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">
                Tinggi Barcode (px):
              </label>
              <input
                type="number"
                min={150}
                max={400}
                value={size}
                onChange={(e) =>
                  setSize(Math.min(Math.max(Number(e.target.value), 150), 400))
                }
                className="w-24 border rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>

        {/* BODY: Area Scroll Barcode */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <div id="print-area" className="flex flex-col items-center gap-6">
            {items.map((item) => (
              <div
                key={item.id}
                className="sticker bg-white border flex flex-col items-center justify-center shadow-sm"
                style={{
                  width: useQRCode ? "10cm" : "8cm",
                  height: "10cm",
                  padding: "5mm",
                  boxSizing: "border-box",
                }}
              >
                {useQRCode ? (
                  <>
                    <div
                      style={{ width: "8cm", height: "8cm" }}
                      className="flex items-center justify-center"
                    >
                      <QRCodeSVG
                        value={item.pallet_code}
                        width="100%"
                        height="100%"
                      />
                    </div>
                    <p
                      className="mt-2 text-center font-bold text-black"
                      style={{ fontSize: "12pt" }}
                    >
                      {palletLabel(item)}
                    </p>
                  </>
                ) : (
                  <>
                    <Barcode
                      value={item.pallet_code}
                      width={2}
                      height={size / 2}
                      displayValue={true}
                    />
                    <p className="mt-2 text-lg font-bold text-black">
                      {item.pallet_code}
                    </p>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* FOOTER: Sticky di bawah */}
        <div className="p-4 bg-white border-t flex justify-end gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors"
          >
            Cancel
          </button>

          <button
            disabled={isExporting}
            onClick={handleExportPDF}
            className={`px-5 py-2 rounded-lg text-white font-medium transition-colors ${
              isExporting
                ? "bg-emerald-400 cursor-not-allowed"
                : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            {isExporting ? "Processing..." : "Export to PDF"}
          </button>

          <button
            onClick={handlePrint}
            className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
          >
            Print
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrintBarcodeModal;
