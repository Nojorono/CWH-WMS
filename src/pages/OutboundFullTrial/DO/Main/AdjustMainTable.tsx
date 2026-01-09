import { useEffect, useMemo, useState } from "react";
import { FaEye, FaEdit, FaAdjust, FaTasks, FaTrash } from "react-icons/fa";
import { ColumnDef } from "@tanstack/react-table";
import TableComponent from "../Table/TableComponent";
import { useNavigate } from "react-router-dom";
import StatusBadge from "../../../../common/statusBadge";
import { STATUS_MAP_DO } from "../../../../constants/statusMaps";
import { useStoreOutboundDeliveryOrder } from "../../../../DynamicAPI/stores/Store/MasterStore";
import Swal from "sweetalert2";
import { showErrorToast } from "../../../../components/toast";
import { EndPoint } from "../../../../utils/EndPoint";

type OutboundMemo = {
  id: string;
  requestor: string;
  origin: string;
  shipTo: string;
  destination: string;
  deliveryDate: string;
  status: string;
  notes: string;
};

type MemoData = {
  no: number;
  id: string;
  outboundDoNumber: string;
  expedition: string;
  origin: string;
  licensePlate: string;
  driverName: string;
  driverPhone: string;
  status: string;
  outboundType: string;
  deliveryDate: string;
  memoId: string[];
  outboundMemos: OutboundMemo[];
  outboundMemosDetailed: any[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

type MenuTableProps = {
  globalFilter?: string;
  setGlobalFilter?: (value: string) => void;
  onDetail?: (id: string) => void;
  onRefresh?: () => void;
  filteredStatus?: any;
  filteredTypeOutbound?: any;
};

const AdjustTable = ({
  globalFilter,
  setGlobalFilter,
  filteredStatus,
  filteredTypeOutbound,
}: MenuTableProps) => {
  const navigate = useNavigate();

  const { fetchUsingPagination, list, pagination } =
    useStoreOutboundDeliveryOrder();

  // 🔹 local state pagination
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(5);

  // 🔹 Fetch data setiap kali pagination / search berubah
  useEffect(() => {
    if (!fetchUsingPagination) return;
    fetchUsingPagination({
      page: pageIndex + 1, // jika backend 1-based
      limit: pageSize,
      search: globalFilter || "",
      status: filteredStatus || "",
      outbound_type: filteredTypeOutbound || "",
    });
  }, [fetchUsingPagination, pageIndex, pageSize, globalFilter, filteredStatus, filteredTypeOutbound]);

  console.log("Outbound DO List:", list);

  const handleDetail = (id: string) => {
    console.log("Detail Memo ID:", id);
    navigate("/outbound_do/detail", {
      state: { data: id, mode: "detail", title: "Detail Memo" },
    });
  };

  const handleAdjust = (id: string) => {
    console.log("DO Id:", id);
    navigate("/outbound_do/picking_suggestion", {
      state: { data: id, mode: "suggestion", title: "Picking Suggestion" },
    });
  };

  const handleDeleteDO = async (id: string) => {
    const confirm = await Swal.fire({
      icon: "warning",
      title: "Cancel DO",
      text: `Yakin cancel DO ini ?`,
      showCancelButton: true,
      confirmButtonText: "Ya, batalkan",
      cancelButtonText: "Batal",
    });

    if (!confirm.isConfirmed) return;

    try {
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${EndPoint}outbound-do/${id}/cancel`, {
        method: "PATCH",
        headers,
      });

      if (!res.ok) {
        const txt = await res.text();
        showErrorToast(`Gagal cancel DO: ${res.status} ${txt}`);
        return;
      }

      // refresh list
      if (fetchUsingPagination) {
        fetchUsingPagination({
          page: pageIndex + 1,
          limit: pageSize,
          search: globalFilter || "",
          status: filteredStatus || "",
        });
      }
    } catch (err) {
      console.error(err);
      showErrorToast("Terjadi kesalahan saat membatalkan DO");
    }
  };

  const roleName = localStorage.getItem("role_name");

  const MemoCell = ({ memos }: { memos: any[] }) => {
    const [openMemoId, setOpenMemoId] = useState<string | null>(null);

    if (!Array.isArray(memos) || memos.length === 0) {
      return <div className="text-sm italic text-slate-500">No memos</div>;
    }

    return (
      <ul className="space-y-2">
        {memos.map((memo) => {
          const isOpen = openMemoId === memo.id;

          // prefer transaction_pickings (detailed pick records). fallback to outbound_memo_items
          let items: any[] = [];
          if (
            Array.isArray(memo.transaction_pickings) &&
            memo.transaction_pickings.length > 0
          ) {
            items = memo.transaction_pickings.map((tp: any) => ({
              id: tp.id,
              sku: tp.item?.sku ?? tp.item?.item_number ?? "-",
              quantity: tp.quantity ?? 0,
              uom: tp.uom ?? "-",
              week: tp.week_number ?? "-",
            }));
          } else if (
            Array.isArray(memo.outbound_memo_items) &&
            memo.outbound_memo_items.length > 0
          ) {
            items = memo.outbound_memo_items.map((mi: any) => ({
              id: mi.id,
              sku: mi.item?.sku ?? mi.item?.item_number ?? "-",
              quantity: mi.quantity_plan ?? 0,
              uom: mi.uom ?? "-",
              week: mi.week_number ?? "-",
            }));
          }

          return (
            <li key={memo.id} className="border border-gray-200 rounded-md p-2">
              {/* HEADER */}
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold">
                  {memo.outbound_memo_number ?? memo.memo_number ?? memo.id}
                </div>

                {/* TOGGLE */}
                <button
                  type="button"
                  onClick={() => setOpenMemoId(isOpen ? null : memo.id)}
                  className="text-xs text-blue-600 hover:underline"
                >
                  {isOpen ? "Hide Items" : `Show Items (${items.length})`}
                </button>
              </div>

              {/* EXPANDED CONTENT */}
              {isOpen && (
                <ul className="mt-2 ml-4 list-disc space-y-1 text-xs">
                  {items.length === 0 ? (
                    <li className="text-xs text-slate-500">No items</li>
                  ) : (
                    
                    items.map((it) => (
                      <li
                        key={it.id}
                        className="flex flex-wrap gap-2 items-center"
                      >
                        <span className="font-medium">{it.sku}</span>
                        <span className="ml-2 text-xs text-gray-500">
                          | Qty {it.quantity}
                        </span>
                        <span className="ml-2 text-xs text-gray-500">
                          | UOM {it.uom}
                        </span>
                        <span className="ml-2 text-xs text-gray-500">
                          | Week {it.week}
                        </span>
                      </li>
                    ))
                  )}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    );
  };

  const columns: ColumnDef<MemoData>[] = useMemo(
    () => [
      { accessorKey: "outboundDoNumber", header: "DO Number" },
      { accessorKey: "outboundType", header: "Type Outbound" },
      { accessorKey: "origin", header: "Origin" },
      {
        accessorKey: "outboundMemos",
        header: "Memo Number",
        // pass detailed memo objects (with transaction_pickings / outbound_memo_items)
        cell: ({ row }) => (
          <MemoCell memos={row.original.outboundMemosDetailed || []} />
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <StatusBadge
            status={row.original.status}
            colorMap={STATUS_MAP_DO}
            variant="solid"
            size="sm"
          />
        ),
      },
      { accessorKey: "deliveryDate", header: "Delivery Date" },
      {
        id: "actions",
        header: "Action",
        cell: ({ row }) => {
          const deletable =
            !Array.isArray(row.original.memoId) ||
            row.original.memoId.length === 0;

          const isCancelled = row.original.status === "CANCELLED";
          return (
            <div className="flex gap-3">
              <FaEye
                className="size-5 cursor-pointer text-green-600 hover:scale-110 transition"
                onClick={() => handleDetail(row.original.id)}
                title="Detail"
              />

              <FaTasks
                className="size-5 cursor-pointer text-yellow-600 hover:scale-110 transition"
                onClick={() => handleAdjust(row.original.id)}
                title="Adjust Memo"
              />

              <FaTrash
                className={`size-5 transition ${
                  deletable && !isCancelled
                    ? "cursor-pointer text-red-600 hover:scale-110"
                    : "opacity-50 cursor-not-allowed pointer-events-none text-gray-400"
                }`}
                onClick={
                  deletable && !isCancelled
                    ? () => handleDeleteDO(row.original.id)
                    : undefined
                }
                title={
                  !deletable
                    ? "Cannot delete - DO has memos"
                    : isCancelled
                    ? "Cannot delete - DO is cancelled"
                    : "Delete"
                }
              />
            </div>
          );
        },
      },
    ],
    [roleName]
  );

  // Mapping API data to table data
  const mappedList = (list || []).map((item: any, index: number) => ({
    no: index + 1,
    id: item.id,
    outboundDoNumber: item.outbound_do_number || "",
    expedition: item.expedition || "",
    origin: item.origin || "-",
    licensePlate: item.license_plate || "-",
    driverName: item.driver_name || "-",
    driverPhone: item.driver_phone || "-",
    status: item.status || "PENDING",
    outboundType: item.outbound_type || "",
    deliveryDate: new Date(item.delivery_date).toLocaleDateString("en-GB"),
    memoId: item.memo_id || [],
    // keep a detailed copy of memos so MemoCell can render sku/week/qty from transaction_pickings or outbound_memo_items
    outboundMemosDetailed: item.outbound_memos || [],
    // lightweight summary list (if needed elsewhere)
    outboundMemos: (item.outbound_memos || []).map((memo: any) => ({
      id: memo.id,
      outbound_memo_number: memo.outbound_memo_number,
      has_do: memo.has_do ?? false,
      status: memo.status ?? "UNKNOWN",
    })),
    createdAt: item.createdAt || null,
    updatedAt: item.updatedAt || null,
    deletedAt: item.deletedAt || null,
  }));

  return (
    <div className="flex flex-col gap-4">
      <TableComponent
        data={mappedList}
        columns={columns}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
        pageSize={pageSize}
        pageIndex={pageIndex}
        totalPages={pagination.totalPages}
        onPageChange={(page, size) => {
          setPageIndex(page);
          setPageSize(size);
        }}
      />
    </div>
  );
};

export default AdjustTable;
