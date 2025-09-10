import React, { useEffect, useMemo, useState } from "react";
import { FaPlus } from "react-icons/fa";
import Input from "../../../../components/form/input/InputField";
import Label from "../../../../components/form/Label";
import Button from "../../../../components/ui/button/Button";
import { useDebounce } from "../../../../helper/useDebounce";
import DynamicTable from "../../../../components/wms-components/DynamicTable";
import {
  useStoreUser,
  useStoreIo,
} from "../../../../DynamicAPI/stores/Store/MasterStore";
import { useRoleStore } from "../../../../API/store/MasterStore";

const DataTable = () => {
  const {
    list: userData,
    createData,
    updateData,
    deleteData,
    fetchAll,
  } = useStoreUser();

  const { list: IoList, fetchAll: fetchIO } = useStoreIo();

  const { fetchRoles, roles } = useRoleStore();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  useEffect(() => {
    fetchAll();
    fetchRoles();
    fetchIO();
  }, []);

  // Fungsi untuk format payload create
  const handleCreate = (data: any) => {
    console.log("Data to create:", data);

    const formattedData = {
      username: data.username,
      organizationId: Number(data.organizationId),
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      isActive: data.isActive,
      roleId: Number(data.roleId),
    };
    return createData(formattedData);
  };

  // Fungsi untuk format payload update
  const handleUpdate = (data: any) => {
    const { id, ...rest } = data;
    return updateData(id, {
      username: rest.username,
      organizationId: Number(rest.organizationId),
      password: rest.password,
      firstName: rest.firstName,
      lastName: rest.lastName,
      isActive: rest.isActive,
      roleId: Number(rest.roleId),
    });
  };  

  const columns = useMemo(
    () => [
      {
        accessorKey: "username",
        header: "Username",
      },
      {
        accessorKey: "firstName",
        header: "First Name",
      },
      {
        accessorKey: "lastName",
        header: "Last Name",
      },
      {
        accessorKey: "organizationId",
        header: "Organization",
        cell: (info: any) => {
          const org = IoList?.find(
            (org: any) => org.organization_id === info.getValue()
          );
          return org ? org.organization_name : "-";
        },
      },
      {
        accessorKey: "roleId",
        header: "Role",
        cell: (info: any) => {
          const role = roles?.find((role: any) => role.id === info.getValue());
          return role ? role.name : "-";
        },
      },
      {
        accessorKey: "isActive",
        header: "Active",
        cell: (info: any) => (info.getValue() ? "Active" : "Inactive"),
      },
    ],
    [IoList, roles]
  );

  const formFields = [
    {
      name: "username",
      label: "Username",
      type: "text",
      validation: { required: "Required" },
    },
    {
      name: "password",
      label: "Password",
      type: "password",
      validation: { required: "Required" },
    },
    {
      name: "firstName",
      label: "First Name",
      type: "text",
      validation: { required: "Required" },
    },
    {
      name: "lastName",
      label: "Last Name",
      type: "text",
      validation: { required: "Required" },
    },
    {
      name: "organizationId",
      label: "Organization",
      type: "select",
      options:
        IoList?.map((org: any) => ({
          label: org.organization_name,
          value: org.organization_id,
        })) || [],
      validation: { required: "Required" },
    },
    {
      name: "roleId",
      label: "Role",
      type: "select",
      options:
        roles?.map((role: any) => ({
          label: role.name,
          value: role.id,
        })) || [],
      validation: { required: "Required" },
    },
    {
      name: "isActive",
      label: "",
      type: "checkbox",
      options: [
        { label: "Active", value: true },
        { label: "Inactive", value: false },
      ],
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
              <FaPlus className="mr-2" /> Tambah Data
            </Button>
          </div>
        </div>
      </div>

      <DynamicTable
        data={userData}
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
