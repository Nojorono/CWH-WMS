import { useEffect, useState, useMemo } from "react";
import { FaPlus, FaSyncAlt } from "react-icons/fa";
import Input from "../../../../components/form/input/InputField";
import Label from "../../../../components/form/Label";
import Button from "../../../../components/ui/button/Button";
import { useDebounce } from "../../../../helper/useDebounce";
import DynamicTable from "../../../../components/wms-components/DynamicTable";
import { useStoreUserManagement } from "../../../../DynamicAPI/stores/Store/MasterStore";

/**
 * Types sesuai permintaan
 */
export interface UserManagement {
  id?: string;
  createdAt?: string; // ISO 8601 timestamp
  updatedAt?: string; // ISO 8601 timestamp
  deletedAt?: string | null;
  name: string;
  phone: string;
  roleName: string;
}

export type CreateUserManagement = Omit<UserManagement, "id">;
export type UpdateUserManagement = Partial<CreateUserManagement>;

const DataTable = () => {
  const {
    list: userList,
    createData,
    updateData,
    deleteData,
    fetchAll,
  } = useStoreUserManagement();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  // Format payload create sesuai CreateUserManagement
  const handleCreate = (data: any) => {
    const formattedData: CreateUserManagement = {
      name: String(data.name || ""),
      phone: String(data.phone || ""),
      roleName: String(data.roleName || ""),
      createdAt: data.createdAt ? String(data.createdAt) : undefined,
      updatedAt: data.updatedAt ? String(data.updatedAt) : undefined,
      deletedAt: data.deletedAt ?? undefined,
    };
    return createData(formattedData);
  };

  // Format payload update sesuai UpdateUserManagement
  const handleUpdate = (data: any) => {
    const { id, ...rest } = data;
    if (!id) {
      return Promise.reject(new Error("ID is required for update"));
    }
    const payload: UpdateUserManagement = {};
    if (rest.name !== undefined) payload.name = String(rest.name);
    if (rest.phone !== undefined) payload.phone = String(rest.phone);
    if (rest.roleName !== undefined) payload.roleName = String(rest.roleName);

    return updateData(id, payload);
  };

  const columns = useMemo(
    () => [
      { accessorKey: "name", header: "Name" },
      { accessorKey: "phone", header: "Phone" },
      { accessorKey: "roleName", header: "Role" },
    ],
    []
  );

  const formFields = [
    {
      name: "name",
      label: "Name",
      type: "text",
      validation: { required: "Required" },
    },
    {
      name: "phone",
      label: "Phone",
      type: "text",
      validation: { required: "Required" },
    },
    {
      name: "roleName",
      label: "Role",
      type: "select",
      options: [
        { label: "DRIVER", value: "DRIVER" },
        { label: "HELPER", value: "HELPER" },
      ],
    },
  ];

  return (
    <>
      <div className="p-4 bg-white shadow rounded-md mb-5">
        <div className="flex justify-between userList-center">
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

            {/* <Button
              variant="primary"
              size="sm"
              onClick={() => handleFetchItem()}
              disabled={isLoadingFetch}
            >
              <FaSyncAlt className="mr-2" /> Sync Data from Meta
            </Button> */}
          </div>
        </div>
      </div>

      <DynamicTable
        data={userList}
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
        getRowId={(row: UserManagement) => String(row.id ?? "")}
        title="User Management"
      />
    </>
  );
};

export default DataTable;
