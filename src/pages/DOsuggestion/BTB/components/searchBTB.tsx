import React, { useEffect, useMemo, useRef, useState } from "react";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.min.css";
import Swal from "sweetalert2";
import { FaCheck } from "react-icons/fa";
import Button from "../../../../components/ui/button/Button";
import { showErrorToast, showSuccessToast } from "../../../../components/toast";
import { showConfirmDialog } from "../../../../components/swal-confirm";
import { usePersistAuthStore } from "../../../../API/store/AuthStore/PersistAuthStore";
import { createBTB } from "../services/BTBservice";
import { applyBTB, searchBTB } from "../services/searchBTB";
import { BTBSearchResult, CreateBTBPayload } from "../services/types";
import {
  BTB_SEARCH_DETAIL_COLUMNS,
  getAlignClass,
  getVisibleColumns,
} from "./btbSearchDetailTableConfig";

const BtbSearch = () => {
  const user = usePersistAuthStore((state) => state.user);
  const loginOrgCode = (user?.userDetail?.organization?.organization_name || "")
    .trim()
    .toUpperCase();
  const organizationId =
    user?.userDetail?.organizationId ||
    user?.userDetail?.organization?.id ||
    "";
  const actorNik =
    user?.username || user?.userDetail?.employee_id || "";

  const [salesNik, setSalesNik] = useState("");
  const [callPlanNumber, setCallPlanNumber] = useState("");
  const [callPlanStartDate, setCallPlanStartDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [btbDetail, setBtbDetail] = useState<BTBSearchResult | null>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const flatpickrRef = useRef<flatpickr.Instance | null>(null);

  useEffect(() => {
    if (!dateInputRef.current) return;

    const fp = flatpickr(dateInputRef.current, {
      enableTime: false,
      dateFormat: "Y-m-d",
      allowInput: false,
      clickOpens: true,
      disableMobile: true,
      defaultDate: callPlanStartDate || undefined,
      onChange: (_dates, dateStr) => {
        setCallPlanStartDate(dateStr || "");
      },
    });

    flatpickrRef.current = fp;

    return () => {
      fp.destroy();
      flatpickrRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = async () => {
    if (!salesNik.trim()) {
      showErrorToast("Harap masukkan Sales NIK!");
      return;
    }
    if (!callPlanNumber.trim()) {
      showErrorToast("Harap masukkan Callplan Number!");
      return;
    }
    if (!callPlanStartDate.trim()) {
      showErrorToast("Harap masukkan Callplan Start Date!");
      return;
    }

    setIsLoading(true);
    try {
      const result = await searchBTB({
        sales_nik: salesNik.trim(),
        call_plan_number: callPlanNumber.trim(),
        call_plan_start_date: callPlanStartDate.trim(),
      });

      if (!result) {
        setBtbDetail(null);
        showErrorToast("BTB tidak ditemukan");
        return;
      }

      const resultOrgCode = (result.organization_code || "")
        .trim()
        .toUpperCase();
      if (loginOrgCode && resultOrgCode && resultOrgCode !== loginOrgCode) {
        setBtbDetail(null);
        await Swal.fire({
          icon: "warning",
          title: "Cabang Tidak Sesuai",
          text: `Data yang dicari bukan dari cabang anda (data dari: ${result.organization_code}, cabang anda: ${loginOrgCode}).`,
          confirmButtonText: "Mengerti",
          confirmButtonColor: "#F97316",
          didOpen: () => {
            const container = Swal.getContainer();
            if (container) container.style.zIndex = "100000";
          },
        });
        return;
      }

      setBtbDetail(result);
    } catch (error: unknown) {
      setBtbDetail(null);
      const message =
        error instanceof Error ? error.message : "Gagal mencari BTB";
      showErrorToast(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSalesNik("");
    setCallPlanNumber("");
    setCallPlanStartDate("");
    setBtbDetail(null);
    flatpickrRef.current?.clear();
  };

  const showResult = Boolean(btbDetail);
  const items = btbDetail?.btb_details ?? [];
  const skuCount = items.length;
  const detailColumns = useMemo(
    () => getVisibleColumns(BTB_SEARCH_DETAIL_COLUMNS),
    [],
  );
  const detailColSpan = detailColumns.length;

  const totalQty = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.btb_qty || 0), 0),
    [items],
  );
  const totalUom = items[0]?.btb_uom || "BKS";

  const buildCreatePayload = (data: BTBSearchResult): CreateBTBPayload => ({
    btb_number: data.btb_number,
    btb_date: data.btb_date,
    organization_code: data.organization_code,
    organization_id: organizationId,
    sales_nik: data.sales_nik,
    sales_name: data.sales_name,
    sales_spv_nik: data.sales_spv_nik,
    sales_spv_name: data.sales_spv_name,
    status: "APPLIED",
    created_by: actorNik,
    updated_by: actorNik,
    details: (data.btb_details ?? []).map((item) => ({
      id: item.id,
      item_code: item.item_code,
      inventory_item_id: item.inventory_item_id,
      item_name: item.item_name,
      btb_qty: item.btb_qty,
      btb_uom: item.btb_uom,
      created_by: actorNik,
      updated_by: actorNik,
    })),
  });

  const handleApplyBTB = () => {
    if (!btbDetail) {
      showErrorToast("Tidak ada data BTB untuk dikonfirmasi");
      return;
    }
    if (isConfirming) return;

    showConfirmDialog(
      async () => {
        setIsConfirming(true);
        try {
          const result = await createBTB(buildCreatePayload(btbDetail));

          if (!result.success) {
            showErrorToast(result.message);
            return;
          }

          await applyBTB(btbDetail.btb_number);

          showSuccessToast(
            result.message || "BTB berhasil disimpan sebagai APPLIED",
          );
          setBtbDetail(null);
        } catch (error: unknown) {
          const message =
            error instanceof Error ? error.message : "Gagal menyimpan BTB";
          showErrorToast(message);
        } finally {
          setIsConfirming(false);
        }
      },
      {
        title: "Konfirmasi APPLIED?",
        text: "Data BTB akan disimpan dengan status APPLIED. Lanjutkan?",
        icon: "question",
        confirmButtonText: "Ya, Simpan",
        cancelButtonText: "Batal",
        confirmButtonColor: "#F97316",
      },
    );
  };

  const handleCancelBTB = async () => {
    await Swal.fire({
      icon: "info",
      title: "Perbaiki Data BTB",
      text: "Perbaiki data BTB melalui DMS",
      confirmButtonText: "Mengerti",
      confirmButtonColor: "#F97316",
      didOpen: () => {
        const container = Swal.getContainer();
        if (container) container.style.zIndex = "100000";
      },
    });
  };

  return (
    <div className="p-4 md:p-8 text-slate-800 bg-slate-50 min-h-screen font-sans">
      <div className=" mx-auto space-y-6">
        {/* KOTAK PENCARIAN */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2">
                Sales NIK *
              </label>
              <input
                type="text"
                value={salesNik}
                onChange={(e) => setSalesNik(e.target.value)}
                placeholder="Contoh: 230102.0016021"
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-sm"
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2">
                Callplan Number *
              </label>
              <input
                type="text"
                value={callPlanNumber}
                onChange={(e) => setCallPlanNumber(e.target.value)}
                placeholder="Contoh: JAB/CP/2026/08/09002"
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-sm"
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2">
                Callplan Start Date *
              </label>
              <input
                ref={dateInputRef}
                type="text"
                readOnly
                defaultValue={callPlanStartDate}
                placeholder="YYYY-MM-DD"
                className="w-full cursor-pointer border border-slate-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-sm bg-white"
                onFocus={() => flatpickrRef.current?.open()}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
            <button
              type="button"
              onClick={handleReset}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-lg border border-slate-300 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleSearch}
              disabled={isLoading}
              className={`bg-[#F97316] hover:bg-orange-600 text-white font-semibold py-2.5 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                isLoading ? "opacity-80 cursor-not-allowed" : ""
              }`}
            >
              {isLoading ? (
                <span>Mencari...</span>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <span>Cari BTB</span>
                </>
              )}
            </button>
          </div>

          <p className="text-xs text-slate-400">
            Ketiga parameter wajib diisi untuk mencari BTB berdasarkan Sales
            NIK, Callplan Number, dan tanggal mulai callplan.
          </p>
        </div>

        {/* EMPTY STATE */}
        {!showResult && (
          <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-16 flex flex-col items-center justify-center text-center">
            <div className="bg-slate-50 p-4 rounded-full mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
            <h3 className="text-slate-600 font-bold text-lg mb-1">
              Belum ada data ditampilkan
            </h3>
            <p className="text-sm text-slate-400">
              Isi Sales NIK, Callplan Number, dan Start Date, lalu klik 'Cari
              BTB'.
            </p>
          </div>
        )}

        {/* HASIL PENCARIAN */}
        {showResult && btbDetail && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm relative">
              <div className="bg-[#FFF7ED] rounded-lg p-4 flex justify-between items-start mb-6">
                <div>
                  <p className="text-xs font-bold text-[#F97316] uppercase tracking-wider mb-1">
                    Detail BTB
                  </p>
                  <h2 className="text-[#F97316] font-bold text-xl">
                    {btbDetail.btb_number}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setBtbDetail(null)}
                  className="text-[#F97316] hover:text-orange-700"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-2 gap-y-6 gap-x-4 mb-6">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Callplan Number
                  </p>
                  <p className="font-bold text-slate-700">
                    {btbDetail.call_plan_number}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Sales Name
                  </p>
                  <p className="font-bold text-slate-700 uppercase">
                    {btbDetail.sales_name}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Tanggal BTB
                  </p>
                  <p className="font-bold text-slate-700">
                    {btbDetail.btb_date}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Total Qty
                  </p>
                  <p className="font-bold text-slate-700">
                    {totalQty.toLocaleString("id-ID")} {totalUom}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Sales NIK
                  </p>
                  <p className="font-bold text-slate-700">
                    {btbDetail.sales_nik}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    SPV
                  </p>
                  <p className="font-bold text-slate-700 uppercase">
                    {btbDetail.sales_spv_name} ({btbDetail.sales_spv_nik})
                  </p>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden mb-6">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                  <h3 className="font-bold text-slate-700 text-sm">
                    Detail Item ({skuCount} SKU)
                  </h3>
                </div>
                <div className="max-h-72 overflow-y-auto overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="text-slate-500 border-b border-slate-200 bg-white sticky top-0 z-10 shadow-sm">
                      <tr>
                        {detailColumns.map((col) => (
                          <th
                            key={col.id}
                            className={`px-4 py-3 font-semibold bg-white ${getAlignClass(col.align)} ${col.widthClassName || ""} ${col.headerClassName || ""}`}
                          >
                            {col.header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="text-slate-700 bg-white">
                      {items.length === 0 ? (
                        <tr>
                          <td
                            colSpan={detailColSpan}
                            className="px-4 py-8 text-center text-slate-400 italic"
                          >
                            Tidak ada item
                          </td>
                        </tr>
                      ) : (
                        items.map((item, index) => (
                          <tr
                            key={`${item.item_code}-${item.inventory_item_id}-${index}`}
                            className={
                              index < items.length - 1
                                ? "border-b border-slate-100"
                                : ""
                            }
                          >
                            {detailColumns.map((col) => (
                              <td
                                key={col.id}
                                className={`px-4 py-3 ${getAlignClass(col.align)} ${col.cellClassName || ""}`}
                              >
                                {col.getValue
                                  ? col.getValue(item, index)
                                  : "-"}
                              </td>
                            ))}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="border border-[#F97316] rounded-lg p-5 bg-white">
                <h3 className="font-bold text-slate-700 mb-4 text-center sm:text-left">
                  Apakah data BTB ini sudah sesuai dengan fisik barang?
                </h3>
                <div className="flex flex-wrap justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="xsm"
                    disabled={isConfirming}
                    onClick={handleCancelBTB}
                  >
                    Batal
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="xsm"
                    disabled={isConfirming}
                    onClick={handleApplyBTB}
                    startIcon={<FaCheck />}
                  >
                    {isConfirming ? "Menyimpan..." : "APPLIED"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BtbSearch;
