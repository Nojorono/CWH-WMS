import React, { useEffect, useState, useMemo } from "react";
import { FaBarcode, FaPlus, FaPrint, FaQrcode, FaRocket } from "react-icons/fa";
import Input from "../../../../components/form/input/InputField";
import Label from "../../../../components/form/Label";
import Button from "../../../../components/ui/button/Button";
import { useDebounce } from "../../../../helper/useDebounce";
import DynamicTable from "../Table/TableComponent";
import {
  useStorePallet,
  useStoreIo,
  useStoreUom,
} from "../../../../DynamicAPI/stores/Store/MasterStore";
import PrintBarcodeModal from "../Modal/PrintBarcodeModal";
import { showErrorToast } from "../../../../components/toast";
import GeneratePalletModal from "../Modal/GeneratePalletModal";

const DataTable = () => {
  const {
    list: pallet,
    createData,
    updateData,
    deleteData,
    fetchAll: fetchPallet,
  } = useStorePallet();

  const { list: uomList, fetchAll: fetchUom } = useStoreUom();
  const { list: IoList, fetchAll: fetchIO } = useStoreIo();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  // 🔑 tambahan state untuk modal preview
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isPrintModalOpen, setPrintModalOpen] = useState(false);
  const [selectedPallets, setSelectedPallets] = useState<any[]>([]);
  const [isGenerateModalOpen, setGenerateModalOpen] = useState(false); // 🔑 State baru
  const [selectedOrgName, setSelectedOrgName] = useState("");
  console.log("Selected Organization Name:", selectedOrgName);

  useEffect(() => {
    fetchPallet();
    fetchIO();
    fetchUom();
  }, []);

  const handleCreate = async (data: any) => {
    const selectedOrg = IoList.find(
      (item: any) => String(item.id) === String(data.organization_id),
    );
    const orgName = selectedOrg ? selectedOrg.organization_name : "";

    const formattedData = {
      ...data,
      // Format baru: ORG-PALLET (Contoh: CWH-PAL-001)
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

  const handleUpdate = (data: any) => {
    const { id, ...rest } = data;

    const selectedOrg = IoList.find(
      (item: any) => String(item.id) === String(rest.organization_id),
    );
    const orgName = selectedOrg ? selectedOrg.organization_name : "";

    let baseCode = String(rest.pallet_code);

    // Logika Pembersihan: Hapus orgName lama jika ada di depan atau di belakang
    if (orgName) {
      // Hapus jika ada di depan (Format baru)
      if (baseCode.startsWith(`${orgName}-`)) {
        baseCode = baseCode.replace(`${orgName}-`, "");
      }
      // Hapus jika ada di belakang (Jaga-jaga data lama)
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
          const org = IoList.find(
            (item: any) =>
              item.organization_id === row.original.organization_id,
          );
          return org ? org.organization_name : row.original.organization_id;
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
          row.original.isActive ? "Active" : "Inactive",
      },
      {
        accessorKey: "isFull",
        header: "Is Full",
        cell: ({ row }: { row: { original: any } }) =>
          row.original.isFull ? "Full" : "Not Full",
      },
      {
        accessorKey: "uom",
        header: "UOM",
        cell: ({ row }: { row: { original: any } }) => {
          const uom = uomList.find((item: any) => item.id === row.original.uom);
          return uom ? uom.name : row.original.uom;
        },
      },
    ],
    [IoList, uomList],
  );

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
          if (org) {
            setSelectedOrgName(org.organization_name);
          } else {
            setSelectedOrgName("");
            console.log("tak ada org_name");
          }
        },
      },
      {
        name: "pallet_code",
        label: `Pallet Code ${selectedOrgName ? `(${selectedOrgName}- ...)` : ""}`,
        type: "text",
        placeholder: "Masukkan kode pallet...",
        description: selectedOrgName
          ? `Hasil akhir: ${selectedOrgName}-[inputan_anda]`
          : "Pilih organisasi dlu untuk melihat format prefix.",
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
          ...uomList.map((item: any) => ({
            label: item.name,
            value: item.name,
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

  const handlePrintBarcode = () => {
    if (selectedIds.length === 0) {
      showErrorToast("Pilih minimal 1 data untuk dicetak!");
      return;
    }
    const selected = pallet.filter(
      (p) => typeof p.id === "string" && selectedIds.includes(p.id),
    );
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
              disabled={selectedIds.length === 0} // UX: disabled kalau belum pilih
            >
              <FaQrcode className="mr-2" /> Print Barcode
            </Button>
          </div>
        </div>
      </div>

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
        getRowId={(row) => row.id}
        title="Form Data"
        onSelectedChange={setSelectedIds}
      />

      {/* 🔑 Modal preview + print */}
      <PrintBarcodeModal
        open={isPrintModalOpen}
        onClose={() => setPrintModalOpen(false)}
        items={selectedPallets}
        useQRCode={true} // true kalau QR, false kalau barcode
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
