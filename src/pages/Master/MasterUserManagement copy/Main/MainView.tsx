import { useEffect, useState, useMemo } from "react";
import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import Input from "../../../../components/form/input/InputField";
import Label from "../../../../components/form/Label";
import Button from "../../../../components/ui/button/Button";
import { useDebounce } from "../../../../helper/useDebounce";
import { useStoreUserManagement } from "../../../../DynamicAPI/stores/Store/MasterStore";

// Komponen Reusable & Table
import TableComponent from "../Table/TableComponent";
import ReusableFormModal from "../../../../components/modal/type/ModalForm";

/**
 * Types untuk User Management
 */
export interface UserManagement {
  id?: string;
  name: string;
  phone: string;
  roleName: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

const DataTable = () => {
  const {
    list: userList,
    createData,
    updateData,
    deleteData,
    fetchUsingPagination,
    pagination: apiPagination,
  } = useStoreUserManagement();

  // --- States ---
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // State Modal Control
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedData, setSelectedData] = useState<UserManagement | null>(null);

  // --- API Side Effects ---
  useEffect(() => {
    if (fetchUsingPagination) {
      fetchUsingPagination({
        page: currentPage + 1,
        limit: pageSize,
        search: debouncedSearch,
      });
    }
  }, [fetchUsingPagination, currentPage, pageSize, debouncedSearch]);

  // --- CRUD Logic ---
  const handleFormSubmit = async (data: any) => {
    try {
      if (selectedData?.id) {
        // Logika Update (Sesuai permintaan payload sebelumnya)
        const { id, ...rest } = data;
        const payload: any = {};
        if (rest.name !== undefined) payload.name = String(rest.name);
        if (rest.phone !== undefined) payload.phone = String(rest.phone);
        if (rest.roleName !== undefined)
          payload.roleName = String(rest.roleName);

        await updateData(selectedData.id, payload);
      } else {
        // Logika Create
        const formattedData = {
          name: String(data.name || ""),
          phone: String(data.phone || ""),
          roleName: String(data.roleName || ""),
        };
        await createData(formattedData);
      }
      handleCloseModal();
    } catch (error) {
      console.error("Operation failed:", error);
    }
  };

  const handleOpenEdit = (data: UserManagement) => {
    setSelectedData(data);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedData(null);
  };

  // --- Konfigurasi Form & Tabel ---
  const formFields = [
    {
      name: "name",
      label: "Name",
      type: "text",
      validation: { required: "Name is required" },
    },
    {
      name: "phone",
      label: "Phone Number",
      type: "phone",
      validation: { required: "Phone is required" },
    },
    {
      name: "roleName",
      label: "Role",
      type: "select",
      options: [
        { label: "DRIVER", value: "DRIVER" },
        { label: "HELPER", value: "HELPER" },
      ],
      validation: { required: "Please select a role" },
    },
  ];

  const columns = useMemo(
    () => [
      { accessorKey: "name", header: "Name" },
      { accessorKey: "phone", header: "Phone" },
      {
        accessorKey: "roleName",
        header: "Role",
        cell: (info: any) => (
          <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-xs font-semibold">
            {info.getValue()}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }: any) => (
          <div className="flex space-x-3">
            <button
              onClick={() => handleOpenEdit(row.original)}
              className="text-blue-500 hover:text-blue-700"
            >
              <FaEdit />
            </button>
            <button
              onClick={() => handleDeleteData(row.original.id)}
              className="text-red-500 hover:text-red-700"
            >
              <FaTrash />
            </button>
          </div>
        ),
      },
    ],
    [deleteData],
  );

  const handleDeleteData = async (id: any) => {
    await deleteData(id);
  };

  return (
    <div className="p-4 space-y-4">
      {/* Search & Add Action */}
      <div className="p-4 bg-white shadow rounded-lg flex justify-between items-center">
        <div className="flex flex-col w-64">
          <Label htmlFor="search">Search</Label>
          <Input
            id="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
          />
        </div>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          <FaPlus className="mr-2" /> Add Data
        </Button>
      </div>

      {/* Main Table */}
      <div className="bg-white shadow rounded-lg p-4">
        <TableComponent
          data={userList || []}
          columns={columns}
          pageIndex={currentPage}
          pageSize={pageSize}
          totalPages={apiPagination?.totalPages || 1}
          onPageChange={(p, s) => {
            setCurrentPage(p);
            setPageSize(s);
          }}
        />
      </div>

      {/* Reusable Form Modal */}
      <ReusableFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleFormSubmit}
        formFields={formFields}
        title="Add User Management"
        defaultValues={selectedData || {}}
        isEditMode={!!selectedData}
      />
    </div>
  );
};

export default DataTable;
