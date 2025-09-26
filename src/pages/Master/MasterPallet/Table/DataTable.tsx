import React, { useEffect, useState, useMemo } from "react";
import { FaPlus } from "react-icons/fa";
import Input from "../../../../components/form/input/InputField";
import Label from "../../../../components/form/Label";
import Button from "../../../../components/ui/button/Button";
import { useDebounce } from "../../../../helper/useDebounce";
import DynamicTable from "../../../../components/wms-components/DynamicTable";
import {
  useStorePallet,
  useStoreIo,
  useStoreUom,
} from "../../../../DynamicAPI/stores/Store/MasterStore";

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

  useEffect(() => {
    fetchPallet();
    fetchIO();
    fetchUom();
  }, []);

  // Fungsi untuk format payload create
  const handleCreate = async (data: any) => {
    const formattedData = {
      organization_id: Number(data.organization_id),
      pallet_code: String(data.pallet_code),
      capacity: Number(data.capacity),
      isActive: data.isActive === "true" || data.isActive === true,
      isFull: data.isFull === "true" || data.isFull === true,
      uom: String(data.uom),
      qr_image_url: "",
      currentQuantity: 0,
    };
    return await createData(formattedData);
  };

  // Fungsi untuk format payload update
  const handleUpdate = (data: any) => {
    const { id, ...rest } = data;
    return updateData(id, {
      organization_id: Number(rest.organization_id),
      pallet_code: String(rest.pallet_code),
      capacity: Number(rest.capacity),
      isActive: rest.isActive === "true" || rest.isActive === true,
      isFull: rest.isFull === "true" || rest.isFull === true,
      uom: String(rest.uom),
      currentQuantity: Number(rest.currentQuantity),
    });
  };

  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);

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
            (item: any) => item.organization_id === row.original.organization_id
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
      {
        accessorKey: "qr_image_url",
        header: "QR Code",
        cell: ({ row }: { row: { original: any } }) =>
          row.original.qr_image_url ? (
            <button
              className="text-blue-600 underline"
              onClick={() => {
                setQrImageUrl(row.original.qr_image_url);
                setQrModalOpen(true);
              }}
              type="button"
            >
              {row.original.qr_image_url ? "Lihat QR" : "No QR"}
            </button>
          ) : (
            <span className="text-gray-400">No QR</span>
          ),
      },
    ],
    [IoList, uomList]
  );

  const formFields = [
    {
      name: "organization_id",
      label: "Organization",
      type: "select",
      options: [
        { label: "--Select--", value: "" },
        ...IoList.map((item: any) => ({
          label: item.organization_name,
          value: item.organization_id,
        })),
      ],
      validation: { required: "Required" },
    },
    {
      name: "pallet_code",
      label: "Pallet Code",
      type: "text",
      validation: { required: "Required" },
    },
    {
      name: "capacity",
      label: "Capacity",
      type: "number",
      validation: { required: "Required" },
    },
    {
      name: "isActive",
      label: "Is Active",
      type: "select",
      options: [
        { label: "--Select--", value: "" },
        { label: "Active", value: true },
        { label: "Inactive", value: false },
      ],
    },
    {
      name: "isFull",
      label: "Is Full",
      type: "select",
      options: [
        { label: "--Select--", value: "" },
        { label: "Full", value: true },
        { label: "Not Full", value: false },
      ],
    },
    {
      name: "uom",
      label: "UOM",
      type: "select",
      options: [
        { label: "--Select--", value: "" },
        ...uomList.map((item: any) => ({
          label: item.name,
          value: item.id,
        })),
      ],
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
          </div>
        </div>
      </div>

      <DynamicTable
        data={pallet}
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
        onRefresh={fetchPallet}
        getRowId={(row) => row.id}
        title="Form Data"
      />

      {qrModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white bg-opacity-40">
          <div className="bg-white rounded shadow-lg p-4 relative max-w-xs w-full">
            <button
              className="absolute top-2 right-2 text-gray-500"
              onClick={() => setQrModalOpen(false)}
            >
              ✕
            </button>
            {/* Tampilkan pallet_code di atas gambar QR */}
            <div className="mb-2 font-semibold">
              {pallet.find((item: any) => item.qr_image_url === qrImageUrl)
                ?.pallet_code || "-"}
            </div>
            {qrImageUrl ? (
              <img
                src={qrImageUrl}
                alt="QR Code"
                className="max-w-full max-h-80 mx-auto"
              />
            ) : (
              <div>Tidak ada gambar</div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default DataTable;
