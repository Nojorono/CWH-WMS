"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { FaEdit } from "react-icons/fa";
import Button from "../../../components/ui/button/Button";
import TableComponent from "../../../components/tables/MasterDataTable/TableComponent";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import {
  useStorePutAwaySuggestion,
  useStoreUserManagement,
  useStoreBulkPutAway,
  useStorePutAway,
} from "../../../DynamicAPI/stores/Store/MasterStore";
import { PutAwaySuggestion } from "../../../DynamicAPI/types/PutAwaySuggestionTypes";
import ModalSuggestion from "../Modal/ModalSuggestion";
import Select from "../../../components/form/Select";
import { showErrorToast } from "../../../components/toast";
import { useForm, Controller } from "react-hook-form";
import { useLocation, useNavigate } from "react-router";
import { formatDateIndo } from "../../../helper/FormatDate";
import { usePersistAuthStore } from "../../../API/store/AuthStore/PersistAuthStore";

type PutAwayRow = {
  stagingPalletId: string;
  palletId: string;
  palletCode: string;
  totalQty: number;
  uom: string;
  week_number: number;
  production_date: string;
  inbound_id: string;
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
  driverId: string;
  driverName: string;
  driverPhone: string;
};

const PutAwayDetail: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: detailDataPutaway, mode } = location.state || {};
  const user = usePersistAuthStore((state) => state.user);
  const orgId = user?.userDetail?.organizationId || user?.userDetail?.organization?.id;

  const isDetail = mode === "detail";
  const isEdit = mode === "edit";
  const isCreate = !isEdit && !isDetail;

  const { list: putAwaySuggestions, fetchAll: fetchPutAwaySuggestions } = useStorePutAwaySuggestion();

  const { list: userList, fetchAll: fetchUserList } = useStoreUserManagement();
  const { createBulkData } = useStoreBulkPutAway();
  const { updateData } = useStorePutAway();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [mappedData, setMappedData] = useState<PutAwayRow[]>([]);
  const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<PutAwayRow | null>(null);  

  useEffect(() => {
    if (isCreate || isEdit || isDetail) {
      fetchPutAwaySuggestions();
      fetchUserList();
    }
  }, [isCreate, isEdit, isDetail, fetchPutAwaySuggestions, fetchUserList]);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm<DriverFormValues>({
    defaultValues: {
      forkliftDriverId: detailDataPutaway?.forkliftDriverId || "",
      driverId: detailDataPutaway?.driverId || "",
      driverName: detailDataPutaway?.driverName || "",
      driverPhone: detailDataPutaway?.driverPhone || "",
    },
  });

  useEffect(() => {
    if (detailDataPutaway) {
      reset({
        forkliftDriverId: detailDataPutaway.forkliftDriverId || "",
        driverId: detailDataPutaway.driverId || "",
        driverName: detailDataPutaway.driverName || "",
        driverPhone: detailDataPutaway.driverPhone || "",
      });
    }
  }, [detailDataPutaway, reset]);

  useEffect(() => {
    if ((isDetail || isEdit) && detailDataPutaway && userList.length > 0) {
      const palletItems = detailDataPutaway.palletItems || [];
      
      const formatted: PutAwayRow[] = [
        {
          stagingPalletId: detailDataPutaway.inventory_tracking_id,
          palletId: detailDataPutaway.palletId,
          palletCode: detailDataPutaway.palletCode,
          totalQty: detailDataPutaway.totalQty,
          uom: detailDataPutaway.uom,
          week_number: detailDataPutaway.week_number,
          production_date: detailDataPutaway.production_date,
          inbound_id: detailDataPutaway.inbound_id,
          warehouseName: detailDataPutaway.warehouseSubName,
          stagingArea: detailDataPutaway.warehouseSubName,
          suggestZoneId: detailDataPutaway.destination_bin_id,
          suggestZone: detailDataPutaway.suggestZone,
          suggestBinId: detailDataPutaway.destination_bin_id,
          suggestBin: detailDataPutaway.suggestBin,
          driver: detailDataPutaway.driverName,
          SKUname: palletItems?.[0]?.itemName,
          palletItemUom: palletItems?.[0]?.uom || palletItems?.[0]?.item_uom,
          destinationWarehouseSubCode:
            detailDataPutaway.destinationWarehouseSubCode,
          destinationBinCode: detailDataPutaway.destinationBinCode,
          destinationWarehouseSubName:
            detailDataPutaway.destinationWarehouseSubName,
        },
      ];

      setMappedData(formatted);

      const matchedDriver = userList.find(
        (u: any) => u.id === detailDataPutaway.forkliftDriverId,
      );

      setValue("forkliftDriverId", detailDataPutaway.forkliftDriverId);
      setValue("driverId", matchedDriver?.id || "");
      setValue("driverName", detailDataPutaway.driverName);
      setValue("driverPhone", detailDataPutaway.driverPhone);
    } else if (isCreate && putAwaySuggestions) {
      const suggestions =
        (putAwaySuggestions as any).palletSuggestions ||
        (Array.isArray(putAwaySuggestions)
          ? putAwaySuggestions.flatMap(
            (res: any) =>
              res.data?.palletSuggestions || res.palletSuggestions || [],
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
            stagingPalletId: staging?.id,
            palletId: pallet?.id,
            palletCode: pallet?.pallet_code,
            totalQty: pallet?.currentQuantity,
            uom: palletItems?.[0]?.uom,
            week_number: palletItems?.[0]?.week_number,
            production_date: palletItems?.[0]?.production_date,
            inbound_id: palletItems?.[0]?.inbound_id,
            warehouseName: warehouse?.name,
            stagingArea: stagingArea?.name,
            suggestZoneId: zone?.id,
            suggestZone: zone?.name,
            suggestBinId: bin?.id,
            suggestBin: bin?.name,
            driver: "",
            SKUname: SKUname,
            palletItemUom: palletItems?.[0]?.uom,
          };
        },
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
    userList,
  ]);

  useEffect(() => {
    if (isEdit && mappedData.length > 0) {
      const firstId = mappedData[0].stagingPalletId;
      setSelectedIds([firstId]);
    }
  }, [isEdit, mappedData]);


  const columns = useMemo<ExtendedColumnDef<PutAwayRow>[]>(() => {
    const cols: ExtendedColumnDef<PutAwayRow>[] = [];

    if (!isCreate) {
      if (!isDetail && !isEdit) {
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
        { accessorKey: "destinationBinCode", header: "Destination Bin" },
      );

      if (!isDetail) {
        cols.push(
          { accessorKey: "suggestZone", header: "Update Zone" },
          { accessorKey: "suggestBin", header: "Update Bin" },
        );
      }
    } else {
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
      );

      if (!isDetail) {
        cols.push(
          { accessorKey: "suggestZone", header: "Suggest Zone" },
          { accessorKey: "suggestBin", header: "Suggest Bin" },
        );
      }
    }

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

  const handleEdit = (row: PutAwayRow) => {
    setSelectedIds([]);
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
          : item,
      ),
    );
    setIsAdjustmentOpen(false);
  };

  // Filter khusus untuk role DRIVER_FORKLIFT dari userList
  const forkliftDrivers = useMemo(() => {
    return Array.isArray(userList)
      ? userList.filter((u: any) => u.role?.name === "DRIVER_FORKLIFT")
      : [];
  }, [userList]);

  const onSubmit = async (data: DriverFormValues) => {
    if (!data.forkliftDriverId || !data.driverName || !data.driverPhone) {
      showErrorToast("Please fill in all driver fields");
      return;
    }

    try {
      if (isDetail) return;

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

        const payload = {
          data: mappedData
            .filter((r) => selectedIds.includes(r.stagingPalletId))
            .map((r) => ({
              organization_id: orgId,
              inventory_tracking_id: r.stagingPalletId,
              destination_bin_id: r.suggestBinId,
              forklift_driver_id: data.forkliftDriverId,
              driver_name: data.driverName,
              driver_phone: data.driverPhone,
              status: "PENDING",
              notes: "",
              uom: r.palletItemUom,
              quantity: r.totalQty,
              week_number: r.week_number,
              production_date: formatDateIndo(r.production_date),
              inbound_id: r.inbound_id || "",
            })),
        };

        if (typeof createBulkData === "function") {
          const res = await createBulkData(payload as any);
          if (res?.success) {
            navigate("/putaway");
          }
        }
      }

      if (isEdit && detailDataPutaway?.id) {
        const originalBinId = detailDataPutaway.destinationBinId;
        const updatedBinId = mappedData?.[0]?.suggestBinId ?? null;
        const finalBinId =
          updatedBinId && updatedBinId !== "-" ? updatedBinId : originalBinId;

        const payload = {
          inventory_tracking_id: detailDataPutaway.inventory_tracking_id,
          destination_bin_id: finalBinId,
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

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="border rounded-lg p-4 shadow-md space-y-4"
      >
        <h2 className="font-semibold text-lg">Forklift Driver</h2>
        <div className="grid grid-cols-2 gap-4">
          {/* Driver Device (Username) */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Username <span className="text-red-500">*</span>
            </label>
            <Controller
              name="forkliftDriverId"
              control={control}
              rules={{ required: "Please select a driver device" }}
              render={({ field }) => (
                <>
                  <Select
                    {...field}
                    placeholder="Select Driver Username"
                    options={forkliftDrivers.map((d: any) => ({
                      value: d.id,
                      label: d.username,
                    }))}
                    onChange={(val: string) => {
                      const selected = forkliftDrivers.find(
                        (u: any) => u.id === val,
                      );
                      if (selected) {
                        const fullName =
                          `${selected.userDetail?.firstName || ""} ${selected.userDetail?.lastName || ""}`.trim();
                        setValue("driverId", selected.id);
                        setValue("driverName", fullName);
                        setValue(
                          "driverPhone",
                          selected.userDetail?.phone || "",
                        );
                      }
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

          {/* Driver Name (Full Name dari UserDetail) */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Driver Name <span className="text-red-500">*</span>
            </label>
            <Controller
              name="driverName"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  readOnly
                  type="text"
                  placeholder="Auto-filled driver name"
                  className="border p-2 rounded w-full bg-gray-100 cursor-not-allowed"
                />
              )}
            />
          </div>

          {/* Driver Phone - Auto Filled & Read Only */}
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">
              Driver Phone <span className="text-red-500">*</span>
            </label>
            <Controller
              name="driverPhone"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  readOnly
                  type="text"
                  placeholder="Auto-filled phone number"
                  className="border p-2 rounded w-full bg-gray-100 cursor-not-allowed"
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
