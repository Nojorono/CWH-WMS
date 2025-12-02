"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import Button from "../../../../components/ui/button/Button";
import PageBreadcrumb from "../../../../components/common/PageBreadCrumb";
import TableComponent from "../Table/TableComponent";
import DynamicForm, {
  FieldConfig,
} from "../../../../components/wms-components/inbound-component/form/DynamicForm";
import {
  useStoreOutboundMemo,
  useStoreOutboundDelivery,
  useStorePickingSuggestion,
  useStorePickingAssignHelper,
} from "../../../../DynamicAPI/stores/Store/MasterStore";
import { useLocation } from "react-router";
import { formatDateIndo } from "../../../../helper/FormatDate";
import { FaClipboardList, FaEye, FaTasks, FaUsers } from "react-icons/fa";
import SuggestionTable from "../Table/SuggestionPicking/SuggestionTable";
import ModalPickingList from "../Modal/ModalPickingList";
import ModalAssignHelper from "../Modal/ModalAssignHelper";

import TabsSection from "../../../../components/wms-components/inbound-component/tabs/TabsSection";
import { SuggestedItem, MemoFormValues } from "../Types/types";
import AssignHelperTable from "../Table/AssignHelper";

const PickingSuggestion: React.FC = () => {
  const location = useLocation();
  const { data: deliveryOrderId, mode, title } = location.state || {};
  const isSuggestion = mode === "suggestion";
  const [activeTab, setActiveTab] = useState(0);
  const [assignHelperOpen, setAssignHelperOpen] = useState(false);
  const [assignHelperMemoId, setAssignHelperMemoId] = useState<string | null>(
    null
  );

  const methods = useForm<MemoFormValues>({
    defaultValues: {
      origin: "",
      delivery_date: "",
      type_outbound: undefined,
    },
  });

  const { fetchAll: fetchAllMemos, list: memoList } = useStoreOutboundMemo();
  const { fetchById, detail } = useStoreOutboundDelivery();
  const { createData } = useStorePickingAssignHelper();
  const {
    fetchById: fetchPickingSuggestionById,
    detail: pickingSuggestionDetail,
    isLoading: isSuggestionLoading,
  } = useStorePickingSuggestion();

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
      fetchAllMemos();
      if (deliveryOrderId) fetchById(deliveryOrderId);
    }
  }, [isSuggestion, fetchAllMemos, fetchById, deliveryOrderId]);

  // === Approved Memo List ===
  const approvedMemos = useMemo(
    () => memoList.filter((item) => item.status === "APPROVED"),
    [memoList]
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
  const columnSuggestionPick = [
    // {
    //   accessorKey: "memo_id",
    //   header: "MEMO ID",
    //   cell: ({ row }: any) => row.original.memo_id || row.original.id,
    // },
    {
      accessorKey: "outbound_memo_number",
      header: "Memo ID",
      cell: ({ row }: any) => row.original.outbound_memo_number,
    },
    { accessorKey: "origin", header: "Origin" },
    { accessorKey: "destination", header: "Destination" },
    { accessorKey: "ship_to", header: "Ship To" },
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
      id: "actions",
      header: "Action",
      cell: ({ row }: { row: any }) => (
        <div className="flex gap-2">
          {isSuggestion ? (
            <Button
              type="button"
              variant="primary"
              onClick={() => handleAssignClick(row.original)}
              disabled={isSuggestionLoading}
              size="xsm"
              startIcon={<FaClipboardList className="size-5" />}
            >
              {isSuggestionLoading ? "Loading..." : "Picking Suggestion Item"}
            </Button>
          ) : (
            <FaTasks
              className="size-5 cursor-pointer text-yellow-600 hover:scale-110 transition"
              title="Adjust Memo"
            />
          )}

          <Button
            type="button"
            variant="secondary"
            onClick={() => handlePickingDetail(row.original.id)}
            disabled={isSuggestionLoading}
            size="xsm"
            startIcon={<FaEye className="size-5" />}
          >
            Picking Detail
          </Button>

          <Button
            type="button"
            variant="action"
            onClick={() => handleAssignHelper(row.original.id)}
            disabled={isSuggestionLoading}
            size="xsm"
            startIcon={<FaUsers className="size-5" />}
          >
            Assign Helper
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
    fetchPickingSuggestionById(memoIdToFetch);
    setSelectedMemoForSuggestion(memo);
  };

  // update: open AssignHelper modal and pass memoId
  const handleAssignHelper = (memoId: string) => {
    console.log("Assign Helper clicked for memoId:", memoId);
    setAssignHelperMemoId(memoId);
    setAssignHelperOpen(true);
  };

  // callback when AssignHelper submits
  const handleAssignHelperSubmit = async (payload: any) => {
    console.log("AssignHelper payload:", payload);
    // TODO: call API / store action to persist assignment if needed

    const res = await createData(payload);
    if (res?.success) {
      setAssignHelperOpen(false);
      setAssignHelperMemoId(null);
      // navigate("/inbound_planning");
    }
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

    // FILTER: ambil item yang memo_id cocok
    // + tambahkan filter supaya remaining_quantity_needed !== 0
    const memoItems = Array.isArray(pickingSuggestionDetail)
      ? pickingSuggestionDetail
          .filter((item: SuggestedItem) => item.memo_id === memoId)
          .filter((item: SuggestedItem) => item.remaining_quantity_needed !== 0)
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

      <TabsSection
        tabs={[
          {
            label: "Memo List",
            content: (
              <>
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
                      columns={columnSuggestionPick}
                      pageSize={10}
                      onSelectionChange={handleSelectionChange}
                    />
                  </div>
                </section>
              </>
            ),
          },
          {
            label: "Helper List",
            content: (
              <>
                <section className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="bg-orange-500 text-white rounded-t-xl px-5 py-3 font-semibold">
                    Helper List
                  </div>
                  <div className="p-4">
                    <AssignHelperTable detailData={detail} />
                  </div>
                </section>
              </>
            ),
          },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

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

      {/* AssignHelper modal */}
      {assignHelperOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{ zIndex: 99999 }}
        >
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setAssignHelperOpen(false)}
          />
          <div className="relative bg-white rounded-lg shadow-lg w-[640px] max-w-full p-4 z-10">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold">Assign Helper</h3>
              <button
                className="text-gray-500"
                onClick={() => setAssignHelperOpen(false)}
              >
                Close
              </button>
            </div>

            <ModalAssignHelper
              memoId={assignHelperMemoId || undefined}
              onSubmit={handleAssignHelperSubmit}
              isDetail={false}
              isEdit={false}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PickingSuggestion;
