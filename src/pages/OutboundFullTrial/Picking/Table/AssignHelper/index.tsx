import React, { useEffect, useState } from "react";
import TableComponent from "../TableComponent";
import { useStorePickingAssignHelper } from "../../../../../DynamicAPI/stores/Store/MasterStore";
import { FaTrash } from "react-icons/fa"; // Menggunakan FaTrash sesuai preferensi

interface AssignHelperTableProps {
  memoId?: string | null;
  detailData?: any;
}

const AssignHelperTable: React.FC<AssignHelperTableProps> = ({
  memoId,
  detailData,
}) => {
  const [globalFilter, setGlobalFilter] = useState<string>("");
  const [pageIndex, setPageIndex] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const { list, fetchAll, deleteData } = useStorePickingAssignHelper();

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const rawList = Array.isArray(list)
    ? list
    : list && Array.isArray((list as any).data)
      ? (list as any).data
      : [];

  const columns = [
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
            className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors"
            title="Delete Helper"
          >
            <FaTrash size={16} />
          </button>
        </div>
      ),
    },
  ];

  const handleDelete = async (id: string) => {
    console.log("ID yang akan dihapus:", id);
    try {
      await deleteData(id);
      fetchAll();
    } catch (error) {
      console.error("Error saat menghapus:", error);
    }
  };

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
