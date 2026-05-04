import React, { useEffect, useState, useMemo } from "react";
import { FaPlus } from "react-icons/fa";
import Input from "../../../../components/form/input/InputField";
import Label from "../../../../components/form/Label";
import Button from "../../../../components/ui/button/Button";
import { useDebounce } from "../../../../helper/useDebounce";
import DynamicTable from "../../../../components/wms-components/DynamicTable";
import {
  useStoreIo,
  useStoreMasterAMO,
} from "../../../../DynamicAPI/stores/Store/MasterStore";
import { showConfirmDialog } from "../../../../components/swal-confirm";
import Select from "react-select";

interface OrganizationOption {
  value: number;
  label: string; // ex: "401 - CWH"
  shortCode: string; // ex: "CWH" -> untuk payload organization_name
  name: string; // tetap disimpan jika nanti dibutuhkan
  locationDescription: string; // untuk payload operating_unit
}

interface AmooItem {
  orgId?: number;
  locationCode?: string; // ex: "NNA - CWH"
  name?: string;
  locationDescription?: string; // ex: "KARAWANG"
}

const DataTable = () => {
  const {
    list: Io,
    createData,
    updateData,
    deleteData,
    fetchAll,
  } = useStoreIo();
  const { fetchAll: getListAMO, list: listAMO } = useStoreMasterAMO();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  useEffect(() => {
    fetchAll();
    getListAMO();
  }, []);

  const columns = useMemo(
    () => [
      { accessorKey: "organization_id", header: "Organization ID" },
      { accessorKey: "organization_name", header: "Organization Name" },
      { accessorKey: "operating_unit", header: "Operating Unit" },
    ],
    [],
  );

  const organizationOptions: OrganizationOption[] = useMemo(() => {
    if (!Array.isArray(listAMO)) return [];

    return (listAMO as AmooItem[])
      .filter((item) => typeof item?.orgId === "number" && !!item?.locationCode)
      .map((item) => {
        const rawLocationCode = item.locationCode ?? "";
        const shortCode = rawLocationCode.includes(" - ")
          ? rawLocationCode.split(" - ")[1]?.trim() || rawLocationCode
          : rawLocationCode;

        return {
          value: Number(item.orgId),
          label: `${Number(item.orgId)} - ${shortCode}`,
          shortCode, 
          name: item.name ?? "",
          locationDescription: item.locationDescription ?? "",
        };
      });
  }, [listAMO]);

  const formFields = [
    {
      name: "organization_id",
      label: "Organization ID",
      type: "custom",
      validation: { required: "Required" },
      renderCustom: ({ watch, setValue }: { watch: any; setValue: any }) => {
        const selectedOrgId = watch("organization_id");
        const selectedOption =
          organizationOptions.find(
            (opt) => Number(opt.value) === Number(selectedOrgId),
          ) || null;

        return (
          <Select
            options={organizationOptions}
            placeholder="Select organization..."
            classNamePrefix="react-select"
            value={selectedOption}
            menuPortalTarget={document.body}
            styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
            onChange={(opt) => {
              const selected = opt as OrganizationOption | null;
              const orgId = selected?.value ?? "";
              const organizationNameFromConcat = selected?.shortCode ?? ""; // ex: CWH
              const operatingUnitFromDescription =
                selected?.locationDescription ?? ""; // ex: KARAWANG

              setValue("organization_id", orgId, { shouldValidate: true });
              setValue("organization_name", organizationNameFromConcat, {
                shouldValidate: true,
              });
              setValue("operating_unit", operatingUnitFromDescription, {
                shouldValidate: true,
              });
            }}
          />
        );
      },
    },
    {
      name: "organization_name",
      label: "Organization Name",
      type: "text",
      validation: { required: "Required" },
      readOnly: true,
    },
    {
      name: "operating_unit",
      label: "Operating Unit",
      type: "text",
      validation: { required: "Required" },
      readOnly: true,
    },
  ];

  const handleCreate = (data: any) => {
    const selected = organizationOptions.find(
      (opt) => Number(opt.value) === Number(data.organization_id),
    );

    const organizationNameFromConcat =
      selected?.shortCode ?? data.organization_name ?? "";
    const operatingUnitFromDescription =
      selected?.locationDescription ?? data.operating_unit ?? "";

    return createData({
      organization_id: Number(data.organization_id),
      organization_name: organizationNameFromConcat, // => CWH
      operating_unit: operatingUnitFromDescription, // => locationDescription
    });
  };

  const handleUpdate = (data: any) => {
    const selected = organizationOptions.find(
      (opt) => Number(opt.value) === Number(data.organization_id),
    );

    const organizationNameFromConcat =
      selected?.shortCode ?? data.organization_name ?? "";
    const operatingUnitFromDescription =
      selected?.locationDescription ?? data.operating_unit ?? "";

    return updateData(data.id, {
      organization_id: Number(data.organization_id),
      organization_name: organizationNameFromConcat, // => CWH
      operating_unit: operatingUnitFromDescription, // => locationDescription
    });
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
          </div>
        </div>
      </div>

      <DynamicTable
        data={Io}
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
        title="Form Data"
      />
    </>
  );
};

export default DataTable;