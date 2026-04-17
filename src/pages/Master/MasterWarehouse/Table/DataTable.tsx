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
import axiosInstance from "../../../../DynamicAPI/AxiosInstance";
import { EndPoint } from "../../../../utils/EndPoint";

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
  const [locatorList, setLocatorList] = useState<any[]>([]);
  const organizationName = localStorage.getItem("organization_name");
  const roleName = localStorage.getItem("role_name");
  const [selectedOrgCode, setSelectedOrgCode] = useState("");

  const fetchLocators = async (orgCode: string) => {
    if (!orgCode) return;
    try {
      const response = await axiosInstance.get(
        `${EndPoint}master-warehouse/locator?organization_code=${orgCode}`,
      );
      if (response.data.success) {
        setLocatorList(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching locators:", error);
      setLocatorList([]);
    }
  };

  useEffect(() => {
    if (selectedOrgCode) {
      fetchLocators(selectedOrgCode);
    }
  }, [selectedOrgCode]);

  useEffect(() => {
    fetchAll();
    fetchAllIo();
    if (roleName !== "superadmin" && organizationName) {
      setSelectedOrgCode(organizationName);
    }
  }, []);

  const columns = useMemo(
    () => [
      {
        accessorKey: "organization_id",
        header: "Organization",
        cell: ({ row }: any) => {
          const org = ioList.find(
            (item: any) => item.id === row.original.organization_id,
          );
          return org ? org.organization_name : "N/A";
        },
      },
      {
        accessorKey: "locator_id",
        header: "Locator Name",
        cell: ({ row }: any) => {
          const loc = locatorList.find(
            (l: any) => l.LOCATOR_ID === row.original.locator_id,
          );
          return loc ? loc.LOCATOR : "N/A";
        },
      },
      { accessorKey: "name", header: "Warehouse Name" },
      { accessorKey: "description", header: "Description" },
    ],
    [ioList],
  );

  const formFields = [
    {
      name: "organization_id",
      label: "Organization",
      type: "select",
      options: ioList
        .filter((item: any) => {
          if (roleName === "superadmin") return true;
          if (!organizationName) return true;
          return item.organization_name === organizationName;
        })
        .map((item: any) => ({
          label: item.organization_name,
          value: item.id,
        })),
      validation: { required: "Required" },
      onChange: (e: any) => {
        const selectedId = e?.target ? e.target.value : e;
        if (selectedId) {
          const found = ioList.find((io: any) => io.id === selectedId);
          if (found) {
            setSelectedOrgCode(found.organization_name);
          }
        }
      },
    },
    {
      name: "locator_id",
      label: "Locator",
      type: "select",
      options: locatorList.map((item: any) => ({
        label: item.LOCATOR,
        value: item.LOCATOR_ID,
      })),
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

  const handleCreate = async (data: any) => {
    try {
      // Pastikan payload yang dikirim sesuai dengan yang diharapkan API
      await createData({
        organization_id: data.organization_id,
        name: data.name,
        description: data.description,
        locator_id: data.locator_id,
      });
      fetchAll(); // Refresh data setelah create
      setCreateModalOpen(false);
    } catch (error) {
      console.error("Create Error:", error);
    }
  };

  const handleUpdate = async (data: any) => {
    try {
      // ID baris biasanya ada di data.id saat mode edit di DynamicTable
      const id = data.id;
      await updateData(id, {
        organization_id: data.organization_id,
        name: data.name,
        description: data.description,
        locator_id: data.locator_id,
      });
      fetchAll(); // Refresh data setelah update
    } catch (error) {
      console.error("Update Error:", error);
    }
  };

  const handleDelete = (id: any) => {
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
        title="Warehouse Management"
        isView={true}
      />
    </>
  );
};

export default DataTable;
