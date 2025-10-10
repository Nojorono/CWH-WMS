import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import DynamicForm, {
  FieldConfig,
} from "../../../components/wms-components/inbound-component/form/DynamicForm";
import { useStoreInventoryTracking } from "../../../DynamicAPI/stores/Store/MasterStore";
import MovementHistoryTable from "../Table/HistoryTable";

// === Helper Function: Mapping Data API → Form ===
function mapDetailToForm(detail: any) {
  if (!detail) return {};

  return {
    id: detail.id || "",
    inventory_date: detail.inventory_date
      ? detail.inventory_date.split("T")[0]
      : "",
    inventory_status: detail.inventory_status || "",
    inventory_note: detail.inventory_note || "",
    warehouse_name: detail.warehouse?.name || "",
    warehouse_sub_name: detail.warehouseSub?.name || "",
    pallet_code: detail.pallet?.pallet_code || "",
    pallet_capacity: detail.pallet?.capacity || "",
    pallet_current_quantity: detail.pallet?.currentQuantity || "",
  };
}

// === Helper Function: Field Configuration ===
function buildFieldsConfig(isDetailMode: boolean): FieldConfig[] {
  return [
    {
      name: "pallet_code",
      label: "Pallet Code",
      type: "text",
      disabled: true,
    },
    {
      name: "pallet_capacity",
      label: "Pallet Capacity",
      type: "number",
      disabled: true,
    },
    {
      name: "pallet_current_quantity",
      label: "Current Quantity",
      type: "number",
      disabled: true,
    },
    {
      name: "inventory_date",
      label: "Inventory Date",
      type: "date",
      disabled: isDetailMode,
    },
    {
      name: "inventory_status",
      label: "Inventory Status",
      type: "text",
      disabled: true,
    },
    {
      name: "warehouse_name",
      label: "Warehouse",
      type: "text",
      disabled: true,
    },
    {
      name: "warehouse_sub_name",
      label: "Warehouse Sub",
      type: "text",
      disabled: true,
    },
  ];
}

// === Main Component ===
export default function DetailInventory() {
  const location = useLocation();
  const { invListId } = location.state || {};

  // === Zustand Store ===
  const { fetchById, detail } = useStoreInventoryTracking();

  // === React Hook Form ===
  const methods = useForm({
    defaultValues: {},
  });
  const { setValue, reset, control, register, handleSubmit, watch } = methods;

  // === Mode (View Only) ===
  const isDetailMode = true;

  // === Fetch data by ID ===
  useEffect(() => {
    if (invListId) fetchById(invListId);
  }, [fetchById, invListId]);

  // === Set data to form ===
  useEffect(() => {
    if (detail && Object.keys(detail).length > 0) {
      reset(mapDetailToForm(detail));
    }
  }, [detail, reset]);

  // === Submit Handler ===
  const onFinalSubmit = (data: any) => {
    console.log("Form submitted:", data);
  };

  const palletId = detail && "pallet_id" in detail ? detail.pallet_id : "";  

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* Breadcrumb Header */}
      <PageBreadcrumb
        breadcrumbs={[
          { title: "Inventory List", path: "/inventory" },
          { title: "Inventory Detail", path: "/inventory/detail" },
        ]}
      />

      {/* Form Section */}
      <section className="mt-6 flex justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 w-full">
          <DynamicForm
            fields={buildFieldsConfig(isDetailMode)}
            onSubmit={handleSubmit(onFinalSubmit)}
            defaultValues={mapDetailToForm(detail)}
            control={control}
            register={register}
            setValue={setValue}
            handleSubmit={handleSubmit}
            isEditMode={!isDetailMode}
            watch={watch}
          />
        </div>
      </section>

      <MovementHistoryTable palletId={palletId} />
    </div>
  );
}
