"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Button from "../../../../components/ui/button/Button";
import PageBreadcrumb from "../../../../components/common/PageBreadCrumb";
import TableComponent from "../TableAndForm/TableComponent";
import ModalAddItem from "../Modal/ModalAddItem";
import DynamicForm, {
  FieldConfig,
} from "../../../../components/wms-components/inbound-component/form/DynamicForm";
import { showErrorToast, showSuccessToast } from "../../../../components/toast";
import {
  useStoreOutboundMemo,
  useStoreUom,
} from "../../../../DynamicAPI/stores/Store/MasterStore";
import { useLocation, useNavigate } from "react-router";
import { EndPoint } from "../../../../utils/EndPoint";
import { useCustomerByOutboundType } from "./FetchCustomer";
import Select from "../../../../components/form/Select";
import { FaCheck, FaUndo } from "react-icons/fa";
import Swal from "sweetalert2";

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

export const formatDate = (date: Date | string | null): string => {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  // Hapus pengaruh timezone, biar tetap lokal (WIB)
  const tzOffset = d.getTimezoneOffset() * 60000;
  const localISO = new Date(d.getTime() - tzOffset).toISOString().slice(0, 10);
  return localISO; // Hasil: "2025-10-14"
};

const CreateMemo: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: memoId, mode, title } = location.state || {};
  const isDetail = mode === "detail";
  const isEdit = mode === "edit";
  const userID = localStorage.getItem("user_id");
  const [isLoading, setIsLoading] = useState(false);

  // store
  const { fetchAll: fetchAllUom, list: uomList } = useStoreUom();
  const {
    createData,
    fetchById,
    detail: detailDataMemo,
    resetDetail,
    updateData,
  } = useStoreOutboundMemo();

  useEffect(() => {
    fetchAllUom();
  }, [fetchAllUom]);

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

    const found = customerRaw.find(
      (x: any) =>
        x.shipToLocation === selectedCustomer.label ||
        x.locationDescription === selectedCustomer.label
    );

    if (!found) return;

    if (typeOutbound.value === "AMO") {
      methods.setValue("ship_to", found.locationDescription || "");
      methods.setValue("address", ""); // ✅ kosongkan
    } else {
      methods.setValue("ship_to", found.shipToLocation || "");
      methods.setValue("address", found.address1 || ""); // ✅ isi address
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
    {
      name: "origin",
      label: "Origin",
      type: "text",
      validation: { required: "Origin is required" },
    },
    {
      name: "requestor",
      label: "Requestor",
      type: "text",
      validation: { required: "Requestor is required" },
    },

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
            label: loadingCustomer ? "Loading..." : "Select Destination",
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

    // ✅ FIELD ADDRESS muncul hanya jika SUBDIST DAN bukan mode detail
    ...(typeOutbound?.value === "SUBDIST" && !isDetail
      ? [
          {
            name: "address",
            label: "Address",
            type: "textarea",
            disabled: true,
          } as FieldConfig,
        ]
      : []),

    {
      name: "notes",
      label: "Notes",
      type: "textarea",
      validation: { required: "Notes is required" },
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

    const dateOnly = formatDate(detailDataMemo.delivery_date);
    methods.reset({
      requestor: detailDataMemo.requestor || "",
      origin: detailDataMemo.origin || "",
      ship_to: detailDataMemo.ship_to || "",
      destination: detailDataMemo.destination || "",
      delivery_date: dateOnly,
      notes: detailDataMemo.notes || "",
      type_outbound: detailDataMemo.type
        ? { label: detailDataMemo.type, value: detailDataMemo.type }
        : { label: "", value: "" },
      selected_destination: detailDataMemo.ship_to
        ? {
            label: detailDataMemo.ship_to,
            value: detailDataMemo.ship_to,
          }
        : { label: "", value: "" },
    });

    const mappedItems: ItemRow[] = (
      detailDataMemo.outbound_memo_items || []
    ).map((it: any) => ({
      item_id: it.item_id || it.item?.id || "",
      item_name: it.item?.description || it.item?.sku || "",
      quantity_plan: Number(it.quantity_plan ?? 0),
      uom: typeof it.uom === "string" ? it.uom : it.uom_name ?? "",
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
    value: any
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
      data.requestor,
      data.origin,
      data.ship_to,
      data.delivery_date,
      data.type_outbound?.value,
    ];

    if (requiredFields.some((field) => !field)) {
      showErrorToast("Please fill in all required fields!");
      return;
    }

    // ✅ Build only required schema
    const payload = {
      requestor: data.requestor,
      origin: data.origin,
      ship_to: data.ship_to,
      destination: data.ship_to,
      delivery_date: formatDate(data.delivery_date),
      notes: data.notes,
      status: "PENDING",
      type: data.type_outbound?.value || "",
      outbound_memo_items: items.map((i) => ({
        item_id: i.item_id,
        quantity_plan: Number(i.quantity_plan ?? 0),
        uom: i.uom ?? i.uom_name ?? "",
      })),
    };

    console.log("Submitting payload:", payload);

    try {
      let res: any = null;
      if (isEdit && memoId) {
        res = await updateData(memoId, payload as any);
      } else {
        res = await createData(payload as any);
      }

      // createData/updateData dari store mengembalikan objek { success: boolean, message?: string }
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
    // SweetAlert confirmation before resetting the form
    Swal.fire({
      title: "Apakah Anda Yakin?",
      text: "Jika Anda mereset, semua data yang telah Anda masukkan akan hilang!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Ya, reset!",
    }).then((result) => {
      if (result.isConfirmed) {
        if (isEdit && detailDataMemo) {
          const dateOnly = formatDate(detailDataMemo.delivery_date);

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
            uom: typeof it.uom === "string" ? it.uom : it.uom_name ?? "",
            uom_name: it.uom_name ?? (typeof it.uom === "string" ? it.uom : ""),
            classification_name:
              it.classification_name ??
              it.classification?.classification_name ??
              "",
            notes: it.notes ?? "",
          }));

          setItems(mappedItems);
        } else {
          // Mode create → reset semua jadi kosong
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
      }
    });
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
          }
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

  return (
    <div className="p-6 space-y-6">
      <PageBreadcrumb
        breadcrumbs={[
          { title: "All Memo", path: "/memo" },
          { title: title || "Process Memo", path: "/memo/process" },
        ]}
      />

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

        {localStorage.getItem("role_name") === "TRANSPORT_SUPERVISOR" &&
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
