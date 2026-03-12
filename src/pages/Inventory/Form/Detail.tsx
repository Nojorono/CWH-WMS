import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import DynamicForm, {
  FieldConfig,
} from "../../../components/wms-components/inbound-component/form/DynamicForm";
import { useStoreInventoryTracking } from "../../../DynamicAPI/stores/Store/MasterStore";
import MovementHistoryTable from "../Tabs/HistoryTable";
import TabsSection from "../../../components/wms-components/inbound-component/tabs/TabsSection";
import CurrentQuantityTable from "../../Master/MasterPallet/Tabs/Current";
import Button from "../../../components/ui/button/Button";
import { FaArrowLeft } from "react-icons/fa";

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
  const navigate = useNavigate();
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
    console.log("Form submitted Detail Invtry:", data);
  };

  const palletId = (detail as any)?.pallet_id ?? "";
  const palletCode = (detail as any)?.pallet?.pallet_code ?? "";
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* Breadcrumb Header */}
      <div className="flex justify-between items-center">
        <PageBreadcrumb
          breadcrumbs={[
            { title: "Inventory List", path: "/main_inventory" },
            { title: "Inventory Detail", path: "/inventory/detail" },
          ]}
        />

        <Button
          variant="primary"
          onClick={() => navigate(-1)}
          startIcon={<FaArrowLeft />}
        >
          Back to List Inventory
        </Button>
      </div>

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

      <div className="mt-6">
        <TabsSection
          tabs={[
            {
              label: "Movement History",
              content: <MovementHistoryTable palletId={palletId} />,
            },
            {
              label: "Current Assets",
              content: <CurrentQuantityTable palletCode={palletCode} />,
            },
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>
    </div>
  );
}
