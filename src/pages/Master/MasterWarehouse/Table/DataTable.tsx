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
import { Controller } from "react-hook-form";
import Select from "../../../../components/form/Select";
import { usePersistAuthStore } from "../../../../API/store/AuthStore/PersistAuthStore";

const DataTable = () => {
  // Ambil data auth dari storage
  const user = usePersistAuthStore((state) => state.user);
  const orgIdFromStorage = user?.userDetail?.organization?.id || null;
  const organizationName =
    user?.userDetail?.organization?.organization_name || null;
  const roleName = user?.role?.name || null;

  const isSuperAdmin = roleName === "superadmin" || !orgIdFromStorage;

  const { fetchAll: fetchAllIo, list: ioList } = useStoreIo();
  const {
    list: Warehouse,
    createData,
    updateData,
    deleteData,
    fetchAll,
  } = useStoreWarehouse();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [locatorList, setLocatorList] = useState<any[]>([]);
  const [selectedOrgCode, setSelectedOrgCode] = useState("");

  // 1. Filter Warehouse berdasarkan Role
  const filteredWarehouse = useMemo(() => {
    if (!Warehouse) return [];
    if (isSuperAdmin) return Warehouse;

    return Warehouse.filter(
      (item: any) => item.organization_id === orgIdFromStorage,
    );
  }, [Warehouse, orgIdFromStorage, isSuperAdmin]);

  // 2. Fetch Locators menggunakan Organization Code
  const fetchLocators = async (orgCode: string) => {
    if (!orgCode) return;
    try {
      const response = await axiosInstance.get(
        `${EndPoint}master-warehouse/locator?organization_code=${orgCode}`,
      );

      console.log("response", response);

      if (response.data.success) {
        const rawData = response.data.data;
        console.log("rawData", rawData);

        const groupedData = rawData.reduce((acc: any, curr: any) => {
          const subName = curr.Subinventory;

          if (!acc[subName]) {
            acc[subName] = {
              subinventory: subName,
              description: curr["Subinventory Description"],
              locators: [],
            };
          }

          if (curr.locator_id) {
            acc[subName].locators.push({
              id: curr.locator_id,
              name: curr.Locator,
              type: curr["Locator Control Type"],
            });
          }

          return acc;
        }, {});

        setLocatorList(Object.values(groupedData));
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

    if (!isSuperAdmin && organizationName) {
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
        header: "Locator Id",
        cell: ({ row }: any) => row.original.locator_id ?? "-",
      },
      {
        accessorKey: "locator_name",
        header: "Locator Name",
        cell: ({ row }: any) => row.original.locator_name || "-",
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
          if (isSuperAdmin) return true;
          return item.id === orgIdFromStorage;
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
      label: "Locator / Subinventory",
      type: "custom",
      renderCustom: ({ control, setValue }: any) => (
        <Controller
          name="locator_id"
          control={control}
          rules={{ required: "Required" }}
          render={({ field: controllerField }) => {
            // PERUBAHAN UTAMA: Memastikan Subinventory tanpa locator tetap masuk sebagai opsi
            const options = locatorList.flatMap((group: any) => {
              if (group.locators.length === 0) {
                return [
                  {
                    label: `Sub ${group.subinventory} - (No Locator)`,
                    // Jika tidak ada locator_id, gunakan format string khusus untuk value dropdown
                    value: `NO_LOCATOR_${group.subinventory}`,
                    subName: group.subinventory,
                    isNoLocator: true,
                  },
                ];
              }

              return group.locators.map((loc: any) => ({
                label: `Sub ${group.subinventory} - Locator ${loc.name}`,
                value: loc.id.toString(),
                subName: group.subinventory,
                isNoLocator: false,
              }));
            });

            return (
              <Select
                options={options}
                value={controllerField.value}
                placeholder="Select Locator..."
                width="100%"
                onChange={(val: any) => {
                  controllerField.onChange(val);
                  const selectedOption = options.find(
                    (opt: any) => opt.value === val,
                  );
                  if (selectedOption) {
                    // Set otomatis Warehouse Name berdasarkan nama Subinventory
                    setValue("name", selectedOption.subName);
                  }
                }}
              />
            );
          }}
        />
      ),
    },
    {
      name: "name",
      label: "Warehouse Name",
      type: "custom",
      renderCustom: ({ register }: any) => (
        <input
          {...register("name", { required: "Required" })}
          readOnly
          className="w-full px-3 py-2 border rounded-md bg-gray-100 cursor-not-allowed text-gray-500 focus:outline-none"
          placeholder="Auto-filled from Locator"
        />
      ),
    },
    {
      name: "description",
      label: "Description",
      type: "text",
      validation: { required: "Required" },
    },
  ];

  // Helper untuk mencari info locator berdasarkan value yang dipilih
  const findSelectedLocator = (id: string) => {
    if (!id) return null;

    // Jika value berupa penanda tanpa locator
    if (id.startsWith("NO_LOCATOR_")) {
      const subName = id.replace("NO_LOCATOR_", "");
      return { id: null, name: "", subinventory: subName };
    }

    for (const group of locatorList) {
      const found = group.locators.find(
        (l: any) => l.id.toString() === id.toString(),
      );
      if (found) return { ...found, subinventory: group.subinventory };
    }
    return null;
  };

  const handleCreate = async (data: any) => {
    try {
      const selectedLoc = findSelectedLocator(data.locator_id);

      // Susun payload aman: jika null/tidak wajib, kirim sesuai spesifikasi API
      const payload = {
        organization_id: data.organization_id,
        name: data.name,
        description: data.description,
        locator_id:
          selectedLoc && selectedLoc.id !== null
            ? Number(selectedLoc.id)
            : null,
        locator_name: selectedLoc ? selectedLoc.name : "",
      };

      await createData(payload);
      fetchAll();
      setCreateModalOpen(false);
    } catch (error) {
      console.error("Create Error:", error);
    }
  };

  const handleUpdate = async (data: any) => {
    try {
      const selectedLoc = findSelectedLocator(data.locator_id);

      const payload = {
        organization_id: data.organization_id,
        name: data.name,
        description: data.description,
        locator_id:
          selectedLoc && selectedLoc.id !== null
            ? Number(selectedLoc.id)
            : null,
        locator_name: selectedLoc ? selectedLoc.name : "",
      };

      await updateData(data.id, payload);
      await fetchAll();
      return { success: true };
    } catch (error) {
      console.error("Update Error:", error);
    }
  };

  const handleDelete = async (id: any) => {
    return new Promise<void>((resolve) => {
      showConfirmDialog(
        async () => {
          try {
            await deleteData(id);
            await fetchAll();
            resolve();
          } catch (error) {
            console.error(error);
            resolve();
          }
        },
        {
          title: "Confirm Delete",
          text: "Anda yakin ingin menghapus data ini?",
          confirmButtonText: "Yes, Delete!",
          cancelButtonText: "No, Cancel",
        },
      );
    });
  };

  return (
    <>
      <div className="p-4 bg-white shadow rounded-md mb-5 border border-gray-100">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="flex flex-col">
              <Label
                htmlFor="search"
                className="mb-1 text-xs text-gray-500 italic"
              >
                Filter Data
              </Label>
              <Input
                onChange={(e) => setSearch(e.target.value)}
                type="text"
                id="search"
                className="w-64"
                placeholder="🔍 Cari Warehouse.."
              />
            </div>
          </div>

          <div>
            {isSuperAdmin && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setCreateModalOpen(true)}
                className="flex items-center"
              >
                <FaPlus className="mr-2" /> Add Warehouse
              </Button>
            )}
          </div>
        </div>
      </div>

      <DynamicTable
        data={filteredWarehouse}
        globalFilter={debouncedSearch}
        isCreateModalOpen={isCreateModalOpen}
        onCloseCreateModal={() => setCreateModalOpen(false)}
        columns={columns}
        formFields={formFields}
        onSubmit={handleCreate}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        onRefresh={fetchAll}
        getRowId={(row) => row.id}
        title="Warehouse Management"
        isView={true}
      />
    </>
  );
};

export default DataTable;
