import React, { useState, useMemo, useEffect } from "react";
import { FaSync } from "react-icons/fa";
import Button from "../../../../components/ui/button/Button";
import { useDebounce } from "../../../../helper/useDebounce";
import DynamicTable from "../../../../components/wms-components/DynamicTable";
import ActIndicator from "../../../../components/ui/activityIndicator";
import axiosInstance from "../../../../API/services/AxiosInstance";
import { showErrorToast, showSuccessToast } from "../../../../components/toast";

// Interface untuk type-safety
interface MasterWeekData {
  TAHUN: string;
  MINGGU: string;
  BULAN: string;
  QUARTER: number;
  TANGGAL_AWAL_MINGGU_REAL: string;
  TANGGAL_AKHIR_MINGGU_REAL: string;
}

const DataTable = () => {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [loadingSync, setLoadingSync] = useState(false);

  // Inisialisasi state dari localStorage agar data tidak hilang saat pindah halaman
  const [dataSync, setDataSync] = useState<MasterWeekData[]>(() => {
    const savedData = localStorage.getItem("last_sync_master_week");
    return savedData ? JSON.parse(savedData) : [];
  });

  const columns = useMemo(
    () => [
      { accessorKey: "TAHUN", header: "Tahun" },
      { accessorKey: "MINGGU", header: "Minggu" },
      { accessorKey: "BULAN", header: "Bulan" },
      { accessorKey: "QUARTER", header: "Quarter" },
      {
        accessorKey: "TANGGAL_AWAL_MINGGU_REAL",
        header: "Awal Minggu",
        cell: (info: any) =>
          info.getValue()
            ? new Date(info.getValue()).toLocaleDateString("id-ID")
            : "-",
      },
      {
        accessorKey: "TANGGAL_AKHIR_MINGGU_REAL",
        header: "Akhir Minggu",
        cell: (info: any) =>
          info.getValue()
            ? new Date(info.getValue()).toLocaleDateString("id-ID")
            : "-",
      },
    ],
    [],
  );

  const syncDataAMOfromMeta = async () => {
    setLoadingSync(true);
    const currentYear = new Date().getFullYear();

    try {
      // Pastikan method sesuai dengan backend (POST/GET)
      const response = await axiosInstance.get(
        `master-week/sync-from-meta-oracle/${currentYear}`,
      );

      const resultData = response.data?.data?.data || [];
      setDataSync(resultData);

      // Simpan ke localStorage
      localStorage.setItem("last_sync_master_week", JSON.stringify(resultData));

      showSuccessToast("Sinkronisasi Berhasil");
    } catch (error) {
      console.error("Error fetching data:", error);
      showErrorToast("Gagal sinkronisasi data");
    } finally {
      setLoadingSync(false);
    }
  };

  return (
    <>
      <div className="p-4 bg-white shadow rounded-md mb-5">
        <div className="flex justify-end items-center">
          <Button
            variant="primary"
            size="sm"
            disabled={loadingSync}
            onClick={syncDataAMOfromMeta}
          >
            {loadingSync ? (
              "Processing..."
            ) : (
              <>
                <FaSync className="mr-2" /> Sync Week {new Date().getFullYear()}
              </>
            )}
          </Button>
        </div>
      </div>

      {loadingSync ? (
        <ActIndicator />
      ) : (
        <DynamicTable
          data={dataSync}
          globalFilter={debouncedSearch}
          columns={columns}
          getRowId={(row: any) => `${row.TAHUN}-${row.MINGGU}`}
          title="Master Week Sync Result"
          noActions={true}
          // Membersihkan props yang tidak digunakan agar tidak error
          isCreateModalOpen={false}
          onCloseCreateModal={() => {}}
          formFields={[]}
          onRefresh={syncDataAMOfromMeta}
        />
      )}
    </>
  );
};

export default DataTable;
