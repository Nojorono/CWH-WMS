import React, { useEffect, useState, useMemo } from "react";
import { FaPlus } from "react-icons/fa";
import Input from "../../../../components/form/input/InputField";
import Label from "../../../../components/form/Label";
import Button from "../../../../components/ui/button/Button";
import { useDebounce } from "../../../../helper/useDebounce";
import DynamicTable from "../../../../components/wms-components/DynamicTable";
import { useStoreVehicle } from "../../../../DynamicAPI/stores/Store/MasterStore";

const DataTable = () => {
  const {
    list: vehicle,
    createData,
    updateData,
    deleteData,
    fetchAll,
  } = useStoreVehicle();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  const columns = useMemo(
    () => [
      { accessorKey: "vehicle_type", header: "Vehicle Type" },
      { accessorKey: "vehicle_brand", header: "Vehicle Brand" },
      { accessorKey: "is_active", header: "Is Active" },
    ],
    []
  );

  const formFields = [
    {
      name: "vehicle_type",
      label: "Vehicle Type",
      type: "text",
      validation: { required: "Required" },
    },
    {
      name: "vehicle_brand",
      label: "Vehicle Brand",
      type: "text",
      validation: { required: "Required" },
    },
    {
      name: "is_active",
      label: "Is Active",
      type: "checkbox",
      validation: {},
    },
  ];

  // Fungsi untuk format payload create
  const handleCreate = (data: any) => {
    const { vehicle_type, vehicle_brand, is_active } = data;
    return createData({
      vehicle_type,
      vehicle_brand,
      is_active,
    });
  };

  // Fungsi untuk format payload update
  const handleUpdate = (data: any) => {
    const { id, vehicle_type, vehicle_brand, is_active } = data;
    return updateData(id, {
      vehicle_type,
      vehicle_brand,
      is_active,
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
        data={vehicle}
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
