"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Button from "../../../../components/ui/button/Button";
import PageBreadcrumb from "../../../../components/common/PageBreadCrumb";
import TableComponent from "../../../../components/tables/MasterDataTable/TableComponent";
import ModalAddItem from "../Modal/ModalAddItem";
import DynamicForm, {
  FieldConfig,
} from "../../../../components/wms-components/inbound-component/form/DynamicForm";
import { showErrorToast } from "../../../../components/toast";
import { useStoreOutboundMemo } from "../../../../DynamicAPI/stores/Store/MasterStore";
import { useLocation, useNavigate } from "react-router";
import { EndPoint } from "../../../../utils/EndPoint";

type MemoFormValues = {
  requestor: string;
  origin: string;
  ship_to: string;
  destination: string;
  delivery_date: string;
  notes: string;
};

type ItemRow = {
  item_id: string;
  item_name: string;
  classification_name?: string;
  quantity_plan: number;
  uom?: string;
  uom_name?: string;
  notes?: string;
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

  const methods = useForm<MemoFormValues>({
    defaultValues: {
      requestor: "",
      origin: "",
      ship_to: "",
      destination: "",
      delivery_date: "",
      notes: "",
    },
  });

  const [items, setItems] = useState<ItemRow[]>([]);
  const [openModal, setOpenModal] = useState(false);

  // store
  const { createData, fetchById, detail, resetDetail, updateData } =
    useStoreOutboundMemo();

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
      fetchById(memoId).catch((err) => console.error("Error fetchById:", err));
    }
  }, [isDetail, isEdit, memoId, fetchById]);

  // 3️⃣ Populate form hanya kalau detail ada & mode bukan create
  useEffect(() => {
    // jika tidak ada detail atau sedang create, stop
    if (!detail || (!isDetail && !isEdit)) return;

    const dateOnly = formatDate(detail.delivery_date);

    methods.reset({
      requestor: detail.requestor || "",
      origin: detail.origin || "",
      ship_to: detail.ship_to || "",
      destination: detail.destination || "",
      delivery_date: dateOnly,
      notes: detail.notes || "",
    });

    const mappedItems: ItemRow[] = (detail.outbound_memo_items || []).map(
      (it: any) => ({
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
      })
    );

    setItems(mappedItems);
  }, [detail, isDetail, isEdit, methods]);

  // add / delete item handlers
  const handleAddItem = (item: ItemRow) => {
    setItems((prev) => [...prev, item]);
    setOpenModal(false);
  };

  const handleDeleteItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // fields config
  const fieldsConfig: FieldConfig[] = [
    {
      name: "origin",
      label: "Origin",
      type: "text",
      validation: { required: "Origin is required" },
    },
    {
      name: "destination",
      label: "Destination",
      type: "text",
      validation: { required: "Destination is required" },
    },
    {
      name: "delivery_date",
      label: "Delivery Date",
      type: "date",
      validation: { required: "Delivery Date is required" },
    },
    {
      name: "ship_to",
      label: "Ship To",
      type: "text",
      validation: { required: "Ship To is required" },
    },
    {
      name: "requestor",
      label: "Requestor",
      type: "text",
      validation: { required: "Requestor is required" },
    },
    {
      name: "notes",
      label: "Notes",
      type: "textarea",
      validation: { required: "Notes is required" },
    },
  ];

  // submit handler (create or update)
  const onFinalSubmit = async (data: MemoFormValues) => {
    console.log("Form data:", data);

    if (items.length === 0) {
      showErrorToast("Please add at least one item!");
      return;
    }

    // build payload ensuring uom is string (fallback "")
    const payload = {
      ...data,
      status: "PENDING",
      delivery_date: formatDate(data.delivery_date), // 👈 gunakan helper
      outbound_memo_items: items.map((i) => ({
        item_id: i.item_id,
        quantity_plan: Number(i.quantity_plan ?? 0),
        uom: (i.uom ?? i.uom_name ?? "") as string,
      })),
    };

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
    { accessorKey: "quantity_plan", header: "Qty Plan" },
    { accessorKey: "uom_name", header: "UoM" },
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
  ];

  const handleReset = () => {
    if (isEdit && detail) {
      const dateOnly = formatDate(detail.delivery_date);

      methods.reset({
        requestor: detail.requestor || "",
        origin: detail.origin || "",
        ship_to: detail.ship_to || "",
        destination: detail.destination || "",
        delivery_date: dateOnly,
        notes: detail.notes || "",
      });

      const mappedItems: ItemRow[] = (detail.outbound_memo_items || []).map(
        (it: any) => ({
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
        })
      );

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
  };

  const handleApproveMemo = (memoId: string) => {
    // Implementasi logika untuk menyetujui memo
    console.log("Approve memo with ID:", memoId);

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

  if (isLoading && (isEdit || isDetail)) {
    return (
      <div className="p-6">
        <PageBreadcrumb
          breadcrumbs={[
            { title: "Memo List", path: "/memo" },
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
          { title: "Memo List", path: "/memo" },
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

        {localStorage.getItem("role_name") === "TRANSPORT SUPERVISOR" &&
          detail?.status !== "APPROVED" && (
            <div className="flex justify-end mt-4 gap-3">
              <Button
                type="button"
                variant="danger"
                // onClick={() => setOpenModal(true)}
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
            variant="secondary"
            onClick={() => handleReset()}
          >
            Reset
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={methods.handleSubmit(onFinalSubmit)}
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
