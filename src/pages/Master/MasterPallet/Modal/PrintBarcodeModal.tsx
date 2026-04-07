// PrintBarcodeModal.tsx
import React, { useState, useEffect } from "react";
import Barcode from "react-barcode";
import { QRCodeSVG } from "qrcode.react";

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

/** Label under QR: prefer explicit name, else pallet code */
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

  useEffect(() => {
    if (open) {
      setSize(defaultSize);
    }
  }, [open, defaultSize]);

  if (!open) return null;

  const handlePrint = () => {
    const printArea = document.getElementById("print-area");
    if (!printArea) return;

    const printWindow = window.open("", "", "width=800,height=600");
    if (printWindow) {
      const clone = printArea.cloneNode(true) as HTMLElement;

      printWindow.document.title = useQRCode ? "Print QR Pallet" : "Print Barcode";
      printWindow.document.head.innerHTML = `<meta charset="utf-8"><style>${PRINT_STYLES}</style>`;
      printWindow.document.body.innerHTML = "";
      printWindow.document.body.appendChild(clone);

      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  };

  const handleCancel = () => {
    setSize(defaultSize);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
      <div className="bg-white p-6 rounded-xl w-[1000px] max-h-[85vh] overflow-y-auto">
        <h2 className="text-lg font-bold mb-4">
          {useQRCode ? "Preview QR Pallet (stiker 10×10 cm)" : "Preview Barcode Pallet (stiker 8×10 cm)"}
        </h2>

        {!useQRCode && (
          <div className="mb-4 flex items-center gap-3">
            <label className="text-sm font-medium">Ukuran barcode (px tinggi):</label>
            <input
              type="number"
              min={150}
              max={400}
              value={size}
              onChange={(e) => {
                let val = Number(e.target.value);
                if (val < 150) val = 150;
                if (val > 400) val = 400;
                setSize(val);
              }}
              className="w-24 border rounded px-2 py-1 focus:ring focus:ring-blue-200"
            />
            <span className="text-xs text-gray-500">
              150–400 px, default {defaultSize}px — area cetak 8×10 cm
            </span>
          </div>
        )}

        {useQRCode && (
          <p className="mb-4 text-sm text-gray-600">
            Cetakan: QR <strong>8 cm × 8 cm</strong>, nama pallet di bawah, pada stiker{" "}
            <strong>10 cm × 10 cm</strong>.
          </p>
        )}

        <div id="print-area">
          {items.map((item) =>
            useQRCode ? (
              <div
                key={item.id}
                className="sticker sticker-qr border border-dashed border-gray-300 rounded flex flex-col items-center justify-start"
                style={{
                  width: "10cm",
                  minHeight: "10cm",
                  boxSizing: "border-box",
                  padding: "2mm",
                }}
              >
                <div
                  className="qr-box flex items-center justify-center"
                  style={{ width: "8cm", height: "8cm", flexShrink: 0 }}
                >
                  <QRCodeSVG
                    value={String(item.pallet_code)}
                    width={320}
                    height={320}
                    style={{ width: "8cm", height: "8cm", maxWidth: "8cm", maxHeight: "8cm" }}
                  />
                </div>
                <p
                  style={{
                    marginTop: "3mm",
                    marginBottom: 0,
                    textAlign: "center",
                    fontWeight: 700,
                    fontSize: "11pt",
                    maxWidth: "9.5cm",
                    wordBreak: "break-word",
                  }}
                >
                  {palletLabel(item)}
                </p>
              </div>
            ) : (
              <div
                key={item.id}
                className="sticker sticker-barcode border border-dashed border-gray-300 rounded flex flex-col items-center justify-center gap-2"
                style={{
                  width: "8cm",
                  minHeight: "10cm",
                  boxSizing: "border-box",
                  padding: "3mm",
                }}
              >
                <Barcode
                  value={item.pallet_code.toString()}
                  width={2}
                  height={size / 2}
                  displayValue
                />
                <p className="text-lg font-bold m-0">{item.pallet_code}</p>
              </div>
            )
          )}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            Print
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrintBarcodeModal;
