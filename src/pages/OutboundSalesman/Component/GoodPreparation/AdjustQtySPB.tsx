import React, { useEffect, useMemo, useRef, useState } from "react";
import { FaSave, FaTimes, FaUpload } from "react-icons/fa";
import { showErrorToast, showSuccessToast } from "../../../../components/toast";
import { deleteApprovalFromS3 } from "./deleteApprovalFromS3";
import { uploadApprovalToS3 } from "./uploadApprovalToS3";

export type AdjustQtyItem = {
  id: string;
  name: string;
  sku: string;
  kategori?: string;
  qtySuggestion: number;
  qtyAwal: number;
  adjustment: number;
};

export type AdjustQtyHeader = {
  callplanNumber?: string;
  salesName?: string;
  salesNik?: string;
  spvName?: string;
  spvNik?: string;
  status?: string;
};

type TableColumn = {
  header: string;
  key: string;
  align?: "left" | "center" | "right";
  width?: string;
  className?: string;
  render?: (item: AdjustQtyItem, index: number) => React.ReactNode;
};

type AdjustQtySPBProps = {
  isOpen: boolean;
  header?: AdjustQtyHeader;
  items: AdjustQtyItem[];
  onClose: () => void;
  onSave?: (payload: {
    items: AdjustQtyItem[];
    approvalFile: File | null;
    approvalUrl: string | null;
  }) => boolean | void | Promise<boolean | void>;
};

export default function AdjustQtySPB({
  isOpen,
  header,
  items: sourceItems,
  onClose,
  onSave,
}: AdjustQtySPBProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const approvalUrlRef = useRef<string | null>(null);
  const isSavedRef = useRef(false);
  const [items, setItems] = useState<AdjustQtyItem[]>([]);
  const [approvalFile, setApprovalFile] = useState<File | null>(null);
  const [approvalUrl, setApprovalUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    approvalUrlRef.current = approvalUrl;
  }, [approvalUrl]);

  // Reset hanya saat modal dibuka/ditutup — jangan reset saat parent re-render
  // (mis. isSavingAdjust) supaya form & approval tetap ada jika BE error.
  useEffect(() => {
    if (isOpen) {
      isSavedRef.current = false;
      setItems(
        sourceItems.map((item) => ({
          ...item,
          adjustment: Number(item.adjustment) || 0,
        })),
      );
      setApprovalFile(null);
      setApprovalUrl(null);
      approvalUrlRef.current = null;
      setIsUploading(false);
      setIsClosing(false);
      setIsSaving(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Modal ditutup tanpa simpan → hapus file S3 agar tidak menumpuk
    const pendingUrl = approvalUrlRef.current;
    if (pendingUrl && !isSavedRef.current) {
      deleteApprovalFromS3(pendingUrl).catch((err) => {
        console.error("Gagal hapus file approval S3 saat close:", err);
      });
      approvalUrlRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hanya sync saat isOpen berubah
  }, [isOpen]);

  const clearLocalFileState = () => {
    setApprovalFile(null);
    setApprovalUrl(null);
    approvalUrlRef.current = null;
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAdjustmentChange = (id: string, value: string) => {
    const numValue = value === "" || value === "-" ? 0 : Number(value);
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id
          ? { ...item, adjustment: Number.isNaN(numValue) ? 0 : numValue }
          : item,
      ),
    );
  };

  const handleFileChange = async (file: File | null) => {
    if (!file) return;

    setIsUploading(true);
    try {
      // Ganti file: hapus file lama di S3 dulu, baru upload baru
      const previousUrl = approvalUrlRef.current;
      if (previousUrl) {
        try {
          await deleteApprovalFromS3(previousUrl);
        } catch (err) {
          console.error("Gagal hapus file approval lama di S3:", err);
          showErrorToast("Gagal menghapus file lama di S3 sebelum ganti file");
          return;
        }
        clearLocalFileState();
      }

      const url = await uploadApprovalToS3(file, header?.callplanNumber);
      if (!url) {
        clearLocalFileState();
        return;
      }

      setApprovalFile(file);
      setApprovalUrl(url);
      approvalUrlRef.current = url;
      showSuccessToast("File approval berhasil diunggah ke S3");
    } finally {
      setIsUploading(false);
    }
  };

  const isApprovalReady = Boolean(approvalUrl);

  const handleClose = async () => {
    if (isClosing || isUploading) return;
    setIsClosing(true);
    try {
      const pendingUrl = approvalUrlRef.current;
      if (pendingUrl && !isSavedRef.current) {
        try {
          await deleteApprovalFromS3(pendingUrl);
        } catch (err) {
          console.error("Gagal hapus file approval S3 saat batal:", err);
        }
        clearLocalFileState();
      }
      onClose();
    } finally {
      setIsClosing(false);
    }
  };

  const handleSave = async () => {
    if (!isApprovalReady) {
      showErrorToast("Upload form approval ke S3 dulu sebelum menyimpan");
      return;
    }
    const hasChanges = items.some((item) => item.adjustment !== 0);
    if (!hasChanges) {
      showErrorToast("Tidak ada perubahan qty untuk disimpan");
      return;
    }

    setIsSaving(true);
    try {
      // Hanya tandai saved + biarkan parent tutup modal jika return true (sukses BE)
      const result = await onSave?.({ items, approvalFile, approvalUrl });
      if (result === true) {
        isSavedRef.current = true;
      }
    } catch (err) {
      console.error("Gagal simpan adjustment:", err);
      // Modal tetap terbuka; user tutup sendiri
    } finally {
      setIsSaving(false);
    }
  };

  const tableColumns: TableColumn[] = [
    {
      header: "NO",
      key: "no",
      align: "left",
      width: "w-12",
      render: (_item, index) => index + 1,
    },
    {
      header: "ITEM NAME",
      key: "name",
      align: "left",
      className: "font-bold text-slate-800",
    },
    {
      header: "SKU",
      key: "sku",
      align: "left",
      className: "text-slate-500",
    },
    {
      header: "QTY SUGGESTION",
      key: "qtySuggestion",
      align: "center",
      className: "font-bold text-slate-800",
    },
    {
      header: "QTY FINAL",
      key: "qtyAwal",
      align: "center",
      className: "font-bold text-slate-800",
    },
    {
      header: "ADJUSTMENT (+/-)",
      key: "adjustment",
      align: "center",
      render: (item) => (
        <input
          type="number"
          value={item.adjustment === 0 ? "" : item.adjustment}
          placeholder="0"
          disabled={!isApprovalReady}
          onChange={(e) => handleAdjustmentChange(item.id, e.target.value)}
          className={`w-20 rounded border-2 py-1.5 text-center font-bold outline-none transition-all ${
            isApprovalReady
              ? "border-orange-300 text-slate-800 focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
              : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
          }`}
        />
      ),
    },
    {
      header: "FINAL QTY BKB",
      key: "finalResult",
      align: "center",
      className: "font-bold text-slate-800",
      render: (item) => item.qtyAwal + (item.adjustment || 0),
    },
  ];

  const totalQtySuggestion = useMemo(
    () => items.reduce((acc, item) => acc + (item.qtySuggestion || 0), 0),
    [items],
  );
  const totalQtyAwal = useMemo(
    () => items.reduce((acc, item) => acc + item.qtyAwal, 0),
    [items],
  );
  const totalFinalQty = useMemo(
    () =>
      items.reduce(
        (acc, item) => acc + (item.qtyAwal + (item.adjustment || 0)),
        0,
      ),
    [items],
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[15000] overflow-y-auto bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl space-y-4 py-4 font-sans text-slate-800">
        <div className="flex items-start justify-between rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <p className="mb-1 text-xs font-semibold text-slate-500">
              CALLPLAN NUMBER
            </p>
            <p className="text-xl font-bold text-orange-500">
              {header?.callplanNumber || "-"}
            </p>
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold text-slate-500">
              NAMA SALES
            </p>
            <p className="font-bold text-slate-800">
              {header?.salesName || "-"}
            </p>
            <p className="text-xs text-slate-500">{header?.salesNik || "-"}</p>
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold text-slate-500">SPV</p>
            <p className="font-bold text-slate-800">{header?.spvName || "-"}</p>
            <p className="text-xs text-slate-500">{header?.spvNik || "-"}</p>
          </div>
          <div className="text-right">
            <p className="mb-1 text-xs font-semibold text-slate-500">STATUS</p>
            <span className="inline-block rounded px-4 py-1 text-sm font-bold text-orange-500">
              {header?.status || "FINAL"}
            </span>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isUploading || isClosing}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          >
            <FaTimes />
          </button>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-lg font-bold">
            Upload Form Approval SPV Sales
          </h2>
          <p className="mb-4 text-sm text-slate-500">
            Step 1: Upload form approval dulu. Setelah file ter-upload, kolom
            Adjustment baru bisa diisi. Format: PDF/JPG/PNG, maks 1MB.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
            className="hidden"
            onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
          />

          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-10 transition-colors hover:bg-slate-100 disabled:cursor-wait disabled:opacity-70"
          >
            <FaUpload className="mb-2 size-7 text-orange-500" />
            <p className="font-bold text-orange-500">
              {isUploading
                ? "Mengunggah ke S3..."
                : approvalFile
                  ? approvalFile.name
                  : "Klik untuk pilih file"}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {isApprovalReady
                ? "Upload S3 berhasil — Adjustment sudah bisa diisi"
                : "PDF, JPG, atau PNG — maks. 1MB"}
            </p>
          </button>

          <p className="mt-3 text-sm text-red-500">
            *Upload form approval wajib dilakukan terlebih dahulu sebelum
            melakukan adjustment qty.
          </p>
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-orange-100 bg-orange-50/50 p-4">
            <div>
              <h2 className="font-bold text-slate-800">
                Detail Item & Final Qty
              </h2>
              {!isApprovalReady && (
                <p className="mt-0.5 text-xs font-medium text-orange-600">
                  Upload approval ke S3 dulu untuk mengaktifkan kolom Adjustment
                </p>
              )}
            </div>
            <div className="flex space-x-6 text-sm">
              <p className="text-slate-600">
                Total Qty Suggestion:{" "}
                <span className="font-bold text-slate-800">
                  {totalQtySuggestion}
                </span>
              </p>
              <p className="text-slate-600">
                Total Qty SPB:{" "}
                <span className="font-bold text-orange-500">
                  {totalQtyAwal}
                </span>
              </p>
              <p className="text-slate-600">
                Total Final Qty:{" "}
                <span className="font-bold text-orange-500">
                  {totalFinalQty}
                </span>
              </p>
            </div>
          </div>

          <div className="max-h-[420px] overflow-auto">
            <table className="w-full whitespace-nowrap text-sm">
              <thead className="sticky top-0 border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500">
                <tr>
                  {tableColumns.map((col) => (
                    <th
                      key={col.key}
                      className={`p-4 ${col.align === "center" ? "text-center" : "text-left"} ${col.width || ""}`}
                    >
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={tableColumns.length}
                      className="p-8 text-center italic text-slate-400"
                    >
                      Tidak ada item untuk di-adjust
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      {tableColumns.map((col) => (
                        <td
                          key={`${item.id}-${col.key}`}
                          className={`p-4 ${col.align === "center" ? "text-center" : "text-left"} ${col.className || ""}`}
                        >
                          {col.render
                            ? col.render(item, index)
                            : String(
                                item[col.key as keyof AdjustQtyItem] ?? "",
                              )}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end space-x-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <button
            type="button"
            onClick={handleClose}
            disabled={isUploading || isClosing || isSaving}
            className="rounded border border-slate-300 px-6 py-2 font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isClosing ? "Membersihkan..." : "Batal"}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!isApprovalReady || isUploading || isSaving}
            className="flex items-center space-x-2 rounded bg-orange-500 px-6 py-2 font-semibold text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <FaSave className="size-4" />
            <span>{isSaving ? "Menyimpan..." : "Simpan Perubahan"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
