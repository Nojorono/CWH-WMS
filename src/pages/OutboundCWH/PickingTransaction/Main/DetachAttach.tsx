"use client";
import React, { useMemo, useState } from "react";
import Button from "../../../../components/ui/button/Button";
import PageBreadcrumb from "../../../../components/common/PageBreadCrumb";
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
import CancelTransactionPickModal from "../Modal/CancelTransactionPickModal";
import AttachMemoModal from "../Modal/AttachMemoModal"; //
import Swal from "sweetalert2";
import DetailMemoModal from "../Modal/DetailMemoModal";
import KeyValueCard from "../../Picking/Helper/KeyValueCard";
import { showErrorToast, showSuccessToast } from "../../../../components/toast";
import TableComponent from "../../../../components/tables/ActionTable/TableComponent";
import { usePersistAuthStore } from "../../../../API/store/AuthStore/PersistAuthStore";
import axiosInstance from "../../../../DynamicAPI/AxiosInstance";
import { ActionMenu } from "../components";

const DetachAttach: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { params } = location.state || {};
  const statusDO = params.status;
  const user = usePersistAuthStore((state) => state.user);
  const roleName = user?.role?.name;

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

  const canApproveDO = useMemo(() => {
    // Syarat: role SUPERVISOR DAN minimal 1 SKU sudah scan picking
    if (roleName === "SUPERVISOR") {
      return outboundMemos.some((memo: any) =>
        memo.transaction_pickings?.some(
          (tp: any) => tp.transactionScanPicking?.length > 0,
        ),
      );
    }
    // Role lain tidak bisa approve
    return false;
  }, [outboundMemos, roleName]);

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
      enableSorting: false,
      cell: ({ row }: { row: any }) => {
        const items = row.original.transaction_pickings;
        const memoNumber = row.original.outbound_memo_number;

        const actionList = [
          {
            label: "Lihat Detail Picking",
            icon: FaEye,
            onClick: () => {
              setSelectedItems(items);
              setIsModalOpen(true);
            },
            className: "text-blue-600",
            visible: true,
          },
          {
            label: `Lepas Memo`,
            icon: FaTasks,
            onClick: () => handleDetachMemo(row.original),
            className: "text-orange-600",
            visible: statusDO === "IN_PROGRESS",
            
          },
          {
            label: "Batalkan Task Picking",
            icon: FaRegWindowClose,
            onClick: () => handleDetachTransactionPicking(row.original),
            className: "text-red-600",
            visible: statusDO === "IN_PROGRESS",
          },
        ].filter((action) => action.visible);

        return <ActionMenu actions={actionList} />;
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

    if (!result.isConfirmed) return;

    try {
      await axiosInstance.patch(`outbound-do/${params.id}/detach-memo`, null, {
        params: { memoId },
      });

      //cek DO dahulu jika punya memo jgn di update pending
      const memoRemainingCount = outboundMemos.length - 1;

      if (memoRemainingCount === 0) {
        try {
          // Hanya update status ke PENDING jika tidak ada memo sama sekali yang tersisa
          await axiosInstance.patch(`outbound-do/${params.id}`, {
            status: "PENDING",
          });
        } catch (err) {
          console.error(
            "Failed to update DO status to PENDING via axiosInstance:",
            err,
          );
          showErrorToast("Gagal mengubah status DO menjadi PENDING");
        }
      } else {
        console.log(
          `DO masih memiliki ${memoRemainingCount} memo tersisa. Status tidak diubah ke PENDING.`,
        );
      }

      showSuccessToast(`Memo ${memoNumber} berhasil dilepas dari DO`);
      navigate("/picking_transaction");
    } catch (error: any) {
      console.error("Error detaching memo via axiosInstance:", error);

      const errorMsg =
        error.response?.data?.message || "Gagal melepas memo dari DO";
      showErrorToast(errorMsg);
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
        "Minimal harus 1 SKU sudah di-scan picking untuk menyetujui DO ini.",
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
            Picking Order Details
          </h3>

          <div className="flex gap-2">
            {statusDO != "IN_PROGRESS" && statusDO != "COMPLETED" ? null : (
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
      <div className="p-2">
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
