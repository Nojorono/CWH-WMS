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
import { useCustomerByOutboundType } from "./FetchCustomer";


// ✅ Tambahkan selected_customer
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

  selected_customer?: {
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
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 10);
};

const CreateMemo: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: memoId, mode, title } = location.state || {};
  const isDetail = mode === "detail";
  const isEdit = mode === "edit";

  const methods = useForm<MemoFormValues>({
    defaultValues: {
      requestor: "",
      origin: "",
      ship_to: "",
      destination: "",
      delivery_date: "",
      notes: "",
      selected_customer: null,
    },
  });

  const { createData, fetchById, detail, resetDetail, updateData } =
    useStoreOutboundMemo();

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

  // ✅ Watch selected_customer
  const selectedCustomer = methods.watch("selected_customer");

  // ✅ Auto set ship_to setelah pilih customer
  useEffect(() => {
    if (!selectedCustomer || !typeOutbound || customerRaw.length === 0) return;

    const found = customerRaw.find(
      (x: any) =>
        x.locationCode === selectedCustomer.value ||
        x.customerNumber === selectedCustomer.value
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

  // ✅ Field Config
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
      name: "destination",
      label: "Destination",
      type: "text",
      validation: { required: "Destination is required" },
    },
    {
      name: "requestor",
      label: "Requestor",
      type: "text",
      validation: { required: "Requestor is required" },
    },
    {
      name: "type_outbound",
      label: "Type Outbound",
      type: "select",
      options: [
        { label: "AMO", value: "AMO" },
        { label: "Subdist", value: "Subdist" },
      ],
    },

    // ✅ FIELD BARU
    {
      name: "selected_customer",
      label: loadingCustomer ? "Loading..." : "Select Customer",
      type: "select",
      options: customerList,
    },
    {
      name: "ship_to",
      label: "Ship To",
      type: "text",
      disabled: true,
      validation: { required: "Ship To is required" },
    },
    // ✅ FIELD ADDRESS — hanya tampil jika Subdist
    ...(typeOutbound?.value === "Subdist"
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
  

  // ✅ Submit original (tidak diubah)
  const onFinalSubmit = async (data: MemoFormValues) => {
    if (items.length === 0) {
      showErrorToast("Please add at least one item!");
      return;
    }

    const payload = {
      ...data,
      status: "PENDING",
      delivery_date: formatDate(data.delivery_date),
      outbound_memo_items: items.map((i) => ({
        item_id: i.item_id,
        quantity_plan: Number(i.quantity_plan),
        uom: i.uom ?? i.uom_name ?? "",
      })),
    };

    console.log("Submitting Payload:", payload);
    

    // let res: any = null;
    // if (isEdit && memoId) res = await updateData(memoId, payload as any);
    // else res = await createData(payload as any);

    // if (res?.success) {
    //   methods.reset();
    //   setItems([]);
    //   navigate("/memo");
    // } else {
    //   showErrorToast(res?.message || "Operation failed");
    // }
  };

  return (
    <div className="p-6 space-y-6">
      <PageBreadcrumb
        breadcrumbs={[
          { title: "Memo List", path: "/memo" },
          { title: title || "Process Memo", path: "/memo/process" },
        ]}
      />

      {/* ✅ FORM */}
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
      </section>

      {/* ✅ ITEM TABLE */}
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

        <TableComponent
          data={items}
          columns={[
            { accessorKey: "item_name", header: "Item Name" },
            { accessorKey: "quantity_plan", header: "Qty Plan" },
            { accessorKey: "uom_name", header: "UoM" },
          ]}
          pageSize={10}
        />
      </section>

      {/* ✅ ACTION BUTTONS */}
      {!isDetail && (
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={() => methods.reset()}>
            Reset
          </Button>
          <Button
            variant="primary"
            onClick={methods.handleSubmit(onFinalSubmit)}
          >
            {isEdit ? "Update Memo" : "Confirm Memo"}
          </Button>
        </div>
      )}

      <ModalAddItem
        open={openModal}
        onClose={() => setOpenModal(false)}
        onSubmit={setItems}
      />
    </div>
  );
};

export default CreateMemo;
