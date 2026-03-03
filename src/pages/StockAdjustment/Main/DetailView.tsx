import React, { useState } from "react";
import { useStoreStockAdjustment } from "../../../DynamicAPI/stores/Store/MasterStore";
import Select from "../../../components/form/Select";
import ReviewAdjustmentModal from "./ConfirmationModal";
import { showErrorToast } from "../../../components/toast";
import { useStockAdjustmentForm } from "./hooks/useStockAdjustmentForm";
import { useDocumentUpload } from "./hooks/useDocumentUpload";
import { usePalletData } from "./hooks/usePalletData";
import DocumentUploadSection from "./components/DocumentUploadSection";
import PalletItemsTable from "./components/PalletItemsTable";

interface DetailViewProps {
  onBack: () => void;
  mode: "create" | "detail" | "update";
  initialData?: any;
}

interface PalletItem {
  id: string;
  pallet_code: string;
  item_id: string;
  item_name: string;
  uom: string;
  week_number: number;
  current_quantity: number;
  warehouse_sub_id: string;
  warehouse_sub_name: string;
  warehouse_bin_id: string;
  warehouse_bin_name: string;
}

interface ColumnConfig {
  header: string;
  accessor?: keyof PalletItem;
  render?: (item: PalletItem) => React.ReactNode;
}

const DetailView: React.FC<DetailViewProps> = ({
  onBack,
  mode,
  initialData,
}) => {
  const { createData, updateData } = useStoreStockAdjustment();
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewPayload, setReviewPayload] = useState<any>(null);

  const {
    isDetailMode,
    isUpdateMode,
    selectedPallets,
    setSelectedPallets,
    palletItems,
    setPalletItems,
    adjustedQty,
    notes,
    setNotes,
    selectedSubInventory,
    setSelectedSubInventory,
    getItemKey,
    handleQtyChange,
    handleRemoveItem,
    validateSubmission,
    buildUpdatePayload,
  } = useStockAdjustmentForm(mode, initialData);

  const {
    documentUrls,
    isUploading,
    handleFileUpload,
    handleFileDelete,
    cleanupUploadedFiles,
    normalizeDocument,
    hasDocumentChanged,
  } = useDocumentUpload(initialData, mode);

  const { palletOptions } = usePalletData(
    selectedPallets,
    isDetailMode,
    setPalletItems,
    getItemKey,
  );

  const columns: ColumnConfig[] = [
    { header: "Pallet", accessor: "pallet_code" },
    { header: "Zone", accessor: "warehouse_sub_name" },
    { header: "Bin", accessor: "warehouse_bin_name" },
    { header: "SKU", accessor: "item_name" },
    { header: "UOM", accessor: "uom" },
    { header: "Week", accessor: "week_number" },
    { header: "Current Qty", accessor: "current_quantity" },
    {
      header: "Adjust Qty",
      render: (item) => {
        const key = getItemKey(item);
        return (
          <input
            type="number"
            disabled={isDetailMode}
            className={`border p-1 w-24 text-center rounded ${isDetailMode ? "bg-gray-100" : ""}`}
            value={adjustedQty[key] ?? ""}
            onChange={(e) => handleQtyChange(key, e.target.value)}
          />
        );
      },
    },
    {
      header: "Action",
      render: (item) =>
        !isDetailMode && (
          <button
            type="button"
            onClick={() => handleRemoveItem(item)}
            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
          >
            Remove
          </button>
        ),
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const items = validateSubmission();
    if (!items) return;

    setReviewPayload({
      document: documentUrls,
      type: "PHYSICAL_FIT",
      code: initialData?.code || "",
      notes,
      status: "PENDING",
      is_inventory: selectedSubInventory,
      items,
    });
    setReviewOpen(true);
  };

  const handleFinalSubmit = async () => {
    try {
      if (!reviewPayload) return;

      const payloadToSend = {
        ...reviewPayload,
        document: normalizeDocument(reviewPayload.document),
        items: reviewPayload.items.map(
          ({ pallet_code, item_name, current_quantity, ...rest }: any) => rest,
        ),
      };

      if (isUpdateMode) {
        const updatePayload = buildUpdatePayload();

        if (!updatePayload || Object.keys(updatePayload).length === 1) {
          showErrorToast("Tidak ada perubahan data");
          return;
        }

        if (hasDocumentChanged(initialData?.document || "")) {
          updatePayload.document = normalizeDocument(documentUrls);
        }

        const id = initialData?.id;
        if (!id) {
          showErrorToast("ID tidak ditemukan untuk update");
          return;
        }

        await updateData(id, updatePayload);
      } else {
        await createData(payloadToSend);
      }

      handleBack();
    } catch (error) {
      showErrorToast("Gagal submit adjustment");
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      const id = initialData?.id;
      if (!id) return;

      const payload = {
        status: newStatus,
      };

      await updateData(id, payload as any);
      handleBack(); // Kembali ke list setelah sukses
    } catch (error) {
      showErrorToast(`Gagal update status ke ${newStatus}`);
    }
  };

  const handleBack = () => {
    cleanupUploadedFiles();
    onBack();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 text-sm">
      <div className="max-w-7xl mx-auto bg-white p-8 rounded shadow border">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold uppercase">
            {mode} Stock Adjustment {initialData?.code}
          </h2>
          <button
            onClick={handleBack}
            className="bg-gray-200 px-6 py-2 rounded hover:bg-gray-300"
          >
            Back
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-6 mb-10">
            <div className="flex items-center">
              <label className="w-32 font-bold">Sub-Inventory</label>
              <select
                disabled={isDetailMode}
                className="flex-1 border p-2 rounded disabled:bg-gray-100"
                value={selectedSubInventory}
                onChange={(e) => setSelectedSubInventory(e.target.value)}
              >
                <option value="GOOD_STOCK">Good Stock</option>
                <option value="BAD_STOCK">Damaged Stock</option>
              </select>
            </div>
            {!isDetailMode && (
              <div className="flex items-center">
                <label className="w-32 font-bold">Pallet</label>
                <div className="flex-1">
                  <Select
                    options={palletOptions}
                    isMulti
                    placeholder="Pilih Pallet"
                    value={selectedPallets}
                    onChange={(vals: string[]) => setSelectedPallets(vals)}
                  />
                </div>
              </div>
            )}
          </div>

          <PalletItemsTable
            palletItems={palletItems}
            columns={columns}
            getItemKey={getItemKey}
          />

          <div className="flex items-start mb-4">
            <label className="w-32 font-bold pt-2">Keterangan</label>
            <textarea
              disabled={isDetailMode}
              className="flex-1 border p-2 rounded h-16 disabled:bg-gray-100"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <DocumentUploadSection
            documentUrls={documentUrls}
            isDetailMode={isDetailMode}
            isUploading={isUploading}
            onFileUpload={handleFileUpload}
            onFileDelete={handleFileDelete}
          />

          {/* {!isDetailMode && (
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isUploading}
                className={`bg-orange-500 text-white px-6 py-2 rounded hover:bg-orange-600 ${
                  isUploading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {isUpdateMode ? "Update Adjustment" : "Submit Adjustment"}
              </button>
            </div>
          )} */}

          {/* Ganti bagian Render Tombol di bagian bawah form */}
          <div className="flex justify-end gap-3">
            {/* Kondisi 1: Tombol Submit/Update (Hanya jika BUKAN mode detail) */}
            {!isDetailMode && (
              <button
                type="submit"
                disabled={isUploading}
                className={`bg-orange-500 text-white px-6 py-2 rounded hover:bg-orange-600 ${
                  isUploading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {isUpdateMode ? "Update Adjustment" : "Submit Adjustment"}
              </button>
            )}

            {/* Kondisi 2: Approval Manager (Hanya muncul jika status PENDING) */}
            {isDetailMode && initialData?.status === "PENDING" && (
              <button
                type="button"
                onClick={() => handleStatusUpdate("APPROVED_MANAGER")}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-bold"
              >
                Approve as Manager
              </button>
            )}

            {/* Kondisi 3: Approval Head of SCM (Hanya muncul jika status APPROVED_MANAGER) */}
            {isDetailMode && initialData?.status === "APPROVED_MANAGER" && (
              <button
                type="button"
                onClick={() => handleStatusUpdate("APPROVED_HEAD_OF_SCM")}
                className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 font-bold"
              >
                Approve as Head of SCM
              </button>
            )}
          </div>
        </form>
      </div>

      <ReviewAdjustmentModal
        open={reviewOpen}
        payload={reviewPayload}
        onClose={() => setReviewOpen(false)}
        onConfirm={handleFinalSubmit}
      />
    </div>
  );
};

export default DetailView;
