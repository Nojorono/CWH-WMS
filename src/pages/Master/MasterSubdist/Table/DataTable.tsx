import React, { useEffect, useState, useMemo } from "react";
import { FaPlus, FaSync } from "react-icons/fa";
import Input from "../../../../components/form/input/InputField";
import Label from "../../../../components/form/Label";
import Button from "../../../../components/ui/button/Button";
import { useDebounce } from "../../../../helper/useDebounce";
import DynamicTable from "../../../../components/wms-components/DynamicTable";
import { useStoreMasterSubdist } from "../../../../DynamicAPI/stores/Store/MasterStore";
import ActIndicator from "../../../../components/ui/activityIndicator";
import { EndPoint } from "../../../../utils/EndPoint";
import axiosInstance from "../../../../DynamicAPI/AxiosInstance";

const DataTable = () => {
  const { list: listSubdist, fetchAll } = useStoreMasterSubdist();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [loadingSycn, setLoadingSycn] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  const columns = useMemo(
    () => [
      { accessorKey: "customerNumber", header: "Customer Number" },
      { accessorKey: "customerName", header: "Customer Name" },
      { accessorKey: "address1", header: "Address" },
      { accessorKey: "provinsi", header: "Province" },
      { accessorKey: "kabKodya", header: "City" },
      { accessorKey: "kecamatan", header: "District" },
      { accessorKey: "status", header: "Status" },
    ],
    [],
  );

  const formFields = [
    {
      name: "custAccountId",
      label: "Customer Account ID",
      type: "number",
      validation: { required: "Required" },
    },
    {
      name: "customerName",
      label: "Customer Name",
      type: "text",
      validation: { required: "Required" },
    },
    {
      name: "customerNumber",
      label: "Customer Number",
      type: "text",
      validation: { required: "Required" },
    },
    {
      name: "address1",
      label: "Address",
      type: "text",
      validation: { required: "Required" },
    },
    {
      name: "provinsi",
      label: "Province",
      type: "text",
      validation: { required: "Required" },
    },
    {
      name: "kabKodya",
      label: "City",
      type: "text",
      validation: { required: "Required" },
    },
    {
      name: "kecamatan",
      label: "District",
      type: "text",
      validation: { required: "Required" },
    },
    {
      name: "kelurahan",
      label: "Sub-district",
      type: "text",
      validation: { required: false },
    },
    {
      name: "status",
      label: "Status",
      type: "text",
      validation: { required: "Required" },
    },
    {
      name: "overallCreditLimit",
      label: "Overall Credit Limit",
      type: "text",
      validation: { required: "Required" },
    },
    {
      name: "termName",
      label: "Term Name",
      type: "text",
      validation: { required: false },
    },
  ];

  const sycnDataAMOfromMeta = async () => {
    setLoadingSycn(true);

    try {
      await axiosInstance.post("customer/subdist/sync-from-meta-oracle");
      fetchAll();
    } catch (error) {
      console.error(
        "Error syncing subdist data from Meta Oracle via axiosInstance:",
        error,
      );
    } finally {
      setLoadingSycn(false);
    }
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
              onClick={() => sycnDataAMOfromMeta()}
            >
              <FaSync className="mr-2" /> Sync from Meta
            </Button>
          </div>
        </div>
      </div>

      {loadingSycn ? (
        <>
          <ActIndicator />
        </>
      ) : (
        <DynamicTable
          data={listSubdist}
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
