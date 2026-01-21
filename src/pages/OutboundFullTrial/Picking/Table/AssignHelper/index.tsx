import React, { useEffect, useState } from "react";
import TableComponent from "../TableComponent"; // Adjust the import path as necessary
import { useStorePickingAssignHelper } from "../../../../../DynamicAPI/stores/Store/MasterStore";

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
  const { list, fetchAll } = useStorePickingAssignHelper();

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const rawList = Array.isArray(list)
    ? list
    : list && Array.isArray((list as any).data)
    ? (list as any).data
    : [];

  console.log("rawList in AssignHelperTable:", rawList);

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
  ];

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
      picking_user_id: item.picking_user_id ?? "",
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
