import { useEffect, useState } from "react";
import { useForm, useFieldArray, FormProvider } from "react-hook-form";
import { useLocation, useNavigate } from "react-router";
import { FormValues } from "./component/formTypes";
import { useStoreInboundGoodStock } from "../../../../DynamicAPI/stores/Store/MasterStore";
import { CreateInboundPlanning } from "../../../../DynamicAPI/types/InboundGoodStock";
import { formatDateIndo } from "../../../../helper/FormatDate";
import { showErrorToast } from "../../../../components/toast";
import InboundPlanningFormView from "./InboundPlanningFormView";
import { mapDetailToFormValues } from "./component/Helper/mapperData";

// --- Default empty values
const emptyFormValues: FormValues = {
  inbound_plan_no: "AUTO GENERATED",
  expedition: "",
  driver: "",
  driver_phone: "",
  no_pol: "",
  origin: "",
  inbound_type: "",
  arrival_date: "",
  flag_validated: undefined,
  deliveryOrders: [
    { do_no: "", date: "", attachment: "", pos: [{ po_no: "", items: [] }] },
  ],
  id: "",
};

// --- Mapper Form → API payload
function mapToPayload(data: FormValues): CreateInboundPlanning {
  const inboundType =
    typeof data.inbound_type === "string"
      ? data.inbound_type
      : (data.inbound_type as any)?.value || "";

  return {
    expedition: data.expedition ?? "",
    origin: data.origin?.toUpperCase() ?? "",
    license_plate: data.no_pol?.toUpperCase().replace(/\s+/g, "").trim() ?? "",
    driver_name: data.driver?.toUpperCase() ?? "",
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
          ? formatDateIndo(new Date(doItem.date))
          : "",
        attachment: doItem.attachment ? String(doItem.attachment) : "",
        inbound_po_number: po.po_no ?? "",
        inbound_po_date: po.po_date ? formatDateIndo(new Date(po.po_date)) : "",
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
        // validasi baru: minimal salah satu dari po_no atau so_no harus terisi
        if (!poItem.po_no && !poItem.so_no) {
          showErrorToast(
            `DO ${doItem.do_no} → PO ke-${j + 1} wajib punya PO No atau SO No.`
          );
          return;
        }

        if (!poItem.items || poItem.items.length === 0) {
          const poLabel = poItem.po_no || poItem.so_no || `ke-${j + 1}`;
          showErrorToast(`PO ${poLabel} belum punya Item.`);
          return;
        }
      }
    }

    // --- Kalau semua valid ---
    setPreviewData(values);
    setIsConfirmOpen(true);
  };

  // SUBMIT CREATE OR UPDATE
  const onFinalSubmit = async (data: FormValues) => {
    const payload = mapToPayload(data);

    const id = dataInbound?.id;
    if (isCreateMode) {
      const res = await createData(payload);
      if (res?.success) {
        reset(emptyFormValues);
        setIsConfirmOpen(false);
        navigate("/inbound_planning");
      }
    } else if (isEditMode && id) {
      const res = await updateData(id, payload);
      if (res?.success) {
        reset(emptyFormValues);
        setIsConfirmOpen(false);
        navigate("/inbound_planning");
      }
    }
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
