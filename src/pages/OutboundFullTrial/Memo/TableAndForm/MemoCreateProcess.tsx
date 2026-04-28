"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Button from "../../../../components/ui/button/Button";
import PageBreadcrumb from "../../../../components/common/PageBreadCrumb";
import ModalAddItem from "../Modal/ModalAddItem";
import DynamicForm, {
  FieldConfig,
} from "../../../../components/wms-components/inbound-component/form/DynamicForm";
import { showErrorToast, showSuccessToast } from "../../../../components/toast";
import {
  useStoreItem,
  useStoreOutboundMemo,
  useStoreUom,
} from "../../../../DynamicAPI/stores/Store/MasterStore";
import { useLocation, useNavigate } from "react-router";
import { EndPoint } from "../../../../utils/EndPoint";
import { useCustomerByOutboundType } from "./FetchCustomer";
import Select from "../../../../components/form/Select";
import { FaArrowLeft, FaCheck, FaSearch, FaUndo } from "react-icons/fa";
import { formatDateIndo } from "../../../../helper/FormatDate";
import { showConfirmDialog } from "../../../../components/swal-confirm";
import TableComponent from "../../../../components/tables/ActionTable/TableComponent";
import { SOsearchService } from "../../../../DynamicAPI/services/Service/SOsearchService";

// ✅ Tambahkan selected_destination
type MemoFormValues = {
  requestor: string;
  origin: string;
  ship_to: string;
  destination: string;
  delivery_date: string;
  notes: string;
  address?: string;

  type_outbound?: {
    label: string;
    value: string;
  } | null;

  selected_destination?: {
    label: string;
    value: string;
  } | null;
};

type ItemRow = {
  item_id: string;
  item_name: string;
  classification_name?: string;
  quantity_plan: number;
  uom?: string;
  uom_name?: string;
  notes?: string;
  address?: string;
};

const LoadingIndicator = () => (
  <div className="flex justify-center items-center min-h-[300px]">
    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-orange-500 border-solid"></div>
  </div>
);

const CreateMemo: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: memoId, mode, title } = location.state || {};
  const isDetail = mode === "detail";
  const isEdit = mode === "edit";
  const userID = localStorage.getItem("user_id");
  const orgId = localStorage.getItem("organization_id");

  const [isLoading, setIsLoading] = useState(false);

  // store
  const { fetchAll: fetchAllUom, list: uomList } = useStoreUom();
  const { fetchAll: fetchAllItems, list: masterItemList } = useStoreItem();
  const {
    createData,
    fetchById,
    detail: detailDataMemo,
    resetDetail,
    updateData,
  } = useStoreOutboundMemo();

  useEffect(() => {
    fetchAllUom();
    fetchAllItems();
  }, [fetchAllUom, fetchAllItems]);

  const methods = useForm<MemoFormValues>({
    defaultValues: {
      requestor: "",
      origin: "",
      ship_to: "",
      destination: "",
      delivery_date: "",
      notes: "",
      selected_destination: null,
    },
  });

  const [items, setItems] = useState<ItemRow[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [soSearchNumber, setSoSearchNumber] = useState("");
  const [isLoadingSO, setIsLoadingSO] = useState(false);

  // ✅ Watch type_outbound
  const typeOutbound = methods.watch("type_outbound");

  // ✅ Fetch customer berdasarkan type_outbound
  const {
    customerList,
    customerRaw,
    loading: loadingCustomer,
  } = useCustomerByOutboundType(typeOutbound, methods);

  // ✅ Watch selected_destination
  const selectedCustomer = methods.watch("selected_destination");

  // ✅ Auto set ship_to setelah pilih customer
  useEffect(() => {
    if (!selectedCustomer || !typeOutbound || customerRaw.length === 0) return;

    const found = customerRaw.find((x: any) => {
      if (typeOutbound.value === "AMO") {
        return x.orgCode === selectedCustomer.value;
      }
      return x.shipToLocation === selectedCustomer.label;
    });

    if (!found) return;

    if (typeOutbound.value === "AMO") {
      // 🔥 SHIP TO dari address
      methods.setValue("ship_to", found.orgCode || "");
      methods.setValue("address", found.address || "");
    } else {
      methods.setValue("ship_to", found.shipToLocation || "");
      methods.setValue("address", found.address1 || "");
    }
  }, [selectedCustomer, typeOutbound, customerRaw]);

  // konfigurasi fields dynamic form
  const fieldsConfig: FieldConfig[] = [
    {
      name: "delivery_date",
      label: "Delivery Date",
      type: "date",
      validation: { required: "Delivery Date is required" },
    },

    ...(isDetail
      ? [
          {
            name: "origin",
            label: "Origin",
            type: "text" as const,
            disabled: true,
          },
          {
            name: "requestor",
            label: "Requestor",
            type: "text" as const,
          },
        ]
      : []),

    // ✅ HIDE type_outbound jika isDetail = true
    ...(!isDetail
      ? [
          {
            name: "type_outbound",
            label: "Type Outbound",
            type: "select",
            options: [
              { label: "AMO", value: "AMO" },
              { label: "SUBDIST", value: "SUBDIST" },
            ],
          } as FieldConfig,
        ]
      : []),

    // ✅ HIDE customer select jika isDetail = true
    ...(!isDetail
      ? [
          {
            name: "selected_destination",
            label: loadingCustomer ? "Loading..." : "Select AMO/Subdist",
            type: "select",
            options: customerList,
          } as FieldConfig,
        ]
      : []),

    {
      name: "ship_to",
      label: "Ship To",
      type: "text",
      disabled: true,
      validation: { required: "Ship To is required" },
    },
    {
      name: "address",
      label: "Ship Address",
      type: "textarea",
      disabled: true,
    },
    {
      name: "notes",
      label: "Notes",
      type: "textarea",
    },
  ];

  // 1️⃣ Reset saat mode create
  useEffect(() => {
    if (!isDetail && !isEdit) {
      // Hapus detail di store
      resetDetail();

      // Reset form react-hook-form
      methods.reset({
        requestor: "",
        origin: "",
        ship_to: "",
        destination: "",
        delivery_date: "",
        notes: "",
      });

      // Kosongkan item list
      setItems([]);
    }
  }, [isDetail, isEdit, resetDetail, methods]);

  // 2️⃣ Fetch detail jika mode edit/detail
  useEffect(() => {
    if ((isDetail || isEdit) && memoId) {
      fetchById(memoId);
    }
  }, [isDetail, isEdit, memoId, fetchById]);

  // 3️⃣ Populate form hanya kalau detail ada & mode bukan create
  useEffect(() => {
    // jika tidak ada detail atau sedang create, stop
    if (!detailDataMemo || (!isDetail && !isEdit)) return;

    const dateOnly = formatDateIndo(detailDataMemo.delivery_date);

    methods.reset({
      requestor: detailDataMemo.requestor || "",
      origin: detailDataMemo.origin || "",

      // 🔥 ship_to = DESTINATION
      ship_to: detailDataMemo.destination || "",

      // 🔥 address = SHIP_TO (alamat)
      address: detailDataMemo.ship_to || "",

      delivery_date: dateOnly,
      notes: detailDataMemo.notes || "",
      type_outbound: detailDataMemo.type
        ? { label: detailDataMemo.type, value: detailDataMemo.type }
        : null,

      selected_destination: detailDataMemo.destination
        ? {
            label: detailDataMemo.destination,
            value: detailDataMemo.destination,
          }
        : null,
    });

    const mappedItems: ItemRow[] = (
      detailDataMemo.outbound_memo_items || []
    ).map((it: any) => ({
      item_id: it.item_id || it.item?.id || "",
      item_name: it.item?.description || it.item?.sku || "",
      quantity_plan: Number(it.quantity_plan ?? 0),
      uom: typeof it.uom === "string" ? it.uom : (it.uom_name ?? ""),
      uom_name: it.uom_name ?? (typeof it.uom === "string" ? it.uom : ""),
      classification_name:
        it.classification_name ?? it.classification?.classification_name ?? "",
      notes: it.notes ?? "",
    }));

    setItems(mappedItems);
  }, [detailDataMemo, isDetail, isEdit, methods]);

  // add / delete item handlers
  const handleAddItem = (item: ItemRow) => {
    setItems((prev) => [...prev, item]);
    setOpenModal(false);
  };

  const handleDeleteItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateItemField = (
    index: number,
    field: keyof ItemRow,
    value: any,
  ) => {
    setItems((prev) => {
      const copy = [...prev];
      // jika update uom, simpan kode ke `uom` dan label ke `uom_name`
      if (field === "uom") {
        copy[index] = {
          ...copy[index],
          uom: value ?? "",
          uom_name: value ?? "",
        };
      } else {
        copy[index] = {
          ...copy[index],
          [field]: field === "quantity_plan" ? Number(value) : value,
        };
      }
      return copy;
    });
  };

  // submit handler (create or update)
  const onFinalSubmit = async (data: MemoFormValues) => {
    if (items.length === 0) {
      showErrorToast("Item tak boleh kosong! Pilih minimal 1 item.");
      return;
    }

    // ✅ Check for empty required fields
    const requiredFields = [
      data.ship_to,
      data.delivery_date,
      data.type_outbound?.value,
    ];

    if (requiredFields.some((field) => !field)) {
      showErrorToast("Please fill in all required fields!");
      return;
    }

    // Tampilkan konfirmasi sebelum hit API
    showConfirmDialog(
      async () => {
        const username = localStorage.getItem("username");
        const payload = {
          organization_id: orgId,
          requestor: username,
          origin: "CWH",
          destination: data.ship_to,
          ship_to: data.address,
          delivery_date: formatDateIndo(data.delivery_date),
          notes: data.notes,
          status: "PENDING",
          type: data.type_outbound?.value || "",
          outbound_memo_items: items.map((i) => ({
            item_id: i.item_id,
            quantity_plan: Number(i.quantity_plan ?? 0),
            uom: i.uom ?? i.uom_name ?? "",
          })),
        };

        try {
          let res: any = null;
          if (isEdit && memoId) {
            res = await updateData(memoId, payload as any);
          } else {
            res = await createData(payload as any);
          }

          if (res && res.success) {
            methods.reset();
            setItems([]);
            navigate("/memo");
          } else {
            showErrorToast(res?.message || "Operation failed");
          }
        } catch (err: any) {
          console.error("Submit error:", err);
          showErrorToast("Gagal menyimpan data.");
        }
      },
      {
        title: isEdit ? "Konfirmasi Update?" : "Simpan Memo?",
        text: "Pastikan semua data item dan tujuan sudah benar.",
        confirmButtonText: "Ya, Simpan",
      },
    );
  };

  const columnsTableItem = [
    { accessorKey: "item_name", header: "Item Name" },
    {
      accessorKey: "quantity_plan",
      header: "Qty Plan",
      cell: ({ row }: any) =>
        !isDetail ? (
          <input
            type="number"
            className="w-28 px-2 py-1 border rounded"
            value={items[row.index]?.quantity_plan ?? ""}
            onChange={(e) =>
              handleUpdateItemField(row.index, "quantity_plan", e.target.value)
            }
          />
        ) : (
          <span>{items[row.index]?.quantity_plan}</span>
        ),
    },
    {
      accessorKey: "uom_name",
      header: "UOM",
      cell: ({ row }: { row: any }) =>
        !isDetail ? (
          <Select
            options={uomList.map((u) => ({
              value: u.code,
              label: u.code,
            }))}
            value={items[row.index]?.uom_name ?? ""}
            onChange={(val) => handleUpdateItemField(row.index, "uom", val)}
            placeholder="-- Select UOM --"
            className="w-40"
          />
        ) : (
          <span>{items[row.index]?.uom ?? ""}</span>
        ),
    },
    ...(!isDetail
      ? [
          {
            accessorKey: "action",
            header: "Action",
            cell: ({ row }: any) =>
              !isDetail && (
                <button
                  className="text-red-600 hover:text-red-800 font-semibold"
                  onClick={() => handleDeleteItem(row.index)}
                >
                  Delete
                </button>
              ),
          },
        ]
      : []),
  ];

  const handleReset = () => {
    showConfirmDialog(
      () => {
        if (isEdit && detailDataMemo) {
          const dateOnly = formatDateIndo(detailDataMemo.delivery_date);
          methods.reset({
            requestor: detailDataMemo.requestor || "",
            origin: detailDataMemo.origin || "",
            ship_to: detailDataMemo.ship_to || "",
            destination: detailDataMemo.destination || "",
            delivery_date: dateOnly,
            notes: detailDataMemo.notes || "",
          });
          const mappedItems: ItemRow[] = (
            detailDataMemo.outbound_memo_items || []
          ).map((it: any) => ({
            item_id: it.item_id || it.item?.id || "",
            item_name: it.item?.description || it.item?.sku || "",
            quantity_plan: Number(it.quantity_plan ?? 0),
            uom: typeof it.uom === "string" ? it.uom : (it.uom_name ?? ""),
            uom_name: it.uom_name ?? (typeof it.uom === "string" ? it.uom : ""),
            classification_name:
              it.classification_name ??
              it.classification?.classification_name ??
              "",
            notes: it.notes ?? "",
          }));
          setItems(mappedItems);
        } else {
          methods.reset({
            requestor: "",
            origin: "",
            ship_to: "",
            destination: "",
            delivery_date: "",
            notes: "",
          });
          setItems([]);
        }
      },
      {
        title: "Reset Form?",
        text: "Semua data yang telah diinput akan hilang.",
        confirmButtonText: "Ya, Reset!",
      },
    );
  };

  const handleApproveMemo = (memoId: string) => {
    // Implementasi logika untuk menyetujui memo
    const approveMemo = async (memoId: string) => {
      const token = localStorage.getItem("token");
      try {
        const res = await fetch(`${EndPoint}outbound-memo/${memoId}/approved`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (res.ok) {
          showSuccessToast("Memo approved successfully");
          navigate("/memo");
        } else {
          showErrorToast(data?.message || "Failed to approve memo");
        }
      } catch (err) {
        showErrorToast("Network error approving memo");
      }
    };

    approveMemo(memoId);
  };

  const handleRejectedMemo = (memoId: string) => {
    // Implementasi logika untuk menolak memo

    const rejectMemo = async (memoId: string) => {
      const token = localStorage.getItem("token");
      try {
        const res = await fetch(
          `${EndPoint}outbound-memo/${memoId}/cancelled`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          },
        );
        const data = await res.json();
        if (res.ok) {
          showErrorToast("Memo rejected successfully");
          navigate("/memo");
        } else {
          showErrorToast(data?.message || "Failed to reject memo");
        }
      } catch (err) {
        showErrorToast("Network error rejecting memo");
      }
    };

    rejectMemo(memoId);
  };

  if (isLoading && (isEdit || isDetail)) {
    return (
      <div className="p-6">
        <PageBreadcrumb
          breadcrumbs={[
            { title: "All Memo", path: "/memo" },
            { title: title || "Loading...", path: "#" },
          ]}
        />
        <LoadingIndicator />
      </div>
    );
  }

  const handleBack = () => {
    navigate(-1); // Ini akan membawa kembali ke /memo?page=x
  };

  // ✅ SEARCH SO berdasarkan inputan user
  const handleSearchSO = async () => {
    if (!soSearchNumber)
      return showErrorToast("Masukkan nomor SO terlebih dahulu!");

    setIsLoadingSO(true);
    try {
      // Menggunakan service searchSO yang sudah diimport
      const { items: soItems } = await SOsearchService(
        soSearchNumber,
        masterItemList,
        uomList,
      );

      if (!soItems || soItems.length === 0) {
        showErrorToast(
          `Data SO ${soSearchNumber} tidak ditemukan atau item tidak terdaftar di master data.`,
        );
        return;
      }

      // Mapping hasil SO ke format ItemRow table
      const mappedItems: ItemRow[] = soItems.map((it: any) => ({
        item_id: String(it.item_id),
        item_name: it.item_name || it.sku || "Unknown Item",
        quantity_plan: Number(it.qty),
        uom: it.uom,
        uom_name: it.uom,
        classification_name: "",
        notes: `Imported from SO: ${soSearchNumber}`,
      }));

      // Tambahkan ke list item yang sudah ada (user bisa mix manual & SO)
      setItems((prev) => [...prev, ...mappedItems]);
      setSoSearchNumber(""); // Reset field search
      showSuccessToast(
        `Berhasil menarik ${mappedItems.length} item dari SO ${soSearchNumber}`,
      );
    } catch (err: any) {
      console.error("SO Search Error:", err);
      showErrorToast(err?.message || "Terjadi kesalahan saat mencari SO.");
    } finally {
      setIsLoadingSO(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <PageBreadcrumb
          breadcrumbs={[
            { title: "All Memo", path: "/memo" },
            { title: title || "Process Memo", path: "/memo/process" },
          ]}
        />

        {/* TOMBOL BACK DI ATAS */}
        <Button
          variant="primary"
          onClick={handleBack}
          startIcon={<FaArrowLeft />}
        >
          Back to List Memo
        </Button>
      </div>

      {/* FORM */}
      <section className="bg-white p-4 rounded-xl shadow-sm mb-6">
        <DynamicForm
          fields={fieldsConfig}
          onSubmit={methods.handleSubmit(onFinalSubmit)}
          defaultValues={{}}
          control={methods.control}
          register={methods.register}
          setValue={methods.setValue}
          handleSubmit={methods.handleSubmit}
          isEditMode={!isDetail}
          watch={methods.watch}
        />

        {isDetail &&
          localStorage.getItem("role_name") === "TRANSPORT_SUPERVISOR" &&
          detailDataMemo?.status !== "APPROVED" && (
            <div className="flex justify-end mt-4 gap-3">
              <Button
                type="button"
                variant="danger"
                onClick={() => handleRejectedMemo(memoId)}
              >
                Reject Memo
              </Button>

              <Button
                type="button"
                variant="primary"
                onClick={() => handleApproveMemo(memoId)}
              >
                Approve Memo
              </Button>
            </div>
          )}
      </section>

      {/* SO SEARCH SECTION (Hanya muncul jika type_outbound == SUBDIST) */}
      {typeOutbound?.value === "SUBDIST" && !isDetail && (
        <section className="bg-blue-50 p-5 rounded-xl border border-blue-200 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex flex-col md:flex-row items-end gap-4">
            <div className="flex-1">
              <label className="block text-sm font-bold text-blue-900 mb-2">
                Import Items from Sales Order (SO)
              </label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="Contoh: SO20240001"
                value={soSearchNumber}
                onChange={(e) =>
                  setSoSearchNumber(e.target.value.toUpperCase())
                }
                onKeyDown={(e) => e.key === "Enter" && handleSearchSO()}
              />
            </div>
            <Button
              type="button"
              variant="primary"
              onClick={handleSearchSO}
              disabled={isLoadingSO}
              startIcon={isLoadingSO ? null : <FaSearch />}
              className="h-[42px] px-6"
            >
              {isLoadingSO ? "Searching..." : "Search & Add"}
            </Button>
          </div>
          <p className="text-xs text-blue-600 mt-2">
            * Masukkan nomor SO untuk mengisi daftar item secara otomatis. Anda
            tetap bisa menambah item manual setelahnya.
          </p>
        </section>
      )}

      {/* ITEM DETAILS */}
      <section className="bg-white p-4 rounded-xl shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold text-lg text-gray-700">Item Details</h3>
          {!isDetail && (
            <Button
              type="button"
              variant="primary"
              onClick={() => setOpenModal(true)}
            >
              + Add Item
            </Button>
          )}
        </div>

        <TableComponent data={items} columns={columnsTableItem} pageSize={10} />
      </section>

      {/* ACTIONS */}
      {!isDetail && (
        <div className="flex justify-end gap-3 mt-6">
          <Button
            type="button"
            variant="danger"
            onClick={() => handleReset()}
            startIcon={<FaUndo />}
          >
            Reset Form
          </Button>

          <Button
            type="button"
            variant="secondary"
            startIcon={<FaCheck />}
            onClick={methods.handleSubmit(onFinalSubmit)}
            disabled={items.length === 0}
          >
            {isEdit ? "Update Memo" : "Confirm Memo"}
          </Button>
        </div>
      )}

      {/* MODAL */}
      <ModalAddItem
        open={openModal}
        onClose={() => setOpenModal(false)}
        onSubmit={handleAddItem}
      />
    </div>
  );
};

export default CreateMemo;
