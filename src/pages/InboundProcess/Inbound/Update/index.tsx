import { FormProvider, useForm, useFieldArray } from "react-hook-form";
import { useEffect, useState, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router";
import { FaPlus, FaRedoAlt } from "react-icons/fa";

import { FormValues } from "./component/formTypes";
import DeliveryOrderCard from "./component/DeliveryOrderCard";
import ConfirmationModal from "./component/ConfirmationModal";
import { toLocalISOString } from "../../../../helper/FormatDate";
import DynamicForm, {
  FieldConfig,
} from "../../../../components/wms-components/inbound-component/form/DynamicForm";
import { useStoreInboundGoodStock } from "../../../../DynamicAPI/stores/Store/MasterStore";
import { CreateInboundPlanning } from "../../../../DynamicAPI/types/InboundGoodStock";
import { showErrorToast } from "../../../../components/toast";
import PageBreadcrumb from "../../../../components/common/PageBreadCrumb";
import Button from "../../../../components/ui/button/Button";
import TabsSection from "../../../../components/wms-components/inbound-component/tabs/TabsSection";

// --- Default empty form values
const emptyFormValues: FormValues = {
  inbound_plan_no: "AUTO GENERATED",
  expedition: "",
  driver: "",
  driver_phone: "",
  no_pol: "",
  origin: "",
  destination: "",
  inbound_type: "",
  arrival_date: "",
  deliveryOrders: [
    {
      do_no: "",
      date: "",
      attachment: null,
      pos: [{ po_no: "", items: [] }],
    },
  ],
};

// --- Header field config
const headerFields: FieldConfig[] = [
  {
    name: "inbound_plan_no",
    label: "Inbound Plan No",
    type: "text",
    disabled: true,
  },
  {
    name: "inbound_type",
    label: "Tipe Inbound",
    type: "select",
    options: [
      { value: "PRINCIPAL", label: "PRINCIPAL" },
      { value: "RETUR", label: "RETUR" },
    ],
    validation: { required: true },
  },
  {
    name: "expedition",
    label: "Ekspedisi",
    type: "text",
    validation: { required: true },
  },
  {
    name: "driver",
    label: "Driver",
    type: "text",
    validation: { required: true },
  },
  {
    name: "no_pol",
    label: "No Polisi",
    type: "text",
    validation: { required: true },
  },
  {
    name: "origin",
    label: "Origin",
    type: "text",
    validation: { required: true },
  },
  {
    name: "destination",
    label: "Tujuan",
    type: "text",
    validation: { required: true },
  },
  {
    name: "driver_phone",
    label: "No Telp Driver",
    type: "text",
    validation: { required: true },
  },
  {
    name: "arrival_date",
    label: "Tanggal Kedatangan",
    type: "date",
    validation: { required: true },
  },
];

// --- Helper mapper: detail API → form values
function mapDetailToFormValues(detail: any): FormValues {
  return {
    inbound_plan_no: detail.inbound_number ?? "AUTO GENERATED",
    inbound_type: detail.inbound_type
      ? { value: detail.inbound_type, label: detail.inbound_type }
      : "",
    expedition: detail.expedition ?? "",
    driver: detail.driver_name ?? "",
    no_pol: detail.license_plate ?? "",
    origin: detail.origin ?? "",
    destination: detail.destination ?? "",
    driver_phone: detail.driver_phone ?? "",
    arrival_date: detail.arrival_date ?? "",
    deliveryOrders: detail.inbound_dos.reduce((acc: any[], doItem: any) => {
      let existingDO = acc.find((d) => d.do_no === doItem.inbound_do_number);
      if (!existingDO) {
        existingDO = {
          do_no: doItem.inbound_do_number ?? "",
          date: doItem.inbound_do_date ?? "",
          attachment: doItem.attachment ?? null,
          pos: [],
        };
        acc.push(existingDO);
      }
      existingDO.pos.push({
        po_no: doItem.inbound_po_number ?? "",
        po_date: doItem.inbound_po_date ?? "",
        items: (doItem.inbound_items || []).map((item: any) => ({
          item_id: item.item_id ?? "",
          sku: item.sku ?? "",
          description: item.item_name ?? "",
          qty: item.quantity ?? 0,
          uom: item.uom ?? "",
          classification: item.classification ?? "",
        })),
      });
      return acc;
    }, []),
  };
}

// --- Helper mapper: form values → API payload
function mapToPayload(data: FormValues): CreateInboundPlanning {
  const normalizedInboundType =
    typeof data.inbound_type === "string"
      ? data.inbound_type
      : (data.inbound_type as any)?.value || "";

  return {
    expedition: data.expedition ?? "",
    origin: data.origin ?? "",
    license_plate: data.no_pol ?? "",
    driver_name: data.driver ?? "",
    driver_phone: data.driver_phone ?? "",
    status: "CREATED",
    inbound_type: normalizedInboundType ?? "",
    arrival_date: data.arrival_date
      ? new Date(data.arrival_date).toISOString()
      : "",
    inbound_dos: data.deliveryOrders.flatMap((doItem) =>
      doItem.pos.map((po) => ({
        inbound_do_number: doItem.do_no ?? "",
        inbound_do_date: doItem.date
          ? toLocalISOString(new Date(doItem.date))
          : "",
        attachment: doItem.attachment ? String(doItem.attachment) : "",
        inbound_po_number: po.po_no ?? "",
        inbound_po_date: po.po_date
          ? toLocalISOString(new Date(po.po_date))
          : "",
        flag_validated: false,
        inbound_items: po.items.map((item) => ({
          item_id: item.item_id ?? "",
          quantity: item.qty ? Number(item.qty) : 0,
          uom: item.uom ?? "",
        })),
      }))
    ),
  };
}

export default function InboundPlanningForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data, mode, title: formTitle } = location.state || {};
  const listRef = useRef<HTMLDivElement | null>(null);

  const isCreateMode = mode === "create";
  const isEditMode = mode === "edit";
  const isDetailMode = mode === "detail";

  const { fetchById, detail, createData } = useStoreInboundGoodStock();

  // --- Setup form
  const methods = useForm<FormValues>({ defaultValues: emptyFormValues });
  const { handleSubmit, reset, control, getValues, trigger } = methods;
  const {
    fields: doFields,
    append: appendDO,
    remove: removeDO,
  } = useFieldArray({
    control,
    name: "deliveryOrders",
  });

  // --- Fetch detail if edit
  useEffect(() => {
    if (isEditMode && data?.id) {
      fetchById(data.id);
    }
  }, [isEditMode, data?.id, fetchById]);

  // --- Reset form sesuai mode
  useEffect(() => {
    if (isEditMode && detail) {
      reset(mapDetailToFormValues(detail));
    } else if (isDetailMode && data) {
      reset(mapDetailToFormValues(data));
    } else if (isCreateMode) {
      reset(emptyFormValues);
    }
  }, [isEditMode, isDetailMode, isCreateMode, detail, data, reset]);

  useEffect(() => {
    if (listRef.current) {
      const lastChild = listRef.current.lastElementChild;
      if (lastChild) {
        lastChild.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [doFields.length]);

  // --- Preview & modal state
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [previewData, setPreviewData] = useState<FormValues | null>(null);

  const handlePreview = async () => {
    const values = getValues();

    // Validasi field utama
    const isValid = await trigger([
      "inbound_type",
      "expedition",
      "driver",
      "no_pol",
      "origin",
      "destination",
      "driver_phone",
      "arrival_date",
    ]);
    if (!isValid) {
      showErrorToast(
        "Lengkapi data inbound planning terlebih dahulu sebelum preview."
      );
      return;
    }

    // Validasi deliveryOrders
    for (let i = 0; i < values.deliveryOrders.length; i++) {
      const doItem = values.deliveryOrders[i];
      if (!doItem.do_no || !doItem.date) {
        showErrorToast(
          `Nomor Surat Jalan ke-${i + 1} dan Tanggal wajib diisi.`
        );
        return;
      }
      if (!doItem.pos || doItem.pos.length === 0) {
        showErrorToast(`Surat Jalan ke-${i + 1}: Minimal 1 PO harus diisi.`);
        return;
      }
      for (let j = 0; j < doItem.pos.length; j++) {
        const po = doItem.pos[j];
        if (!po.po_no) {
          showErrorToast(
            `Surat Jalan ke-${i + 1}, PO ke-${j + 1}: PO No wajib diisi.`
          );
          return;
        }
        if (!po.items || po.items.length === 0) {
          showErrorToast(
            `Surat Jalan ke-${i + 1}, PO ke-${
              j + 1
            }: Minimal 1 item harus diisi.`
          );
          return;
        }
      }
    }

    setPreviewData(values);
    setIsConfirmOpen(true);
  };

  const onSubmit = async (data: FormValues) => {
    const payload = mapToPayload(data);
    const res = await createData(payload);
    if (res?.success) {
      reset(emptyFormValues);
      setIsConfirmOpen(false);
      navigate("/inbound_planning");
    }
  };

  // --- Dynamic field config (disable sesuai mode)
  const fieldsConfig = useMemo(
    () =>
      headerFields.map((f) => ({
        ...f,
        disabled: f.name === "inbound_plan_no" ? true : isDetailMode, // hanya disable di detail
      })),
    [isDetailMode]
  );

  const tabs = [
    { key: "suratjalan", label: "Surat Jalan" },
    { key: "scanhistory", label: "Scan History" },
    { key: "attachment", label: "Attachment" },
    { key: "helperassign", label: "Helper Assign" },
  ];

  const [activeTab, setActiveTab] = useState(0);

  return (
    <>
      <PageBreadcrumb
        breadcrumbs={[
          { title: "Inbound List", path: "/inbound_planning" },
          {
            title: isCreateMode
              ? "Create Inbound Planning"
              : isEditMode
              ? formTitle
              : "Detail Inbound Planning",
            path: "/inbound_planning/update",
          },
        ]}
      />

      <FormProvider {...methods}>
        <div className="p-6 bg-slate-50 min-h-screen">
          <h1 className="text-2xl font-semibold mb-4">
            {isCreateMode
              ? "Create Inbound Planning"
              : isEditMode
              ? formTitle
              : "Detail Inbound Planning"}
          </h1>

          {/* Header Form */}
          <section className="bg-white p-4 rounded-xl shadow-sm mb-6">
            <DynamicForm
              fields={fieldsConfig}
              onSubmit={methods.handleSubmit(onSubmit)}
              defaultValues={{}}
              control={methods.control}
              register={methods.register}
              setValue={methods.setValue}
              handleSubmit={methods.handleSubmit}
              isEditMode={!isDetailMode}
              watch={methods.watch}
            />
          </section>

          {/* Action buttons */}
          {(isCreateMode || isEditMode) && (
            <div className="mt-4 flex justify-end gap-1">
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() =>
                  appendDO({ do_no: "", date: "", attachment: null, pos: [] })
                }
              >
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
          )}

          {/* Delivery Orders */}
          {(isCreateMode || isEditMode) && (
            <section className="space-y-4 mt-4" ref={listRef}>
              {doFields.map((doField, doIndex) => (
                <DeliveryOrderCard
                  key={doField.id}
                  doIndex={doIndex}
                  removeDO={() => removeDO(doIndex)}
                  totalDO={doFields.length}
                  isEditMode={!isDetailMode}
                />
              ))}
            </section>
          )}

          {/* Tab Section */}
          {isDetailMode && (
            <section className="mt-6">
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
                            isEditMode={!isDetailMode}
                          />
                        ))}
                      </>
                    ),
                  },
                  {
                    label: "Scan History",
                    content: <>Scan History</>,
                  },
                ]}
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />
            </section>
          )}

          {/* Submit */}
          {(isCreateMode || isEditMode) && (
            <div className="mt-4 flex justify-end">
              <Button type="button" variant="secondary" onClick={handlePreview}>
                Preview & Submit
              </Button>
            </div>
          )}
        </div>

        {(isCreateMode || isEditMode) && previewData && (
          <ConfirmationModal
            isOpen={isConfirmOpen}
            onClose={() => setIsConfirmOpen(false)}
            onSubmit={handleSubmit(onSubmit)}
            formData={previewData}
          />
        )}
      </FormProvider>
    </>
  );
}
