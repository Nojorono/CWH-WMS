import React, { useState, useEffect, useMemo } from "react";
import { MdAssignment, MdClose } from "react-icons/md";
import { useLocation, useNavigate } from "react-router-dom";
import ActIndicator from "../../../../components/ui/activityIndicator";
import { showErrorToast, showSuccessToast } from "../../../../components/toast";
import PageBreadcrumb from "../../../../components/common/PageBreadCrumb";
import { useGetLocalDoSuggestion } from "../hook/useGetLocalDoSuggestion";
import SalesmanDetailCard from "../component/SalesmanDetailCard";
import SuggestionTable from "../component/SuggestionTable";
import { showConfirmDialog } from "../../../../components/swal-confirm";
import AddItemModal from "../../../Inbound/InboundProcess/TableAndForm/component/Modal/AddItemModal";
import Button from "../../../../components/ui/button/Button";
import { FaPlus, FaSearch, FaUndo } from "react-icons/fa";
import { updateDO } from "../../../../API/store/DOsuggestionServices/postDOsuggestion";

export default function DetailSuggestionSection() {
  const location = useLocation();
  const selectedSales = location.state?.selectedSales;
  const navigate = useNavigate();

  // STATE MANAGEMENT
  const [editingRows, setEditingRows] = useState<string[]>([]);
  const [revisions, setRevisions] = useState<Map<string, number>>(new Map());
  const [localDetails, setLocalDetails] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, isLoading, fetchDOData } = useGetLocalDoSuggestion();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredDetails = useMemo(() => {
    if (!searchQuery.trim()) return localDetails;

    const query = searchQuery.toLowerCase();
    return localDetails.filter((item) =>
      item.item_code?.toLowerCase().includes(query),
    );
  }, [localDetails, searchQuery]);

  // FETCH & SYNC DATA
  useEffect(() => {
    if (data?.details) {
      setLocalDetails(data.details);
    }
  }, [data]);

  useEffect(() => {
    if (selectedSales?.CALL_PLAN_NUMBER) {
      fetchDOData(selectedSales.CALL_PLAN_NUMBER);
    }
  }, [selectedSales?.CALL_PLAN_NUMBER]);

  // INLINE EDIT HANDLERS
  const toggleEditRow = (sku: string) => {
    setEditingRows((prev) =>
      prev.includes(sku) ? prev.filter((id) => id !== sku) : [...prev, sku],
    );
  };

  const cancelEditRow = (sku: string) => {
    setEditingRows((prev) => prev.filter((id) => id !== sku));
    setRevisions((prev) => {
      const newMap = new Map(prev);
      newMap.delete(sku); // Hapus revisi agar kembali ke angka awal
      return newMap;
    });
  };

  const handleRevisionChange = (sku: string, value: string) => {
    const newQty = parseInt(value);
    setRevisions((prev) => {
      const newMap = new Map(prev);
      if (isNaN(newQty) || newQty <= 0) {
        newMap.delete(sku);
      } else {
        newMap.set(sku, newQty);
      }
      return newMap;
    });
  };

  // ADD NEW ITEM HANDLER
  const handleAddNewItem = (itemData: any) => {
    const sku = itemData.sku;
    const qty = itemData.qty;
    const uom = itemData.uom;

    if (localDetails.some((item) => item.item_code === sku)) {
      showErrorToast("SKU ini sudah ada di dalam list!");
      return;
    }

    const newItem = {
      id: `temp-${Date.now()}`,
      item_code: sku,
      item_qty_suggestion: "0",
      item_qty_revision: qty.toString(),
      item_qty_final: qty.toString(),
      item_uom: uom,
    };

    // 3. Update State Tabel & Revisions
    setLocalDetails((prev) => [...prev, newItem]);
    setRevisions((prev) => {
      const newMap = new Map(prev);
      newMap.set(sku, qty);
      return newMap;
    });

    setEditingRows((prev) => [...prev, sku]);

    setIsModalOpen(false);
    showSuccessToast("Item berhasil ditambahkan ke draft.");
  };

  // SUBMIT HANDLER
  const handleSubmit = async (actionType: "revision" | "submit" = "submit") => {
    if (!data) return;

    const hasRevisions = revisions.size > 0;
    const isRevisionAction = actionType === "revision";

    // 1. Dinamiskan status payload
    const basePayload = {
      id: data.id,
      callplan_number: data.callplan_number,
      status: isRevisionAction ? "REVISED" : "SUBMITTED",
    };

    const dialogConfig = isRevisionAction
      ? {
          title: "Simpan Revisi?",
          text: "Perubahan akan disimpan sementara sebagai Revision Data. Anda masih bisa mengubahnya nanti.",
          confirmBtn: "Ya, Simpan",
          successMsg: "Revisi berhasil disimpan.",
        }
      : {
          title: "Konfirmasi Submit",
          text: "Data yang telah disubmit tidak dapat diubah kembali. Apakah Anda yakin ingin melanjutkan?",
          confirmBtn: "Ya, Submit",
          successMsg: "Data berhasil disubmit.",
        };

    showConfirmDialog(
      async () => {
        try {
          let payload;
          // Kirim array lines jika ada revisi, atau jika user secara eksplisit menyimpan revisi
          if (hasRevisions || isRevisionAction) {
            const payloadLines = localDetails.map((item) => {
              const isRevised = revisions.has(item.item_code);
              const revisionQty = revisions.get(item.item_code) || 0;
              const isNewItem = String(item.id).startsWith("temp-");

              return {
                id: isNewItem ? null : item.id,
                item_code: item.item_code,
                item_qty_revision: isRevised
                  ? revisionQty.toString()
                  : item.item_qty_revision,
                item_uom: item.item_uom,
              };
            });
            payload = { ...basePayload, lines: payloadLines };
          } else {
            payload = { ...basePayload, lines: [] };
          }

          await updateDO(payload);
          showSuccessToast(dialogConfig.successMsg);

          setEditingRows([]);
          setRevisions(new Map());
        } catch (err) {
          showErrorToast(
            `Gagal ${isRevisionAction ? "menyimpan revisi" : "submit"}. Periksa kembali koneksi Anda.`,
          );
          console.error(err);
        }
      },
      {
        title: dialogConfig.title,
        text: dialogConfig.text,
        confirmButtonText: dialogConfig.confirmBtn,
        cancelButtonText: "Batal",
      },
    );
  };

  if (isLoading) return <ActIndicator />;

  const isSubmitted = data?.status === "SUBMITTED";

  // RESET HANDLER
  const handleReset = () => {
    showConfirmDialog(
      async () => {
        if (data?.details) {
          setLocalDetails(data.details);
        } else {
          setLocalDetails([]);
        }
        setRevisions(new Map());
        setEditingRows([]);
        showSuccessToast("Semua perubahan berhasil di-reset ke kondisi awal.");
      },
      {
        title: "Konfirmasi Reset",
        text: "Apakah Anda yakin ingin membatalkan semua perubahan dan item baru yang belum di-submit?",
        confirmButtonText: "Ya, Reset",
        cancelButtonText: "Batal",
      },
    );
  };

  return (
    <div className="w-full min-h-screen p-6 bg-[#f8fafc] font-sans">
      <PageBreadcrumb
        breadcrumbs={[
          { title: "Callplan List", path: "/do_suggestion" },
          { title: "DO Suggestion", path: "/do_suggestion/generate_do" },
        ]}
      />

      <SalesmanDetailCard
        salesData={selectedSales}
        status={data?.status}
        onBack={() => navigate(-1)}
      />

      <>
        {/* --- PREMIUM TOOLBAR SECTION --- */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center m-4 px-1 gap-4">
          {/* Kiri: Judul & Subtitle */}
          <div>
            <h2 className="text-lg font-extrabold text-slate-800 uppercase tracking-wide">
              SKU Suggestion List
            </h2>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              Kelola dan revisi kuantitas item sebelum melakukan submit.
            </p>
          </div>

          {/* Kanan: Search Bar & Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            {/* Search Input Box */}
            <div className="relative w-full sm:w-64 group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch
                  className="text-slate-400 group-focus-within:text-blue-500 transition-colors"
                  size={14}
                />
              </div>
              <input
                type="text"
                placeholder="Cari SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-sm text-slate-700 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all shadow-sm"
              />
              {/* Tombol Clear 'X' muncul jika ada teks */}
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-red-500 transition-colors"
                  title="Clear search"
                >
                  <MdClose size={16} />
                </button>
              )}
            </div>

            {/* Garis Pemisah (Hanya tampil di layar besar) */}
            <div className="hidden sm:block h-8 w-px bg-slate-200 mx-1"></div>

            {/* Action Buttons */}
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                onClick={handleReset}
                variant="outline"
                size="sm"
                className="flex-1 sm:flex-none border-slate-300 hover:bg-slate-50 text-slate-700"
                startIcon={<FaUndo />}
              >
                Reset
              </Button>

              {!isSubmitted && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsModalOpen(true)}
                  className="flex-1 sm:flex-none bg-orange-500 hover:bg-orange-600 shadow-sm"
                  startIcon={<FaPlus />}
                >
                  Add Item
                </Button>
              )}
            </div>
          </div>
        </div>
        {/* --- END TOOLBAR --- */}

        {/* TanStack Table Integration */}
        <SuggestionTable
          data={filteredDetails}
          revisions={revisions}
          handleRevisionChange={handleRevisionChange}
          editingRows={editingRows}
          toggleEditRow={toggleEditRow}
          cancelEditRow={cancelEditRow}
        />

        {/* Submit Action */}
        <div className="flex justify-end gap-3 mt-6">
          {!isSubmitted && (
            <>
              {/* Tombol Simpan Sementara (Draf/Revised) */}
              <Button
                variant="outline" // Bedakan gaya tombol agar UX lebih jelas
                onClick={() => handleSubmit("revision")} // <-- Perbaikan Parameter
                startIcon={<MdAssignment />}
                className="border-orange-500 text-orange-600 hover:bg-orange-50"
              >
                Save Revision
              </Button>

              {/* Tombol Simpan Permanen (Submitted) */}
              <Button
                variant="primary" // Gaya tombol utama
                onClick={() => handleSubmit("submit")} // <-- Parameter Submit
                startIcon={<MdAssignment />}
                className="bg-green-600 hover:bg-green-700 text-white shadow-md"
              >
                Final Submit
              </Button>
            </>
          )}
        </div>

        {/* Modal Add Item */}
        <AddItemModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleAddNewItem}
          isDOsuggestion={true}
        />
      </>
    </div>
  );
}
