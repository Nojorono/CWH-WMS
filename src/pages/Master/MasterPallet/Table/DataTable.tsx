import React, { useEffect, useState, useMemo } from "react";
import { FaPlus, FaQrcode, FaRocket, FaSync } from "react-icons/fa";
import Input from "../../../../components/form/input/InputField";
import Label from "../../../../components/form/Label";
import Button from "../../../../components/ui/button/Button";
import { useDebounce } from "../../../../helper/useDebounce";
import DynamicTable from "../Table/TableComponent";
import {
  useStorePallet,
  useStoreUom,
} from "../../../../DynamicAPI/stores/Store/MasterStore";
import PrintBarcodeModal from "../Modal/PrintBarcodeModal";
import { showErrorToast } from "../../../../components/toast";
import GeneratePalletModal from "../Modal/GeneratePalletModal";
import { usePersistAuthStore } from "../../../../API/store/AuthStore/PersistAuthStore";

const DataTable = () => {
  // Store Master Data Pallet & UOM
  const {
    list: pallet,
    createData,
    updateData,
    deleteData,
    fetchAll: fetchPallet,
    isLoading,
  } = useStorePallet();

  const { list: uomList, fetchAll: fetchUom } = useStoreUom();

  // Local State UI Controls
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isPrintModalOpen, setPrintModalOpen] = useState(false);
  const [selectedPallets, setSelectedPallets] = useState<any[]>([]);
  const [isGenerateModalOpen, setGenerateModalOpen] = useState(false);
  const [selectedOrgName, setSelectedOrgName] = useState("");

  // Ambil Data Gudang Organisasi & Info User dari Zustand Store Persistent baru
  const globalIoList = usePersistAuthStore((state) => state.ioList) || [];
  const user = usePersistAuthStore((state) => state.user);

  // Ambil data dari backend saat komponen pertama kali dirender
  useEffect(() => {
    fetchPallet();
    fetchUom();
  }, []);

  // Filter List IO berdasarkan hak akses Organisasi User (HO vs Cabang)
  const IoList = useMemo(() => {
    const organizationId = user?.userDetail?.organization?.id || null;

    // Jika user HO / Superadmin (tidak memiliki organizationId spesifik), tampilkan semua IO
    if (!organizationId) return globalIoList;

    // Jika user Cabang, filter hanya organisasi milik dia saja
    return globalIoList.filter(
      (io: any) => String(io?.id) === String(organizationId),
    );
  }, [globalIoList, user]);

  // Handler: Membuat Pallet Baru (Otomatis Append Prefix Nama Organisasi)
  const handleCreate = async (data: any) => {
    const selectedOrg = IoList.find(
      (item: any) => String(item.id) === String(data.organization_id),
    );
    const orgName = selectedOrg ? selectedOrg.organization_name : "";

    const formattedData = {
      ...data,
      pallet_code: orgName
        ? `${orgName}-${data.pallet_code}`
        : data.pallet_code,
      capacity: Number(data.capacity),
      isActive: true,
      isFull: false,
      uom: String(data.uom),
      currentQuantity: 0,
    };

    return await createData(formattedData);
  };

  // Handler: Update Data Pallet (Pembersihan & Penyusunan Ulang Prefix Code)
  const handleUpdate = (data: any) => {
    const { id, ...rest } = data;

    const selectedOrg = IoList.find(
      (item: any) => String(item.id) === String(rest.organization_id),
    );
    const orgName = selectedOrg ? selectedOrg.organization_name : "";

    let baseCode = String(rest.pallet_code);

    // Bersihkan prefix/suffix duplikat kode organisasi lama jika ada
    if (orgName) {
      if (baseCode.startsWith(`${orgName}-`)) {
        baseCode = baseCode.replace(`${orgName}-`, "");
      }
      if (baseCode.endsWith(`-${orgName}`)) {
        baseCode = baseCode.replace(`-${orgName}`, "");
      }
    }

    const finalPalletCode = orgName ? `${orgName}-${baseCode}` : baseCode;

    return updateData(id, {
      organization_id: rest.organization_id,
      pallet_code: finalPalletCode,
      capacity: Number(rest.capacity),
      isActive: rest.isActive === "true" || rest.isActive === true,
      isFull: rest.isFull === "true" || rest.isFull === true,
      uom: String(rest.uom),
      currentQuantity: Number(rest.currentQuantity),
    });
  };

  // Definisikan Struktur Kolom Tabel Dinamis
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
          const rowOrgId = row.original.organization_id;
          const org = IoList.find(
            (item: any) => String(item.id) === String(rowOrgId),
          );

          return (
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {org ? org.organization_name : `ID Not Found: ${rowOrgId}`}
            </span>
          );
        },
      },
      {
        accessorKey: "pallet_code",
        header: "Pallet Code",
      },
      {
        accessorKey: "capacity",
        header: "Capacity",
      },
      {
        accessorKey: "currentQuantity",
        header: "Current Qty",
      },
      {
        accessorKey: "isActive",
        header: "Active",
        cell: ({ row }: { row: { original: any } }) =>
          row.original.isActive ? (
            <span className="text-green-600 font-semibold">Active</span>
          ) : (
            <span className="text-gray-400">Inactive</span>
          ),
      },
      {
        accessorKey: "uom",
        header: "UOM",
        cell: ({ row }: { row: { original: any } }) => {
          const uom = uomList.find(
            (item: any) =>
              item.code === row.original.uom ||
              String(item.id) === String(row.original.uom),
          );
          return uom ? uom.name : row.original.uom;
        },
      },
    ],
    [IoList, uomList],
  );

  // Definisikan Field Form Input Dinamis untuk Modal CRUD
  const dynamicFormFields = useMemo(() => {
    return [
      {
        name: "organization_id",
        label: "Organization",
        type: "select",
        options: [
          { label: "--Select--", value: "" },
          ...IoList.map((item: any) => ({
            label: item.organization_name,
            value: item.id,
          })),
        ],
        validation: { required: "Required" },
        onChange: (e: any) => {
          const val = e?.target ? e.target.value : e;
          const org = IoList.find(
            (item: any) => String(item.id) === String(val),
          );
          setSelectedOrgName(org ? org.organization_name : "");
        },
      },
      {
        name: "pallet_code",
        label: `Pallet Code ${selectedOrgName ? `(${selectedOrgName}- ...)` : ""}`,
        type: "text",
        placeholder: "Masukkan kode pallet...",
        description: selectedOrgName
          ? `Hasil akhir: ${selectedOrgName}-[inputan_anda]`
          : "Pilih organisasi dulu untuk melihat format prefix.",
        validation: { required: "Required" },
      },
      {
        name: "capacity",
        label: "Capacity",
        type: "number",
        validation: { required: "Required" },
      },
      {
        name: "uom",
        label: "UOM",
        type: "select",
        options: [
          { label: "--Select--", value: "" },
          ...uomList.map((uom: any) => ({
            label: uom.code,
            value: uom.code,
          })),
        ],
        validation: { required: "Required" },
      },
      {
        name: "isActive",
        label: "Active",
        type: "radio",
        options: [
          { label: "Yes", value: "true" },
          { label: "No", value: "false" },
        ],
        validation: { required: "Required" },
      },
    ];
  }, [IoList, selectedOrgName, uomList]);

  // Handler: Mengumpulkan Pallet Yang Dipilih untuk Print Barcode/QR
  const handlePrintBarcode = () => {
    if (selectedIds.length === 0) {
      showErrorToast("Pilih minimal 1 data untuk dicetak!");
      return;
    }

    // KUNCI PERBAIKAN BUG: Gunakan String(p.id) agar pencocokan ID bertipe number tetap sukses bekerja
    const selected = pallet.filter((p) => selectedIds.includes(String(p.id)));

    setSelectedPallets(selected);
    setPrintModalOpen(true);
  };

  const handleRefresh = () => {
    fetchPallet();
  };

  return (
    <>
      {/* Search and Action Toolbar Bar */}
      <div className="p-4 bg-white shadow rounded-xl mb-5 border border-gray-100">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Label
              htmlFor="search"
              className="text-sm font-semibold text-gray-600"
            >
              Search
            </Label>
            <Input
              onChange={(e) => setSearch(e.target.value)}
              type="text"
              id="search"
              placeholder="🔍 Masukan data.."
              className="max-w-xs"
            />
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setCreateModalOpen(true)}
            >
              <FaPlus className="mr-2" /> Add Data
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setGenerateModalOpen(true)}
            >
              <FaRocket className="mr-2" /> Generate Pallet
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handlePrintBarcode}
              disabled={selectedIds.length === 0}
            >
              <FaQrcode className="mr-2" /> Print Barcode
            </Button>

            <Button variant="action" size="sm" onClick={handleRefresh}>
              <FaSync className="mr-2" /> Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area (Table Component) */}
      {isLoading ? (
        <div className="flex p-8 justify-center items-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="ml-3 text-sm text-gray-500 font-medium">
            Loading pallet master data...
          </p>
        </div>
      ) : (
        <DynamicTable
          data={pallet}
          globalFilter={debouncedSearch}
          isCreateModalOpen={isCreateModalOpen}
          onCloseCreateModal={() => setCreateModalOpen(false)}
          columns={columns}
          formFields={dynamicFormFields}
          onSubmit={handleCreate}
          onUpdate={handleUpdate}
          onDelete={async (id) => {
            await deleteData(id);
          }}
          onRefresh={fetchPallet}
          getRowId={(row) => String(row.id)}
          title="Master Pallet Management"
          onSelectedChange={setSelectedIds}
        />
      )}

      {/* Modal Popup Component Viewports */}
      <PrintBarcodeModal
        open={isPrintModalOpen}
        onClose={() => setPrintModalOpen(false)}
        items={selectedPallets}
        useQRCode={true}
      />

      <GeneratePalletModal
        isOpen={isGenerateModalOpen}
        onClose={() => setGenerateModalOpen(false)}
        onSuccess={fetchPallet}
        organizations={IoList}
        uoms={uomList}
      />
    </>
  );
};

export default DataTable;
