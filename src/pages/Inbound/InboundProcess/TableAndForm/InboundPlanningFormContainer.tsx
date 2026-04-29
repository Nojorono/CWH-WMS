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
  origin: "CWH",
  inbound_type: "",
  arrival_date: "",
  flag_validated: undefined,
  deliveryOrders: [
    {
      do_no: "",
      date: "",
      attachment: "",
      pos: [
        {
          po_no: "",
          so_no: "",
          vendor_name: "",
          principal: "",
          items: [],
        },
      ],
    },
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
  const isAddToReceiveMode = mode === "add";

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

  // // Reset sesuai mode
  useEffect(() => {
    if (isEditMode && detail) {
      reset(mapDetailToFormValues(detail));
    } else if (isDetailMode && dataInbound) {
      reset(mapDetailToFormValues(dataInbound));
    } else if (isCreateMode) {
      reset(emptyFormValues);
    } else if (isAddToReceiveMode && dataInbound) {
      const inbType = dataInbound.inboundType || "";
      // ✅ Format sebagai object agar cocok dengan select field
      const inboundTypeValue = inbType
        ? { value: inbType, label: inbType }
        : "";

      reset({
        ...emptyFormValues,
        inbound_plan_no: dataInbound.inbound_number || "AUTO GENERATED",
        inbound_type: inboundTypeValue as any,
        deliveryOrders: [
          {
            do_no: dataInbound.do_no || "",
            date: "",
            attachment: "",
            pos: [
              {
                po_no: dataInbound.activePOno || "",
                so_no: dataInbound.activeSOno || "",
                vendor_name: "",
                principal: "",
                items: [],
              },
            ],
          },
        ],
      });
    }
  }, [
    isEditMode,
    isDetailMode,
    isCreateMode,
    isAddToReceiveMode,
    detail,
    dataInbound,
    reset,
  ]);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [previewData, setPreviewData] = useState<FormValues | null>(null);

  const handlePreview = async () => {
    // Jalankan validasi bawaan RHF dulu
    const isValid = await trigger();

    if (!isValid) {
      const errors = methods.formState.errors;
      console.warn("Field Error:", Object.keys(errors));
      showErrorToast("Lengkapi semua data inbound planning terlebih dahulu.");
      return;
    }

    const values = getValues();
    const deliveryOrders = values.deliveryOrders || [];

    // =========================
    // 1) VALIDASI: minimal 1 SJ
    // =========================
    if (deliveryOrders.length === 0) {
      showErrorToast("Minimal 1 Nomor SJ harus diisi.");
      return;
    }

    // ======================================================
    // 2) VALIDASI DUPLIKASI SJ/DO DALAM 1 INBOUND PLAN (NEW)
    // ======================================================
    // Normalisasi: trim + uppercase agar "sj001" dan " SJ001 " dianggap sama
    const doNoMap = new Map<string, number[]>();

    deliveryOrders.forEach((doItem, index) => {
      const key = (doItem?.do_no || "").trim().toUpperCase();
      if (!key) return;
      if (!doNoMap.has(key)) doNoMap.set(key, []);
      doNoMap.get(key)!.push(index);
    });

    const duplicateGroups = [...doNoMap.entries()].filter(
      ([, indexes]) => indexes.length > 1,
    );

    if (duplicateGroups.length > 0) {
      const dupList = duplicateGroups.map(([no]) => no).join(", ");      
      showErrorToast(
        `Nomor SJ/DO duplikat ditemukan: ${dupList}. Setiap SJ harus unik dalam 1 Inbound Plan.`,
      );
      return;
    }

    // ============================================
    // 3) VALIDASI existing DO -> PO -> Item (tetap)
    // ============================================
    for (const [i, doItem] of deliveryOrders.entries()) {
      const doNo = (doItem.do_no || "").trim();

      if (!doNo || !doItem.date) {
        showErrorToast(`Nomor SJ ke-${i + 1} wajib punya DO No & Date.`);
        return;
      }

      if (!doItem.pos || doItem.pos.length === 0) {
        showErrorToast(`Nomor SJ ${doNo} belum punya PO.`);
        return;
      }

      // dalam 1 DO hanya boleh 1 PO
      if (doItem.pos.length > 1) {
        showErrorToast(`Nomor SJ ${doNo} hanya boleh memiliki 1 PO.`);
        return;
      }

      for (const [j, poItem] of doItem.pos.entries()) {
        // minimal salah satu po_no / so_no terisi
        if (!poItem.po_no && !poItem.so_no) {
          showErrorToast(
            `Nomor SJ ${doNo} → PO ke-${j + 1} wajib punya PO No atau SO No.`,
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

    // ============================================
    // 4) Kalau semua valid -> lanjut preview
    // ============================================
    setPreviewData(values);
    setIsConfirmOpen(true);
  };

  // SUBMIT CREATE OR UPDATE INBOUND PLANING
  const onFinalSubmit = async (data: FormValues) => {
    let payload = mapToPayload(data);

    const expeditionField = payload.expedition as any;

    if (payload.inbound_dos) {
      payload.inbound_dos = payload.inbound_dos.map((doItem: any) => {
        const { po_type, ...rest } = doItem;
        return rest;
      });
    }

    if (
      expeditionField &&
      typeof expeditionField === "object" &&
      "value" in expeditionField
    ) {
      payload.expedition = expeditionField.value;
    }

    const typeField = payload.inbound_type as any;
    if (typeField && typeof typeField === "object" && "value" in typeField) {
      payload.inbound_type = typeField.value;
    }

    if (payload.inbound_dos && Array.isArray(payload.inbound_dos)) {
      payload.inbound_dos = payload.inbound_dos.map((doItem: any) => {
        const cleanedDo = { ...doItem };
        if (
          !cleanedDo.inbound_po_date ||
          cleanedDo.inbound_po_date.trim() === ""
        ) {
          delete cleanedDo.inbound_po_date;
        }

        return cleanedDo;
      });
    }

    const id = dataInbound?.id;
    let apiAction = null;

    if (isCreateMode) {
      apiAction = () => createData(payload);
    } else if (isEditMode && id) {
      apiAction = () => updateData(id, payload);
    } else if (isAddToReceiveMode && id) {
      const addToReceivePayload = {
        ...payload,
        inbound_id_reference: id,
      };
      apiAction = () => createData(addToReceivePayload);
    }

    if (apiAction) {
      const res = await apiAction();

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
          append({
            do_no: "",
            date: "",
            po_type: "PO_GROUP",
            attachment: "",
            pos: [
              {
                po_no: "",
                so_no: "",
                vendor_name: "",
                principal: "",
                items: [],
              },
            ],
          })
        }
        removeDO={remove}
        isCreateMode={isCreateMode}
        isEditMode={isEditMode}
        isDetailMode={isDetailMode}
        isAddToReceiveMode={isAddToReceiveMode}
        formTitle={formTitle}
        onFinalSubmit={onFinalSubmit}
        handlePreview={handlePreview}
        previewData={previewData}
        isConfirmOpen={isConfirmOpen}
        setIsConfirmOpen={setIsConfirmOpen}
        reset={reset}
        emptyFormValues={emptyFormValues}
        inboundID={dataInbound.id}
        inboundNumber={dataInbound.inbound_number}
        // inboundType={dataInbound.inbound_type}
        inboundType={
          isAddToReceiveMode
            ? dataInbound?.inboundType
            : dataInbound?.inbound_type
        }
      />
    </FormProvider>
  );
}
