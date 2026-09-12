import React, { useEffect, useMemo, useState } from "react";
import TableComponent from "../TableComponent";
import { useStorePickingAssignHelper } from "../../../../../DynamicAPI/stores/Store/MasterStore";
import { FaTrash } from "react-icons/fa";
import { showErrorToast } from "../../../../../components/toast";

interface AssignHelperTableProps {
  memoId?: string | null;
  detailData?: any;
  doStatus?: string;
}

const AssignHelperTable: React.FC<AssignHelperTableProps> = ({
  memoId,
  detailData,
  doStatus,
}) => {  const [globalFilter, setGlobalFilter] = useState<string>("");
  const [pageIndex, setPageIndex] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const { list, fetchAll, deleteData } = useStorePickingAssignHelper();

  const resolvedDoStatus = doStatus ?? detailData?.status ?? "";
  const canDeleteHelper = resolvedDoStatus === "PENDING";

  useEffect(() => {    fetchAll();
  }, [fetchAll]);

  const rawList = Array.isArray(list)
    ? list
    : list && Array.isArray((list as any).data)
      ? (list as any).data
      : [];

  const handleDelete = async (id: string) => {
    if (!canDeleteHelper) {
      showErrorToast(
        "Helper tidak dapat dihapus karena status DO sudah bukan PENDING.",
      );
      return;
    }

    try {
      await deleteData(id);
      fetchAll();
    } catch (error) {
      console.error("Error saat menghapus:", error);
    }
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: "outbound_memo_number",
        header: "Memo Number",
      },
      {
        accessorKey: "picking_name",
        header: "Helper Name",
      },
      {
        accessorKey: "picking_phone",
        header: "Helper Phone",
      },
      {
        accessorKey: "action",
        header: "Action",
        cell: ({ row }: any) => (
          <div>
            <button
              type="button"
              onClick={() => handleDelete(row.original.picking_user_id)}
              disabled={!canDeleteHelper}
              className={`p-2 rounded-md transition-colors ${
                canDeleteHelper
                  ? "text-red-500 hover:bg-red-50"
                  : "text-slate-300 cursor-not-allowed"
              }`}
              title={
                canDeleteHelper
                  ? "Delete Helper"
                  : "Helper tidak dapat dihapus karena DO sudah bukan PENDING"
              }
            >
              <FaTrash size={16} />
            </button>
          </div>
        ),
      },
    ],
    [canDeleteHelper],
  );
  const memoIdsFromDetail: string[] | undefined = (() => {
    if (!detailData) return undefined;
    if (Array.isArray(detailData.memo_id) && detailData.memo_id.length)
      return detailData.memo_id;
    if (
      Array.isArray(detailData.outbound_memos) &&
      detailData.outbound_memos.length
    )
      return detailData.outbound_memos.map((m: any) => m.id).filter(Boolean);
    return undefined;
  })();

  const mappedData = rawList
    .filter((item: any) => {
      if (!memoIdsFromDetail || memoIdsFromDetail.length === 0) return true;
      const itemMemoId = item.memo_id ?? item.memo?.id ?? "";
      if (Array.isArray(itemMemoId)) {
        return itemMemoId.some((id) => memoIdsFromDetail.includes(id));
      }
      return !!itemMemoId && memoIdsFromDetail.includes(itemMemoId);
    })
    .map((item: any) => ({
      // Pastikan picking_user_id atau ID utama lainnya dipetakan di sini
      picking_user_id: item.id ?? item.picking_user_id ?? "",
      picking_name: item.picking_name ?? "",
      picking_phone: item.picking_phone ?? "",
      memo_id: item.memo_id ?? item.memo?.id ?? "",
      status: item.memo?.status ?? item.status ?? "N/A",
      outbound_memo_number: item.memo?.outbound_memo_number ?? "N/A",
    }));

  return (
    <TableComponent
      data={mappedData}
      columns={columns}
      globalFilter={globalFilter}
      setGlobalFilter={setGlobalFilter}
      pageIndex={pageIndex}
      pageSize={pageSize}
      onPageChange={(page, size) => {
        setPageIndex(page);
        setPageSize(size);
      }}
    />
  );
};

export default AssignHelperTable;
