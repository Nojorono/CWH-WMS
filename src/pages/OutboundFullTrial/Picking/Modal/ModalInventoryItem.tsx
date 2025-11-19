import React, { useEffect, useMemo } from "react";
import { useStorePickingSuggestionItem } from "../../../../DynamicAPI/stores/Store/MasterStore";
import { useForm, Controller } from "react-hook-form";
import Button from "../../../../components/ui/button/Button";
import Select from "../../../../components/form/Select";

type Props = { onSubmit?: (d: any) => void; onBack?: () => void; itemID?: any };

export default function ModalInventoryItem({
  onSubmit,
  onBack,
  itemID,
}: Props) {
  const {
    fetchById,
    detail: itemList,
    isLoading,
  } = useStorePickingSuggestionItem();

  /** load detail */
  useEffect(() => {
    if (itemID && typeof fetchById === "function") fetchById(itemID);
  }, [itemID, fetchById]);

  /** react hook form - always call hooks in same order */
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
      qty_pick: 0,
    },
  });

  /** keep locations safe even when itemList is null to avoid conditional hooks */
  const locations = (itemList && itemList.suggested_locations) || [];

  const defaultLocation = locations?.[0] || null;

  /** reset when data loaded */
  useEffect(() => {
    if (itemList) {
      reset({
        week_number: "",
        location_id: "",
        qty_pick: 0,
      });
    }
  }, [itemList, reset]);

  /* STEP 1 — Week options */
  const weekOptions = useMemo(() => {
    const uniq = Array.from(
      new Map((locations || []).map((l: any) => [l.week_number, l])).values()
    );
    return uniq
      .sort((a: any, b: any) => Number(a.week_number) - Number(b.week_number))
      .map((loc: any) => ({
        label: `Week ${loc.week_number}`,
        value: String(loc.week_number),
      }));
  }, [locations]);

  const selectedWeek = watch("week_number");

  /* STEP 2 — Location list based on week */
  const locationOptions = useMemo(() => {
    if (!selectedWeek) return [];
    const filtered = (locations || []).filter(
      (l: any) => String(l.week_number) === selectedWeek
    );
    return filtered.map((loc: any) => ({
      label: `${loc.warehouse_sub_code} - BIN ${loc.bin_code} (Qty: ${loc.quantity_ready_to_pick})`,
      value: String(loc.bin_id),
    }));
  }, [locations, selectedWeek]);

  const selectedLocationId = watch("location_id");

  const selectedLocation = useMemo(() => {
    return (locations || []).find(
      (l: any) =>
        String(l.week_number) === selectedWeek &&
        String(l.bin_id) === selectedLocationId
    );
  }, [locations, selectedWeek, selectedLocationId]);

  /* SUBMIT */
  const onSave = (data: any) => {
    onSubmit?.({
      ...data,
      location_data: selectedLocation,
      item_id: itemList?.item_id,
      uom: itemList?.uom,
    });
    console.log("Submitting data:", {
      ...data,
      location_data: selectedLocation,
      item_id: itemList?.item_id,
      uom: itemList?.uom,
    });
    
  };

  // Render: still render form skeleton even if loading so hooks order doesn't change
  if (isLoading && !itemList) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-blue-900">Suggest Location</h2>

      <div className="grid grid-cols-2 gap-6">
        {/* LEFT INFO */}
        <div className="space-y-4">
          <div>
            <label className="font-semibold">Item Name</label>
            <input
              className="w-full border p-2 bg-gray-200"
              value={itemList?.item_name ?? ""}
              disabled
            />
          </div>

          <div>
            <label className="font-semibold">Quantity Request</label>
            <input
              className="w-full border p-2 bg-gray-200"
              value={itemList?.required_quantity ?? ""}
              disabled
            />
          </div>

          <div>
            <label className="font-semibold">UOM</label>
            <input
              className="w-full border p-2 bg-gray-200"
              value={itemList?.uom ?? ""}
              disabled
            />
          </div>
        </div>

        {/* RIGHT STEPS */}
        <div className="space-y-4">
          {/* STEP 1 — Week */}
          <div>
            <label className="font-semibold">Week</label>
            <Controller
              control={control}
              name="week_number"
              rules={{ required: "Required" }}
              render={({ field }) => (
                <Select {...field} options={weekOptions} />
              )}
            />
          </div>

          {/* STEP 2 — Location */}
          <div>
            <label className="font-semibold">Location</label>
            <Controller
              control={control}
              name="location_id"
              rules={{ required: "Required" }}
              render={({ field }) => (
                <Select {...field} options={locationOptions} />
              )}
            />
          </div>

          {/* Preview */}
          {selectedLocation && (
            <div className="p-4 bg-gray-100 rounded border space-y-1">
              <p>
                <b>Zone:</b> {selectedLocation.warehouse_sub_code}
              </p>
              <p>
                <b>BIN:</b> {selectedLocation.bin_code}
              </p>
              <p>
                <b>Qty Ready:</b> {selectedLocation.quantity_ready_to_pick}
              </p>
              <p>
                <b>Production Date:</b>{" "}
                {selectedLocation.production_date?.slice(0, 10) ?? ""}
              </p>
              <p>
                <b>Location Priority:</b> {selectedLocation.location_priority}
              </p>
            </div>
          )}

          {/* STEP 3 — Qty Picking */}
          <div>
            <label className="font-semibold">Qty Picking</label>
            <Controller
              control={control}
              name="qty_pick"
              rules={{
                required: "Required",
                validate: (v: any) => {
                  const max =
                    selectedLocation?.quantity_ready_to_pick ??
                    defaultLocation?.quantity_ready_to_pick ??
                    0;
                  if (Number(v) > max) return `Max ${max}`;
                  return true;
                },
              }}
              render={({ field }) => (
                <input
                  type="number"
                  {...field}
                  className="border p-2 w-full"
                  min={0}
                  max={
                    selectedLocation?.quantity_ready_to_pick ??
                    defaultLocation?.quantity_ready_to_pick ??
                    undefined
                  }
                />
              )}
            />
            {errors.qty_pick && (
              <p className="text-red-500 text-sm">
                {(errors.qty_pick as any)?.message}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
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
