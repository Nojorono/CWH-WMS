import { useEffect, useState, useMemo, useRef } from "react";
import { useForm, useFieldArray, FormProvider } from "react-hook-form";
import { useLocation, useNavigate } from "react-router";
import { FormValues } from "./component/formTypes";
// import { CreateMemo } from "../../../../DynamicAPI/types/MemoTypes";
// import { toLocalISOString } from "../../../../helper/FormatDate";
// import { showErrorToast } from "../../../../components/toast";
import MemoFormView from "./MemoFormView";
// import { useStoreMemo } from "../../../../DynamicAPI/stores/Store/MasterStore";

// --- Default empty values
const emptyFormValues: FormValues = {
  memo_id: "AUTO GENERATED",
  delivery_date: "",
  origin: "",
  destination: "",
  ship_to: "",
  requestor: "",
};

const MemoFormContainer = () => {
  const location = useLocation();
  const { data: dataMemo, mode, title: formTitle } = location.state || {};
  // const { list: memoData, fetchAll, fetchUsingParam } = useStoreMemo();

  const methods = useForm<FormValues>({ defaultValues: emptyFormValues });
  const isCreateMode = mode === "create";
  const isDetailMode = mode === "detail";

  const onFinalSubmit = async (data: FormValues) => {
    console.log("submitting...");
  };

  return (
    <FormProvider {...methods}>
      <MemoFormView
        methods={methods}
        // doFields={doFields}
        // appendDO={() =>
        //   append({ do_no: "", date: "", attachment: "", pos: [] })
        // }
        // removeDO={remove}
        isCreateMode={isCreateMode}
        isDetailMode={isDetailMode}
        formTitle={formTitle}
        onFinalSubmit={onFinalSubmit}
        // handlePreview={handlePreview}
        // previewData={previewData}
        // isConfirmOpen={isConfirmOpen}
        // setIsConfirmOpen={setIsConfirmOpen}
        // reset={reset}
        emptyFormValues={emptyFormValues}
        // memoID={dataMemo.id}
        // data={memoData}
      />
    </FormProvider>
  );
};

export default MemoFormContainer;
