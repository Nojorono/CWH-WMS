import React, { useEffect, useState, useMemo } from "react";
import { FaPlus, FaQrcode } from "react-icons/fa";
import Input from "../../../../components/form/input/InputField";
import Label from "../../../../components/form/Label";
import Button from "../../../../components/ui/button/Button";
import { useDebounce } from "../../../../helper/useDebounce";
import DynamicTable from "../Table/TableComponent";
import {
  useStoreWarehouse,
  useStoreIo,
  useStoreSubWarehouse,
} from "../../../../DynamicAPI/stores/Store/MasterStore";
import PrintBarcodeModal from "../Modal/PrintBarcodeModal";

const DataTable = () => {
  const { list: Warehouse, fetchAll } = useStoreWarehouse();
  const { fetchAll: fetchAllIo, list: ioList } = useStoreIo();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  // STATE UNTUK MODAL PRINT BARCODE
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedPallets, setSelectedPallets] = useState<any[]>([]);
  const [isPrintModalOpen, setPrintModalOpen] = useState(false);

  const {
    fetchAll: fetchSubWH,
    list: subWHList,
    createData,
    updateData,
    deleteData,
  } = useStoreSubWarehouse();

  useEffect(() => {
    fetchAll();
    fetchAllIo();
    fetchSubWH();
  }, []);

  const columns = useMemo(
    () => [
      {
        accessorKey: "id",
        header: "ID",
        selectedRow: true,
      },
      {
        accessorKey: "organization_id",
        header: "Organization",
        cell: ({ row }: { row: { original: any } }) => {
          const org = ioList.find(
            (item: any) => item.organization_id === row.original.organization_id
          );
          return org ? org.organization_name : row.original.organization_id;
        },
      },
      {
        accessorKey: "warehouse_id",
        header: "Warehouse",
        cell: ({ row }: { row: { original: any } }) => {
          const wh = Warehouse.find(
            (item: any) => item.id === row.original.warehouse_id
          );
          return wh ? wh.name : row.original.warehouse_id;
        },
      },
      { accessorKey: "name", header: "Zone Name" },
      { accessorKey: "code", header: "Code" },
      { accessorKey: "description", header: "Description" },
      { accessorKey: "capacity_bin", header: "Bin Capacity" },
      { accessorKey: "is_staging", header: "Staging Area" },
    ],
    [ioList, Warehouse]
  );

  const formFields = [
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
      name: "warehouse_id",
      label: "Warehouse",
      type: "select",
      options: Warehouse.map((item: any) => ({
        label: item.name,
        value: item.id,
      })),
      validation: { required: "Required" },
    },
    {
      name: "name",
      label: "Zone Name",
      type: "text",
      validation: { required: "Required" },
    },
    {
      name: "code",
      label: "Kode",
      type: "text",
      validation: { required: "Required" },
    },
    {
      name: "is_staging",
      label: "Is Staging Area?",
      type: "select",
      options: [
        { label: "NO", value: "NO" },
        { label: "INBOUND", value: "INBOUND" },
        { label: "OUTBOUND", value: "OUTBOUND" },
      ],
      validation: { required: "Required" },
    },
    {
      name: "description",
      label: "Description",
      type: "text",
      validation: { required: "Required" },
    },
    {
      name: "capacity_bin",
      label: "Bin Capacity",
      type: "number",
      validation: {
        min: { value: 0, message: "Harus >= 0" },
      },
      hiddenWhen: (values: any) =>
        values.is_staging === "INBOUND" || values.is_staging === "OUTBOUND",
    },
  ];

  // Fungsi untuk format payload create
  const handleCreate = (data: any) => {
    const {
      organization_id,
      warehouse_id,
      name,
      code,
      description,
      capacity_bin,
      barcode_image_url,
      is_staging,
    } = data;

    const payload: any = {
      organization_id: Number(organization_id),
      warehouse_id,
      name,
      code,
      description,
      barcode_image_url,
    };

    if (is_staging === "NO") {
      payload.capacity_bin =
        capacity_bin !== undefined ? Number(capacity_bin) : undefined;
      // is_staging tidak dibawa
    } else {
      payload.is_staging = is_staging;
      // capacity_bin tidak dibawa
    }
    return createData(payload);
  };

  // Fungsi untuk format payload update
  const handleUpdate = (data: any) => {
    const {
      id,
      organization_id,
      warehouse_id,
      name,
      code,
      description,
      capacity_bin,
      barcode_image_url,
      is_staging,
    } = data;

    const payload: any = {
      organization_id: Number(organization_id),
      warehouse_id,
      name,
      code,
      description,
      barcode_image_url,
    };

    if (is_staging === "NO") {
      payload.capacity_bin =
        capacity_bin !== undefined ? Number(capacity_bin) : undefined;
      // is_staging tidak dibawa
    } else {
      payload.is_staging = is_staging;
      // capacity_bin tidak dibawa
    }

    return updateData(id, payload);
  };

  const handlePrintBarcode = () => {
    if (selectedIds.length === 0) {
      alert("Pilih minimal 1 data untuk dicetak!");
      return;
    }
    const selected = subWHList.filter((p) => selectedIds.includes(p.id));
    setSelectedPallets(selected);
    setPrintModalOpen(true); // buka modal preview
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
              <FaPlus className="mr-2" /> Tambah Data
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handlePrintBarcode}
              disabled={selectedIds.length === 0} // UX: disabled kalau belum pilih
            >
              <FaQrcode className="mr-2" /> Print Barcode
            </Button>
          </div>
        </div>
      </div>

      <DynamicTable
        data={subWHList}
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
        title="Form UOM"
        onSelectedChange={setSelectedIds}
      />

      {/* 🔑 Modal preview + print */}
      <PrintBarcodeModal
        open={isPrintModalOpen}
        onClose={() => setPrintModalOpen(false)}
        items={selectedPallets}
        useQRCode={true} // true kalau QR, false kalau barcode
      />
    </>
  );
};

export default DataTable;
