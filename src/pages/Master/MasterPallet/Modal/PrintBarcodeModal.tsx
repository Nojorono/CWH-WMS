// PrintBarcodeModal.tsx
import React, { useState, useEffect } from "react";
import Barcode from "react-barcode";
import { QRCodeSVG } from "qrcode.react"; // ✅ gunakan SVG agar aman di print

type Item = {
  id: string | number;
  pallet_code: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  items: Item[];
  useQRCode?: boolean; // bisa pilih QR atau barcode
  defaultSize?: number; // ukuran default
};

const PrintBarcodeModal: React.FC<Props> = ({
  open,
  onClose,
  items,
  useQRCode = false,
  defaultSize = 200,
}) => {
  const [size, setSize] = useState(defaultSize);

  // 🔄 reset size setiap kali modal dibuka
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
      // clone isi print-area (supaya canvas/SVG ikut)
      const clone = printArea.cloneNode(true) as HTMLElement;

      printWindow.document.title = "Print Barcode";
      printWindow.document.head.innerHTML = `
        <style>
          body { font-family: sans-serif; padding: 20px; }
          .barcode-item { display: inline-block; margin: 10px; text-align: center; }
          img, svg { max-width: 100%; height: auto; }
        </style>
      `;
      printWindow.document.body.innerHTML = "";
      printWindow.document.body.appendChild(clone);

      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  };

  const handleCancel = () => {
    setSize(defaultSize); // reset ke default
    onClose(); // tutup modal
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
      <div className="bg-white p-6 rounded-xl w-[1000px] max-h-[85vh] overflow-y-auto">
        <h2 className="text-lg font-bold mb-4">Preview Barcode</h2>

        {/* Input ukuran */}
        <div className="mb-4 flex items-center gap-3">
          <label className="text-sm font-medium">Ukuran (px):</label>
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
            Minimal 150px, maksimal 400px, default {defaultSize}px
          </span>
        </div>

        {/* Preview area */}
        <div id="print-area" className="grid grid-cols-2 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="barcode-item flex flex-col items-center border p-2 rounded"
            >
              {useQRCode ? (
                <QRCodeSVG
                  value={`Pallet: ${item.pallet_code}, ID: ${item.id}`}
                  width={size}
                  height={size}
                />
              ) : (
                <Barcode
                  value={item.pallet_code}
                  width={2}
                  height={size / 2}
                  displayValue
                />
              )}
              <p className="mt-2 text-sm">{item.pallet_code}</p>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={handleCancel}
            className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
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
