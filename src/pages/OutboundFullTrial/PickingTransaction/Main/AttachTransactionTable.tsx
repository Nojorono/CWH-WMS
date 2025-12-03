import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from "react";
import Button from "../../../../components/ui/button/Button";
import {
  useStorePickingTransactionList,
  useStoreOutboundMemo,
} from "../../../../DynamicAPI/stores/Store/MasterStore";
import TableComponent from "../Table/TableComponent";
import { FaPlus } from "react-icons/fa";
import ModalSelectMemo from "../Modal/ModalSelectMemo";
import Select from "../../../../components/form/Select";
import { showErrorToast } from "../../../../components/toast";

type AttachTransactionTableProps = {
  onAttachSuccess?: (attachedIds: string[]) => void; // callback opsional saat sukses
};

const AttachTransactionTable: React.FC<AttachTransactionTableProps> = ({
  onAttachSuccess,
}) => {
  const { fetchUsingParam: fetchTransacList, list } =
    useStorePickingTransactionList();

  const { fetchUsingParam: fetchOutboundMemos, list: availableMemos } =
    useStoreOutboundMemo();

  // Table state
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>(
    []
  );
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string>("all");

  // Ensure this runs only once (protect against store function identity changes)
  const didFetchRef = useRef(false);
  useEffect(() => {
    if (!didFetchRef.current) {
      didFetchRef.current = true;
      fetchTransacList({ has_memo_id: false });
    }
  }, [fetchTransacList]);

  const toggleExpandRow = useCallback((rowId: string) => {
    setExpandedRowId((prev) => (prev === rowId ? null : rowId));
  }, []);

  // Ambil daftar item unik dari data
  const itemOptions = useMemo(() => {
    if (!list) return [];
    const unique: { id: string; description: string }[] = [];
    const seen = new Set();
    list.forEach((trx) => {
      const id = trx.item?.id;
      if (id && !seen.has(id)) {
        seen.add(id);
        unique.push({ id, description: trx.item?.description ?? id });
      }
    });
    return unique;
  }, [list]);

  // Filter data sesuai item yang dipilih
  const tableData = useMemo(() => {
    if (selectedItemId === "all") return list || [];
    return (list || []).filter((trx) => trx.item?.id === selectedItemId);
  }, [list, selectedItemId]);

  // Definisi kolom untuk TableComponent (tanstack)Attach Transaction Picking to this Memo
  const columns = useMemo(
    () => [
      {
        accessorKey: "id",
        header: "Select",
        selectedRow: true,
      },
      //   {
      //     accessorKey: "item.id",
      //     header: "Item",
      //     cell: ({ row }: any) => row.original.item?.id ?? "-",
      //   },
      {
        accessorKey: "item.description",
        header: "Item",
        cell: ({ row }: any) => row.original.item?.description ?? "-",
      },
      {
        accessorKey: "quantity",
        header: "Qty",
      },
      {
        accessorKey: "uom",
        header: "UOM",
      },
      {
        accessorKey: "has_memo_id",
        header: "Has Memo",
        cell: ({ row }: any) => (row.original.has_memo_id ? "Yes" : "No"),
      },
      {
        id: "scanFlag",
        header: "Scan Status",
        cell: ({ row }: any) => {
          const hasScans = row.original.transactionScanPicking?.length > 0;
          return hasScans ? "Scanned" : "Not Scanned";
        },
      },
      {
        accessorKey: "status",
        header: "Status",
      },
      {
        id: "expand",
        header: "Detail",
        cell: ({ row }: any) => {
          const trx = row.original;
          const isExpanded = expandedRowId === trx.id;
          return (
            <div className="space-y-2">
              <Button
                size="xsm"
                type="button"
                variant="secondary"
                onClick={() => toggleExpandRow(trx.id)}
              >
                {isExpanded ? "Hide" : "Show"} Detail
              </Button>
              {isExpanded && (
                <div className="mt-2 p-2 border rounded bg-gray-100">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <strong>DO ID:</strong> {trx.do_id ?? "-"}
                    </div>
                    <div>
                      <strong>Week:</strong> {trx.week_number ?? "-"}
                    </div>
                    <div>
                      <strong>Source WH Sub:</strong>{" "}
                      {trx.sourceWarehouseSub?.name ?? "-"}
                    </div>
                    <div>
                      <strong>Source Bin:</strong>{" "}
                      {trx.sourceBin?.code ?? trx.source_bin_id ?? "-"}
                    </div>
                    <div>
                      <strong>Destination WH Sub:</strong>{" "}
                      {trx.destination_warehouse_sub_id ?? "-"}
                    </div>
                    <div>
                      <strong>Destination Bin:</strong>{" "}
                      {trx.destination_bin_id ?? "-"}
                    </div>
                  </div>
                  <div className="mt-3">
                    <strong>Transaction Scan Picking:</strong>
                    <ul className="mt-1 space-y-1">
                      {trx.transactionScanPicking?.length ? (
                        trx.transactionScanPicking.map((scan: any) => (
                          <li
                            key={scan.id}
                            className="p-2 border rounded bg-white"
                          >
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <strong>Scan ID:</strong> {scan.id}
                              </div>
                              <div>
                                <strong>Status:</strong> {scan.status}
                              </div>
                              <div>
                                <strong>Qty Picked:</strong>{" "}
                                {scan.quantity_picked} {scan.uom}
                              </div>
                              <div>
                                <strong>Week:</strong> {scan.week_number}
                              </div>
                              <div>
                                <strong>User:</strong> {scan.user_name}
                              </div>
                              <div>
                                <strong>Inspection By:</strong>{" "}
                                {scan.inspection_by}
                              </div>
                            </div>
                          </li>
                        ))
                      ) : (
                        <li>-</li>
                      )}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          );
        },
      },
    ],
    [expandedRowId, toggleExpandRow]
  );

  // Memoize pagination handler
  const handlePageChange = useCallback((page: number, size: number) => {
    setPageIndex(page);
    setPageSize(size);
    // fetchUsingParam({ has_memo_id: false, page: page + 1, limit: size });
  }, []);

  // Memoize selection handler and avoid redundant updates
  const handleSelectionChange = useCallback(
    (ids: string[] | number[]) => {
      const next = (ids as string[]) ?? [];
      // Only update if actually different to prevent loops
      const same =
        next.length === selectedTransactions.length &&
        next.every((id, i) => id === selectedTransactions[i]);
      if (!same) {
        setSelectedTransactions(next);
      }
    },
    [selectedTransactions]
  );

  const itemSelectOptions = [
    { value: "all", label: "All Items" },
    ...itemOptions.map((item) => ({
      value: item.id,
      label: item.description,
    })),
  ];
  const handleItemSelectChange = (value: string) => {
    if (!value || value === "all") {
      showErrorToast("Please select a valid item.");
      return;
    }
    fetchOutboundMemos({
      item_id: value,
    });
    setSelectedItemId(value);
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-3">
        <div>
          <Select
            options={itemSelectOptions}
            value={selectedItemId}
            onChange={handleItemSelectChange}
            placeholder="Select Item for Attach"
            width={220}
          />
        </div>
        <div>
          <Button
            type="button"
            variant="action"
            onClick={() => setIsModalOpen(true)}
            disabled={
              selectedTransactions.length === 0 || selectedItemId === "all"
            }
            startIcon={<FaPlus />}
          >
            Attach to Memo
          </Button>
        </div>
      </div>

      <TableComponent
        data={tableData}
        columns={columns as any}
        pageSize={pageSize}
        pageIndex={pageIndex}
        totalPages={Math.max(1, Math.ceil(tableData.length / pageSize))}
        onPageChange={handlePageChange}
        onSelectionChange={handleSelectionChange}
        selectColumn={false}
      />

      <ModalSelectMemo
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        memos={availableMemos}
        selectedTransactions={selectedTransactions}
      />
    </div>
  );
};

export default AttachTransactionTable;
