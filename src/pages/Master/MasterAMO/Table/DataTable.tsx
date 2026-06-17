import React, { useEffect, useState, useMemo } from "react";
import { FaPlus, FaSync } from "react-icons/fa";
import Input from "../../../../components/form/input/InputField";
import Label from "../../../../components/form/Label";
import Button from "../../../../components/ui/button/Button";
import { useDebounce } from "../../../../helper/useDebounce";
import DynamicTable from "../../../../components/wms-components/DynamicTable";
import { useStoreMasterAMO } from "../../../../DynamicAPI/stores/Store/MasterStore";
import ActIndicator from "../../../../components/ui/activityIndicator";
import { EndPoint } from "../../../../utils/EndPoint";
import axiosInstance from "../../../../DynamicAPI/AxiosInstance";

const DataTable = () => {
  const {
    list: listAMO,
    deleteData,
    fetchAll,
    isLoading,
  } = useStoreMasterAMO();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [loadingSycn, setLoadingSycn] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  const columns = useMemo(
    () => [
      { accessorKey: "businessGroupId", header: "Business Group ID" },
      { accessorKey: "name", header: "Name" },
      { accessorKey: "locationDescription", header: "Location Description" },
    ],
    [],
  );

  const formFields = [
    {
      name: "businessGroupId",
      label: "Business Group ID",
      type: "number",
      validation: { required: "Required" },
    },
    {
      name: "name",
      label: "Name",
      type: "text",
      validation: { required: "Required" },
    },
    {
      name: "locationDescription",
      label: "Location Description",
      type: "text",
      validation: { required: "Required" },
    },
    {
      name: "dateFrom",
      label: "Date From",
      type: "date",
      validation: { required: "Required" },
    },
    {
      name: "dateTo",
      label: "Date To",
      type: "date",
      validation: { required: false },
    },
    {
      name: "usableFlag",
      label: "Usable Flag",
      type: "checkbox",
      validation: { required: "Required" },
    },
  ];

  const handleDelete = (id: any) => {
    return deleteData(id);
  };

  const sycnDataAMOfromMeta = async () => {
    setLoadingSycn(true);
    try {
      await axiosInstance.post("customer/main/sync-from-meta-oracle");
      fetchAll();
    } catch (error) {
      console.error(
        "Error syncing data from Meta Oracle via axiosInstance:",
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

      {isLoading || loadingSycn ? (
        <>
          <ActIndicator />
        </>
      ) : (
        <DynamicTable
          data={listAMO}
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
