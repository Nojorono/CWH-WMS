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
import ModalSuggestion from "./ModalSuggestion";
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
  const { data: viewData, mode } = location.state || {};

  const isDetail = mode === "detail";
  const isEdit = mode === "edit";
  const isCreate = !isEdit && !isDetail;

  const { list: putAwaySuggestions, fetchAll: fetchPutAwaySuggestions } =
    useStorePutAwaySuggestion();

  console.log("🚩 Put Away Suggestions:", putAwaySuggestions);

  const { list: userList, fetchAll: fetchUserList } = useStoreUser();
  const { createBulkData } = useStoreBulkPutAway();
  const { updateData } = useStorePutAway();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [mappedData, setMappedData] = useState<PutAwayRow[]>([]);
  const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<PutAwayRow | null>(null);

  // Fetch data awal
  useEffect(() => {
    if (isCreate || isEdit) {
      fetchPutAwaySuggestions();
      fetchUserList();
    }
  }, [isCreate, isEdit, fetchPutAwaySuggestions, fetchUserList]);

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
      forkliftDriverId: viewData?.forklift_driver_id || "",
      driverName: viewData?.driver_name || "",
      driverPhone: viewData?.driver_phone || "",
    },
  });

  useEffect(() => {
    if (viewData) {
      reset({
        forkliftDriverId: viewData.forklift_driver_id || "",
        driverName: viewData.driver_name || "",
        driverPhone: viewData.driver_phone || "",
      });
    }
  }, [viewData, reset]);

  // Mapping data tabel
  // ==============================
  // 🔹 TABLE DATA (EDIT/CREATE)
  // ==============================
  useEffect(() => {
    if ((isDetail || isEdit) && viewData) {
      const palletItems = viewData.palletItems || [];
      const SKUname = palletItems.map((item: any) => item.item_name).join(", ");

      const formatted: PutAwayRow[] = [
        {
          stagingPalletId: viewData.inventory_tracking_id || "-",
          palletId: viewData.palletId || "-",
          palletCode: viewData.palletCode || "-",
          totalQty: viewData.totalQty || 0,
          warehouseName: viewData.warehouseSubName || "-",
          stagingArea: viewData.warehouseSubName || "-", // atau ubah jika ada field stagingArea terpisah
          suggestZoneId:
            viewData.warehouse_bin_id || viewData.destination_bin_id || "-",
          suggestZone: viewData.suggestZone || "-",
          suggestBinId: viewData.destination_bin_id || "-",
          suggestBin: viewData.suggestBin || "-",
          driver: viewData.driver_name || "-",
          SKUname: SKUname,
          // Ambil UoM dari palletItems (robust terhadap nama field uom / item_uom)
          palletItemUom:
            palletItems?.[0]?.uom || palletItems?.[0]?.item_uom || "-",
        },
      ];

      setMappedData(formatted);

      // Isi form driver
      setValue("forkliftDriverId", viewData.forklift_driver_id || "");
      setValue("driverName", viewData.driver_name || "");
      setValue("driverPhone", viewData.driver_phone || "");
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
            palletItemUom: palletItems?.[0]?.uom || palletItems?.[0]?.item_uom || "-",
          };
        }
      );
      setMappedData(formatted);
    }
  }, [isDetail, isEdit, isCreate, viewData, putAwaySuggestions, setValue]);

  // 🟢 Auto-select baris pertama kalau edit
  useEffect(() => {
    if (isEdit && mappedData.length > 0) {
      const firstId = mappedData[0].stagingPalletId;
      setSelectedIds([firstId]);
    }
  }, [isEdit, mappedData]);

  // Table columns
  const columns = useMemo<ExtendedColumnDef<PutAwayRow>[]>(() => {
    const cols: ExtendedColumnDef<PutAwayRow>[] = [
      {
        accessorKey: "stagingPalletId",
        header: "Staging Pallet ID",
        ...(!isDetail && { selectedRow: true }),
      },
      { accessorKey: "palletCode", header: "Pallet Code" },
      { accessorKey: "SKUname", header: "SKU Name" },
      { accessorKey: "palletItemUom", header: "UoM" },
      {
        accessorKey: "totalQty",
        header: "Total Qty",
      },
      { accessorKey: "suggestZone", header: "Suggest Zone" },
      { accessorKey: "suggestBin", header: "Suggest Bin" },
    ];

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
  }, [isDetail]);

  const [tableKey, setTableKey] = useState(0);

  // const handleEdit = (row: PutAwayRow) => {
  //   // 1️⃣ Kosongkan semua checkbox
  //   setSelectedIds([]);

  //   // 2️⃣ Simpan baris yang akan diedit ke state modal
  //   setSelectedRow(row);

  //   // 3️⃣ Buka modal edit (adjustment)
  //   setIsAdjustmentOpen(true);
  // };

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
              suggestZone: adjustPutaway.suggestZoneName,
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

  // const createPutawayPayload = (
  //   selectedIds: string[],
  //   mapped: PutAwayRow[],
  //   driver: { id: string; name: string; phone: string }
  // ) =>
  //   mapped
  //     .filter((r) => selectedIds.includes(r.stagingPalletId))
  //     .map((r) => ({
  //       inventory_tracking_id: r.stagingPalletId,
  //       destination_bin_id: r.suggestBinId,
  //       forklift_driver_id: driver.id,
  //       driver_name: driver.name,
  //       driver_phone: driver.phone,
  //       status: "PENDING",
  //       notes: "",
  //     }));

  // Submit handler
  // ==============================
  // 🔹 HANDLE SUBMIT
  // ==============================
  const onSubmit = async (data: DriverFormValues) => {
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

        console.log("🟢 Create Payload:", payload);
        if (typeof createBulkData === "function") {
          const res = await createBulkData(payload);
          if (res?.success) {
            navigate("/putaway");
          }
        } else {
          showErrorToast("Put Away creation function is not available.");
        }
      }

      // 🔸 MODE EDIT → single update
      if (isEdit && viewData?.id) {
        const payload = {
          inventory_tracking_id: viewData.inventory_tracking_id,
          destination_bin_id: mappedData[0]?.suggestBinId || "",
          forklift_driver_id: data.forkliftDriverId,
          driver_name: data.driverName,
          driver_phone: data.driverPhone,
          status: viewData.status || "PENDING",
          notes: viewData.notes || "",
        };

        console.log("🟡 Edit Payload:", payload);
        const res = await updateData(viewData.id, payload);
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
          <div>
            <label className="block text-sm font-medium mb-1">
              Forklift Username
            </label>
            <Controller
              name="forkliftDriverId"
              control={control}
              render={({ field }) => (
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
              )}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
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

          <div>
            <label className="block text-sm font-medium mb-1">
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
                  type="number"
                />
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
          }}
          onSave={handleSaveAdjustment}
        />
      )}
    </div>
  );
};

export default PutAwayDetail;
