import React, { useEffect, useState, useMemo } from "react";
import { FaPlus, FaQrcode } from "react-icons/fa";
import Input from "../../../../components/form/input/InputField";
import Label from "../../../../components/form/Label";
import Button from "../../../../components/ui/button/Button";
import { useDebounce } from "../../../../helper/useDebounce";
import DynamicTable from "../../../../components/wms-components/DynamicTable";
import {
  useStoreWarehouse,
  useStoreIo,
  useStoreSubWarehouse,
  useStoreBin,
} from "../../../../DynamicAPI/stores/Store/MasterStore";
import PrintBarcodeModal from "../Modal/PrintBarcodeModal";
import { showErrorToast } from "../../../../components/toast";
import { showConfirmDialog } from "../../../../components/swal-confirm";

interface DataTableProps {
  params?: {
    orgId?: any;
    zoneId?: any;
    zoneCode?: any;
  };
}

const DataTable: React.FC<DataTableProps> = ({ params }) => {
  const { list: Warehouse, fetchAll } = useStoreWarehouse();
  const { fetchAll: fetchAllIo, list: ioList } = useStoreIo();
  const { fetchAll: fetchSubWH, list: subWHList } = useStoreSubWarehouse();
  
  const {
    fetchAll: fetchBin,
    list: binList,
    createData,
    updateData,
    deleteData,
  } = useStoreBin();

  // STATE UNTUK MODAL PRINT BARCODE
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedBins, setSelectedBin] = useState<any[]>([]);
  const [isPrintModalOpen, setPrintModalOpen] = useState(false);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  useEffect(() => {
    fetchAll();
    fetchAllIo();
    fetchSubWH();
    fetchBin();
  }, []);

  const columns = useMemo(
    () => [
      { accessorKey: "id", header: "ID", selectedRow: true },
      {
        accessorKey: "organization_id",
        header: "Organization",
        cell: ({ row }: any) => {
          const org = ioList.find(
            (item: any) =>
              item.organization_id === row.original.organization_id,
          );
          return org ? org.organization_name : row.original.organization_id;
        },
      },
      {
        accessorKey: "warehouse_sub_id",
        header: "Zone",
        cell: ({ row }: any) => {
          const subWh = subWHList.find(
            (item: any) => item.id === row.original.warehouse_sub_id,
          );
          return subWh ? subWh.name : row.original.warehouse_sub_id;
        },
      },
      { accessorKey: "name", header: "Nama" },
      { accessorKey: "code", header: "Kode" },
      { accessorKey: "description", header: "Deskripsi" },
      { accessorKey: "capacity_pallet", header: "Kapasitas Pallet" },
    ],
    [ioList, subWHList],
  );

  const formFields = [
    {
      name: "name",
      label: "Nama Bin",
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
      name: "description",
      label: "Deskripsi",
      type: "text",
      validation: { required: "Required" },
    },
    {
      name: "capacity_pallet",
      label: "Kapasitas Pallet",
      type: "number",
      // sembunyikan ketika params.zoneCode memiliki nilai "PRELOAD"
      hiddenWhen: () => params?.zoneCode === "PRELOAD",
    },
  ];

  // Fungsi untuk format payload create
  const handleCreate = (data: any) => {
    const {
      // organization_id,
      // warehouse_sub_id,
      name,
      code,
      description,
      capacity_pallet,
    } = data;

    const payload: any = {
      organization_id: params?.orgId,
      warehouse_sub_id: params?.zoneId,
      name,
      code,
      description,
    };

    // Hapus capacity_pallet dari payload jika kosong string
    if (capacity_pallet != null) {
      const cp =
        typeof capacity_pallet === "string"
          ? capacity_pallet.trim()
          : capacity_pallet;
      if (cp !== "") {
        payload.capacity_pallet = Number(cp);
      }
    }

    return createData(payload);
  };

  // Fungsi untuk format payload update
  const handleUpdate = (data: any) => {
    const { id, name, code, description, capacity_pallet } = data;
    return updateData(id, {
      organization_id: params?.orgId,
      warehouse_sub_id: params?.zoneId,
      name,
      code,
      description,
      capacity_pallet: Number(capacity_pallet),
    });
  };

  const handlePrintBarcode = () => {
    if (selectedIds.length === 0) {
      showErrorToast("Pilih minimal 1 data untuk dicetak!");
      return;
    }
    const selected = binList.filter(
      (p) => typeof p.id === "string" && selectedIds.includes(p.id),
    );
    setSelectedBin(selected);
    setPrintModalOpen(true); // buka modal preview
  };

  const handleDelete = (id: number) => {
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

  const filteredBinList = useMemo(() => {
    if (params?.zoneId) {
      return binList.filter((bin) => bin.warehouse_sub_id === params.zoneId);
    }
    return binList;
  }, [binList, params?.zoneId]);

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
              <FaPlus className="mr-2" /> Tambah BIN
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handlePrintBarcode}
              disabled={selectedIds.length === 0} // UX: disabled kalau belum pilih
            >
              <FaQrcode className="mr-2" /> Print Barcode BIN
            </Button>
          </div>
        </div>
      </div>

      <DynamicTable
        data={filteredBinList}
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
        title="Form UOM"
        onSelectedChange={setSelectedIds}
      />

      {/* 🔑 Modal preview + print */}
      <PrintBarcodeModal
        open={isPrintModalOpen}
        onClose={() => setPrintModalOpen(false)}
        items={selectedBins}
        useQRCode={true}
      />
    </>
  );
};

export default DataTable;
