"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Button from "../../../../components/ui/button/Button";
import PageBreadcrumb from "../../../../components/common/PageBreadCrumb";
import TableComponent from "../Table/TableComponent";
import { useStoreOutboundDeliveryOrder } from "../../../../DynamicAPI/stores/Store/MasterStore";
import { useLocation, useNavigate } from "react-router";
import { formatDateIndo } from "../../../../helper/FormatDate";
import {
  FaArrowLeft,
  FaCheck,
  FaEye,
  FaPlus,
  FaRegWindowClose,
  FaTasks,
} from "react-icons/fa";
import { EndPoint } from "../../../../utils/EndPoint";
import CancelTransactionPickModal from "../Modal/CancelTransactionPickModal";
import AttachMemoModal from "../Modal/AttachMemoModal"; //
import Swal from "sweetalert2";
import DetailMemoModal from "../Modal/DetailMemoModal";
import KeyValueCard from "../../Picking/Helper/KeyValueCard";
import { showErrorToast } from "../../../../components/toast";

const DetachAttach: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { params } = location.state || {};
  const statusDO = params.status;

  // 🔹 local state pagination
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const [modalDetachOpen, setModalDetachOpen] = useState(false); // State untuk modal
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null); // State untuk menyimpan transaksi yang dipilih
  const [isAttachModalOpen, setIsAttachModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false); // State untuk modal
  const [selectedItems, setSelectedItems] = useState<any[]>([]); // State untuk menyimpan item yang dipilih

  const { updateData } = useStoreOutboundDeliveryOrder();

  // Mapping outbound_memos dari params
  const outboundMemos = params?.outbound_memos || [];

  console.log("outbound memos detech attach", outboundMemos);

  const canApproveDO = React.useMemo(() => {
    return outboundMemos.some((memo: any) =>
      memo.transaction_pickings?.some(
        (tp: any) => tp.transactionScanPicking?.length > 0
      )
    );
  }, [outboundMemos]);

  const columnsTableItem = [
    { accessorKey: "outbound_memo_number", header: "Memo No" },
    { accessorKey: "origin", header: "Origin" },
    { accessorKey: "ship_to", header: "Ship To" },
    { accessorKey: "destination", header: "Destination" },
    {
      accessorKey: "delivery_date",
      header: "Delivery Date",
      cell: ({ row }: any) => formatDateIndo(row.original.delivery_date),
    },
    {
      accessorKey: "type",
      header: "Type Outbound",
    },
    {
      accessorKey: "has_do",
      header: "Has DO Number",
      cell: ({ row }: any) => <span>{row.original.has_do ? "Yes" : "No"}</span>,
    },
    {
      accessorKey: "notes", // New column for notes
      header: "Notes",
      cell: ({ row }: any) => <span>{row.original.notes}</span>,
    },
    {
      id: "assigned_pickings", // New column for assigned picking
      header: "Picker",
      cell: ({ row }: any) => {
        const assigned = row.original.assigned_pickings[0];
        return assigned ? (
          <span>{`${assigned.picking_name} (${assigned.picking_phone})`}</span>
        ) : (
          <span>-</span>
        );
      },
    },
    {
      id: "actions",
      header: "Action",
      cell: ({ row }: { row: any }) => {
        const items = row.original.transaction_pickings;

        return (
          <div className="flex items-center gap-1.5">
            {/* Show Detail */}
            <Button
              size="sm"
              variant="action"
              title="Show Detail Items"
              className="px-2 py-1 min-w-[32px]"
              startIcon={<FaEye size={12} />}
              onClick={() => {
                setSelectedItems(items);
                setIsModalOpen(true);
              }}
              children={undefined}
            />

            {/* Lepas Memo */}
            {statusDO === "IN_PROGRESS" ? (
              <>
                <Button
                  size="sm"
                  type="button"
                  variant="primary"
                  title="Lepas Memo"
                  onClick={() => handleDetachMemo(row.original)}
                  startIcon={<FaTasks size={12} />}
                  className="px-2 py-1 min-w-[32px]"
                  children={undefined}
                />

                <Button
                  size="sm"
                  type="button"
                  variant="danger"
                  title="Cancel Suggestion Task"
                  onClick={() => handleDetachTransactionPicking(row.original)}
                  startIcon={<FaRegWindowClose size={12} />}
                  className="px-2 py-1 min-w-[32px]"
                  children={undefined}
                />
              </>
            ) : null}
          </div>
        );
      },
    },
  ];

  const handleDetachMemo = async (memoData: any) => {
    const memoId = memoData.id;
    const memoNumber = memoData.outbound_memo_number;
    const doNumber = params?.outbound_do_number;

    const result = await Swal.fire({
      title: "Apakah Anda yakin?",
      text: `Anda akan lepas Memo ${memoNumber} dari DO ${doNumber}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, lepas Memo ini!",
      cancelButtonText: "Batal",
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${EndPoint}outbound-do/${params.id}/detach-memo?memoId=${memoId}`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        navigate("/picking_transaction");
      } catch (error) {
        console.error("Error detaching memo:", error);
      }
    }
  };

  const handleDetachTransactionPicking = async (transaction: {
    transaction_pickings: any[];
  }) => {
    setSelectedTransaction(transaction); // Set transaksi yang dipilih
    setModalDetachOpen(true); // Buka modal
  };

  const handleApproveDO = async () => {
    if (!canApproveDO) {
      showErrorToast(
        "Minimal harus 1 SKU sudah di-scan picking untuk menyetujui DO ini."
      );
      return;
    }

    const result = await Swal.fire({
      title: "Apakah Anda yakin?",
      text: `Approve ${params?.outbound_do_number} dengan kondisi memo, picking item dan hasil scan picking ini.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, setujui!",
      cancelButtonText: "Batal",
    });

    if (result.isConfirmed) {
      const id = params.id;
      const res = await updateData(id, {
        status: "APPROVED",
      });

      if (res?.success) {
        navigate("/picking_transaction");
      }
    }
  };

  const handleBack = () => {
    navigate(-1); // Ini akan membawa kembali ke /memo?page=x
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <PageBreadcrumb
          breadcrumbs={[
            { title: "Picking Transaction", path: "/picking_transaction" },
            { title: "Lepas Memo & Cancel Task", path: "#" },
          ]}
        />

        <Button
          variant="primary"
          onClick={handleBack}
          startIcon={<FaArrowLeft />}
        >
          Back to List DO
        </Button>
      </div>

      <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        {/* HEADER + ACTIONS */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-gray-800 text-lg">
            Delivery Order Details
          </h3>

          <div className="flex gap-2">
            {statusDO === "APPROVED" || statusDO === "APPROVED_LOAD" ? null : (
              <Button
                size="sm"
                variant="secondary"
                onClick={handleApproveDO}
                startIcon={<FaCheck className="size-5" />}
                disabled={!canApproveDO}
              >
                Confirmation DO
              </Button>
            )}
          </div>
        </div>

        {/* KEY VALUE CONTENT */}
        <KeyValueCard
          title="" // <- kosongkan title bawaan
          data={{
            do_id: params?.id,
            outbound_do_number: params?.outbound_do_number,
            origin: params?.origin,
            outbound_type: params?.outbound_type,
            status: params?.status,
            delivery_date: formatDateIndo(params?.delivery_date),
          }}
          labelMap={{
            do_id: "DO ID",
            outbound_do_number: "Outbound DO Number",
            origin: "Origin",
            outbound_type: "Outbound Type",
            status: "Status",
            delivery_date: "Delivery Date",
          }}
        />
      </section>

      {/* === MEMO List === */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="bg-orange-500 text-white rounded-t-xl px-5 py-3 font-semibold">
          Memo Transaction List
        </div>
        <div className="p-4">
          <>
            <div className="flex justify-end mb-4">
              {statusDO === "APPROVED" || statusDO === "APPROVED_LOAD" ? null : (
                <Button
                  size="sm"
                  type="button"
                  variant="action"
                  startIcon={<FaPlus className="size-5" />}
                  onClick={() => setIsAttachModalOpen(true)}
                >
                  Attach Memo
                </Button>
              )}
            </div>

            <TableComponent
              data={outboundMemos}
              columns={columnsTableItem}
              pageSize={pageSize}
              pageIndex={pageIndex}
              onPageChange={(page, size) => {
                setPageIndex(page);
                setPageSize(size);
              }}
            />
          </>
        </div>
      </section>

      {/* === Modal Attach Memo === */}
      <AttachMemoModal
        isOpen={isAttachModalOpen}
        onRequestClose={() => setIsAttachModalOpen(false)}
        detailDO={params}
      />

      {/* === Modal Detach Transaction === */}
      <CancelTransactionPickModal
        isOpen={modalDetachOpen}
        onRequestClose={() => setModalDetachOpen(false)}
        transactionData={selectedTransaction}
      />

      {/* Modal untuk menampilkan item */}
      <DetailMemoModal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        items={selectedItems}
      />
    </div>
  );
};

export default DetachAttach;
