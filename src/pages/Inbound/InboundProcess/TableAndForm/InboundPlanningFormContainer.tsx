import { useEffect, useState, useMemo, useRef } from "react";
import { useForm, useFieldArray, FormProvider } from "react-hook-form";
import { useLocation, useNavigate } from "react-router";
import { FormValues } from "./component/formTypes";
import { useStoreInboundGoodStock } from "../../../../DynamicAPI/stores/Store/MasterStore";
import { CreateInboundPlanning } from "../../../../DynamicAPI/types/InboundGoodStock";
import { toLocalISOString } from "../../../../helper/FormatDate";
import { showErrorToast } from "../../../../components/toast";
import InboundPlanningFormView from "./InboundPlanningFormView";

// --- Default empty values
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
  flag_validated: undefined,
  deliveryOrders: [
    { do_no: "", date: "", attachment: "", pos: [{ po_no: "", items: [] }] },
  ],
  id: "",
};

// --- Mapper API → Form
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
    id: undefined,
  };
}

// --- Mapper Form → API payload
function mapToPayload(data: FormValues): CreateInboundPlanning {
  console.log("mapToPayload data", data);

  const inboundType =
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
    inbound_type: inboundType,
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
        flag_validated: doItem.flag_validated ?? false, // <-- ensure flag_validated is included
        inbound_items: po.items.map((item) => ({
          item_id: item.item_id ?? "",
          quantity: item.qty ? Number(item.qty) : 0,
          uom: item.uom ?? "",
        })),
      }))
    ),
  };
}

export default function InboundPlanningFormContainer() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: dataInbound, mode, title: formTitle } = location.state || {};

  const isCreateMode = mode === "create";
  const isEditMode = mode === "edit";
  const isDetailMode = mode === "detail";

  const { fetchById, detail, createData, updateData } =
    useStoreInboundGoodStock();

  const methods = useForm<FormValues>({ defaultValues: emptyFormValues });
  const { reset, control, getValues, trigger, handleSubmit } = methods;

  const {
    fields: doFields,
    append,
    remove,
  } = useFieldArray({
    control,
    name: "deliveryOrders",
  });

  // Fetch detail untuk edit
  useEffect(() => {
    if (isEditMode && dataInbound?.id) {
      fetchById(dataInbound.id);
    }
  }, [isEditMode, dataInbound?.id, fetchById]);

  // Reset sesuai mode
  useEffect(() => {
    if (isEditMode && detail) reset(mapDetailToFormValues(detail));
    else if (isDetailMode && dataInbound)
      reset(mapDetailToFormValues(dataInbound));
    else if (isCreateMode) reset(emptyFormValues);
  }, [isEditMode, isDetailMode, isCreateMode, detail, dataInbound, reset]);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [previewData, setPreviewData] = useState<FormValues | null>(null);

  const handlePreview = async () => {
    const isValid = await trigger(); // validasi field basic
    if (!isValid) {
      showErrorToast("Lengkapi semua data inbound planning terlebih dahulu.");
      return;
    }

    const values = getValues();

    // --- Validasi tambahan untuk DO, PO, Item ---
    if (!values.deliveryOrders || values.deliveryOrders.length === 0) {
      showErrorToast("Minimal 1 Delivery Order harus diisi.");
      return;
    }

    for (const [i, doItem] of values.deliveryOrders.entries()) {
      if (!doItem.do_no || !doItem.date) {
        showErrorToast(`Delivery Order ke-${i + 1} wajib punya DO No & Date.`);
        return;
      }

      if (!doItem.pos || doItem.pos.length === 0) {
        showErrorToast(`Delivery Order ${doItem.do_no} belum punya PO.`);
        return;
      }

      for (const [j, poItem] of doItem.pos.entries()) {
        if (!poItem.po_no) {
          showErrorToast(
            `DO ${doItem.do_no} → PO ke-${j + 1} wajib punya PO No.`
          );
          return;
        }

        if (!poItem.items || poItem.items.length === 0) {
          showErrorToast(`PO ${poItem.po_no} belum punya Item.`);
          return;
        }
      }
    }

    // --- Kalau semua valid ---
    console.log("inbound values", values);
    setPreviewData(values);
    setIsConfirmOpen(true);
  };

  const onFinalSubmit = async (data: FormValues) => {
    const payload = mapToPayload(data);    
    const id = dataInbound?.id;

    console.log("Final submit payload:", payload, " | id:", id);
    
    // if (isCreateMode) {
    //   const res = await createData(payload);
    //   if (res?.success) {
    //     reset(emptyFormValues);
    //     setIsConfirmOpen(false);
    //     navigate("/inbound_planning");
    //   }
    // } else if (isEditMode && id) {
    //   const res = await updateData(id, payload);
    //   if (res?.success) {
    //     reset(emptyFormValues);
    //     setIsConfirmOpen(false);
    //     navigate("/inbound_planning");
    //   }
    // }
  };

  return (
    <FormProvider {...methods}>
      <InboundPlanningFormView
        methods={methods}
        doFields={doFields}
        appendDO={() =>
          append({ do_no: "", date: "", attachment: "", pos: [] })
        }
        removeDO={remove}
        isCreateMode={isCreateMode}
        isEditMode={isEditMode}
        isDetailMode={isDetailMode}
        formTitle={formTitle}
        onFinalSubmit={onFinalSubmit}
        handlePreview={handlePreview}
        previewData={previewData}
        isConfirmOpen={isConfirmOpen}
        setIsConfirmOpen={setIsConfirmOpen}
        reset={reset}
        emptyFormValues={emptyFormValues}
        inboundID={dataInbound.id}
      />
    </FormProvider>
  );
}
