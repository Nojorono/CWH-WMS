import React, { useEffect, useMemo, useState } from "react";
import {
  useStorePallet,
  useStoreStockAdjustment,
} from "../../../DynamicAPI/stores/Store/MasterStore";
import Select from "../../../components/form/Select";
import axiosInstance from "../../../DynamicAPI/AxiosInstance";
import { EndPoint } from "../../../utils/EndPoint";
import ReviewAdjustmentModal from "./ConfirmationModal";
import { showErrorToast } from "../../../components/toast";
import { uploadFileToS3 } from "../Helper/uploadFileToS3";
import { deleteFileFromS3 } from "../Helper/deleteFileFromS3";
import {
  FaFileAlt,
  FaTrash,
  FaCloudUploadAlt,
  FaExternalLinkAlt,
} from "react-icons/fa";

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
  const isDetailMode = mode === "detail";
  const isUpdateMode = mode === "update";

  const { fetchAll, list } = useStorePallet();
  const { createData, updateData } = useStoreStockAdjustment();
  const [originalData, setOriginalData] = useState<any>(null);

  const [selectedPallets, setSelectedPallets] = useState<string[]>([]);
  const [palletItems, setPalletItems] = useState<PalletItem[]>([]);
  const [adjustedQty, setAdjustedQty] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [selectedSubInventory, setSelectedSubInventory] =
    useState("GOOD_STOCK");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewPayload, setReviewPayload] = useState<any>(null);

  // S3 States
  // Multiple document URLs for create mode
  const [documentUrls, setDocumentUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedThisSession, setUploadedThisSession] = useState<string[]>([]);

  // =============================
  // EFFECT: INITIAL DATA LOADING
  // =============================

  useEffect(() => {
    if (isUpdateMode && initialData) {
      setOriginalData(initialData);
    }
  }, [isUpdateMode, initialData]);

  useEffect(() => {
    if ((isDetailMode || isUpdateMode) && initialData) {
      setNotes(initialData.notes || "");
      setSelectedSubInventory(initialData.is_inventory || "GOOD_STOCK");
      // Parse document string (comma-separated) into array for detail/update mode
      let docArr: string[] = [];
      if (
        typeof initialData.document === "string" &&
        initialData.document.trim() !== ""
      ) {
        docArr = initialData.document
          .split(",")
          .map((v: string) => v.trim())
          .filter(Boolean);
      } else if (Array.isArray(initialData.document)) {
        docArr = initialData.document;
      }
      setDocumentUrls(docArr);

      // Ambil pallet_code dari adjustmentStockItems
      const palletCodes =
        initialData.adjustmentStockItems
          ?.map((item: any) => item.pallet?.pallet_code)
          ?.filter(Boolean) || [];
      setSelectedPallets(palletCodes);

      const mappedItems =
        initialData.adjustmentStockItems?.map((item: any) => ({
          id: item.pallet_id,
          pallet_code: item.pallet?.pallet_code || "-",
          item_id: item.item_id,
          item_name: item.item?.sku || item.item?.sku || "-",
          uom: item.uom,
          week_number: item.pallet?.currentWeekNumber || 0,
          current_quantity: item.pallet?.currentQuantity || 0,
          warehouse_sub_id: item.warehouse_sub_id,
          warehouse_sub_name: item.warehouseSub?.name || "-",
          warehouse_bin_id: item.warehouse_bin_id,
          warehouse_bin_name: item.warehouseBin?.name || "-",
        })) || [];

      setPalletItems(mappedItems);

      const qtyMap: Record<string, string> = {};
      initialData.adjustmentStockItems?.forEach((item: any) => {
        const key = `${item.pallet?.pallet_code}-${item.item_id}-${item.uom}`;
        qtyMap[key] = item.quantity.toString();
      });
      setAdjustedQty(qtyMap);
    }
  }, [initialData, isDetailMode, isUpdateMode]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // FETCH MULTI PALLET SKU
  useEffect(() => {
    // Jika detail mode atau tidak ada pallet yang dipilih, jangan jalankan logic fetch
    if (isDetailMode || selectedPallets.length === 0) return;

    const fetchData = async () => {
      try {
        const responses = await Promise.all(
          selectedPallets.map(async (code) => {
            const res = await axiosInstance.get(
              `${EndPoint}master-pallet/by-code/${code}/current`,
            );
            return res.data.data.map((item: any) => ({
              ...item,
              pallet_code: code,
            }));
          }),
        );

        const newItems = responses
          .flat()
          .filter((it: any) => Number(it.current_quantity) > 0);

        setPalletItems((prevItems) => {
          // Buat Map dari item yang sudah ada untuk pengecekan duplikasi yang cepat
          // Key menggunakan getItemKey logic: pallet_code-item_id-uom
          const existingKeys = new Set(
            prevItems.map((item) => getItemKey(item)),
          );

          // Filter hanya item baru yang belum ada di state current
          const filteredNewItems = newItems.filter(
            (newItem) => !existingKeys.has(getItemKey(newItem)),
          );

          // Gabungkan data lama dengan data baru yang unik
          return [...prevItems, ...filteredNewItems];
        });
      } catch (error) {
        console.error("Gagal mengambil data pallet:", error);
      }
    };

    fetchData();
  }, [selectedPallets, isDetailMode]);

  // =============================
  // S3 HANDLERS
  // =============================

  // Multiple file upload handler for create mode
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const url = await uploadFileToS3(files[i]);
        if (url) uploadedUrls.push(url);
      }
      setDocumentUrls((prev) => [...prev, ...uploadedUrls]);
      setUploadedThisSession((prev) => [...prev, ...uploadedUrls]);
    } catch (error) {
      showErrorToast("Gagal memproses file");
    } finally {
      setIsUploading(false);
      e.target.value = ""; // Clear input
    }
  };

  // Delete a specific file (for create mode)
  const handleFileDelete = async (urlToDelete: string) => {
    if (!urlToDelete) return;
    if (!window.confirm("Hapus file ini?")) return;
    try {
      await deleteFileFromS3(urlToDelete);
      setDocumentUrls((prev) => prev.filter((url) => url !== urlToDelete));
      setUploadedThisSession((prev) =>
        prev.filter((url) => url !== urlToDelete),
      );
    } catch (error) {
      showErrorToast("Gagal menghapus file");
    }
  };

  const palletOptions = useMemo(() => {
    if (!Array.isArray(list)) return [];
    return list
      .slice()
      .sort((a: any, b: any) =>
        String(a.pallet_code).localeCompare(String(b.pallet_code), undefined, {
          numeric: true,
        }),
      )
      .map((p: any) => ({
        label: p.pallet_code,
        value: p.pallet_code,
      }));
  }, [list]);

  const getItemKey = (item: PalletItem) =>
    `${item.pallet_code}-${item.item_id}-${item.uom}`;

  const handleQtyChange = (key: string, value: string) => {
    setAdjustedQty((prev) => ({
      ...prev,
      [key]: value.replace(/^0+/, "") || "",
    }));
  };

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
    const items = palletItems
      .filter((item) => adjustedQty[getItemKey(item)])
      .map((item) => ({
        warehouse_sub_id: item.warehouse_sub_id,
        warehouse_bin_id: item.warehouse_bin_id,
        pallet_id: item.id,
        pallet_code: item.pallet_code,
        item_name: item.item_name,
        item_id: item.item_id,
        current_quantity: item.current_quantity,
        quantity: Number(adjustedQty[getItemKey(item)]) || 0,
        uom: item.uom,
      }));

    if (items.length === 0) {
      showErrorToast("Tidak ada qty yang di-adjust!");
      return;
    }

    // Validation: Adjusted qty must be different from current qty
    const invalidItem = items.find(
      (item) => Number(item.quantity) === Number(item.current_quantity),
    );
    if (invalidItem) {
      showErrorToast(
        `Qty adjustment untuk pallet ${invalidItem.pallet_code} SKU ${invalidItem.item_name} harus berbeda dari current qty!`,
      );
      return;
    }

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

  const buildUpdatePayload = () => {
    if (!originalData) return null;

    const updatedFields: any = {};

    // 🔹 NOTES
    if (notes !== originalData.notes) {
      updatedFields.notes = notes;
    }

    // 🔹 SUB INVENTORY
    if (selectedSubInventory !== originalData.is_inventory) {
      updatedFields.is_inventory = selectedSubInventory;
    }

    // 🔹 DOCUMENT
    const normalizedCurrentDoc = documentUrls.join(", ");
    const normalizedOriginalDoc = (originalData.document || "")
      .split(",")
      .map((v: string) => v.trim())
      .filter(Boolean)
      .join(", ");

    if (normalizedCurrentDoc !== normalizedOriginalDoc) {
      updatedFields.document = normalizedCurrentDoc;
    }

    // 🔹 ITEMS (lebih kompleks)
    // hanya kirim jika qty berubah
    const changedItems = [];

    for (const item of palletItems) {
      const key = getItemKey(item);
      const newQty = Number(adjustedQty[key]);

      const originalItem = originalData.adjustmentStockItems?.find(
        (i: any) =>
          i.pallet_id === item.id &&
          i.item_id === item.item_id &&
          i.uom === item.uom,
      );

      if (!originalItem) continue;

      if (Number(originalItem.quantity) !== newQty) {
        changedItems.push({
          pallet_id: item.id,
          item_id: item.item_id,
          quantity: newQty,
          uom: item.uom,
        });
      }
    }

    if (changedItems.length > 0) {
      updatedFields.items = changedItems;
    }

    return updatedFields;
  };

  const handleFinalSubmit = async () => {
    try {
      if (!reviewPayload) return;

      const normalizeDocument = (doc: unknown): string => {
        if (Array.isArray(doc)) {
          return doc
            .map((v) => String(v).trim())
            .filter(Boolean)
            .join(", ");
        }

        if (typeof doc === "string") {
          const raw = doc.trim();

          // Handle format: "{doc1, doc2, doc3}"
          if (raw.startsWith("{") && raw.endsWith("}")) {
            return raw
              .slice(1, -1)
              .split(",")
              .map((v) => v.trim().replace(/^"|"$/g, ""))
              .filter(Boolean)
              .join(", ");
          }

          return raw;
        }

        return "";
      };

      const payloadToSend = {
        ...reviewPayload,
        document: normalizeDocument(reviewPayload.document), // "doc1, doc2, doc3"
        items: reviewPayload.items.map(
          ({ pallet_code, item_name, current_quantity, ...rest }: any) => rest,
        ),
      };
      console.log("payloadToSend", payloadToSend);

      if (isUpdateMode) {
        const updatePayload = buildUpdatePayload();

        if (!updatePayload || Object.keys(updatePayload).length === 1) {
          showErrorToast("Tidak ada perubahan data");
          return;
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

      setUploadedThisSession([]);
      handleBack();
    } catch (error) {
      showErrorToast("Gagal submit adjustment");
    }
  };

  const handleRemoveItem = (item: PalletItem) => {
    setPalletItems((prev) =>
      prev.filter(
        (i) =>
          !(
            i.pallet_code === item.pallet_code &&
            i.item_id === item.item_id &&
            i.uom === item.uom
          ),
      ),
    );
  };

  const handleBack = () => {
    // Hapus file S3 yang diupload di sesi ini
    uploadedThisSession.forEach(async (url) => {
      try {
        await deleteFileFromS3(url);
      } catch {}
    });
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

          <table className="w-full border-collapse mb-10">
            <thead>
              <tr className="bg-orange-500 text-white">
                {columns.map((col, idx) => (
                  <th key={idx} className="p-2 text-center">
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {palletItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="text-center py-6 text-gray-400"
                  >
                    Tidak ada data
                  </td>
                </tr>
              ) : (
                palletItems.map((item) => (
                  <tr key={getItemKey(item)} className="border-b">
                    {columns.map((col, idx) => (
                      <td key={idx} className="p-3 text-center">
                        {col.render
                          ? col.render(item)
                          : col.accessor
                            ? (item[col.accessor] as any)
                            : null}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="flex items-start mb-4">
            <label className="w-32 font-bold pt-2">Keterangan</label>
            <textarea
              disabled={isDetailMode}
              className="flex-1 border p-2 rounded h-16 disabled:bg-gray-100"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* DOCUMENT UPLOAD SECTION */}
          <div className="flex items-start mb-6">
            <label className="w-32 font-bold pt-2">Dokumen</label>
            <div className="flex-1">
              {/* LIST DOCUMENT */}
              {documentUrls.length === 0 && isDetailMode && (
                <span className="text-gray-400 italic pt-2 block">
                  Tidak ada dokumen dilampirkan
                </span>
              )}

              {/* UPLOAD BUTTON (CREATE + UPDATE ONLY) */}
              {!isDetailMode && (
                <div className="relative mb-2">
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                    multiple
                    disabled={isUploading}
                  />
                  <label
                    htmlFor="file-upload"
                    className={`flex items-center justify-center gap-2 w-max px-4 py-2 border-2 border-dashed rounded-md cursor-pointer hover:bg-gray-50 transition-colors ${
                      isUploading
                        ? "opacity-50"
                        : "border-gray-300 text-gray-600"
                    }`}
                  >
                    <FaCloudUploadAlt className="text-xl" />
                    {isUploading
                      ? "Uploading..."
                      : "Click to upload document (Max 2MB)"}
                  </label>
                </div>
              )}

              {documentUrls.length > 0 && (
                <div className="flex flex-col gap-2 mb-3">
                  {documentUrls.map((url, idx) => (
                    <div
                      key={url}
                      className="flex items-center gap-4 p-3 bg-blue-50 border border-blue-200 rounded-md w-max"
                    >
                      <FaFileAlt className="text-blue-500 text-lg" />

                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-700 font-medium hover:underline flex items-center gap-1"
                      >
                        Document {idx + 1}
                        <FaExternalLinkAlt className="text-[10px]" />
                      </a>

                      {!isDetailMode && (
                        <button
                          type="button"
                          onClick={() => handleFileDelete(url)}
                          className="ml-2 text-red-500 hover:text-red-700 transition-colors"
                          title="Hapus file"
                        >
                          <FaTrash />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {!isDetailMode && (
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
          )}
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
