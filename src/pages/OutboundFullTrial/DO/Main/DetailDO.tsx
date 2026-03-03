"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import Button from "../../../../components/ui/button/Button";
import PageBreadcrumb from "../../../../components/common/PageBreadCrumb";
import TableComponent from "../Table/TableListMemo";
import DynamicForm, {
  FieldConfig,
} from "../../../../components/wms-components/inbound-component/form/DynamicForm";
import { showErrorToast } from "../../../../components/toast";
import {
  useStoreOutboundMemo,
  useStoreOutboundDeliveryOrder,
} from "../../../../DynamicAPI/stores/Store/MasterStore";
import { useLocation, useNavigate } from "react-router";
import { formatDateIndo } from "../../../../helper/FormatDate";
import ConfirmationModal from "../Modal/Sequence";
import { FaArrowLeft } from "react-icons/fa";
import { OutboundMemo } from "../../../../DynamicAPI/types/DeliverOrderTypes";

type MemoFormValues = {
  requestor: string;
  origin: string;
  ship_to: string;
  destination: string;
  delivery_date: string;
  type_outbound?: { label: string; value: string };
};

const DetailDO: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { data, mode, title } = location.state || {};
  const isDetail = mode === "detail";

  const methods = useForm<MemoFormValues>({
    defaultValues: {
      origin: "",
      delivery_date: "",
      type_outbound: undefined,
    },
  });

  const { fetchAll, list } = useStoreOutboundMemo();
  const { createData, fetchById, detail } = useStoreOutboundDeliveryOrder();

  const [selectedMemoIds, setSelectedMemoIds] = useState<string[]>([]);
  const [selectedMemos, setSelectedMemos] = useState<any[]>([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [formDataPreview, setFormDataPreview] = useState<any>(null);

  useEffect(() => {
    fetchAll();
    fetchById(data);
  }, [fetchAll, fetchById, data]);

  // ✅ APPROVED memo list (hanya untuk create)
  const approvedMemos = useMemo(
    () => list.filter((item) => item.status === "APPROVED"),
    [list]
  );

  // ✅ SET FORM dan Memo jika mode DETAIL
  useEffect(() => {
    if (!detail) return;

    // isi form
    methods.setValue("type_outbound", {
      label: detail.outbound_type || "",
      value: detail.outbound_type || "",
    });

    methods.setValue("origin", detail.origin || "");

    methods.setValue(
      "delivery_date",
      detail.delivery_date ? detail.delivery_date.split("T")[0] : ""
    );

    // isi memo selected
    if (detail.outbound_memos && detail.outbound_memos.length > 0) {
      const memoIds = detail.outbound_memos.map((m: any) => m.id);

      setSelectedMemoIds(memoIds);
      setSelectedMemos(detail.outbound_memos);
    }
  }, [detail]);

  const fieldsConfig: FieldConfig[] = [
    {
      name: "type_outbound",
      label: "Type Outbound",
      type: "select",
      options: [{ label: "AMO", value: "AMO" }],
    },
    { name: "origin", label: "Origin", type: "text" },
    { name: "delivery_date", label: "Delivery Date", type: "date" },
  ];

  const columnsTableItem = [
    // { accessorKey: "id", header: "Select", selectedRow: true },
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
      cell: ({ row }: any) => formatDateIndo(row.original.createdAt),
    },
  ];

  // ✅ handle checkbox
  const handleSelectionChange = (selectedIds: string[]) => {
    const filtered = approvedMemos.filter(
      (m) => typeof m.id === "string" && selectedIds.includes(m.id)
    );
    setSelectedMemoIds(selectedIds);
    setSelectedMemos(filtered);
  };

  // ✅ Submit DO
  const onFinalSubmit = (data: any) => {
    if (selectedMemos.length === 0) {
      showErrorToast("Pilih minimal satu memo sebelum membuat DO!");
      return;
    }

    const formData = methods.getValues();

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

    setFormDataPreview(payload);
    setIsConfirmOpen(true);
  };

  const handleConfirmSubmit = async (reorderedList: any[]) => {
    try {
      const PAYLOAD = {
        outbound_do_number: "",
        origin: formDataPreview?.origin,
        expedition: "",
        license_plate: "",
        driver_name: "",
        driver_phone: "",
        container_number: "",
        seal_number: "",
        status: "PENDING",
        outbound_type: formDataPreview?.type_outbound,
        delivery_date: formDataPreview?.delivery_date,
        outbound_memo_ids: reorderedList.map((m, index) => ({
          memo_id: m.id || m.memo_id,
          sequence: index + 1,
        })),
      };

      console.log("Final PAYLOAD to submit:", PAYLOAD);

      const res = await createData(PAYLOAD);
      if (res?.success) {
        handleReset();
        setIsConfirmOpen(false);
        navigate("/outbound_do");
      }
    } catch (error) {
      showErrorToast("Gagal membuat Delivery Order!");
      console.error(error);
    }
  };

  const handleReset = () => {
    methods.reset();
    setSelectedMemoIds([]);
    setSelectedMemos([]);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <PageBreadcrumb
          breadcrumbs={[
            { title: "Delivery Order List", path: "/outbound_do" },
            { title: title || "Detail", path: "#" },
          ]}
        />

        <Button
          variant="primary"
          onClick={() => navigate(-1)}
          startIcon={<FaArrowLeft />}
        >
          Back to List DO
        </Button>
      </div>

      {/* === FORM DETAIL === */}
      <section className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
        <h3 className="font-semibold text-gray-700 text-lg mb-3">{title}</h3>

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

      {/* === AVAILABLE MEMO === */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="bg-orange-500 text-white rounded-t-xl px-5 py-3 font-semibold">
          Available Memo
        </div>
        <div className="p-4">
          <TableComponent
            data={
              (isDetail
          ? (detail?.outbound_memos || []).filter(
              (m: any) => typeof m.id === "string"
            )
          : approvedMemos.filter(
              (m: any) => typeof m.id === "string"
            )) as OutboundMemo[]
            }
            columns={columnsTableItem}
            pageSize={10}
            onSelectionChange={handleSelectionChange}
          />
        </div>
      </section>

      {/* === BUTTONS === */}
      {!isDetail && (
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
            Confirm DO
          </Button>
        </div>
      )}

      {/* === MODAL CONFIRM === */}
      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmSubmit}
        formData={formDataPreview}
      />
    </div>
  );
};

export default DetailDO;
