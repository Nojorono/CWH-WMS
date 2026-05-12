import React, { useEffect, useState, useMemo } from "react";
import { FaSync } from "react-icons/fa"; // Mengubah icon agar lebih relevan dengan fungsi Sync
import Input from "../../../../components/form/input/InputField";
import Label from "../../../../components/form/Label";
import Button from "../../../../components/ui/button/Button";
import { useDebounce } from "../../../../helper/useDebounce";
import DynamicTable from "../../../../components/wms-components/DynamicTable";
import {
  useStoreIo,
  useStoreIoFromMeta,
} from "../../../../DynamicAPI/stores/Store/MasterStore";
import ActIndicator from "../../../../components/ui/activityIndicator";

const DataTable = () => {
  const { list: IoList, fetchAll: fetchIO } = useStoreIo();
  const { fetchAll: fetchIOfromMeta, isLoading: isSyncing } =
    useStoreIoFromMeta();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    fetchIO();
  }, [fetchIO]);

  // Penyesuaian Kolom berdasarkan data JSON terbaru
  const columns = useMemo(
    () => [
      {
        accessorKey: "organization_code",
        header: "Org Code",
        cell: (info: any) => (
          <span className="font-semibold text-gray-700">{info.getValue()}</span>
        ),
      },
      { accessorKey: "organization_name", header: "Org Name" },
      { accessorKey: "org_name", header: "Operating Unit" },
      { accessorKey: "region_code", header: "Region" },
      {
        accessorKey: "address",
        header: "Address",
        // Opsional: membatasi lebar kolom alamat agar tidak merusak layout table
        cell: (info: any) => (
          <div className="max-w-xs truncate">{info.getValue()}</div>
        ),
      },
      {
        accessorKey: "start_date_active",
        header: "Active Since",
        cell: (info: any) =>
          info.getValue()
            ? new Date(info.getValue()).toLocaleDateString("id-ID")
            : "-",
      },
    ],
    [],
  );

  const syncMeta = async () => {
    try {
      await fetchIOfromMeta();
      fetchIO(); // Refresh data lokal setelah sync berhasil
    } catch (error) {
      console.error("Failed to sync from ERP:", error);
    }
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
                placeholder="🔍 Cari Org Code atau Nama.."
              />
            </div>
          </div>
          <div className="flex items-center">
            <Button
              variant="primary"
              size="sm"
              onClick={syncMeta}
              disabled={isSyncing}
              className="flex items-center gap-2"
            >
              <FaSync className={`${isSyncing ? "animate-spin" : ""}`} />
              {isSyncing ? "Syncing..." : "Sync from ERP Meta"}
            </Button>
          </div>
        </div>
      </div>

      {isSyncing ? (
        <div className="flex justify-center items-center h-64 bg-white rounded-md shadow-sm">
          <ActIndicator />
        </div>
      ) : (
        <DynamicTable
          data={IoList}
          globalFilter={debouncedSearch}
          columns={columns}
          onRefresh={fetchIO}
          getRowId={(row) => row.id}
          title="Inventory Organization List"
          isCreateModalOpen={false}
          onCloseCreateModal={() => {}}
          formFields={[]}
          noActions={true}
        />
      )}
    </>
  );
};

export default DataTable;
