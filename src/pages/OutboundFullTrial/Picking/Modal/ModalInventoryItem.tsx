import React, { useEffect, useMemo } from "react";
import { useStorePickingSuggestionItem } from "../../../../DynamicAPI/stores/Store/MasterStore";
import { useForm, Controller } from "react-hook-form";
import Button from "../../../../components/ui/button/Button";
import Select from "../../../../components/form/Select";
import KeyValueCard from "../Helper/KeyValueCard";
import { formatDate } from "../../Memo/TableAndForm/MemoCreateProcess";

type Props = {
  onSubmit?: (d: any) => void;
  onBack?: () => void;
  itemID?: any;
  existingItemData?: any;
};

export default function ModalInventoryItem({
  onSubmit,
  onBack,
  itemID,
  existingItemData,
}: Props) {
  const {
    fetchById,
    detail: itemList,
    isLoading,
  } = useStorePickingSuggestionItem();

  useEffect(() => {
    if (itemID && typeof fetchById === "function") fetchById(itemID);
  }, [itemID, fetchById]);

  const {
    control,
    watch,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      week_number: "",
      location_id: "",
      qty_pick: "",
    },
  });

  const locations = itemList?.suggested_locations || [];
  const defaultLocation = locations?.[0] || null;

  useEffect(() => {
    if (itemList) {
      reset({
        week_number: "",
        location_id: "",
        qty_pick: "",
      });
    }
  }, [itemList, reset]);

  /** WEEK OPTIONS */
  const weekOptions = useMemo(() => {
    const uniq = Array.from(
      new Map((locations || []).map((l: any) => [l.week_number, l])).values()
    );

    return uniq
      .sort((a, b) => Number(a.week_number) - Number(b.week_number))
      .map((loc: any) => ({
        label: `Week ${loc.week_number}`,
        value: String(loc.week_number),
      }));
  }, [locations]);

  const selectedWeek = watch("week_number");

  /** LOCATION OPTIONS */
  const locationOptions = useMemo(() => {
    if (!selectedWeek) return [];

    return locations
      .filter((l: any) => String(l.week_number) === selectedWeek)
      .map((loc: any) => ({
        label: `${loc.warehouse_sub_code} - ${loc.bin_code} (Available : ${loc.available_quantity} ${loc.uom})`,
        value: String(loc.bin_id),
      }));
  }, [locations, selectedWeek]);

  const selectedLocationId = watch("location_id");

  const selectedLocation = useMemo(() => {
    return locations.find(
      (l: any) =>
        String(l.week_number) === selectedWeek &&
        String(l.bin_id) === selectedLocationId
    );
  }, [locations, selectedWeek, selectedLocationId]);

  /** SUBMIT */
  const onSave = (data: any) => {
    onSubmit?.({
      ...data,
      location_data: selectedLocation,
      item_id: itemList?.item_id,
      uom: itemList?.uom,
    });
  };

  if (isLoading && !itemList) {
    return <div className="p-6">Loading...</div>;
  }

  const isSameSource =
    existingItemData &&
    selectedLocation &&
    existingItemData.week_number === selectedLocation.week_number &&
    existingItemData.zone === selectedLocation.warehouse_sub_code &&
    existingItemData.bin === selectedLocation.bin_code;

  return (
    <div className="p-6 space-y-8">
      {/* HEADER */}
      <h2 className="text-2xl font-semibold text-blue-900 tracking-wide">
        Suggest Location
      </h2>

      {/* ITEM NAME */}
      <div>
        <input
          className="w-full border p-3 bg-gray-100 rounded-xl text-gray-700"
          value={itemList?.item_name ?? ""}
          disabled
        />
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 gap-6">
        {/* WEEK */}
        <div>
          <label className="font-semibold text-gray-700 text-sm">Week</label>
          <Controller
            control={control}
            name="week_number"
            rules={{ required: "Required" }}
            render={({ field }) => (
              <Select {...field} options={weekOptions} width={"100%"} />
            )}
          />
        </div>

        {/* LOCATION */}
        <div>
          <label className="font-semibold text-gray-700 text-sm">
            Location
          </label>
          <Controller
            control={control}
            name="location_id"
            rules={{ required: "Required" }}
            render={({ field }) => (
              <Select {...field} options={locationOptions} width={"100%"} />
            )}
          />
        </div>
      </div>

      {/* NOTE FOR SAME SOURCE */}
      {isSameSource && (
        <div className="text-blue-500">
          <span className="italic">
            Suggestion Location yang dipilih berasal dari Zone, BIN, dan Week yang sama
            dengan data yang ada.
          </span>
        </div>
      )}

      {/* COMPARISON AREA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* EXISTING ITEM CARD */}
        {existingItemData && (
          <KeyValueCard
            title="Existing Suggestion Location"
            data={{
              zone: existingItemData.zone,
              bin: existingItemData.bin,
              planned_qty: existingItemData.qty_plan,
              production_date: formatDate(existingItemData.production_date),
              week: existingItemData.week_number,
              uom: existingItemData.uom,
            }}
            labelMap={{
              zone: "Zone",
              bin: "BIN",
              planned_qty: "Qty Plan",
              production_date: "Production Date",
              week: "Week",
              uom: "UOM",
            }}
          />
        )}

        {/* NEW SUGGESTION ITEM CARD */}
        {selectedLocation && (
          <KeyValueCard
            title="New Suggestion Location"
            data={{
              zone: selectedLocation.warehouse_sub_code,
              bin: selectedLocation.bin_code,
              available_quantity: selectedLocation.available_quantity,
              production_date: formatDate(selectedLocation.production_date),
              week: selectedLocation.week_number,
              uom: selectedLocation.uom,
              priority: selectedLocation.location_priority,
            }}
            labelMap={{
              uom: "UOM",
              zone: "Zone",
              bin: "BIN",
              available_quantity: "Available Qty",
              production_date: "Production Date",
              week: "Week",
              priority: "Location Priority",
            }}
          />
        )}
      </div>

      {/* QTY PICK */}
      <div>
        <label className="font-semibold text-gray-700 text-sm">
          Set new Qty Plan
        </label>
        <Controller
          control={control}
          name="qty_pick"
          rules={{
            required: "Required",
            validate: (v: any) => {
              const max =
                selectedLocation?.quantity_ready_to_pick ??
                defaultLocation?.quantity_ready_to_pick ??
                "";
              if (Number(v) > max) return `Max ${max}`;
              return true;
            },
          }}
          render={({ field }) => (
            <input
              type="number"
              {...field}
              className="border p-3 w-full rounded-xl"
            />
          )}
        />
        {errors.qty_pick && (
          <p className="text-red-500 text-xs">
            {(errors.qty_pick as any)?.message}
          </p>
        )}
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex justify-end gap-3 pt-4">
        <Button variant="secondary" onClick={onBack}>
          Back
        </Button>

        <Button variant="primary" onClick={handleSubmit(onSave)}>
          Submit
        </Button>
      </div>
    </div>
  );
}
