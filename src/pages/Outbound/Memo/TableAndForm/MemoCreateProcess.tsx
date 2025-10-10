"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import Button from "../../../../components/ui/button/Button";
import PageBreadcrumb from "../../../../components/common/PageBreadCrumb";
import TableComponent from "../../../../components/tables/MasterDataTable/TableComponent";
import ModalAddItem from "./ModalAddItem";
import DynamicForm, {
  FieldConfig,
} from "../../../../components/wms-components/inbound-component/form/DynamicForm";
import { showErrorToast, showSuccessToast } from "../../../../components/toast";
import { useStoreOutboundMemo } from "../../../../DynamicAPI/stores/Store/MasterStore";
import { useLocation } from "react-router";

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
  classification: string;
  quantity_plan: number;
  uom: string;
  notes: string;
};

const CreateMemo: React.FC = () => {
  const location = useLocation();
  const { data: viewData, mode } = location.state || {};
  const isDetail = mode === "detail";

  console.log("Mode:", mode, "View Data:", viewData);
  

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
  const { createData } = useStoreOutboundMemo();

  const handleAddItem = (item: ItemRow) => {
    setItems((prev) => [...prev, item]);
    setOpenModal(false);
  };

  // ✅ Konfigurasi field untuk DynamicForm
  const fieldsConfig: FieldConfig[] = [
    {
      name: "origin",
      label: "Origin",
      type: "text" as const,
      validation: { required: "Origin is required" },
    },
    {
      name: "destination",
      label: "Destination",
      type: "text" as const,
      validation: { required: "Destination is required" },
    },
    {
      name: "delivery_date",
      label: "Delivery Date",
      type: "date" as const,
      validation: { required: "Delivery Date is required" },
    },
    {
      name: "ship_to",
      label: "Ship To",
      type: "text" as const,
      validation: { required: "Ship To is required" },
    },
    {
      name: "requestor",
      label: "Requestor",
      type: "text" as const,
      validation: { required: "Requestor is required" },
    },
    {
      name: "notes",
      label: "Notes",
      type: "textarea" as const,
      validation: { required: "Notes is required" },
    },
  ];

  // ✅ Fungsi submit akhir
  const onFinalSubmit = async (data: MemoFormValues) => {
    if (items.length === 0) {
      showErrorToast("Please add at least one item!");
      return;
    }

    const payload = {
      ...data,
      status: "PENDING",
      outbound_memo_items: items.map((i) => ({
        item_id: i.item_id,
        quantity_plan: i.quantity_plan,
        uom: i.uom,
      })),
    };

    const res = await createData(payload);
    if (res?.success) {
      showSuccessToast("Memo created successfully!");
      // navigate("/inbound_planning");
    }

    methods.reset();
    setItems([]);
  };

  const columns = [
    { accessorKey: "item_name", header: "Item Name" },
    { accessorKey: "classification_name", header: "Classification" },
    { accessorKey: "quantity_plan", header: "Qty Plan" },
    { accessorKey: "uom_name", header: "UoM" },
    { accessorKey: "notes", header: "Notes" },
    {
      accessorKey: "action",
      header: "Action",
      cell: ({ row }: any) => (
        <button
          className="text-red-600 hover:text-red-800 font-semibold"
          onClick={() => handleDeleteItem(row.index)}
        >
          Delete
        </button>
      ),
    },
  ];

  const handleDeleteItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="p-6 space-y-6">
      <PageBreadcrumb
        breadcrumbs={[
          { title: "Memo List", path: "/memo" },
          { title: "Create Memo", path: "/memo/process" },
        ]}
      />

      {/* 🧾 MEMO DETAILS via DynamicForm */}
      <section className="bg-white p-4 rounded-xl shadow-sm mb-6">
        <DynamicForm
          fields={fieldsConfig}
          onSubmit={methods.handleSubmit(onFinalSubmit)}
          defaultValues={{}}
          control={methods.control}
          register={methods.register}
          setValue={methods.setValue}
          handleSubmit={methods.handleSubmit}
          isEditMode={true}
          watch={methods.watch}
        />
      </section>

      {/* 🧱 ITEM DETAILS */}
      <section className="bg-white p-4 rounded-xl shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold text-lg text-gray-700">Item Details</h3>
          <Button
            type="button"
            variant="primary"
            onClick={() => setOpenModal(true)}
          >
            + Add Item
          </Button>
        </div>

        <TableComponent data={items} columns={columns} pageSize={5} />
      </section>

      {/* 🔘 BUTTONS */}
      <div className="flex justify-end gap-3 mt-6">
        <Button
          type="button"
          variant="secondary"
          onClick={() => methods.reset()}
        >
          Reset
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={methods.handleSubmit(onFinalSubmit)}
        >
          Create Memo
        </Button>
      </div>

      {/* 📦 MODAL ADD ITEM */}
      <ModalAddItem
        open={openModal}
        onClose={() => setOpenModal(false)}
        onSubmit={handleAddItem}
      />
    </div>
  );
};

export default CreateMemo;
