import { useEffect, useState, useMemo } from "react";
import { FaPlus } from "react-icons/fa";
import Input from "../../../../../../components/form/input/InputField";
import Label from "../../../../../../components/form/Label";
import Button from "../../../../../../components/ui/button/Button";
import { useDebounce } from "../../../../../../helper/useDebounce";
import DynamicTable from "../../../../../../components/wms-components/DynamicTable";
import { useStoreInboundScan } from "../../../../../../DynamicAPI/stores/Store/MasterStore";

interface HelperAssignProps {
  inboundID?: string;
}

const DataTable = ({ inboundID }: { inboundID?: string }) => {
  const { list: InboundScan, fetchUsingParam } = useStoreInboundScan();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  useEffect(() => {
    fetchUsingParam({
      inbound_id: inboundID,
      // status: "PENDING",
    });
  }, [fetchUsingParam]);

  const handleFetch = () => {
    fetchUsingParam({
      inbound_id: inboundID,
    });
  };

  const columns = useMemo(
    () => [
      { accessorKey: "production_date", header: "Production Date" },
      { accessorKey: "week_number", header: "Week Number" },
      { accessorKey: "item.sku", header: "SKU" },
      { accessorKey: "item.item_number", header: "Item Number" },
      { accessorKey: "item.description", header: "Description" },
      { accessorKey: "quantity", header: "Quantity" },
      { accessorKey: "uom", header: "UOM" },
      { accessorKey: "user_name", header: "User Name" },
      { accessorKey: "pallet.pallet_code", header: "Pallet Code" },
      { accessorKey: "status", header: "Status" },
    ],
    []
  );

  const formFields = [
    {
      name: "production_date",
      label: "Production Date",
      type: "date",
      validation: { required: "Required" },
    },
    {
      name: "inbound_id",
      label: "Inbound ID",
      type: "text",
      validation: { required: "Required" },
    },
    {
      name: "item_id",
      label: "Item ID",
      type: "text",
      validation: { required: "Required" },
    },
    {
      name: "quantity",
      label: "Quantity",
      type: "number",
      validation: {
        required: "Required",
        min: { value: 0, message: "Harus >= 0" },
      },
    },
    {
      name: "uom",
      label: "UOM",
      type: "text",
      validation: { required: "Required" },
    },
    {
      name: "user_id",
      label: "User ID",
      type: "text",
      validation: { required: "Required" },
    },
    {
      name: "user_name",
      label: "User Name",
      type: "text",
      validation: { required: "Required" },
    },
    {
      name: "pallet_code",
      label: "Pallet Code",
      type: "text",
      validation: { required: "Required" },
    },
    {
      name: "status",
      label: "Status",
      type: "text",
      validation: { required: "Required" },
    },
  ];

  const handleCreate = async (data: any) => {};
  const handleUpdate = async (data: any) => {};
  function handleDelete(id: any): Promise<void> {
    throw new Error("Function not implemented.");
  }

  return (
    <>
      <DynamicTable
        data={InboundScan}
        globalFilter={debouncedSearch}
        isCreateModalOpen={isCreateModalOpen}
        onCloseCreateModal={() => setCreateModalOpen(false)}
        columns={columns}
        formFields={formFields}
        onSubmit={handleCreate}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        onRefresh={handleFetch}
        getRowId={(row) => row.id}
        title="Form UOM"
        noActions={true}
      />
    </>
  );
};

export default DataTable;
