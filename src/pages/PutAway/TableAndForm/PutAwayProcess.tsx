"use client";

import React, { useEffect, useMemo, useState } from "react";
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
import { useLocation, useNavigate } from "react-router";

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

const PutAwayDetail: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: viewData, mode } = location.state || {};
  const isDetail = mode === "detail";

  const { list: putAwaySuggestions, fetchAll: fetchPutAwaySuggestions } =
    useStorePutAwaySuggestion();
  const { list: userList, fetchAll: fetchUserList } = useStoreUser();
  const { createBulkData } = useStoreBulkPutAway();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [mappedData, setMappedData] = useState<PutAwayRow[]>([]);
  const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<PutAwayRow | null>(null);

  // 🔁 Fetch hanya jika bukan mode detail
  useEffect(() => {
    if (!isDetail) {
      fetchPutAwaySuggestions();
      fetchUserList();
    }
  }, [isDetail, fetchPutAwaySuggestions, fetchUserList]);

  // 🔍 Jika mode detail, isi table & form dari viewData
  useEffect(() => {
    if (isDetail && viewData) {
      const formatted: PutAwayRow[] = [
        {
          stagingPalletId: viewData.inventory_tracking_id || "-",
          palletId: viewData.inventoryTracking?.pallet_id || "-",
          palletCode: viewData.inventoryTracking?.pallet_id || "-",
          totalQty: viewData.totalQty || 0,
          warehouseName: viewData.inventoryTracking?.warehouse_id || "-",
          stagingArea: viewData.inventoryTracking?.warehouse_sub_id || "-",
          suggestZoneId: viewData.destinationBin?.id || "-",
          suggestZone: viewData.suggestZone || "-",
          suggestBinId: viewData.destination_bin_id || "-",
          suggestBin: viewData.destinationBin?.name || "-",
          driver: viewData.driver_name || "-",
        },
      ];
      setMappedData(formatted);
    } else {
      // Jika mode create/edit → ambil dari store
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
    }
  }, [isDetail, viewData, putAwaySuggestions]);

  // 📋 Table Columns
  const columns = useMemo<ColumnDef<PutAwayRow>[]>(() => {
    const baseCols: ColumnDef<PutAwayRow>[] = [
      { accessorKey: "stagingPalletId", header: "Staging Pallet ID" },
      { accessorKey: "palletCode", header: "Pallet Code" },
      { accessorKey: "totalQty", header: "Total Qty" },
      { accessorKey: "warehouseName", header: "Warehouse" },
      { accessorKey: "stagingArea", header: "Staging Area" },
      { accessorKey: "suggestZone", header: "Suggest Zone" },
      { accessorKey: "suggestBin", header: "Suggest Bin" },
    ];

    if (!isDetail) {
      baseCols.push({
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
      });
    }

    return baseCols;
  }, [isDetail]);

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

  const forkliftDrivers =
    Array.isArray(userList) && userList.length > 0
      ? userList.filter(
          (user: any) => user.role?.name?.toUpperCase() === "DRIVER FORKLIFT"
        )
      : [];

  // 📦 React Hook Form Setup
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DriverFormValues>({
    defaultValues: {
      forkliftDriverId: viewData?.forklift_driver_id || "",
      driverName: viewData?.driver_name || "",
      driverPhone: viewData?.driver_phone || "",
    },
  });

  const handleDriverSelect = (value: string) => {
    const driver = forkliftDrivers.find((d: any) => d.id === value);
    setValue("forkliftDriverId", driver?.id || "");
    setValue("driverPhone", driver?.phone || "");
  };

  const onSubmit = async (data: DriverFormValues) => {
    if (isDetail) return; // prevent submit
    showSuccessToast("Create Put Away triggered!");
  };

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
        onSelectionChange={!isDetail ? setSelectedIds : undefined}
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
              Forklift Username
            </label>
            <Controller
              name="forkliftDriverId"
              control={control}
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
                  disabled={isDetail}
                  className="border p-2 rounded w-full"
                  width={"100%"}
                />
              )}
            />
          </div>

          {/* 🧑 Driver Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Driver Name
            </label>
            <Controller
              name="driverName"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  disabled={isDetail}
                  className="border p-2 rounded w-full"
                />
              )}
            />
          </div>

          {/* 📞 Driver Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Driver Phone
            </label>
            <Controller
              name="driverPhone"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  disabled={isDetail}
                  className="border p-2 rounded w-full"
                />
              )}
            />
          </div>
        </div>

        {/* ✅ Hide button jika mode detail */}
        {!isDetail && (
          <div className="flex justify-end space-x-4 pt-4">
            <Button type="submit" variant="primary">
              Create Put Away
            </Button>
          </div>
        )}
      </form>

      {/* 🏗️ Modal Adjustment */}
      {!isDetail && selectedRow && (
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
