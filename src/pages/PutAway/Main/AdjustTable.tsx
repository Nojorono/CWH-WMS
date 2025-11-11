"use client";

import { useEffect, useMemo, useState } from "react";
import { FaEye, FaEdit, FaTrash } from "react-icons/fa";
import { ColumnDef } from "@tanstack/react-table";
import TableComponent from "../Table/TableComponent";
import { useNavigate } from "react-router-dom";
import { useStorePutAway } from "../../../DynamicAPI/stores/Store/MasterStore";
import { MappedData } from "../constant/MappedData";
import StatusBadge from "../../../common/statusBadge";
import { STATUS_MAP_PUTAWAY } from "../../../constants/statusMaps";

type AdjustTableProps = {
  globalFilter?: string;
  setGlobalFilter?: (value: string) => void;
  onDetail?: (id: string) => void;
  onRefresh?: () => void;
  filteredStatus?: any;
};

const AdjustTable = ({
  globalFilter,
  setGlobalFilter,
  filteredStatus,
}: AdjustTableProps) => {
  const navigate = useNavigate();

  const { fetchUsingPagination, deleteData, list, pagination, isLoading } =
    useStorePutAway();

  // 🔹 local state pagination
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // 🔹 Fetch data setiap kali pagination / search berubah
  useEffect(() => {
    if (!fetchUsingPagination) return;
    fetchUsingPagination({
      page: pageIndex + 1, // jika backend 1-based
      limit: pageSize,
      search: globalFilter || "",
      status: filteredStatus || "",
    });
  }, [fetchUsingPagination, pageIndex, pageSize, globalFilter, filteredStatus]);

  const handleDetail = (data: MappedData) => {
    navigate("/putaway/process", {
      state: { data, mode: "detail" },
    });
  };

  const handleUpdate = (data: MappedData) => {
    navigate("/putaway/process", {
      state: { data, mode: "edit", title: "Update PutAway" },
    });
  };

  const handleDelete = async (id: any) => {
    await deleteData(id);
  };

  // ✅ Updated columns to reflect full mapped structure
  const columns: ColumnDef<MappedData>[] = useMemo(() => {
    if (!list || list.length === 0) return []; // fallback

    const baseColumns: ColumnDef<MappedData>[] = [
      { accessorKey: "palletCode", header: "Pallet Code" },

      {
        accessorKey: "sourceWarehouseSubName",
        header: "Source Zone",
        cell: ({ row }) =>
          row.original.status === "COMPLETED"
            ? "-"
            : row.original.sourceWarehouseSubName || "-",
      },
      {
        accessorKey: "destinationWarehouseSubName",
        header: "Destination Zone",
      },
      { accessorKey: "destinationBinCode", header: "Destination Bin" },
      { accessorKey: "totalSku", header: "Total SKU" },
      { accessorKey: "totalQty", header: "Total Qty" },
      { accessorKey: "palletItemUom", header: "UOM" },
      { accessorKey: "driverName", header: "Forklift Driver" },
      { accessorKey: "driverPhone", header: "Driver Phone" },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <StatusBadge
            status={row.original.status}
            colorMap={STATUS_MAP_PUTAWAY}
            variant="solid"
            size="sm"
          />
        ),
      },
      {
        id: "actions",
        header: "Action",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <FaEye
              className="size-5 cursor-pointer text-green-600"
              onClick={() => handleDetail(row.original)}
              title="Detail"
            />
            {row.original.status !== "COMPLETED" && (
              <>
                <FaEdit
                  className="size-5 cursor-pointer text-blue-600"
                  onClick={() => handleUpdate(row.original)}
                  title="Edit"
                />
                <FaTrash
                  className="size-5 cursor-pointer text-red-600"
                  onClick={() => handleDelete(row.original.id)}
                  title="Delete"
                />
              </>
            )}
          </div>
        ),
      },
    ];

    return baseColumns;
  }, [list]);

  // Mapping API data to table-friendly shape
  const mappedList = (list || []).map((item: any) => {
    const inventory = item.inventoryTracking || {};
    const pallet = inventory.pallet || {};
    const sourceSub = inventory.warehouseSub || {};
    const destinationBin = item.destinationBin || {};
    const destinationSub = destinationBin.warehouseSub || {};

    // Map palletItems for detail display
    const palletItems = (item.palletItems || []).map((pi: any) => ({
      itemId: pi.item_id || pi.id || "-",
      itemName: pi.item_name || pi.name || "-",
      currentQuantity: Number(pi.current_quantity) || 0,
      uom: pi.uom || "-",
      lastUpdated: pi.last_updated || null,
      productionDate: pi.production_date || null,
      weekNumber: pi.week_number ?? null,
    }));

    const totalSku = palletItems.length;
    const totalQty = palletItems.reduce(
      (sum: number, pi: any) => sum + (Number(pi.currentQuantity) || 0),
      0
    );

    return {
      // --- Metadata ---
      id: item.id,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      deletedAt: item.deletedAt,

      // --- Source (Inventory Tracking) ---
      inventoryTrackingId: inventory.id || item.inventory_tracking_id || "-",
      inventoryDate: inventory.inventory_date || null,
      inventoryStatus: inventory.inventory_status || "-",
      progressionStatus: inventory.progression_status || "-",
      inventoryNote: inventory.inventory_note || "-",

      // --- Source Warehouse Info ---
      sourceWarehouseId: inventory.warehouse_id || "-",
      sourceWarehouseSubId: inventory.warehouse_sub_id || "-",
      sourceWarehouseSubName: sourceSub.name || "-",
      sourceWarehouseSubCode: sourceSub.code || "-",
      sourceWarehouseSubDesc: sourceSub.description || "-",
      sourceWarehouseSubIsStaging: sourceSub.is_staging || "-",
      sourceBinCode: inventory.bin_code || "-",

      // --- Source Pallet Info ---
      palletId: pallet.id || inventory.pallet_id || "-",
      palletCode: pallet.pallet_code || "-",
      palletCapacity: pallet.capacity ?? 0,
      palletCurrentQuantity: Number(pallet.currentQuantity) || 0,
      palletUom: pallet.uom || "-",
      palletIsFull: pallet.isFull ?? false,
      palletQrUrl: pallet.qr_image_url || null,

      // --- Destination Info ---
      destinationBinId: item.destination_bin_id || "-",
      destinationBinCode: destinationBin.code || "-",
      destinationBinName: destinationBin.name || "-",
      destinationBinDesc: destinationBin.description || "-",
      destinationBinCapacity: destinationBin.capacity_pallet ?? 0,
      destinationBinQrUrl: destinationBin.barcode_image_url || null,

      destinationWarehouseSubId: destinationSub.id || "-",
      destinationWarehouseSubName: destinationSub.name || "-",
      destinationWarehouseSubCode: destinationSub.code || "-",
      destinationWarehouseSubDesc: destinationSub.description || "-",

      // --- Driver / Forklift ---
      forkliftDriverId: item.forklift_driver_id || "-",
      driverName: item.driver_name || "-",
      driverPhone: item.driver_phone || "-",

      // --- Status / Notes ---
      status: item.status || "-",
      notes: item.notes || "-",

      // --- Summary Info ---
      totalSku,
      totalQty,
      palletItemUom: palletItems.length > 0 ? palletItems[0].uom : "-",

      // --- Detail Items ---
      palletItems,
    };
  });

  return (
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
  );
};

export default AdjustTable;
