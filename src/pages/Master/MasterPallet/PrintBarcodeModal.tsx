// PrintBarcodeModal.tsx
import React, { useState, useEffect } from "react";
import Barcode from "react-barcode";
import { QRCodeCanvas } from "qrcode.react";

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
    const printContent = document.getElementById("print-area")?.innerHTML;
    const printWindow = window.open("", "", "width=800,height=600");
    if (printWindow && printContent) {
      printWindow.document.write(`
        <html>
          <head><title>Print Barcode</title></head>
          <body>${printContent}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
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
            min={50}
            max={400}
            value={size}
            onChange={(e) => {
              let val = Number(e.target.value);
              if (val < 50) val = 50;
              if (val > 400) val = 400;
              setSize(val);
            }}
            className="w-24 border rounded px-2 py-1 focus:ring focus:ring-blue-200"
          />
          <span className="text-xs text-gray-500">
            Minimal 50px, maksimal 400px, default {defaultSize}px
          </span>
        </div>

        {/* Preview area */}
        <div id="print-area" className="grid grid-cols-2 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col items-center border p-2 rounded"
            >
              {useQRCode ? (
                <QRCodeCanvas
                  value={`Pallet: ${item.pallet_code}, ID: ${item.id}`}
                  size={size}
                />
              ) : (
                <Barcode value={item.pallet_code} width={2} height={size / 2} />
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
