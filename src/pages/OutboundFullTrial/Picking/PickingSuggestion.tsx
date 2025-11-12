"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import Button from "../../../components/ui/button/Button";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import TableComponent from "./Table/TableComponent";
import DynamicForm, {
  FieldConfig,
} from "../../../components/wms-components/inbound-component/form/DynamicForm";
import {
  useStoreOutboundMemo,
  useStoreOutboundDelivery,
  useStorePickingSuggestion,
} from "../../../DynamicAPI/stores/Store/MasterStore";
import { useLocation } from "react-router";
import { formatDateIndo } from "../../../helper/FormatDate";
import { FaTasks } from "react-icons/fa";
import SuggestionTable from "./Table/SuggestionTable";
import ModalPickingList from "./Modal/ModalPickingList";

// === Interface Definitions ===
interface SuggestedLocation {
  total_quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  quantity_ready_to_pick: number;
  uom: string;
  warehouse_name: string;
  warehouse_sub_name: string;
  warehouse_sub_code: string;
  warehouse_sub_id: string;
  bin_id: string;
  bin_name: string;
  bin_code: string;
  search_level: string;
  location_type: string;
  location_priority: number;
  week_number: number;
  production_date: string;
  place: string;
}

interface SuggestedItem {
  memo_id: string;
  item_id: string;
  item_name: string;
  item_code: string;
  required_quantity: number;
  already_picked_quantity: number;
  remaining_quantity_needed: number;
  available_quantity: number;
  suggested_locations: SuggestedLocation[];
  total_suggested_quantity: number;
  priority: number;
  notes: string;
}

type MemoFormValues = {
  requestor: string;
  origin: string;
  ship_to: string;
  destination: string;
  delivery_date: string;
  type_outbound?: { label: string; value: string };
};

const PickingSuggestion: React.FC = () => {
  const location = useLocation();
  const { data: deliveryOrderId, mode, title } = location.state || {};
  const isSuggestion = mode === "suggestion";

  const methods = useForm<MemoFormValues>({
    defaultValues: {
      origin: "",
      delivery_date: "",
      type_outbound: undefined,
    },
  });

  const { fetchAll, list } = useStoreOutboundMemo();
  const { fetchById, detail } = useStoreOutboundDelivery();
  const {
    fetchById: fetchPickingSuggestionById,
    detail: pickingSuggestionDetail,
    isLoading: isSuggestionLoading,
  } = useStorePickingSuggestion();

  // const [selectedMemoIds, setSelectedMemoIds] = useState<string[]>([]);
  // const [selectedMemos, setSelectedMemos] = useState<any[]>([]);
  const [selectedMemoForSuggestion, setSelectedMemoForSuggestion] = useState<
    any | null
  >(null);

  const [openModal, setOpenModal] = useState(false);
  const [selectedMemoIdForModal, setSelectedMemoIdForModal] = useState<
    string | null
  >(null);

  // === Fetch Data ===
  useEffect(() => {
    if (isSuggestion) {
      fetchAll();
      if (deliveryOrderId) fetchById(deliveryOrderId);
    }
  }, [isSuggestion, fetchAll, fetchById, deliveryOrderId]);

  // === Approved Memo List ===
  const approvedMemos = useMemo(
    () => list.filter((item) => item.status === "APPROVED"),
    [list]
  );

  // === Set Form Value (Mode Detail) ===
  useEffect(() => {
    if (!detail) return;

    methods.setValue("type_outbound", {
      label: detail.outbound_type || "",
      value: detail.outbound_type || "",
    });

    methods.setValue("origin", detail.origin || "");

    methods.setValue(
      "delivery_date",
      detail.delivery_date ? detail.delivery_date.split("T")[0] : ""
    );

    if (detail.outbound_memos?.length > 0) {
      const memoIds = detail.outbound_memos.map((m: any) => m.id);
      // setSelectedMemoIds(memoIds);
      // setSelectedMemos(detail.outbound_memos);
    }
  }, [detail, methods]);

  // === Field Config ===
  const fieldsConfig: FieldConfig[] = [
    {
      name: "type_outbound",
      label: "Outbound Type",
      type: "select",
      options: [{ label: "AMO", value: "AMO" }],
    },
    { name: "origin", label: "Origin", type: "text" },
    { name: "delivery_date", label: "Delivery Date", type: "date" },
  ];

  // === Table Columns ===
  const columnsTableItem = [
    {
      accessorKey: "memo_id",
      header: "MEMO ID",
      cell: ({ row }: any) => row.original.memo_id || row.original.id,
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
      accessorKey: "created_date",
      header: "Created Date",
      cell: ({ row }: any) => formatDateIndo(row.original.createdAt),
    },
    {
      id: "actions",
      header: "Action",
      cell: ({ row }: { row: any }) => (
        <div className="flex gap-2">
          {isSuggestion ? (
            <Button
              type="button"
              variant="primary"
              className="px-2 py-1 text-xs bg-orange-500 hover:bg-orange-600"
              onClick={() => handleAssignClick(row.original)}
              disabled={isSuggestionLoading}
            >
              {isSuggestionLoading ? "Loading..." : "Picking Suggestion"}
            </Button>
          ) : (
            <FaTasks
              className="size-5 cursor-pointer text-yellow-600 hover:scale-110 transition"
              title="Adjust Memo"
            />
          )}

          <Button
            type="button"
            variant="primary"
            className="px-2 py-1 text-xs bg-orange-500 hover:bg-orange-600"
            onClick={() => handlePickingDetail(row.original.id)}
            disabled={isSuggestionLoading}
          >
            Picking Detail
          </Button>
        </div>
      ),
    },
  ];

  // === Handlers ===
  const handlePickingDetail = (memoId: string) => {
    setSelectedMemoIdForModal(memoId);
    setOpenModal(true);
  };

  const handleAssignClick = (memo: any) => {
    const memoIdToFetch = memo.id || memo.memo_id;
    setSelectedMemoForSuggestion(memo);
    fetchPickingSuggestionById(memoIdToFetch);
  };

  const handleSelectionChange = (selectedIds: string[]) => {
    const filtered = approvedMemos.filter(
      (m) => typeof m.id === "string" && selectedIds.includes(m.id)
    );
    // setSelectedMemoIds(selectedIds);
    // setSelectedMemos(filtered);
  };

  const handleReset = () => {
    methods.reset();
    // setSelectedMemoIds([]);
    // setSelectedMemos([]);
    setSelectedMemoForSuggestion(null);
  };

  // === Display Suggestion Table ===
  if (selectedMemoForSuggestion) {
    const memoId =
      selectedMemoForSuggestion.id || selectedMemoForSuggestion.memo_id;

    const memoItems = Array.isArray(pickingSuggestionDetail)
      ? pickingSuggestionDetail.filter(
          (item: SuggestedItem) => item.memo_id === memoId
        )
      : [];

    if (isSuggestionLoading && memoItems.length === 0) {
      return (
        <div className="flex justify-center items-center h-96">
          <p className="text-xl font-medium text-orange-500">
            Loading Suggestions...
          </p>
        </div>
      );
    }

    return (
      <SuggestionTable
        memoDetail={selectedMemoForSuggestion}
        suggestionItems={memoItems as SuggestedItem[]}
        onBack={() => setSelectedMemoForSuggestion(null)}
        deliveryOrder={detail}
      />
    );
  }

  // === Default Layout ===
  return (
    <div className="p-6 space-y-6">
      <PageBreadcrumb
        breadcrumbs={[
          { title: "Delivery Order List", path: "/outbound_do" },
          { title: title || "Detail", path: "#" },
        ]}
      />

      {/* === FORM DETAIL === */}
      <section className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
        <h3 className="font-semibold text-gray-700 text-lg mb-3">{title}</h3>

        <DynamicForm
          fields={fieldsConfig}
          onSubmit={methods.handleSubmit(() => {})}
          control={methods.control}
          register={methods.register}
          setValue={methods.setValue}
          handleSubmit={methods.handleSubmit}
          isEditMode={!isSuggestion}
          watch={methods.watch}
        />
      </section>

      {/* === MEMO LIST === */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="bg-orange-500 text-white rounded-t-xl px-5 py-3 font-semibold">
          Memo List
        </div>
        <div className="p-4">
          <TableComponent
            data={
              (isSuggestion
                ? (detail?.outbound_memos || []).filter(
                    (m: any) => typeof m.id === "string"
                  )
                : approvedMemos.filter(
                    (m: any) => typeof m.id === "string"
                  )) as any[]
            }
            columns={columnsTableItem}
            pageSize={10}
            onSelectionChange={handleSelectionChange}
          />
        </div>
      </section>

      {!isSuggestion && (
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
            onClick={methods.handleSubmit(() => {})}
          >
            Confirm DO
          </Button>
        </div>
      )}

      <ModalPickingList
        open={openModal}
        onClose={() => setOpenModal(false)}
        memoId={selectedMemoIdForModal || ""}
      />
    </div>
  );
};

export default PickingSuggestion;
