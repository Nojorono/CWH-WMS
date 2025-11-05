"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import Button from "../../../../components/ui/button/Button";
import PageBreadcrumb from "../../../../components/common/PageBreadCrumb";
import TableComponent from "../Table/TableListMemo";
import DynamicForm, {
  FieldConfig,
} from "../../../../components/wms-components/inbound-component/form/DynamicForm";
import { showErrorToast, showSuccessToast } from "../../../../components/toast";
import { useStoreOutboundMemo } from "../../../../DynamicAPI/stores/Store/MasterStore";
import { useLocation, useNavigate } from "react-router";
import { formatDateIndo } from "../../../../helper/FormatDate";
import ConfirmationModal from "../Modal/Sequence";

type MemoFormValues = {
  requestor: string;
  origin: string;
  ship_to: string;
  destination: string;
  delivery_date: string;
  license_plate?: string;
  expedition?: string;
  driver?: string;
  type_outbound?: { label: string; value: string };
  driver_phone?: string;
  po_expedition?: string;
};

const CreateDO: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { mode } = location.state || {};
  const isDetail = mode === "detail";

  const methods = useForm<MemoFormValues>({
    defaultValues: {
      requestor: "",
      origin: "",
      ship_to: "",
      destination: "",
      delivery_date: "",
    },
  });

  const { fetchAll, list } = useStoreOutboundMemo();
  const [selectedMemoIds, setSelectedMemoIds] = useState<string[]>([]);
  const [selectedMemos, setSelectedMemos] = useState<any[]>([]);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [formDataPreview, setFormDataPreview] = useState<any>(null);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ✅ Ambil hanya memo yang APPROVED
  const approvedMemos = useMemo(
    () => list.filter((item) => item.status === "APPROVED"),
    [list]
  );

  const fieldsConfig: FieldConfig[] = [
    { name: "license_plate", label: "License Plate", type: "text" },
    { name: "expedition", label: "Expedition", type: "text" },
    { name: "driver", label: "Driver", type: "text" },
    {
      name: "type_outbound",
      label: "Type Outbound",
      type: "select",
      options: [{ label: "AMO", value: "AMO" }],
    },
    { name: "origin", label: "Origin", type: "text" },
    { name: "destination", label: "Destination", type: "text" },
    { name: "driver_phone", label: "Driver Phone", type: "text" },
    { name: "delivery_date", label: "Delivery Date", type: "date" },
    { name: "po_expedition", label: "PO Expedition", type: "text" },
  ];

  const columnsTableItem = [
    { accessorKey: "id", header: "Select", selectedRow: true }, // ✅ gunakan ID asli
    {
      accessorKey: "delivery_date",
      header: "Delivery Date",
      cell: ({ row }: any) => formatDateIndo(row.original.delivery_date),
    },
    { accessorKey: "origin", header: "Origin" },
    { accessorKey: "destination", header: "Destination" },
    { accessorKey: "ship_to", header: "Ship To" },
    { accessorKey: "requestor", header: "Requestor" },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: any) => (
        <span className="bg-green-100 text-green-700 px-2 py-1 rounded-md text-sm font-medium">
          {row.original.status}
        </span>
      ),
    },
    {
      accessorKey: "created_date",
      header: "Created Date",
      cell: ({ row }: any) => formatDateIndo(row.original.created_date),
    },
  ];

  // ✅ Selection Handler
  const handleSelectionChange = (selectedIds: string[]) => {
    const filtered = approvedMemos.filter(
      (m) => typeof m.id === "string" && selectedIds.includes(m.id)
    );
    setSelectedMemoIds(selectedIds);
    setSelectedMemos(filtered);
  };

  // ✅ Submit Handler
  const onFinalSubmit = (data: any) => {
    if (selectedMemos.length === 0) {
      showErrorToast("Pilih minimal satu memo sebelum membuat DO!");
      return;
    }

    const formData = methods.getValues();

    console.log("formData", formData);
    console.log("selectedMemos", selectedMemos);
    

    const payload = {
      ...formData,
      type_outbound: formData.type_outbound?.value || "",
      memo_list: selectedMemos.map((m) => ({
        id: m.id,
        memo_id: m.memo_id,
        origin: m.origin,
        destination: m.destination,
        ship_to: m.ship_to,
        requestor: m.requestor,
      })),
    };

    // 👇 tampilkan dulu di modal sebelum API call
    setFormDataPreview(payload);
    setIsConfirmOpen(true);
  };

  const handleConfirmSubmit = async (reorderedList: any[]) => {
    // setIsConfirmOpen(false);

    // try {
    //   const finalPayload = {
    //     ...formDataPreview,
    //     memo_list: reorderedList.map((m, index) => ({
    //       sequence: index + 1, // Tambahkan urutan sequence
    //       id: m.id,
    //       memo_id: m.memo_id,
    //       origin: m.origin,
    //       destination: m.destination,
    //       ship_to: m.ship_to,
    //       requestor: m.requestor,
    //     })),
    //   };

    //   console.log("=== FINAL PAYLOAD CREATE DO ===");
    //   console.log(finalPayload);

    //   // TODO: kirim ke API
    //   // await axios.post(EndPoint.CREATE_DO, finalPayload);

    //   showSuccessToast("Delivery Order berhasil dibuat!");
    // } catch (error) {
    //   showErrorToast("Gagal membuat Delivery Order!");
    //   console.error(error);
    // }
  };

  const handleReset = () => {
    methods.reset();
    setSelectedMemoIds([]);
    setSelectedMemos([]);
  };

  return (
    <div className="p-6 space-y-6">
      <PageBreadcrumb
        breadcrumbs={[
          { title: "Delivery Order List", path: "/outbound_do" },
          { title: "Create Delivery Order", path: "#" },
        ]}
      />

      {/* === Delivery Order Details === */}
      <section className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
        <h3 className="font-semibold text-gray-700 text-lg mb-3">
          Delivery Order Details
        </h3>

        <DynamicForm
          fields={fieldsConfig}
          onSubmit={methods.handleSubmit(onFinalSubmit)}
          control={methods.control}
          register={methods.register}
          setValue={methods.setValue}
          handleSubmit={methods.handleSubmit}
          isEditMode={!isDetail}
          watch={methods.watch}
        />
      </section>

      {/* === MEMO List === */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="bg-orange-500 text-white rounded-t-xl px-5 py-3 font-semibold">
          Memo List
        </div>
        <div className="p-4">
          <TableComponent
            data={approvedMemos}
            columns={columnsTableItem}
            pageSize={10}
            onSelectionChange={handleSelectionChange}
          />
        </div>
      </section>

      {/* === Buttons === */}
      <div className="flex justify-end gap-3 mt-4">
        <Button
          type="button"
          variant="secondary"
          className="bg-gray-200 text-gray-700 hover:bg-gray-300"
          onClick={handleReset}
        >
          Reset
        </Button>

        <Button
          type="button"
          className="bg-orange-500 text-white hover:bg-orange-600"
          onClick={methods.handleSubmit(onFinalSubmit)}
        >
          Create DO
        </Button>
      </div>

      {/* Modal Konfirmasi */}
      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmSubmit}
        formData={formDataPreview}
      />
    </div>
  );
};

export default CreateDO;
