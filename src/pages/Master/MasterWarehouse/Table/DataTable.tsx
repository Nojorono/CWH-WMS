import React, { useEffect, useState, useMemo } from "react";
import { FaPlus } from "react-icons/fa";
import Input from "../../../../components/form/input/InputField";
import Label from "../../../../components/form/Label";
import Button from "../../../../components/ui/button/Button";
import { useDebounce } from "../../../../helper/useDebounce";
import DynamicTable from "../../../../components/wms-components/DynamicTable";
import { useStoreWarehouse } from "../../../../DynamicAPI/stores/Store/MasterStore";

const DataTable = () => {
  const {
    list: Warehouse,
    createData,
    updateData,
    deleteData,
    fetchAll,
  } = useStoreWarehouse();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  const columns = useMemo(
    () => [
      { accessorKey: "id", header: "ID" },
      { accessorKey: "organization_id", header: "Organization ID" },
      { accessorKey: "name", header: "Nama Gudang" },
      { accessorKey: "description", header: "Deskripsi" },
    ],
    []
  );

  const formFields = [
    {
      name: "organization_id",
      label: "Organization ID",
      type: "number",
      validation: { required: "Required" },
    },
    {
      name: "name",
      label: "Nama Gudang",
      type: "text",
      validation: { required: "Required" },
    },
    {
      name: "description",
      label: "Deskripsi",
      type: "text",
      validation: { required: "Required" },
    },
  ];

  // Fungsi untuk format payload create
  const handleCreate = (data: any) => {
    const { organization_id, name, description } = data;
    return createData({
      organization_id: Number(organization_id),
      name,
      description,
    });
  };

  // Fungsi untuk format payload update
  const handleUpdate = (data: any) => {
    const { id, organization_id, name, description } = data;
    return updateData(id, {
      organization_id,
      name,
      description,
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
        data={Warehouse}
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
