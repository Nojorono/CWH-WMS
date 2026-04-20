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
  useStoreZoneByWarehouse,
} from "../../../../DynamicAPI/stores/Store/MasterStore";
import PrintBarcodeModal from "../Modal/PrintBarcodeModal";
import { showErrorToast } from "../../../../components/toast";
import { showConfirmDialog } from "../../../../components/swal-confirm";

interface DataTableProps {
  params?: {
    WHid: any;
    locatorId?: Number;
    locatorName?: String;
  };
}

const DataTable = ({ params }: DataTableProps) => {
  // Store Hooks
  const { list: Warehouse, fetchAll: fetchAllWarehouse } = useStoreWarehouse();
  const { fetchById: fetchZoneByWH, detail: WHdetail } =
    useStoreZoneByWarehouse();
  const { fetchAll: fetchAllIo, list: ioList } = useStoreIo();
  const {
    fetchAll: fetchSubWH,
    list: subWHList,
    createData,
    updateData,
    deleteData,
  } = useStoreSubWarehouse();

  // State
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  // State untuk Modal Print Barcode
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedPallets, setSelectedPallets] = useState<any[]>([]);
  const [isPrintModalOpen, setPrintModalOpen] = useState(false);

  // LOGIKA PEMILIHAN DATA:
  const displayData = useMemo(() => {
    return params?.WHid ? (Array.isArray(WHdetail) ? WHdetail : []) : subWHList;
  }, [params?.WHid, WHdetail, subWHList]);

  // LOGIKA FETCHING DINAMIS
  const handleRefresh = () => {
    if (params?.WHid) {
      fetchZoneByWH(params.WHid);
    } else {
      fetchSubWH();
    }
  };

  useEffect(() => {
    fetchAllIo();
    fetchAllWarehouse();
    handleRefresh();
  }, [params?.WHid]);

  const columns = useMemo(
    () => [
      {
        accessorKey: "id",
        header: "ID",
        selectedRow: true,
      },
      {
        accessorKey: "warehouse_id",
        header: "Warehouse",
        cell: ({ row }: { row: { original: any } }) => {
          const wh = Warehouse.find(
            (item: any) => item.id === row.original.warehouse_id,
          );
          return wh ? wh.name : row.original.warehouse_id;
        },
      },
      { accessorKey: "name", header: "Zone Name" },
      { accessorKey: "code", header: "Code" },
      { accessorKey: "description", header: "Description" },
      {
        accessorKey: "capacity_bin",
        header: "Bin Capacity",
        cell: ({ row }: { row: { original: any } }) => {
          return row.original.capacity_bin === 0
            ? ""
            : row.original.capacity_bin;
        },
      },
      { accessorKey: "is_staging", header: "Staging Area" },
      {
        accessorKey: "is_gate",
        header: "Gate Area",
        cell: ({ row }: { row: { original: any } }) => {
          return row.original.is_gate ? "Yes" : "";
        },
      },
    ],
    [ioList, Warehouse],
  );

  const formFields = [
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
      name: "is_gate",
      label: "Is Gate?",
      type: "checkbox",
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
        values.is_staging === "INBOUND" ||
        values.is_staging === "OUTBOUND" ||
        values.is_gate === true,
    },
  ];

  const handleCreate = async (data: any) => {
    const {
      name,
      code,
      description,
      capacity_bin,
      barcode_image_url,
      is_staging,
      is_gate,
      is_good_stock, // field baru
    } = data;

    const payload: any = {
      // Mengambil dari params atau state yang tersedia
      warehouse_id: params?.WHid || data.warehouse_id,
      name,
      code,
      description,
      barcode_image_url,
      is_gate: !!is_gate,
      is_good_stock: !!is_good_stock, // konversi ke boolean
      locator_id: params?.locatorId || data.locator_id, // dari params props
      locator_name: params?.locatorName || data.locator_name, // dari params props
    };

    // Logika bisnis proses yang sudah ada (Prioritas Staging vs Capacity)
    if (is_staging === "NO") {
      payload.capacity_bin =
        capacity_bin !== undefined ? Number(capacity_bin) : undefined;
      payload.is_staging = null;
    } else {
      payload.is_staging = is_staging;
      payload.capacity_bin = null; // Menghindari konflik data
    }

    try {
      await createData(payload);
      handleRefresh();
      setCreateModalOpen(false);
    } catch (error) {
      console.error(error);
      return { success: false };
    }
  };

  const handleUpdate = async (data: any) => {
    const {
      id,
      warehouse_id,
      name,
      code,
      description,
      capacity_bin,
      barcode_image_url,
      is_staging,
      is_gate,
      is_good_stock, // field baru
      locator_id, // field baru
      locator_name, // field baru
    } = data;

    const payload: any = {
      warehouse_id,
      name,
      code,
      description,
      barcode_image_url,
      is_gate: !!is_gate,
      is_good_stock: !!is_good_stock,
      locator_id: locator_id,
      locator_name: locator_name,
    };

    // Tetap mempertahankan logika prioritas bisnis proses yang lama
    if (is_gate === true) {
      payload.capacity_bin = null;
      payload.is_staging = null;
    } else if (is_staging === "NO") {
      payload.capacity_bin =
        capacity_bin !== undefined ? Number(capacity_bin) : undefined;
      payload.is_staging = null;
    } else {
      payload.is_staging = is_staging;
      payload.capacity_bin = null;
    }

    try {
      await updateData(id, payload);
      handleRefresh();
      return { success: true };
    } catch (error) {
      console.error(error);
      return { success: false };
    }
  };

  const handlePrintBarcode = () => {
    if (selectedIds.length === 0) {
      showErrorToast("Pilih minimal 1 data untuk dicetak!");
      return;
    }
    const selected = displayData.filter((p: any) => selectedIds.includes(p.id));
    setSelectedPallets(selected);
    setPrintModalOpen(true);
  };

  const handleDelete = (id: number) => {
    showConfirmDialog(
      async () => {
        try {
          await deleteData(id);
          handleRefresh();
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

            <Button
              variant="primary"
              size="sm"
              onClick={handlePrintBarcode}
              disabled={selectedIds.length === 0}
            >
              <FaQrcode className="mr-2" /> Print Barcode
            </Button>
          </div>
        </div>
      </div>

      <DynamicTable
        data={displayData}
        globalFilter={debouncedSearch}
        isCreateModalOpen={isCreateModalOpen}
        onCloseCreateModal={() => setCreateModalOpen(false)}
        columns={columns}
        formFields={formFields}
        onSubmit={handleCreate}
        onUpdate={handleUpdate}
        onDelete={async (id) => {
          handleDelete(id as number);
        }}
        onRefresh={handleRefresh}
        getRowId={(row) => row.id}
        title={params?.WHid ? `Warehouse Zones` : "Form Zone"}
        onSelectedChange={setSelectedIds}
      />

      <PrintBarcodeModal
        open={isPrintModalOpen}
        onClose={() => setPrintModalOpen(false)}
        items={selectedPallets}
        useQRCode={true}
      />
    </>
  );
};

export default DataTable;