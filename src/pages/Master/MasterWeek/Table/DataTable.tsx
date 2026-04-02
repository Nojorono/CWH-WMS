import React, { useEffect, useState, useMemo } from "react";
import { FaPlus, FaSync } from "react-icons/fa";
import Input from "../../../../components/form/input/InputField";
import Label from "../../../../components/form/Label";
import Button from "../../../../components/ui/button/Button";
import { useDebounce } from "../../../../helper/useDebounce";
import DynamicTable from "../../../../components/wms-components/DynamicTable";
import { useStoreMasterWeek } from "../../../../DynamicAPI/stores/Store/MasterStore";
import ActIndicator from "../../../../components/ui/activityIndicator";
import { EndPoint } from "../../../../utils/EndPoint";
import axiosInstance from "../../../../DynamicAPI/AxiosInstance";

const DataTable = () => {
  const { list: listWeek, fetchAll, isLoading } = useStoreMasterWeek();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [loadingSycn, setLoadingSycn] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

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

  // const sycnDataAMOfromMeta = async () => {
  //   setLoadingSycn(true);

  //   try {
  //     const token = localStorage.getItem("token"); // Replace with your actual token key
  //     const response = await fetch(
  //       `${EndPoint}customer/main/sync-from-meta-oracle`,
  //       {
  //         method: "POST",
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //         },
  //       }
  //     );
  //     if (!response.ok) {
  //       throw new Error("Network response was not ok");
  //     }
  //     setLoadingSycn(false);
  //     fetchAll();
  //   } catch (error) {
  //     console.error("Error fetching data:", error);
  //   }
  // };

  const syncDataWeekfromMeta = async () => {
    const currentYear = new Date().getFullYear();

    try {
      const response = await axiosInstance.get(
        `master-week/sync-from-meta-oracle/${currentYear}`,
      );

      console.log("response", response);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      fetchAll();
    }
  };

  const formFields = [{}];

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
              onClick={() => syncDataWeekfromMeta()}
            >
              <FaSync className="mr-2" /> Sync Week {new Date().getFullYear()}
            </Button>
          </div>
        </div>
      </div>

      {isLoading || loadingSycn ? (
        <>
          <ActIndicator />
        </>
      ) : (
        <DynamicTable
          data={listWeek}
          globalFilter={debouncedSearch}
          isCreateModalOpen={isCreateModalOpen}
          onCloseCreateModal={() => setCreateModalOpen(false)}
          columns={columns}
          formFields={formFields}
          onRefresh={fetchAll}
          getRowId={(row) => row.id}
          title="Form Data"
          noActions={true}
        />
      )}
    </>
  );
};

export default DataTable;
