import React, { useEffect, useState, useMemo } from "react";
import { FaPlus } from "react-icons/fa";
import Input from "../../../../components/form/input/InputField";
import Label from "../../../../components/form/Label";
import Button from "../../../../components/ui/button/Button";
import { useDebounce } from "../../../../helper/useDebounce";
import DynamicTable from "../../../../components/wms-components/DynamicTable";
import { useStoreIo } from "../../../../DynamicAPI/stores/Store/MasterStore";

const DataTable = () => {
  const {
    list: Io,
    createData,
    updateData,
    deleteData,
    fetchAll,
  } = useStoreIo();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  const columns = useMemo(
    () => [
      { accessorKey: "organization_id", header: "Organization ID" },
      { accessorKey: "organization_name", header: "Organization Name" },
      { accessorKey: "operating_unit", header: "Operating Unit" },
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
      name: "organization_name",
      label: "Organization Name",
      type: "text",
      validation: { required: "Required" },
    },
    {
      name: "operating_unit",
      label: "Operating Unit",
      type: "text",
      validation: { required: "Required" },
    },
  ];

  // Fungsi untuk format payload create
  const handleCreate = (data: any) => {
    const { organization_id, organization_name, operating_unit } = data;
    return createData({
      organization_id: Number(organization_id),
      organization_name,
      operating_unit: operating_unit,
    });
  };

  // Fungsi untuk format payload update
  const handleUpdate = (data: any) => {
    const { id, organization_id, organization_name, operating_unit } = data;
    return updateData(id, {
      organization_id: Number(organization_id),
      organization_name,
      operating_unit: operating_unit,
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
        data={Io}
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
        title="Form Data"
      />
    </>
  );
};

export default DataTable;
