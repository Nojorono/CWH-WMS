import React, { useEffect, useState, useMemo } from "react";
import { FaPlus } from "react-icons/fa";
import Input from "../../../components/form/input/InputField";
import Label from "../../../components/form/Label";
import Button from "../../../components/ui/button/Button";
import { useDebounce } from "../../../helper/useDebounce";
import DynamicTable from "../Table/TableComponent";
import { useStoreInventoryTracking } from "../../../DynamicAPI/stores/Store/MasterStore";

const DataTable = () => {
  const { list: inventory, fetchAll } = useStoreInventoryTracking();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  // 🎨 Warna badge status
  const getStatusColor = (status: string) => {
    switch (status) {
      case "INVENTORY":
      case "INVENTORY_COMPLETED":
        return "bg-blue-100 text-blue-700";
      case "PUT_AWAY":
        return "bg-green-100 text-green-700";
      case "RECEIVED":
        return "bg-lime-100 text-lime-700";
      case "INSPECTION_COMPLETED":
        return "bg-yellow-100 text-yellow-700";
      case "PICKING":
        return "bg-orange-100 text-orange-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: "pallet.pallet_code",
        header: "Pallet ID",
        cell: ({ row }: any) => row.original.pallet?.pallet_code ?? "-",
      },
      {
        accessorKey: "warehouse.name",
        header: "Warehouse",
        cell: ({ row }: any) => row.original.warehouse?.name ?? "-",
      },
      {
        accessorKey: "warehouseSub.code",
        header: "Zone",
        cell: ({ row }: any) => row.original.warehouseSub?.code ?? "-",
      },
      {
        accessorKey: "warehouseBin.name",
        header: "Bin",
        cell: ({ row }: any) => row.original.warehouseBin?.name ?? "Preload",
      },
      {
        accessorKey: "inventory_status",
        header: "Status",
        cell: ({ row }: any) => {
          const status = row.original.inventory_status || "-";
          return (
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                status
              )}`}
            >
              {status.replaceAll("_", " ")}
            </span>
          );
        },
      },
    ],
    []
  );

  // Define formFields for DynamicTable
  const formFields = [
    {
      name: "pallet_code",
      label: "Pallet Code",
      type: "text",
      required: true,
    },
    {
      name: "warehouse_name",
      label: "Warehouse Name",
      type: "text",
      required: true,
    },
    {
      name: "zone_code",
      label: "Zone Code",
      type: "text",
      required: false,
    },
    {
      name: "bin_name",
      label: "Bin Name",
      type: "text",
      required: false,
    },
    {
      name: "inventory_status",
      label: "Status",
      type: "select",
      options: [
        { label: "Inventory", value: "INVENTORY" },
        { label: "Inventory Completed", value: "INVENTORY_COMPLETED" },
        { label: "Put Away", value: "PUT_AWAY" },
        { label: "Received", value: "RECEIVED" },
        { label: "Inspection Completed", value: "INSPECTION_COMPLETED" },
        { label: "Picking", value: "PICKING" },
      ],
      required: true,
    },
  ];

  return (
    <>
      <div className="p-4 bg-white shadow rounded-md mb-5">
        <div className="flex justify-between items-center">
          <div className="space-x-4">
            <Label htmlFor="search">Search</Label>
            <Input
              onChange={(e) => setSearch(e.target.value)}
              type="text"
              id="search"
              placeholder="🔍 Masukan data.."
            />
          </div>
        </div>
      </div>

      <DynamicTable
        data={inventory}
        globalFilter={debouncedSearch}
        isCreateModalOpen={isCreateModalOpen}
        onCloseCreateModal={() => setCreateModalOpen(false)}
        columns={columns}
        formFields={formFields}
        onRefresh={fetchAll}
        getRowId={(row) => row.id}
        title="Form UOM"
        isDeleted={false}
        isEdited={false}
        isView={true}
      />
    </>
  );
};

export default DataTable;
