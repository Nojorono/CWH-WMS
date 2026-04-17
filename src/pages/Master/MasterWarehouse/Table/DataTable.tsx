import { useEffect, useState, useMemo } from "react";
import { FaPlus } from "react-icons/fa";
import Input from "../../../../components/form/input/InputField";
import Label from "../../../../components/form/Label";
import Button from "../../../../components/ui/button/Button";
import { useDebounce } from "../../../../helper/useDebounce";
import DynamicTable from "../../../../components/wms-components/DynamicTable";
import {
  useStoreWarehouse,
  useStoreIo,
} from "../../../../DynamicAPI/stores/Store/MasterStore";
import { showConfirmDialog } from "../../../../components/swal-confirm";

const DataTable = () => {
  const {
    list: Warehouse,
    createData,
    updateData,
    deleteData,
    fetchAll,
  } = useStoreWarehouse();

  const { fetchAll: fetchAllIo, list: ioList } = useStoreIo();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  useEffect(() => {
    fetchAll();
    fetchAllIo();
  }, []);

  const columns = useMemo(
    () => [
      {
        accessorKey: "organization_id",
        header: "Organization",
        cell: ({ row }: any) => {
          const org = ioList.find(
            (item: any) =>
              item.organization_id === row.original.organization_id,
          );
          return org ? org.organization_name : row.original.organization_id;
        },
      },
      { accessorKey: "locator_name", header: "Locator Name" },
      { accessorKey: "name", header: "Warehouse Name" },
      { accessorKey: "description", header: "Description" },
    ],
    [ioList],
  );

  const formFields = [
    {
      name: "organization_id",
      label: "Organization ID",
      type: "select",
      options: ioList.map((item: any) => ({
        label: item.organization_name,
        value: item.organization_id,
      })),
      validation: { required: "Required" },
    },
    {
      name: "locator_name",
      label: "Locator Name",
      type: "text",
      validation: { required: "Required" },
    },
    {
      name: "name",
      label: "Warehouse Name",
      type: "text",
      validation: { required: "Required" },
    },
    {
      name: "description",
      label: "Description",
      type: "text",
      validation: { required: "Required" },
    },
  ];

  // Fungsi untuk format payload create
  const handleCreate = (data: any) => {
    const { organization_id, name, description, locator_id, locator_name} = data;
    return createData({
      organization_id: organization_id,
      name,
      description,
      locator_id,
      locator_name,
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
        data={Warehouse}
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
        isView={true}
      />
    </>
  );
};

export default DataTable;
