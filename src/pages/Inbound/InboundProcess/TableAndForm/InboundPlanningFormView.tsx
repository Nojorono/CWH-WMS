import PageBreadcrumb from "../../../../components/common/PageBreadCrumb";
import Button from "../../../../components/ui/button/Button";
import DynamicForm, {
  FieldConfig,
} from "../../../../components/wms-components/inbound-component/form/DynamicForm";
import TabsSection from "../../../../components/wms-components/inbound-component/tabs/TabsSection";
import DeliveryOrderCard from "./component/Form/DeliveryOrderCard";
import HelperAssign from "./component/Tabs/HelperAssign";
import ConfirmationModal from "./component/Modal/ConfirmationModal";
import { FaPlus, FaRedoAlt } from "react-icons/fa";
import { UseFormReturn } from "react-hook-form";
import { FormValues } from "./component/formTypes";
import { useState } from "react";
import ScanHistory from "./component/Tabs/ScanHistory";

type Props = {
  methods: UseFormReturn<FormValues>;
  doFields: { id: string }[];
  appendDO: () => void;
  removeDO: (index: number) => void;
  isCreateMode: boolean;
  isEditMode: boolean;
  isDetailMode: boolean;
  formTitle: string;
  handlePreview: () => void;
  previewData: FormValues | null;
  isConfirmOpen: boolean;
  setIsConfirmOpen: (v: boolean) => void;
  onFinalSubmit: (data: FormValues) => void;
  reset: (values: FormValues) => void;
  emptyFormValues: FormValues;
  inboundID?: string;
};

// ==== Helpers ====
const buildFieldsConfig = (isDetailMode: boolean): FieldConfig[] =>
  [
    {
      name: "inbound_plan_no",
      label: "Inbound Plan No",
      type: "text" as const,
      disabled: true,
    },
    {
      name: "inbound_type",
      label: "Tipe Inbound",
      type: "select" as const,
      options: [
        { value: "PO", label: "PO" },
        { value: "SO", label: "SO" },
        { value: "RETUR", label: "RETUR" },
      ],
      validation: { required: "Tipe inbound wajib diisi" }, // ✅ wajib
    },
    {
      name: "expedition",
      label: "Ekspedisi",
      type: "text" as const,
      validation: { required: "Ekspedisi wajib diisi" }, // ✅
    },
    {
      name: "driver",
      label: "Driver",
      type: "text" as const,
      validation: { required: "Nama driver wajib diisi" },
    },
    {
      name: "no_pol",
      label: "No Polisi",
      type: "text" as const,
      validation: { required: "No polisi wajib diisi" },
    },
    {
      name: "origin",
      label: "Origin",
      type: "text" as const,
      validation: { required: "Origin wajib diisi" },
    },
    {
      name: "destination",
      label: "Tujuan",
      type: "text" as const,
      validation: { required: "Tujuan wajib diisi" },
    },
    {
      name: "driver_phone",
      label: "No Telp Driver",
      type: "text" as const,
      validation: { required: "No telp driver wajib diisi" },
    },
    {
      name: "arrival_date",
      label: "Tanggal Kedatangan",
      type: "date" as const,
      validation: { required: "Tanggal kedatangan wajib diisi" },
    },
  ].map((f) => ({
    ...f,
    disabled: f.name === "inbound_plan_no" ? true : isDetailMode,
  }));

// ==== Sub Components ====
const ActionButtons = ({
  isCreateMode,
  isEditMode,
  appendDO,
  reset,
  emptyFormValues,
}: Props) => {
  if (!(isCreateMode || isEditMode)) return null;

  return (
    <div className="mt-4 flex justify-end gap-1">
      <Button type="button" variant="primary" size="sm" onClick={appendDO}>
        <FaPlus className="inline mr-1" /> Add Surat Jalan
      </Button>
      {!isEditMode && (
        <Button
          type="button"
          variant="danger"
          size="sm"
          onClick={() => reset(emptyFormValues)}
        >
          <FaRedoAlt className="inline mr-1" /> Reset All
        </Button>
      )}
    </div>
  );
};

const DOSection = ({
  doFields,
  removeDO,
  isDetailMode,
  methods,
}: Props & { methods: UseFormReturn<FormValues> }) => {
  const inboundTypeObj = methods.watch("inbound_type");
  const inboundType =
    typeof inboundTypeObj === "string"
      ? inboundTypeObj
      : inboundTypeObj?.value || "PO";

  if (!doFields.length) return null;

  return (
    <section className="space-y-4 mt-4">
      {doFields.map((doField, doIndex) => (
        <DeliveryOrderCard
          key={doField.id}
          doIndex={doIndex}
          removeDO={() => removeDO(doIndex)}
          totalDO={doFields.length}
          isEditMode={!isDetailMode}
          inbType={inboundType as "PO" | "SO" | "RETUR"} // 👈 passing langsung ke prop
        />
      ))}
    </section>
  );
};

const DetailTabs = ({
  doFields,
  removeDO,
  inboundID,
  methods,
}: Pick<Props, "doFields" | "removeDO" | "inboundID"> & {
  methods: UseFormReturn<FormValues>;
}) => {
  const inboundType = methods.watch("inbound_type") || "PO"; // 👈 default PO
  const [activeTab, setActiveTab] = useState(0);

  return (
    <TabsSection
      tabs={[
        {
          label: "Item Details",
          content: (
            <>
              {doFields.map((doField, doIndex) => (
                <DeliveryOrderCard
                  key={doField.id}
                  doIndex={doIndex}
                  removeDO={() => removeDO(doIndex)}
                  totalDO={doFields.length}
                  isEditMode={false}
                  inbType={inboundType as "PO" | "SO" | "RETUR"}
                />
              ))}
            </>
          ),
        },
        {
          label: "Scan History",
          content: <ScanHistory inboundID={inboundID} />,
        },
        {
          label: "Helper Assign",
          content: <HelperAssign inboundID={inboundID} />,
        },
      ]}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    />
  );
};

const SubmitSection = ({ isCreateMode, isEditMode, handlePreview }: Props) => {
  if (!(isCreateMode || isEditMode)) return null;

  return (
    <div className="mt-4 flex justify-end">
      <Button type="button" variant="action" onClick={handlePreview}>
        Preview & Submit
      </Button>
    </div>
  );
};

// ==== Main Component ====
export default function InboundPlanningFormView(props: Props) {
  const {
    methods,
    doFields,
    removeDO,
    isCreateMode,
    isEditMode,
    isDetailMode,
    formTitle,
    onFinalSubmit,
    previewData,
    isConfirmOpen,
    setIsConfirmOpen,
  } = props;

  const fieldsConfig = buildFieldsConfig(isDetailMode);

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <PageBreadcrumb
        breadcrumbs={[
          { title: "Inbound List", path: "/inbound_planning" },
          {
            title: isCreateMode
              ? "Create Inbound Planning"
              : isEditMode
              ? formTitle
              : "Detail Inbound Planning",
            path: "/inbound_planning/process",
          },
        ]}
      />

      {/* Header Form */}
      <section className="bg-white p-4 rounded-xl shadow-sm mb-6">
        <DynamicForm
          fields={fieldsConfig}
          onSubmit={methods.handleSubmit(onFinalSubmit)}
          defaultValues={{}}
          control={methods.control}
          register={methods.register}
          setValue={methods.setValue}
          handleSubmit={methods.handleSubmit}
          isEditMode={!isDetailMode}
          watch={methods.watch}
        />
      </section>

      {/* Action Buttons */}
      <ActionButtons {...props} />

      {/* Delivery Orders / Tabs */}
      {(isCreateMode || isEditMode) && (
        <DOSection {...props} methods={methods} />
      )}
      {isDetailMode && (
        <DetailTabs
          doFields={doFields}
          removeDO={removeDO}
          inboundID={props.inboundID}
          methods={methods}
        />
      )}

      {/* Submit Button */}
      <SubmitSection {...props} />

      {/* Confirmation Modal */}
      {(isCreateMode || isEditMode) && previewData && (
        <ConfirmationModal
          isOpen={isConfirmOpen}
          onClose={() => setIsConfirmOpen(false)}
          onSubmit={methods.handleSubmit(onFinalSubmit)}
          formData={previewData}
        />
      )}
    </div>
  );
}
