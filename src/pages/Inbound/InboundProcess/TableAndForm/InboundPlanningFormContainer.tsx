import { useEffect, useState } from "react";
import { useForm, useFieldArray, FormProvider } from "react-hook-form";
import { useLocation, useNavigate } from "react-router";
import { FormValues } from "./component/formTypes";
import { useStoreInboundGoodStock } from "../../../../DynamicAPI/stores/Store/MasterStore";
import { showErrorToast } from "../../../../components/toast";
import InboundPlanningFormView from "./InboundPlanningFormView";
import { mapDetailToFormValues } from "./component/Helper/mapperData";
import { mapToPayload } from "./component/Helper/mapperFinalPayload";

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
      showErrorToast("Minimal 1 Nomor SJ harus diisi.");
      return;
    }

    for (const [i, doItem] of values.deliveryOrders.entries()) {
      if (!doItem.do_no || !doItem.date) {
        showErrorToast(`Nomor SJ ke-${i + 1} wajib punya DO No & Date.`);
        return;
      }

      if (!doItem.pos || doItem.pos.length === 0) {
        showErrorToast(`Nomor SJ ${doItem.do_no} belum punya PO.`);
        return;
      }

      // ✅ Validasi baru: dalam 1 DO hanya boleh 1 PO
      if (doItem.pos.length > 1) {
        showErrorToast(`Nomor SJ ${doItem.do_no} hanya boleh memiliki 1 PO.`);
        return;
      }

      for (const [j, poItem] of doItem.pos.entries()) {
        // validasi baru: minimal salah satu dari po_no atau so_no harus terisi
        if (!poItem.po_no && !poItem.so_no) {
          showErrorToast(
            `Nomor SJ ${doItem.do_no} → PO ke-${
              j + 1
            } wajib punya PO No atau SO No.`
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
