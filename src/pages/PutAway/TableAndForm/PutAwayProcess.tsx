"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { FaEdit } from "react-icons/fa";
import Button from "../../../components/ui/button/Button";
import TableComponent from "../../../components/tables/MasterDataTable/TableComponent";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import {
  useStorePutAwaySuggestion,
  useStoreUser,
  useStoreBulkPutAway,
} from "../../../DynamicAPI/stores/Store/MasterStore";
import { PutAwaySuggestion } from "../../../DynamicAPI/types/PutAwaySuggestionTypes";
import ModalSuggestion from "./ModalSuggestion";
import Select from "../../../components/form/Select";
import { showErrorToast, showSuccessToast } from "../../../components/toast";
import { useForm, Controller } from "react-hook-form";

// ==========================
// 🧩 Type Definitions
// ==========================
type PutAwayRow = {
  stagingPalletId: string;
  palletId: string;
  palletCode: string;
  totalQty: number;
  warehouseName: string;
  stagingArea: string;
  suggestZoneId: string;
  suggestZone: string;
  suggestBinId: string;
  suggestBin: string;
  driver: string;
};

type DriverFormValues = {
  forkliftDriverId: string;
  driverName: string;
  driverPhone: string;
};

// ==========================
// 🧱 Component
// ==========================
const PutAwayDetail: React.FC = () => {
  const { list: putAwaySuggestions, fetchAll: fetchPutAwaySuggestions } =
    useStorePutAwaySuggestion();
  const { list: userList, fetchAll: fetchUserList } = useStoreUser();
  const { createBulkData } = useStoreBulkPutAway();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [mappedData, setMappedData] = useState<PutAwayRow[]>([]);
  const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<PutAwayRow | null>(null);

  // ==========================
  // 🔁 Fetch Data on Mount
  // ==========================
  useEffect(() => {
    fetchPutAwaySuggestions();
    fetchUserList();
  }, [fetchPutAwaySuggestions, fetchUserList]);

  // ==========================
  // 🔍 Map API → Table data
  // ==========================
  useEffect(() => {
    if (!putAwaySuggestions) return;

    const suggestions =
      (putAwaySuggestions as any).palletSuggestions ||
      (Array.isArray(putAwaySuggestions)
        ? putAwaySuggestions.flatMap(
            (res: any) =>
              res.data?.palletSuggestions || res.palletSuggestions || []
          )
        : []);

    const formatted: PutAwayRow[] = suggestions.map(
      (suggestion: PutAwaySuggestion) => {
        const staging = suggestion.stagingPallet;
        const pallet = staging?.pallet;
        const warehouse = staging?.warehouse;
        const stagingArea = staging?.warehouseSub;
        const zone = suggestion.suggestedZone;
        const bin = suggestion.suggestedBin;

        return {
          stagingPalletId: staging?.id || "-",
          palletId: pallet?.id || "-",
          palletCode: pallet?.pallet_code || "-",
          totalQty: pallet?.currentQuantity || 0,
          warehouseName: warehouse?.name || "-",
          stagingArea: stagingArea?.name || "-",
          suggestZoneId: zone?.id || "",
          suggestZone: zone?.name || "-",
          suggestBinId: bin?.id || "",
          suggestBin: bin?.name || "-",
          driver: "Forklift Driver 1",
        };
      }
    );

    setMappedData(formatted);
  }, [putAwaySuggestions]);

  // ==========================
  // 📋 Table Columns
  // ==========================
  const columns = useMemo<ColumnDef<PutAwayRow>[]>(
    () => [
      {
        accessorKey: "stagingPalletId",
        header: "Staging Pallet ID",
        selectedRow: true,
      },
      { accessorKey: "palletCode", header: "Pallet Code" },
      { accessorKey: "totalQty", header: "Total Qty" },
      { accessorKey: "warehouseName", header: "Warehouse" },
      { accessorKey: "stagingArea", header: "Staging Area" },
      { accessorKey: "suggestZone", header: "Suggest Zone" },
      { accessorKey: "suggestBin", header: "Suggest Bin" },
      {
        id: "actions",
        header: "Action",
        cell: ({ row }) => (
          <div className="flex gap-2">
            <button
              className="text-green-600"
              onClick={() => handleEdit(row.original)}
            >
              <FaEdit />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  // ==========================
  // ⚙️ Handlers
  // ==========================
  const handleSelectionChange = useCallback((ids: string[]) => {
    setSelectedIds(ids);
  }, []);

  const handleEdit = (rowData: PutAwayRow) => {
    setSelectedRow(rowData);
    setIsAdjustmentOpen(true);
  };

  const handleSaveAdjustment = (adjustPutaway: any) => {
    setMappedData((prevData) =>
      prevData.map((item) =>
        item.palletId === adjustPutaway.palletId
          ? {
              ...item,
              suggestZoneId: adjustPutaway.zone_id,
              suggestZone: adjustPutaway.suggestZoneName,
              suggestBinId: adjustPutaway.bin_id,
              suggestBin: adjustPutaway.suggestBin,
            }
          : item
      )
    );
    setIsAdjustmentOpen(false);
  };

  // ✅ Driver list
  const forkliftDrivers =
    Array.isArray(userList) && userList.length > 0
      ? userList.filter(
          (user: any) => user.role?.name?.toUpperCase() === "DRIVER FORKLIFT"
        )
      : [];

  // ==========================
  // 📦 React Hook Form Setup
  // ==========================
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DriverFormValues>({
    defaultValues: {
      forkliftDriverId: "",
      driverName: "",
      driverPhone: "",
    },
  });

  const forkliftDriverId = watch("forkliftDriverId");

  const handleDriverSelect = (value: string) => {
    const driver = forkliftDrivers.find((d: any) => d.id === value);
    console.log("Selected Driver:", driver);

    setValue("forkliftDriverId", driver?.id || "");
    // setValue("driverName", driver?.username || "");
    setValue("driverPhone", driver?.phone || "");
  };

  // ✅ Build payload
  const createPutawayPayload = (
    selectedIds: string[],
    mappedData: PutAwayRow[],
    driver: { id: string; name: string; phone: string; notes?: string }
  ) => {
    return mappedData
      .filter((row) => selectedIds.includes(row.stagingPalletId))
      .map((row) => ({
        inventory_tracking_id: row.stagingPalletId,
        destination_bin_id: row.suggestBinId || "",
        forklift_driver_id: driver.id,
        driver_name: driver.name,
        driver_phone: driver.phone,
        status: "PENDING",
        notes: "",
      }));
  };

  // ==========================
  // 🚀 Submit Handler
  // ==========================
  const onSubmit = async (data: DriverFormValues) => {
    console.log("🚀 Creating Put Away for IDs:", selectedIds);

    if (selectedIds.length === 0) {
      showErrorToast("Please select at least one pallet!");
      return;
    }

    // 🧠 Cek apakah ada pallet tanpa bin
    const missingBin = mappedData
      .filter((row) => selectedIds.includes(row.stagingPalletId))
      .some((row) => !row.suggestBinId);

    if (missingBin) {
      showErrorToast(
        "Some selected pallets have no assigned bin. Please fix first!"
      );
      return;
    }

    const driverInfo = {
      id: data.forkliftDriverId,
      name: data.driverName,
      phone: data.driverPhone,
      notes: "",
    };

    // 🧱 Build array of payload items
    const payloadArray = createPutawayPayload(
      selectedIds,
      mappedData,
      driverInfo
    ).map((item, idx) => ({
      ...item,
      status: "PENDING",
      notes: "",
    }));

    // ✅ Bungkus ke dalam object { data: [...] }
    const payload = { data: payloadArray };

    console.log("📦 Final Payload yang dikirim ke API:", payload);

    if (payload.data.length === 0) {
      showErrorToast("Tidak ada data yang valid untuk dikirim.");
      return;
    }

    try {
      if (createBulkData) {
        const res = await createBulkData(payload); // ✅ kirim object { data: [...] }

        if (res?.success) {
          showSuccessToast(res.message || "Put Away created successfully!");
          window.location.href = "/putaway-detail";
        }
      }
    } catch (error) {
      showErrorToast("Gagal mengirim data ke server.");
    }
  };

  // ==========================
  // 🧩 Render
  // ==========================
  return (
    <div className="p-6 space-y-6">
      <PageBreadcrumb
        breadcrumbs={[
          { title: "Put Away List", path: "/putaway" },
          { title: "Put Away Process", path: "/putaway/process" },
        ]}
      />

      {/* 📊 Table Section */}
      <TableComponent
        data={mappedData}
        columns={columns}
        onSelectionChange={handleSelectionChange}
      />

      {/* 🧠 Driver Details Form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="border rounded-lg p-4 shadow-md space-y-4"
      >
        <h2 className="font-semibold text-lg">Driver Details</h2>
        <div className="grid grid-cols-2 gap-4">
          {/* 🔽 Dropdown Username Driver */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Forklift Username <span className="text-red-500">*</span>
            </label>
            <Controller
              name="forkliftDriverId"
              control={control}
              rules={{ required: "Forklift driver is required" }}
              render={({ field }) => (
                <Select
                  {...field}
                  placeholder="Select Forklift Driver"
                  options={forkliftDrivers.map((driver: any) => ({
                    value: driver.id,
                    label: driver.username,
                  }))}
                  onChange={(val: string) => {
                    handleDriverSelect(val);
                    field.onChange(val);
                  }}
                  className={`border p-2 rounded ${
                    errors.forkliftDriverId ? "border-red-400" : ""
                  }`}
                  width={"100%"}
                />
              )}
            />
            {errors.forkliftDriverId && (
              <p className="text-xs text-red-500 mt-1">
                {errors.forkliftDriverId.message}
              </p>
            )}
          </div>

          {/* 🧑 Driver Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Driver Name <span className="text-red-500">*</span>
            </label>
            <Controller
              name="driverName"
              control={control}
              rules={{ required: "Driver name is required" }}
              render={({ field }) => (
                <input
                  {...field}
                  className={`border p-2 rounded w-full ${
                    errors.driverName ? "border-red-400" : ""
                  }`}
                  placeholder="Enter Forklift Driver Name"
                />
              )}
            />
            {errors.driverName && (
              <p className="text-xs text-red-500 mt-1">
                {errors.driverName.message}
              </p>
            )}
          </div>

          {/* 📞 Driver Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Driver Phone <span className="text-red-500">*</span>
            </label>
            <Controller
              name="driverPhone"
              control={control}
              rules={{
                required: "Phone number is required",
                pattern: {
                  value: /^[0-9+\-\s()]+$/,
                  message: "Invalid phone number format",
                },
              }}
              render={({ field }) => (
                <input
                  {...field}
                  className={`border p-2 rounded w-full ${
                    errors.driverPhone ? "border-red-400" : ""
                  }`}
                  placeholder="Enter Forklift Driver Phone"
                />
              )}
            />
            {errors.driverPhone && (
              <p className="text-xs text-red-500 mt-1">
                {errors.driverPhone.message}
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-4 pt-4">
          <Button type="submit" variant="primary">
            Create Put Away
          </Button>
        </div>
      </form>

      {/* 🏗️ Modal Adjustment */}
      {selectedRow && (
        <ModalSuggestion
          open={isAdjustmentOpen}
          onClose={() => setIsAdjustmentOpen(false)}
          data={{
            palletId: selectedRow.palletId,
            palletCode: selectedRow.palletCode,
            totalQty: selectedRow.totalQty,
            stagingArea: selectedRow.stagingArea,
            suggestZone: selectedRow.suggestZone,
            suggestBin: selectedRow.suggestBin,
          }}
          onSave={handleSaveAdjustment}
        />
      )}
    </div>
  );
};

export default PutAwayDetail;
