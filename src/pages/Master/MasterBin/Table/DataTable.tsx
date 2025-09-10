import React, { useEffect, useState, useMemo } from "react";
import { FaPlus } from "react-icons/fa";
import Input from "../../../../components/form/input/InputField";
import Label from "../../../../components/form/Label";
import Button from "../../../../components/ui/button/Button";
import { useDebounce } from "../../../../helper/useDebounce";
import DynamicTable from "../../../../components/wms-components/DynamicTable";
import {
  useStoreWarehouse,
  useStoreIo,
  useStoreSubWarehouse,
  useStoreBin,
} from "../../../../DynamicAPI/stores/Store/MasterStore";

const DataTable = () => {
  const { list: Warehouse, fetchAll } = useStoreWarehouse();
  const { fetchAll: fetchAllIo, list: ioList } = useStoreIo();
  const { fetchAll: fetchSubWH, list: subWHList } = useStoreSubWarehouse();

  const {
    fetchAll: fetchBin,
    list: binList,
    createData,
    updateData,
    deleteData,
  } = useStoreBin();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  useEffect(() => {
    fetchAll();
    fetchAllIo();
    fetchSubWH();
    fetchBin();
  }, []);

  const columns = useMemo(
    () => [
      { accessorKey: "id", header: "ID" },
      {
        accessorKey: "organization_id",
        header: "Organization",
        cell: ({ row }: any) => {
          const org = ioList.find(
            (item: any) => item.organization_id === row.original.organization_id
          );
          return org ? org.organization_name : row.original.organization_id;
        },
      },
      {
        accessorKey: "warehouse_sub_id",
        header: "Zone",
        cell: ({ row }: any) => {
          const subWh = subWHList.find(
            (item: any) => item.id === row.original.warehouse_sub_id
          );
          return subWh ? subWh.name : row.original.warehouse_sub_id;
        },
      },
      { accessorKey: "name", header: "Nama" },
      { accessorKey: "code", header: "Kode" },
      { accessorKey: "description", header: "Deskripsi" },
      { accessorKey: "capacity_pallet", header: "Kapasitas Pallet" },
    ],
    [ioList, subWHList]
  );

  const formFields = [
    {
      name: "organization_id",
      label: "Organization",
      type: "select",
      options: ioList.map((item: any) => ({
        label: item.organization_name,
        value: item.organization_id,
      })),
      validation: { required: "Required" },
    },
    {
      name: "warehouse_sub_id",
      label: "Zone",
      type: "select",
      options: subWHList.map((item: any) => ({
        label: item.name,
        value: item.id,
      })),
      validation: { required: "Required" },
    },
    {
      name: "name",
      label: "Nama Bin",
      type: "text",
      validation: { required: "Required" },
    },
    {
      name: "code",
      label: "Kode",
      type: "text",
      validation: { required: "Required" },
    },
    {
      name: "description",
      label: "Deskripsi",
      type: "text",
      validation: { required: "Required" },
    },
    {
      name: "capacity_pallet",
      label: "Kapasitas Pallet",
      type: "number",
      validation: {
        required: "Required",
        min: { value: 0, message: "Harus >= 0" },
      },
    },
  ];

  // Fungsi untuk format payload create
  const handleCreate = (data: any) => {
    const {
      organization_id,
      warehouse_sub_id,
      name,
      code,
      description,
      capacity_pallet,
    } = data;
    return createData({
      organization_id: Number(organization_id),
      warehouse_sub_id,
      name,
      code,
      description,
      capacity_pallet: Number(capacity_pallet),
    });
  };

  // Fungsi untuk format payload update
  const handleUpdate = (data: any) => {
    const {
      id,
      organization_id,
      warehouse_sub_id,
      name,
      code,
      description,
      capacity_pallet,
    } = data;
    return updateData(id, {
      organization_id: Number(organization_id),
      warehouse_sub_id,
      name,
      code,
      description,
      capacity_pallet: Number(capacity_pallet),
    });
  };

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
          <div className="space-x-4">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setCreateModalOpen(true)}
            >
              <FaPlus className="mr-2" /> Tambah Data
            </Button>
          </div>
        </div>
      </div>

      <DynamicTable
        data={binList}
        globalFilter={debouncedSearch}
        isCreateModalOpen={isCreateModalOpen}
        onCloseCreateModal={() => setCreateModalOpen(false)}
        columns={columns}
        formFields={formFields}
        onSubmit={handleCreate}
        onUpdate={handleUpdate}
        onDelete={async (id) => {
          await deleteData(id);
        }}
        onRefresh={fetchAll}
        getRowId={(row) => row.id}
        title="Form UOM"
      />
    </>
  );
};

export default DataTable;
