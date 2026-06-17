import React, { useEffect, useState, useMemo } from "react";
import { FaPlus } from "react-icons/fa";
import Input from "../../../../components/form/input/InputField";
import Label from "../../../../components/form/Label";
import Button from "../../../../components/ui/button/Button";
import { useDebounce } from "../../../../helper/useDebounce";
import DynamicTable from "../../../../components/wms-components/DynamicTable";
import { useStoreDepartement } from "../../../../DynamicAPI/stores/Store/MasterStore";
import { showConfirmDialog } from "../../../../components/swal-confirm";

const DataTable = () => {
  const {
    list: DepartementList,
    createData,
    updateData,
    deleteData,
    fetchAll,
  } = useStoreDepartement();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  const columns = useMemo(
    () => [
      { accessorKey: "departement_code", header: "Code" },
      { accessorKey: "departement_name", header: "Name" },
      {
        accessorKey: "is_active",
        header: "Status",
        cell: (cell: any) => (cell.getValue() ? "Active" : "Inactive"),
      },
    ],
    [],
  );

  const formFields = [
    {
      name: "departement_code",
      label: "Departement Code",
      type: "text",
      validation: { required: "Required" },
    },
    {
      name: "departement_name",
      label: "Departement Name",
      type: "text",
      validation: { required: "Required" },
    },
    {
      name: "is_active",
      label: "Is Active?",
      type: "checkbox",
    },
  ];

  // Fungsi untuk format payload create
  const handleCreate = (data: any) => {
    const { departement_code, departement_name } = data;
    return createData({
      departement_code,
      departement_name,
      is_active: Boolean(data.is_active),
    });
  };

  // Fungsi untuk format payload update
  const handleUpdate = (data: any) => {
    const { id, departement_code, departement_name, is_active } = data;
    return updateData(id, {
      departement_code,
      departement_name,
      is_active: Boolean(is_active),
    });
  };

  const handleDelete = (id: number) => {
    showConfirmDialog(
      async () => {
        try {
          await deleteData(id);
          fetchAll();
        } catch (error) {
          console.error(error);
        }
      },
      {
        title: "Confirm Delete",
        text: "Anda yakin ingin menghapus data ini?",
        confirmButtonText: "Yes, Delete!",
        cancelButtonText: "No, Cancel",
      },
    );
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
        data={DepartementList.map((item) => ({
          ...item,
         is_active: Boolean(item.is_active),
        }))}
        globalFilter={debouncedSearch}
        isCreateModalOpen={isCreateModalOpen}
        onCloseCreateModal={() => setCreateModalOpen(false)}
        columns={columns}
        formFields={formFields}
        onSubmit={handleCreate}
        onUpdate={handleUpdate}
        onDelete={async (id) => {
          handleDelete(id);
        }}
        onRefresh={fetchAll}
        getRowId={(row) => row.id}
        title="Form UOM"
      />
    </>
  );
};

export default DataTable;
