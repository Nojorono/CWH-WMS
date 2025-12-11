"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import Button from "../../../../components/ui/button/Button";
import PageBreadcrumb from "../../../../components/common/PageBreadCrumb";
import TableComponent from "../Table/TableComponent";
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
import Label from "../../../../components/form/Label";
import Select from "../../../../components/form/Select";
import ActIndicator from "../../../../components/ui/activityIndicator";
import { FaCheck } from "react-icons/fa";

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

  const {
    fetchUsingPagination,
    list: approvedMemos,
    pagination,
    isLoading,
  } = useStoreOutboundMemo();

  // 🔹 local state pagination
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(5);

  const { createData } = useStoreOutboundDeliveryOrder();
  const [selectedMemoIds, setSelectedMemoIds] = useState<string[]>([]);
  const [selectedMemos, setSelectedMemos] = useState<any[]>([]);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [formDataPreview, setFormDataPreview] = useState<any>(null);
  const [selectedTypeOutbound, setSelectTypeOutbound] = useState<any>(null);

  const options = [
    { label: "AMO", value: "AMO" },
    { label: "SUBDIST", value: "SUBDIST" },
  ];

  const fieldsConfig: FieldConfig[] = [
    { name: "origin", label: "Origin", type: "text" },
    { name: "delivery_date", label: "Delivery Date", type: "date" },
  ];

  const columnsTableItem = [
    { accessorKey: "id", header: "Select", selectedRow: true },
    { accessorKey: "outbound_memo_number", header: "Memo No" },
    {
      accessorKey: "type",
      header: "Type Outbound",
    },
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
      accessorKey: "createdAt",
      header: "Created Date",
      cell: ({ row }: any) => formatDateIndo(row.original.createdAt),
    },
  ];

  // ✅ Selection Handler
  const handleSelectionChange = (selectedIds: string[]) => {
    if (JSON.stringify(selectedIds) !== JSON.stringify(selectedMemoIds)) {
      const filtered = approvedMemos.filter(
        (m) => typeof m.id === "string" && selectedIds.includes(m.id)
      );
      setSelectedMemoIds(selectedIds);
      setSelectedMemos(filtered);
    }
  };

  // ✅ Submit Handler
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

    // 👇 tampilkan dulu di modal sebelum API call
    setFormDataPreview(payload);
    setIsConfirmOpen(true);
  };

  function generateOutboundDONumber() {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");

    const datePart = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(
      now.getDate()
    )}`;
    const timePart = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(
      now.getSeconds()
    )}`;

    const rand = Math.floor(100 + Math.random() * 900); // 3 digit random

    return `DO-${datePart}-${timePart}-${rand}`;
  }

  const handleConfirmSubmit = async (reorderedList: any[]) => {
    const DOnumber = generateOutboundDONumber();

    try {
      const PAYLOAD = {
        outbound_do_number: DOnumber, // akan di-generate oleh backend
        origin: approvedMemos[0]?.origin || "",
        outbound_type: selectedTypeOutbound,
        delivery_date: formatDateIndo(formDataPreview?.delivery_date),
        expedition: "",
        license_plate: "",
        driver_name: "",
        driver_phone: "",
        status: "PENDING",
        outbound_memo_ids: reorderedList.map((m, index) => ({
          memo_id: m.id || m.memo_id, // sesuaikan key ID
          sequence: index + 1,
        })),
      };

      console.log("Final PAYLOAD Create DO to submit:", PAYLOAD);

      const res = await createData(PAYLOAD as any);
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

  const onChangeType = (value: any) => {
    console.log("value selected type:", value);
    setSelectTypeOutbound(value);

    if (!fetchUsingPagination) return;
    fetchUsingPagination({
      page: pageIndex + 1,
      limit: pageSize,
      status: "APPROVED",
      type: value,
    });
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
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <div className="flex space-x-4">
          {/* Add space between items */}
          <div className="flex-1">
            {/* Allow Select to take available space */}
            <Label
              htmlFor="type-outbound"
              className="mb-1 text-sm font-medium text-gray-600"
            >
              Type Outbound
            </Label>
            <Select
              options={options}
              placeholder="Pilih Type"
              onChange={onChangeType}
              value={selectedTypeOutbound}
              className="w-full"
            />
          </div>
          <div className="flex-6">
            {/* Allow DynamicForm to take available space */}
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
          </div>
        </div>
      </section>

      {/* === MEMO List === */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="bg-orange-500 text-white rounded-t-xl px-5 py-3 font-semibold">
          Available Memo
        </div>
        <div className="p-4">
          {isLoading ? (
            <>
              <ActIndicator />
            </>
          ) : (
            <>
              <TableComponent
                data={selectedTypeOutbound ? approvedMemos : []}
                columns={columnsTableItem}
                pageSize={pageSize}
                pageIndex={pageIndex}
                totalPages={pagination.totalPages}
                onPageChange={(page, size) => {
                  setPageIndex(page);
                  setPageSize(size);
                }}
                onSelectionChange={handleSelectionChange}
              />
            </>
          )}
        </div>
      </section>

      {/* === Buttons === */}
      <div className="flex justify-end gap-3 mt-4">
        {/* <Button
          type="button"
          variant="secondary"
          className="bg-gray-200 text-gray-700 hover:bg-gray-300"
          onClick={handleReset}
        >
          Reset
        </Button> */}

        <Button
          type="button"
          onClick={methods.handleSubmit(onFinalSubmit)}
          variant="primary"
          startIcon={<FaCheck />}
          disabled={selectedMemos.length === 0}
        >
          Submit DO
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
