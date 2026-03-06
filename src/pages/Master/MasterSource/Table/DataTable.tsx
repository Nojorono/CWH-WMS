import React, { useEffect, useState, useMemo } from "react";
import { FaPlus } from "react-icons/fa";
import Input from "../../../../components/form/input/InputField";
import Label from "../../../../components/form/Label";
import Button from "../../../../components/ui/button/Button";
import { useDebounce } from "../../../../helper/useDebounce";
import DynamicTable from "../../../../components/wms-components/DynamicTable";
import {
  useStoreSource,
  useStoreIo,
} from "../../../../DynamicAPI/stores/Store/MasterStore";

const DataTable = () => {
  const {
    list: items,
    createData,
    updateData,
    deleteData,
    fetchAll,
  } = useStoreSource();

  const { fetchAll: fetchAllIo, list: ioList } = useStoreIo();

  useEffect(() => {
    fetchAll();
    fetchAllIo();
  }, []);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  // Fungsi untuk format payload create
  const handleCreate = (data: any) => {
    const formattedData = {
      ...data,
      organization_id: Number(data.organization_id),
      name: String(data.name),
      code: String(data.code),
      type: String(data.type),
      url: String(data.url),
    };
    return createData(formattedData);
  };

  // Fungsi untuk format payload update
  const handleUpdate = (data: any) => {
    const { id, ...rest } = data;
    return updateData(id, {
      organization_id: Number(rest.organization_id),
      name: String(rest.name),
      code: String(rest.code),
      type: String(rest.type),
      url: String(rest.url),
    });
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: "id",
        header: "Id",
      },
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
        accessorKey: "name",
        header: "Name",
      },
      {
        accessorKey: "code",
        header: "Code",
      },
      {
        accessorKey: "type",
        header: "Type",
      },
      {
        accessorKey: "url",
        header: "URL",
      },
    ],
    []
  );

  const formFields = [
    {
      name: "organization_id",
      label: "Organization Id",
      type: "select",
      options: ioList.map((item: any) => ({
        value: item.organization_id,
        label: item.organization_name,
      })),
      validation: { required: "Required" },
    },
    {
      name: "name",
      label: "Name",
      type: "text",
      validation: { required: "Required" },
    },
    {
      name: "code",
      label: "Code",
      type: "text",
      validation: { required: "Required" },
    },
    {
      name: "type",
      label: "Type",
      type: "text",
      validation: { required: "Required" },
    },
    {
      name: "url",
      label: "URL",
      type: "text",
      validation: { required: "Required" },
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
        data={items}
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
