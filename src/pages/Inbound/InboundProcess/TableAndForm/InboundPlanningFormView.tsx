import PageBreadcrumb from "../../../../components/common/PageBreadCrumb";
import Button from "../../../../components/ui/button/Button";
import DynamicForm, {
  FieldConfig,
} from "../../../../components/wms-components/inbound-component/form/DynamicForm";
import TabsSection from "../../../../components/wms-components/inbound-component/tabs/TabsSection";
import DeliveryOrderCard from "./component/Form/DeliveryOrderCard";
import HelperAssign from "./component/Tabs/HelperAssign";
import ConfirmationModal from "./component/Modal/InboundConfirmModal";
import { FaPlus, FaRedoAlt } from "react-icons/fa";
import { UseFormReturn } from "react-hook-form";
import { FormValues } from "./component/formTypes";
import { useEffect, useState, useRef } from "react";
import ScanHistory from "./component/Tabs/ScanHistory";
import { useStoreMasterSupplier } from "../../../../DynamicAPI/stores/Store/MasterStore";

type Props = {
  methods: UseFormReturn<FormValues>;
  doFields: { id: string }[];
  appendDO: () => void;
  removeDO: (index: number) => void;
  isCreateMode: boolean;
  isEditMode: boolean;
  isDetailMode: boolean;
  isAddToReceiveMode: boolean;
  formTitle: string;
  handlePreview: () => void;
  previewData: FormValues | null;
  isConfirmOpen: boolean;
  setIsConfirmOpen: (v: boolean) => void;
  onFinalSubmit: (data: FormValues) => void;
  reset: (values: FormValues) => void;
  emptyFormValues: FormValues;
  inboundID?: string;
  inboundNumber?: string;
  inboundType?: string;
};

// ==== Helpers ==== //
const buildFieldsConfig = (
  isDetailMode: boolean,
  supplierOptions: { value: string; label: string }[],
  inboundTypeOptions: { value: string; label: string }[],
): FieldConfig[] => {
  const baseFields: FieldConfig[] = [
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
      options: inboundTypeOptions,
      validation: { required: "Tipe inbound wajib diisi" },
    },
    // {
    //   name: "expedition",
    //   label: "Ekspedisi",
    //   type: "select" as const, // Ubah dari text ke select
    //   options: supplierOptions, // Masukkan data dari API di sini
    //   validation: { required: "Ekspedisi wajib diisi" },
    // },
    {
      name: "expedition",
      label: "Ekspedisi",
      type: "text" as const, // Ubah dari text ke select
      validation: { required: "Ekspedisi wajib diisi" },
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
      name: "driver_phone",
      label: "No Telp Driver",
      type: "tel" as const,
      validation: {
        required: "No telp driver wajib diisi",
        pattern: {
          value: /^\+?[1-9][0-9]{7,14}$/, // sesuai format E.164
          message:
            "Format nomor tidak valid. Gunakan format internasional, misalnya +6281234567890.",
        },
      },
    },
    {
      name: "arrival_date",
      label: "Tanggal Kedatangan",
      type: "date" as const,
      validation: { required: "Tanggal kedatangan wajib diisi" },
    },
  ];

  return baseFields.map((f) => ({
    ...f,
    disabled:
      f.name === "inbound_plan_no" ? true : isDetailMode || f.disabled || false,
  }));
};

// ==== Sub Components ====
const ActionButtons = ({
  isCreateMode,
  isEditMode,
  isAddToReceiveMode,
  appendDO,
  reset,
  emptyFormValues,
}: Props) => {
  if (!(isCreateMode || isEditMode || isAddToReceiveMode)) return null;

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
  isCreateMode,
  isDetailMode,
  isEditMode,
  isAddToReceiveMode,
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
          isCreateMode={isCreateMode}
          isDetailMode={isDetailMode}
          isEditMode={isEditMode}
          isAddToReceiveMode={isAddToReceiveMode}
          inbType={inboundType as "PO" | "SO" | "RETUR"}
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
                  isDetailMode={true}
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

const SubmitSection = ({
  isCreateMode,
  isEditMode,
  isAddToReceiveMode,
  handlePreview,
  methods,
}: Props) => {
  if (!(isCreateMode || isEditMode || isAddToReceiveMode)) return null;

  const values = methods.watch();
  const deliveryOrders = values.deliveryOrders || [];

  // --- VALIDASI UTAMA ---
  const hasNoDO = deliveryOrders.every((doItem: any) => !doItem.do_no?.trim());

  const hasMultiplePO = deliveryOrders.some(
    (doItem: any) => doItem.pos?.length > 1,
  );

  const hasDOWithoutPO = deliveryOrders.some(
    (doItem: any) => !doItem.pos || doItem.pos.length === 0,
  );

  const hasPOWithoutItem = deliveryOrders.some((doItem: any) =>
    doItem.pos?.some((po: any) => !po.items || po.items.length === 0),
  );

  const requiredFields: (keyof FormValues)[] = [
    "inbound_type",
    "expedition",
    "driver",
    "no_pol",
    "driver_phone",
  ];

  const hasEmptyMainFields = requiredFields.some((field) => {
    const val = values[field];
    return !val || (typeof val === "object" && !val.value);
  });

  // --- Disable button jika ada kondisi tidak valid ---
  const isDisabled =
    hasNoDO ||
    hasMultiplePO ||
    hasDOWithoutPO ||
    hasPOWithoutItem ||
    hasEmptyMainFields;

  // --- Pesan agar user tahu penyebab disable ---
  let validateMsg = "";

  if (hasEmptyMainFields) validateMsg = "Isi field utama terlebih dahulu.";
  else if (hasNoDO) validateMsg = "Minimal harus ada 1 nomor Surat Jalan.";
  else if (hasMultiplePO)
    validateMsg = "Setiap Surat Jalan hanya boleh memiliki 1 nomor PO.";
  else if (hasPOWithoutItem)
    validateMsg =
      "Setiap 1 SJ hanya boleh 1 PO dan PO tersebut harus memiliki minimal 1 SKU.";
  else if (hasDOWithoutPO)
    validateMsg = "Setiap Surat Jalan wajib memiliki 1 nomor PO.";
  else validateMsg = "";

  return (
    <div className="mt-4 flex justify-end">
      {validateMsg && (
        <p className="text-red-600 italic ml-4 self-center mt-2 mr-4">
          * {validateMsg}
        </p>
      )}
      <Button
        type="button"
        variant="action"
        onClick={handlePreview}
        disabled={isDisabled}
        className={`transition-opacity ${
          isDisabled ? "opacity-60 cursor-not-allowed" : ""
        }`}
      >
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
    isAddToReceiveMode,
    formTitle,
    onFinalSubmit,
    previewData,
    isConfirmOpen,
    setIsConfirmOpen,
    inboundNumber,
    inboundType,
  } = props;

  const { list: masterSupplierData, fetchUsingParam } =
    useStoreMasterSupplier();

  useEffect(() => {
    const attribute7 = "FREIGHT (FRG)";
    fetchUsingParam({
      ATTRIBUTE7: attribute7,
    });
  }, [fetchUsingParam]);

  const supplierOptions = masterSupplierData.map((item: any) => ({
    value: item.VENDOR_NAME, // atau item.VENDOR_ID jika database butuh ID
    label: item.VENDOR_NAME,
  }));

  const defaultInboundTypeOptions = [
    { value: "PO", label: "PO" },
    { value: "SO", label: "SO" },
  ];

  const [inboundTypeOptions, setInboundTypeOptions] = useState(
    defaultInboundTypeOptions,
  );

  // jika props.inboundType diberikan, eliminasi opsi lain dan pilih nilai itu di form
  const inboundTypeInitRef = useRef<string | null>(null);
  useEffect(() => {
    if (!inboundType) return;

    // jalankan hanya sekali saat inboundType berubah
    if (inboundTypeInitRef.current === inboundType) return;
    inboundTypeInitRef.current = inboundType;

    const opt = { value: inboundType, label: inboundType };
    // set options hanya berisi nilai inboundType (mengeliminasi opsi lain)
    setInboundTypeOptions([opt]);

    // set nilai form ke object option agar Select menampilkan labelnya
    try {
      const current = methods.getValues?.("inbound_type");
      const needSet =
        !current ||
        (typeof current === "string" && current !== inboundType) ||
        (typeof current === "object" && current?.value !== inboundType);

      if (needSet) {
        methods.setValue("inbound_type", opt, {
          shouldDirty: false,
          shouldTouch: false,
          shouldValidate: false,
        });
      }
    } catch {
      // ignore
    }
  }, [inboundType, methods]);

  const fieldsConfig = buildFieldsConfig(
    isDetailMode,
    supplierOptions,
    inboundTypeOptions,
  );

  // useEffect(() => {
  //   // Jalankan hanya jika dalam mode Edit atau Detail
  //   if (isEditMode || isDetailMode) {
  //     const currentExpedition = methods.getValues("expedition");

  //     // Jika nilainya masih string (misal: "KAS NEGARA")
  //     if (typeof currentExpedition === "string" && currentExpedition !== "") {
  //       // Cari objek yang sesuai di supplierOptions
  //       const foundOption = supplierOptions.find(
  //         (opt) => opt.value === currentExpedition
  //       );

  //       if (foundOption) {
  //         // Set ulang field expedition menjadi objek agar Select bisa menampilkan labelnya
  //         methods.setValue("expedition", foundOption);
  //       } else {
  //         // Jika tidak ada di master, buat objek temporary agar tetap muncul teksnya
  //         methods.setValue("expedition", {
  //           value: currentExpedition,
  //           label: currentExpedition
  //         });
  //       }
  //     }
  //   }
  // }, [masterSupplierData, isEditMode, isDetailMode, methods]);

  console.log("inboundType di View", inboundType);

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <PageBreadcrumb
        breadcrumbs={[
          { title: "Inbound List", path: "/inbound_planning" },
          {
            title: isAddToReceiveMode
              ? "Add to Receive Inbound"
              : isCreateMode
                ? "Create Inbound Planning"
                : isEditMode
                  ? formTitle
                  : "Detail Inbound Planning",
            path: "/inbound_planning/process",
          },
        ]}
      />

      {isAddToReceiveMode && (
        <h3 className="text-xl font-semibold text-slate-700 mb-4">
          Reference Inbound No ({inboundNumber})
        </h3>
      )}

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
      {(isCreateMode || isEditMode || isAddToReceiveMode) && (
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
      <SubmitSection {...props} methods={methods} />

      {/* Confirmation Modal */}
      {(isCreateMode || isEditMode || isAddToReceiveMode) && previewData && (
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
