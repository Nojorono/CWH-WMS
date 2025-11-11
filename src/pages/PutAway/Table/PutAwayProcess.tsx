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
  useStorePutAway,
} from "../../../DynamicAPI/stores/Store/MasterStore";
import { PutAwaySuggestion } from "../../../DynamicAPI/types/PutAwaySuggestionTypes";
import ModalSuggestion from "../Modal/ModalSuggestion";
import Select from "../../../components/form/Select";
import { showErrorToast } from "../../../components/toast";
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
  selectedRow?: boolean;
  SKUname: string;
  palletItemUom?: string;
  destinationWarehouseSubCode?: string;
  destinationBinCode?: string;
  destinationWarehouseSubName?: string;
};

type ExtendedColumnDef<T> = ColumnDef<T> & { selectedRow?: boolean };

type DriverFormValues = {
  forkliftDriverId: string;
  driverName: string;
  driverPhone: string;
};

const PutAwayDetail: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: detailDataPutaway, mode } = location.state || {};

  const isDetail = mode === "detail";
  const isEdit = mode === "edit";
  const isCreate = !isEdit && !isDetail;

  const { list: putAwaySuggestions, fetchAll: fetchPutAwaySuggestions } =
    useStorePutAwaySuggestion();

  const { list: userList, fetchAll: fetchUserList } = useStoreUser();
  const { createBulkData } = useStoreBulkPutAway();
  const { updateData } = useStorePutAway();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [mappedData, setMappedData] = useState<PutAwayRow[]>([]);
  const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<PutAwayRow | null>(null);

  // Fetch data awal
  useEffect(() => {
    if (isCreate || isEdit || isDetail) {
      fetchPutAwaySuggestions();
      fetchUserList();
    }
  }, [isCreate, isEdit, isDetail, fetchPutAwaySuggestions, fetchUserList]);

  // react-hook-form setup
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
    watch,
  } = useForm<DriverFormValues>({
    defaultValues: {
      forkliftDriverId: detailDataPutaway?.forkliftDriverId || "",
      driverName: detailDataPutaway?.driverName || "",
      driverPhone: detailDataPutaway?.driverPhone || "",
    },
  });

  useEffect(() => {
    if (detailDataPutaway) {
      reset({
        forkliftDriverId: detailDataPutaway.forkliftDriverId || "",
        driverName: detailDataPutaway.driverName || "",
        driverPhone: detailDataPutaway.driverPhone || "",
      });
    }
  }, [detailDataPutaway, reset]);

  // Mapping data tabel
  // ==============================
  // 🔹 TABLE DATA (EDIT/CREATE)
  // ==============================
  useEffect(() => {
    if ((isDetail || isEdit) && detailDataPutaway) {
      const palletItems = detailDataPutaway.palletItems || [];

      const formatted: PutAwayRow[] = [
        {
          stagingPalletId: detailDataPutaway.inventory_tracking_id || "-",
          palletId: detailDataPutaway.palletId || "-",
          palletCode: detailDataPutaway.palletCode || "-",
          totalQty: detailDataPutaway.totalQty || 0,
          warehouseName: detailDataPutaway.warehouseSubName || "-",
          stagingArea: detailDataPutaway.warehouseSubName || "-",
          suggestZoneId: detailDataPutaway.destination_bin_id || "-",
          suggestZone: detailDataPutaway.suggestZone || "-",
          suggestBinId: detailDataPutaway.destination_bin_id || "-",
          suggestBin: detailDataPutaway.suggestBin || "-",
          driver: detailDataPutaway.driverName || "-",
          SKUname: palletItems?.[0]?.itemName || "-",
          palletItemUom:
            palletItems?.[0]?.uom || palletItems?.[0]?.item_uom || "-",
          destinationWarehouseSubCode:
            detailDataPutaway.destinationWarehouseSubCode || "-",
          destinationBinCode: detailDataPutaway.destinationBinCode || "-",
        },
      ];

      setMappedData(formatted);

      // Isi form driver
      setValue("forkliftDriverId", detailDataPutaway.forkliftDriverId || "");
      setValue("driverName", detailDataPutaway.driverName || "");
      setValue("driverPhone", detailDataPutaway.driverPhone || "");
    } else if (isCreate && putAwaySuggestions) {
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
          const palletItems = suggestion.palletItems || [];

          const pallet = staging?.pallet;
          const warehouse = staging?.warehouse;
          const stagingArea = staging?.warehouseSub;
          const zone = suggestion.suggestedZone;
          const bin = suggestion.suggestedBin;
          const SKUname = palletItems.map((item) => item.item_name).join(", ");

          return {
            stagingPalletId: staging?.id || "-",
            palletId: pallet?.id || "-",
            palletCode: pallet?.pallet_code || "-",
            totalQty: pallet?.currentQuantity || "-",
            warehouseName: warehouse?.name || "-",
            stagingArea: stagingArea?.name || "-",
            suggestZoneId: zone?.id || "",
            suggestZone: zone?.name || "-",
            suggestBinId: bin?.id || "",
            suggestBin: bin?.name || "-",
            driver: "",
            SKUname: SKUname,
            // Ambil UoM dari palletItems (API contoh menggunakan "uom")
            palletItemUom:
              palletItems?.[0]?.uom || palletItems?.[0]?.item_uom || "-",
          };
        }
      );
      setMappedData(formatted);
    }
  }, [
    isDetail,
    isEdit,
    isCreate,
    detailDataPutaway,
    putAwaySuggestions,
    setValue,
  ]);

  // 🟢 Auto-select baris pertama kalau edit
  useEffect(() => {
    if (isEdit && mappedData.length > 0) {
      const firstId = mappedData[0].stagingPalletId;
      setSelectedIds([firstId]);
    }
  }, [isEdit, mappedData]);

  // Table columns
  // Table columns
  const columns = useMemo<ExtendedColumnDef<PutAwayRow>[]>(() => {
    const cols: ExtendedColumnDef<PutAwayRow>[] = [];

    // === EDIT / DETAIL MODE ===
    if (!isCreate) {
      // tampilkan hanya jika bukan detail
      if (!isDetail) {
        cols.push({
          accessorKey: "stagingPalletId",
          header: "Staging Pallet ID",
          selectedRow: true,
        });
      }

      cols.push(
        { accessorKey: "palletCode", header: "Pallet Code" },
        { accessorKey: "SKUname", header: "SKU Name" },
        { accessorKey: "palletItemUom", header: "UoM" },
        { accessorKey: "totalQty", header: "Total Qty" },
        {
          accessorKey: "destinationWarehouseSubCode",
          header: "Destination Zone",
        },
        { accessorKey: "destinationBinCode", header: "Destination Bin" }
      );

      // kolom tambahan hanya jika bukan detail
      if (!isDetail) {
        cols.push(
          { accessorKey: "suggestZone", header: "Update Zone" },
          { accessorKey: "suggestBin", header: "Update Bin" }
        );
      }

      // === CREATE MODE ===
    } else {
      // tampilkan hanya jika bukan detail
      if (!isDetail) {
        cols.push({
          accessorKey: "stagingPalletId",
          header: "Staging Pallet ID",
          selectedRow: true,
        });
      }

      cols.push(
        { accessorKey: "palletCode", header: "Pallet Code" },
        { accessorKey: "SKUname", header: "SKU Name" },
        { accessorKey: "palletItemUom", header: "UoM" },
        { accessorKey: "totalQty", header: "Total Qty" }
      );

      // kolom tambahan hanya jika bukan detail
      if (!isDetail) {
        cols.push(
          { accessorKey: "suggestZone", header: "Suggest Zone" },
          { accessorKey: "suggestBin", header: "Suggest Bin" }
        );
      }
    }

    // tombol action hanya muncul jika bukan detail
    if (!isDetail) {
      cols.push({
        id: "actions",
        header: "Action",
        cell: ({ row }) => (
          <button
            className="text-green-600"
            onClick={() => handleEdit(row.original)}
          >
            <FaEdit />
          </button>
        ),
      });
    }

    return cols;
  }, [isCreate, isDetail]);

  const [tableKey, setTableKey] = useState(0);

  // handleEdit
  const handleEdit = (row: PutAwayRow) => {
    // kosongkan selected ids
    setSelectedIds([]);

    // paksa remount tabel agar internal selection reset
    setTableKey((k) => k + 1);

    setSelectedRow(row);
    setIsAdjustmentOpen(true);
  };

  const handleSaveAdjustment = (adjustPutaway: any) => {
    setMappedData((prev) =>
      prev.map((item) =>
        item.palletId === adjustPutaway.palletId
          ? {
              ...item,
              suggestZoneId: adjustPutaway.zone_id,
              suggestZone: adjustPutaway.suggestZone,
              suggestBinId: adjustPutaway.bin_id,
              suggestBin: adjustPutaway.suggestBin,
            }
          : item
      )
    );
    setIsAdjustmentOpen(false);
  };

  // Filter user forklift driver
  const forkliftDrivers =
    Array.isArray(userList) && userList.length > 0
      ? userList.filter(
          (u: any) => u.role?.name?.toUpperCase() === "DRIVER FORKLIFT"
        )
      : [];

  const handleDriverSelect = (val: string) => {
    const driver = forkliftDrivers.find((d: any) => d.id === val);

    if (driver) {
      setValue("forkliftDriverId", driver.id);
      setValue("driverName", driver.username || "");
      setValue("driverPhone", driver.phone || "");
    }
  };

  // Submit handler
  // ==============================
  // 🔹 HANDLE SUBMIT
  // ==============================
  const onSubmit = async (data: DriverFormValues) => {

    if (!data.forkliftDriverId || !data.driverName || !data.driverPhone) {
      showErrorToast("Please fill in all driver fields");
      return;
    }

    try {
      if (isDetail) return;

      // 🔸 MODE CREATE → bulk create
      if (isCreate) {
        if (selectedIds.length === 0) {
          showErrorToast("Please select at least one pallet!");
          return;
        }

        const missingBin = mappedData
          .filter((row) => selectedIds.includes(row.stagingPalletId))
          .some((row) => !row.suggestBinId);

        if (missingBin) {
          showErrorToast("Some pallets have no assigned bin!");
          return;
        }

        const driver = {
          id: data.forkliftDriverId,
          name: data.driverName,
          phone: data.driverPhone,
        };

        const payload = {
          data: mappedData
            .filter((r) => selectedIds.includes(r.stagingPalletId))
            .map((r) => ({
              inventory_tracking_id: r.stagingPalletId,
              destination_bin_id: r.suggestBinId,
              forklift_driver_id: driver.id,
              driver_name: driver.name,
              driver_phone: driver.phone,
              status: "PENDING",
              notes: "",
            })),
        };

        if (typeof createBulkData === "function") {
          const res = await createBulkData(payload as any);
          if (res?.success) {
            navigate("/putaway");
          }
        } else {
          showErrorToast("Put Away creation function is not available.");
        }
      }

      // 🔸 MODE EDIT → single update
      if (isEdit && detailDataPutaway?.id) {
        const payload = {
          inventory_tracking_id: detailDataPutaway.inventory_tracking_id,
          destination_bin_id: mappedData[0]?.suggestBinId || "",
          forklift_driver_id: data.forkliftDriverId,
          driver_name: data.driverName,
          driver_phone: data.driverPhone,
          status: detailDataPutaway.status || "PENDING",
          notes: detailDataPutaway.notes || "",
        };

        const res = await updateData(detailDataPutaway.id, payload);
        if (res?.success) {
          navigate("/putaway");
        }
      }
    } catch (err) {
      console.error(err);
      showErrorToast("Failed to send data to server.");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <PageBreadcrumb
        breadcrumbs={[
          { title: "Put Away List", path: "/putaway" },
          { title: "Put Away Process", path: "/putaway/process" },
        ]}
      />

      <TableComponent
        key={tableKey}
        data={mappedData}
        columns={columns}
        onSelectionChange={!isDetail && isCreate ? setSelectedIds : undefined}
      />

      {/* Driver Form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="border rounded-lg p-4 shadow-md space-y-4"
      >
        <h2 className="font-semibold text-lg">Driver Details</h2>
        <div className="grid grid-cols-2 gap-4">
          {/* Forklift Username */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Forklift Username <span className="text-red-500">*</span>
            </label>
            <Controller
              name="forkliftDriverId"
              control={control}
              rules={{ required: "Please select a forklift driver" }}
              render={({ field }) => (
                <>
                  <Select
                    {...field}
                    placeholder="Select Forklift Driver"
                    options={forkliftDrivers.map((d: any) => ({
                      value: d.id,
                      label: d.username || d.name,
                    }))}
                    onChange={(val: string) => {
                      handleDriverSelect(val);
                      field.onChange(val);
                    }}
                    disabled={isDetail}
                    width="100%"
                  />
                  {errors.forkliftDriverId && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.forkliftDriverId.message}
                    </p>
                  )}
                </>
              )}
            />
          </div>

          {/* Driver Name */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Driver Name <span className="text-red-500">*</span>
            </label>
            <Controller
              name="driverName"
              control={control}
              rules={{ required: "Driver name is required" }}
              render={({ field }) => (
                <>
                  <input
                    {...field}
                    disabled={isDetail}
                    className={`border p-2 rounded w-full ${
                      errors.driverName ? "border-red-500" : ""
                    }`}
                  />
                  {errors.driverName && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.driverName.message}
                    </p>
                  )}
                </>
              )}
            />
          </div>

          {/* Driver Phone */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Driver Phone <span className="text-red-500">*</span>
            </label>
            <Controller
              name="driverPhone"
              control={control}
              rules={{
                required: "Driver phone number is required",
                pattern: {
                  value: /^[0-9]+$/,
                  message: "Phone must contain only numbers",
                },
              }}
              render={({ field }) => (
                <>
                  <input
                    {...field}
                    disabled={isDetail}
                    type="text"
                    className={`border p-2 rounded w-full ${
                      errors.driverPhone ? "border-red-500" : ""
                    }`}
                  />
                  {errors.driverPhone && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.driverPhone.message}
                    </p>
                  )}
                </>
              )}
            />
          </div>
        </div>

        {!isDetail && (
          <Button type="submit" variant="primary">
            {isEdit ? "Update Put Away" : "Create Put Away"}
          </Button>
        )}
      </form>

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
            destinationWarehouseSubCode:
              selectedRow.destinationWarehouseSubCode,
            destinationBinCode: selectedRow.destinationBinCode,
            destinationWarehouseSubName:
              selectedRow.destinationWarehouseSubName,
          }}
          onSave={handleSaveAdjustment}
          mode={isEdit ? "edit" : "create"}
        />
      )}
    </div>
  );
};

export default PutAwayDetail;
