import React, { useEffect, useState, useMemo } from "react";
import { FaPlus } from "react-icons/fa";
import Input from "../../../../components/form/input/InputField";
import Label from "../../../../components/form/Label";
import Button from "../../../../components/ui/button/Button";
import { useDebounce } from "../../../../helper/useDebounce";
import DynamicTable from "../../../../components/wms-components/DynamicTable";
import { useStoreClassification } from "../../../../DynamicAPI/stores/Store/MasterStore";

const DataTable = () => {
  const {
    list: classification,
    createData,
    updateData,
    deleteData,
    fetchAll,
  } = useStoreClassification();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  const columns = useMemo(
    () => [
      { accessorKey: "classification_name", header: "Classification Name" },
      { accessorKey: "classification_code", header: "Classification Code" },
      {
        accessorKey: "classification_description",
        header: "Classification Description",
      },
    ],
    []
  );

  const formFields = [
    {
      name: "classification_name",
      label: "Classification Name",
      type: "text",
      validation: { required: "Required" },
    },
    {
      name: "classification_code",
      label: "Classification Code",
      type: "text",
      validation: { required: "Required" },
    },
    {
      name: "classification_description",
      label: "Classification Description",
      type: "text",
      validation: { required: "Required" },
    },
  ];

  // Fungsi untuk format payload create
  const handleCreate = (data: any) => {
    const {
      classification_name,
      classification_code,
      classification_description,
    } = data;
    return createData({
      classification_name,
      classification_code,
      classification_description,
    });
  };

  // Fungsi untuk format payload update
  const handleUpdate = (data: any) => {
    const {
      id,
      classification_name,
      classification_code,
      classification_description,
    } = data;
    return updateData(id, {
      classification_name,
      classification_code,
      classification_description,
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
              <FaPlus className="mr-2" /> Add Data
            </Button>
          </div>
        </div>
      </div>

      <DynamicTable
        data={classification}
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
