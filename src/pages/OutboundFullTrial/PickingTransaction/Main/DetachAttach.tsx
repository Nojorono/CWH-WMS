"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Button from "../../../../components/ui/button/Button";
import PageBreadcrumb from "../../../../components/common/PageBreadCrumb";
import TableComponent from "../Table/TableComponent";
import { useStoreOutboundMemo } from "../../../../DynamicAPI/stores/Store/MasterStore";
import { useLocation, useNavigate } from "react-router";
import { formatDateIndo } from "../../../../helper/FormatDate";
import ActIndicator from "../../../../components/ui/activityIndicator";
import { FaPlus, FaRegWindowClose, FaTasks } from "react-icons/fa";
import { EndPoint } from "../../../../utils/EndPoint";
import DetachTransactionModal from "../Modal/DetachTransactionModal"; // Import modal
import AttachMemoModal from "../Modal/AttachMemoModal"; //
import { showErrorToast } from "../../../../components/toast";
import Swal from "sweetalert2";

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

const DetachAttach: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { mode, params } = location.state || {};

  // const methods = useForm<MemoFormValues>({
  //   defaultValues: {
  //     requestor: "",
  //     origin: "",
  //     ship_to: "",
  //     destination: "",
  //     delivery_date: "",
  //   },
  // });

  // 🔹 local state pagination
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [modalDetachOpen, setModalDetachOpen] = useState(false); // State untuk modal
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null); // State untuk menyimpan transaksi yang dipilih
  const [isAttachModalOpen, setIsAttachModalOpen] = useState(false);
  const [isAttachTransactionModalOpen, setIsAttachTransactionModalOpen] =
    useState(false); // Tambahkan state untuk modal attach

  // Mapping outbound_memos dari params
  const outboundMemos = params?.outbound_memos || [];

  const columnsTableItem = [
    { accessorKey: "id", header: "memo Id" },
    { accessorKey: "outbound_memo_number", header: "Memo No" },
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
      accessorKey: "delivery_date",
      header: "Delivery Date",
      cell: ({ row }: any) => formatDateIndo(row.original.delivery_date),
    },
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
          <Button
            size="xsm"
            type="button"
            variant="primary"
            onClick={() => handleDetachMemo(row.original.id)}
            startIcon={<FaRegWindowClose className="size-5" />}
          >
            Detach Memo from this DO
          </Button>

          <Button
            size="xsm"
            type="button"
            variant="danger"
            onClick={() => handleDetachTransactionPicking(row.original)}
            disabled={row.original.transaction_pickings.length === 0} // Disable jika tidak ada transaction_pickings
            startIcon={<FaTasks className="size-5" />}
          >
            Detach Transaction Picking from this Memo
          </Button>
        </div>
      ),
    },
  ];

  const handleDetachMemo = async (memoId: string) => {
    const result = await Swal.fire({
      title: "Apakah Anda yakin?",
      text: `Anda akan detach memo_id ${memoId} dari DO ${params?.id}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, detach Memo ini!",
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
    // Cek apakah transaction_pickings kosong
    if (transaction.transaction_pickings.length === 0) {
      showErrorToast(
        "Tidak ada transaksi picking yang dapat di-detach dalam Memo ini."
      );
      return; // Tidak membuka modal
    }

    setSelectedTransaction(transaction); // Set transaksi yang dipilih
    setModalDetachOpen(true); // Buka modal
  };

  const detachTransactionPicking = async (transactionId: string) => {
    const memoId = selectedTransaction?.id; // Ambil memoId dari selectedTransaction
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${EndPoint}transaction-picking/memo/${memoId}/detach`, // Ganti dengan endpoint yang sesuai
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
      setModalDetachOpen(false); // Tutup modal setelah detach
      navigate("/picking_transaction");
    } catch (error) {
      console.error("Error detaching transaction:", error);
    }
  };

  const handleAttachTransactionPicking = async (transaction: any[]) => {
    console.log("Attaching transaction picking to memo:", transaction);

    setSelectedTransaction(transaction);
    setIsAttachTransactionModalOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      <PageBreadcrumb
        breadcrumbs={[
          { title: "Picking Transaction", path: "/picking_transaction" },
          { title: "Detach and Attach Process", path: "#" },
        ]}
      />

      {/* === Delivery Order Details === */}
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <div className="flex space-x-8">
          <div className="flex flex-col space-y-4">
            <div className="flex flex-col">
              <label className="font-semibold">Origin:</label>
              <span>{params?.origin}</span>
            </div>
            <div className="flex flex-col">
              <label className="font-semibold">Outbound Type:</label>
              <span>{params?.outbound_type}</span>
            </div>
          </div>
          <div className="flex flex-col space-y-4">
            <div className="flex flex-col">
              <label className="font-semibold">DO ID:</label>
              <span>{params?.id}</span>
            </div>
            <div className="flex flex-col">
              <label className="font-semibold">Outbound DO Number:</label>
              <span>{params?.outbound_do_number}</span>
            </div>
          </div>
        </div>
      </section>

      {/* === MEMO List === */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="bg-orange-500 text-white rounded-t-xl px-5 py-3 font-semibold">
          Memo List
        </div>
        <div className="p-4">
          <>
            <div className="flex justify-end mb-4">
              <Button
                size="sm"
                type="button"
                variant="secondary"
                startIcon={<FaPlus className="size-5" />}
                onClick={() => setIsAttachModalOpen(true)}
              >
                Attach Memo
              </Button>
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
      <DetachTransactionModal
        isOpen={modalDetachOpen}
        onRequestClose={() => setModalDetachOpen(false)}
        transactionData={selectedTransaction}
        onDetach={async (transactionId: string) => {
          await detachTransactionPicking(transactionId); // Panggil fungsi detach
        }}
      />
    </div>
  );
};

export default DetachAttach;
