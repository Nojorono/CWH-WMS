import { useEffect, useState, useMemo, useRef } from "react";
import { useForm, useFieldArray, FormProvider } from "react-hook-form";
import { useLocation, useNavigate } from "react-router";
import { FormValues } from "./component/formTypes";
// import { toLocalISOString } from "../../../../helper/FormatDate";
// import { showErrorToast } from "../../../../components/toast";
import MemoFormView from "./MemoFormView";

// --- Default empty values
const emptyFormValues: FormValues = {
  id: "AUTO GENERATED",
  delivery_date: "",
  origin: "",
  destination: "",
  ship_to: "",
  requestor: "",
  outbound_memo_items: [
    { item_id: "", item_name: "", quantity_plan: "", uom: "" },
  ],
};

// --- Mapper API → Form
function mapDetailToFormValues(detail: any): FormValues {
  return {
    id: detail.id ?? "AUTO GENERATED",
    delivery_date: detail.delivery_date ?? "",
    origin: detail.origin ?? "",
    destination: detail.destination ?? "",
    ship_to: detail.ship_to ?? "",
    requestor: detail.requestor ?? "",
    outbound_memo_items: (detail.outbound_memo_list || []).map((item: any) => ({
      item_id: item.item_id ?? "",
      item_name: item.item_name ?? "",
      quantity_plan: item.quantity_plan ?? "",
      uom: item.uom ?? "",
    })),
  };
}

// --- Mapper Form → API payload
function mapToPayload(data: FormValues) {
  return {
    id: data.id === "AUTO GENERATED" ? undefined : data.id,
    delivery_date: data.delivery_date
      ? new Date(data.delivery_date).toISOString()
      : "",
    origin: data.origin ?? "",
    destination: data.destination ?? "",
    ship_to: data.ship_to ?? "",
    requestor: data.requestor ?? "",
    outbound_memo_list: (data.outbound_memo_items || []).map((item) => ({
      item_id: item.item_id ?? "",
      item_name: item.item_name ?? "",
      quantity_plan:
        typeof item.quantity_plan === "string"
          ? Number(item.quantity_plan) || 0
          : item.quantity_plan ?? 0,
      uom: item.uom ?? "",
    })),
  };
}

const MemoFormContainer = () => {
  const location = useLocation();
  const {
    data,
    memoData,
    itemData,
    classificationData,
    uomData,
    mode,
    title: formTitle,
  } = location.state || {};

  const methods = useForm<FormValues>({ defaultValues: emptyFormValues });
  const { reset, control, getValues, trigger, handleSubmit } = methods;

  const isCreateMode = mode === "create";
  const isDetailMode = mode === "detail";

  // Reset sesuai mode
  useEffect(() => {
    if (isDetailMode && data) reset(mapDetailToFormValues(data));
    else if (isCreateMode) reset(emptyFormValues);
  }, [isDetailMode, isCreateMode, memoData, reset]);

  const onFinalSubmit = async (data: FormValues) => {
    const payload = mapToPayload(data);
    const id = memoData?.id;

    console.log("Final submit payload:", payload, " | id:", id);
    alert(
      `Final submit payload (lihat di console): ${JSON.stringify(payload)}`
    );
  };

  return (
    <FormProvider {...methods}>
      <MemoFormView
        methods={methods}
        isCreateMode={isCreateMode}
        isDetailMode={isDetailMode}
        formTitle={formTitle}
        onFinalSubmit={onFinalSubmit}
        reset={reset}
        emptyFormValues={emptyFormValues}
        memoID={memoData?.id ?? null}
        detail={data}
        itemData={itemData}
        classificationData={classificationData}
        uomData={uomData}
      />
    </FormProvider>
  );
};

export default MemoFormContainer;
