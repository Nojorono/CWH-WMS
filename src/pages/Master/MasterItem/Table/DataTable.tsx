import { useEffect, useState, useMemo } from "react";
import { FaPlus, FaSyncAlt } from "react-icons/fa";
import Input from "../../../../components/form/input/InputField";
import Label from "../../../../components/form/Label";
import Button from "../../../../components/ui/button/Button";
import { useDebounce } from "../../../../helper/useDebounce";
import DynamicTable from "../../../../components/wms-components/DynamicTable";
import {
  useStoreItem,
  useStoreIo,
} from "../../../../DynamicAPI/stores/Store/MasterStore";
import { showErrorToast, showSuccessToast } from "../../../../components/toast";
import { EndPoint } from "../../../../utils/EndPoint";

const DataTable = () => {
  const {
    list: items,
    createData,
    updateData,
    deleteData,
    fetchAll,
  } = useStoreItem();
  const { fetchAll: fetchAllIo, list: ioList } = useStoreIo();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  useEffect(() => {
    fetchAll();
    fetchAllIo();
  }, []);

  // Fungsi untuk format payload create
  const handleCreate = (data: any) => {
    const formattedData = {
      ...data,
      organization_id: Number(data.organization_id),
      inventory_item_id: Number(data.inventory_item_id),
      dus_per_stack: Number(data.dus_per_stack),
      bal_per_dus: Number(data.bal_per_dus),
      press_per_bal: Number(data.press_per_bal),
      bks_per_press: Number(data.bks_per_press),
      btg_per_bks: Number(data.btg_per_bks),
    };
    return createData(formattedData);
  };

  // Fungsi untuk format payload update
  const handleUpdate = (data: any) => {
    const { id, ...rest } = data;
    return updateData(id, {
      sku: String(rest.sku),
      item_number: String(rest.item_number),
      description: String(rest.description),
      organization_id: Number(rest.organization_id),
      inventory_item_id: Number(rest.inventory_item_id),
      dus_per_stack: Number(rest.dus_per_stack),
      bal_per_dus: Number(rest.bal_per_dus),
      press_per_bal: Number(rest.press_per_bal),
      bks_per_press: Number(rest.bks_per_press),
      btg_per_bks: Number(rest.btg_per_bks),
    });
  };
  const [isLoadingFetch, setIsLoadingFetch] = useState(false);

  const handleFetchItem = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Token not found");
      return;
    }
    setIsLoadingFetch(true);
    try {
      const response = await fetch(
        `${EndPoint}master-item/sync-from-meta-oracle`,
        {
          method: "POST",
          headers: {
            accept: "*/*",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch item from Meta Oracle");
      }
      showSuccessToast("Sync from Meta Oracle successful");
      fetchAll();
    } catch (error: any) {
      showErrorToast(error.message || "Error syncing from Meta Oracle");
    } finally {
      setIsLoadingFetch(false);
    }
  };

  const columns = useMemo(
    () => [
      { accessorKey: "sku", header: "SKU" },
      { accessorKey: "item_number", header: "Item Number" },
      { accessorKey: "description", header: "Description" },
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
      { accessorKey: "inventory_item_id", header: "Inventory Item ID" },
      { accessorKey: "dus_per_stack", header: "Dus/Stack" },
      { accessorKey: "bal_per_dus", header: "Bal/Dus" },
      { accessorKey: "press_per_bal", header: "Press/Bal" },
      { accessorKey: "bks_per_press", header: "Bks/Press" },
      { accessorKey: "btg_per_bks", header: "Btg/Bks" },
    ],
    []
  );

  const formFields = [
    {
      name: "sku",
      label: "SKU",
      type: "text",
      validation: { required: "Required" },
    },
    {
      name: "item_number",
      label: "Item Number",
      type: "text",
      validation: { required: "Required" },
    },
    {
      name: "description",
      label: "Description",
      type: "text",
      validation: { required: "Required" },
    },
    {
      name: "organization_id",
      label: "Organization",
      type: "select",
      options: ioList.map((item: any) => ({
        label: item.organization_name,
        value: item.organization_id,
      })),
      validation: { required: "Required" },
    },
    {
      name: "inventory_item_id",
      label: "Inventory Item ID",
      type: "number",
      validation: { required: "Required" },
    },
    {
      name: "dus_per_stack",
      label: "Dus per Stack",
      type: "number",
      validation: { required: "Required" },
    },
    {
      name: "bal_per_dus",
      label: "Bal per Dus",
      type: "number",
      validation: { required: "Required" },
    },
    {
      name: "press_per_bal",
      label: "Press per Bal",
      type: "number",
      validation: { required: "Required" },
    },
    {
      name: "bks_per_press",
      label: "Bks per Press",
      type: "number",
      validation: { required: "Required" },
    },
    {
      name: "btg_per_bks",
      label: "Btg per Bks",
      type: "number",
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
              disabled={isLoadingFetch}
            />
          </div>
          <div className="space-x-4">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setCreateModalOpen(true)}
              disabled={isLoadingFetch}
            >
              <FaPlus className="mr-2" /> Tambah Data
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => handleFetchItem()}
              disabled={isLoadingFetch}
            >
              <FaSyncAlt className="mr-2" /> Sync Data from Meta
            </Button>
          </div>
        </div>
      </div>

      {isLoadingFetch ? (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-4 text-blue-500 font-semibold">
            Syncing data...
          </span>
        </div>
      ) : (
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
      )}
    </>
  );
};

export default DataTable;
