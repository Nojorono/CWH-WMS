import React, { useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import Button from "../../../../components/ui/button/Button";
import Select from "../../../../components/form/Select";
import KeyValueCard from "../Helper/KeyValueCard";
import { EndPoint } from "../../../../utils/EndPoint";
import { formatDateIndo } from "../../../../helper/FormatDate";
import axiosInstance from "../../../../DynamicAPI/AxiosInstance";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit?: (d: any) => void;
  itemID?: any;
  existingItemData?: any;
  mode?: "add" | "edit";
  metodeSuggestion?: string;
  uomID?: string;
};

export default function ModalInventoryItemModal({
  open,
  onClose,
  onSubmit,
  itemID,
  existingItemData,
  mode,
  metodeSuggestion,
  uomID,
}: Props) {
  if (!open) return null; // modal hidden

  const [itemList, setItemList] = React.useState<any>(null);

  // useEffect(() => {
  //   const fetchItem = async () => {
  //     try {

  //       // Default to empty string if any param is missing
  //       const id = itemID ?? "";
  //       const uom = uomID ?? "";
  //       const sortMethod = metodeSuggestion ?? "";

  //       const response = await fetch(
  //         `${EndPoint}picking-suggestion/item/${id}?uom=${uom}&sortMethod=${sortMethod}`,
  //         {
  //           headers: {
  //             Authorization: `Bearer ${token}`, // Set the Authorization header
  //           },
  //         }
  //       );
  //       const data = await response.json();

  //       // Handle the fetched data as needed
  //       setItemList(data.data);
  //     } catch (error) {
  //       console.error("Error fetching item:", error);
  //     }
  //   };

  //   if (open) {
  //     fetchItem();
  //   }
  // }, [open, itemID, uomID, metodeSuggestion]);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const res = await axiosInstance.get(
          `picking-suggestion/item/${itemID ?? ""}`,
          {
            params: {
              uom: uomID ?? "",
              sortMethod: metodeSuggestion ?? "",
            },
          },
        );

        setItemList(res.data.data);
      } catch (error) {
        console.error("Error fetching item via axiosInstance:", error);
      }
    };

    if (open) {
      fetchItem();
    }
  }, [open, itemID, uomID, metodeSuggestion]);

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
  const isEditMode = mode === "edit";

  useEffect(() => {}, []);

  useEffect(() => {
    if (isEditMode && existingItemData) {
      const suggestedLocation = existingItemData.suggested_locations[0] || null; // Ambil lokasi pertama atau null
      reset({
        week_number: suggestedLocation ? suggestedLocation.week_number : "", // Atur week_number jika ada
        location_id: suggestedLocation ? suggestedLocation.bin_id : "", // Atur location_id jika ada
        qty_pick: existingItemData.remaining_quantity_needed, // Atur qty_pick sesuai dengan remaining_quantity_needed
      });
    } else {
      // Reset form untuk mode add
      reset({
        week_number: "",
        location_id: "",
        qty_pick: "",
      });
    }
  }, [itemList, existingItemData, isEditMode, reset]);

  /** WEEK OPTIONS */
  const weekOptions = useMemo(() => {
    const uniq = Array.from(
      new Map((locations || []).map((l: any) => [l.week_number, l])).values(),
    );

    return uniq
      .sort((a: any, b: any) => Number(a.week_number) - Number(b.week_number))
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
        String(l.bin_id) === selectedLocationId,
    );
  }, [locations, selectedWeek, selectedLocationId]);

  /** SUBMIT */
  const onSave = (data: any) => {
    const newSuggestion = {
      ...data,
      location_data: selectedLocation || null,
      item_id: itemList?.item_id,
      uom: itemList?.uom,
      item_name: itemList?.item_name,
      item_code: itemList?.item_code,
    };

    if (mode === "add") {
      onSubmit?.(newSuggestion);
    } else {
      onSubmit?.({
        ...newSuggestion,
        existingItemData: existingItemData,
      });
    }

    onClose(); // auto-close modal
  };

  const isSameSource =
    existingItemData &&
    selectedLocation &&
    existingItemData.week_number === selectedLocation.week_number &&
    existingItemData.zone === selectedLocation.warehouse_sub_code &&
    existingItemData.bin === selectedLocation.bin_code;

  // For ADD mode: disable submit if selected location equals any existing suggested location
  const isDuplicateLocationInAdd =
    mode === "add" &&
    existingItemData &&
    selectedLocation &&
    Array.isArray(existingItemData.suggested_locations) &&
    existingItemData.suggested_locations.some((loc: any) => {
      // same week + same bin (location) => considered duplicate
      return (
        Number(loc.week_number) === Number(selectedLocation.week_number) &&
        (loc.bin_id === selectedLocation.bin_id ||
          (loc.warehouse_sub_code === selectedLocation.warehouse_sub_code &&
            loc.bin_code === selectedLocation.bin_code))
      );
    });

  return (
    <div className="fixed inset-0 z-10000 flex items-center justify-center">
      {/* OVERLAY */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose}></div>

      {/* MODAL CARD */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[92vh] overflow-y-auto p-6 space-y-8 animate-fadeIn">
        {/* HEADER */}
        <h2 className="text-2xl font-semibold text-blue-900 tracking-wide">
          {isEditMode
            ? "Edit Suggest Location Item"
            : "Add Suggest Location Item"}
        </h2>

        {/* ITEM NAME */}
        <div>
          <label className="font-semibold text-gray-700 text-sm">
            Required Item
          </label>
          <input
            className="w-full border p-3 bg-gray-100 rounded-xl text-gray-700"
            value={`${existingItemData.item_name}`}
            disabled
          />
        </div>

        <div>
          <label className="font-semibold text-gray-700 text-sm">
            Required Qty
          </label>
          <input
            className="w-full border p-3 bg-gray-100 rounded-xl text-gray-700"
            value={`${existingItemData.required_quantity} ${existingItemData.suggested_locations[0]?.uom}`}
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
                <Select {...field} options={weekOptions} width="100%" />
              )}
            />
          </div>

          {/* DUPLICATE LOCATION INFO */}
          {isDuplicateLocationInAdd && (
            <div className="mt-3 p-3 rounded-md bg-red-50 border border-red-200 text-sm text-black-800">
              Selected location sudah ada untuk item ini pada week yang sama.
              Mohon pilih week dan lokasi lain!
            </div>
          )}

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
                <Select {...field} options={locationOptions} width="100%" />
              )}
            />
          </div>
        </div>

        {/* NOTE FOR SAME SOURCE */}
        {isEditMode && isSameSource && (
          <p className="text-blue-500 italic">
            Suggestion Location yang dipilih berasal dari Zone, BIN, dan Week
            yang sama dengan data existing.
          </p>
        )}

        {/* COMPARISON */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {isEditMode && existingItemData?.suggested_locations.length > 0 && (
            <KeyValueCard
              title="Existing Suggestion Location"
              data={{
                zone: existingItemData.suggested_locations[0]
                  ?.warehouse_sub_code,
                bin:
                  existingItemData.suggested_locations[0]?.bin_code !== "N/A"
                    ? existingItemData.suggested_locations[0]?.bin_code
                    : null,
                planned_qty: existingItemData.required_quantity,
                production_date: formatDateIndo(
                  existingItemData.suggested_locations[0]?.production_date,
                ),
                week: existingItemData.suggested_locations[0]?.week_number,
                uom: existingItemData.suggested_locations[0]?.uom,
              }}
              labelMap={{
                zone: "Zone",
                bin: "BIN",
                planned_qty: "Set Qty Pick",
                production_date: "Production Date",
                week: "Week",
                uom: "UOM",
              }}
            />
          )}

          {selectedLocation && (
            <KeyValueCard
              title="New Suggestion Location"
              data={{
                zone: selectedLocation.warehouse_sub_code,
                bin:
                  selectedLocation.bin_code !== "N/A"
                    ? selectedLocation.bin_code
                    : null,
                available_quantity: selectedLocation.available_quantity,
                production_date: formatDateIndo(
                  selectedLocation.production_date,
                ),
                week: selectedLocation.week_number,
                uom: selectedLocation.uom,
              }}
              labelMap={{
                uom: "UOM",
                zone: "Zone",
                bin: "BIN",
                available_quantity: "Available Qty",
                production_date: "Production Date",
                week: "Week",
              }}
            />
          )}
        </div>

        {/* QTY PICK */}
        <div>
          <label className="font-semibold text-gray-700 text-sm">
            {isEditMode ? "Qty Pick" : "Qty Pick to Add"}
          </label>

          <Controller
            control={control}
            name="qty_pick"
            rules={{
              required: "Required",
              validate: (v: any) => {
                const max = isEditMode
                  ? existingItemData.required_quantity // Ambil dari existingItemData saat edit
                  : (selectedLocation?.quantity_ready_to_pick ??
                    defaultLocation?.quantity_ready_to_pick ??
                    ""); // Ambil dari selectedLocation saat add
                if (Number(v) > max)
                  return `Tidak boleh lebih dari Qty Pick : ${max} ${selectedLocation?.uom}`;
                return true;
              },
            }}
            render={({ field }) => (
              <input
                type="number"
                {...field}
                className="border p-3 w-full rounded-xl"
                min={0}
                step={1}
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
          <Button variant="danger" onClick={onClose}>
            Cancel
          </Button>

          <Button
            variant="primary"
            onClick={handleSubmit(onSave)}
            disabled={isDuplicateLocationInAdd}
            title={
              isDuplicateLocationInAdd
                ? "Selected location already exists for this item/week — choose different location"
                : "Submit"
            }
          >
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
}
