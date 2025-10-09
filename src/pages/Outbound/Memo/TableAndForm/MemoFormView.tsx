import React, { useMemo, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { FormValues } from "./component/formTypes";
import { FaPlus, FaRedoAlt } from "react-icons/fa";
import PageBreadcrumb from "../../../../components/common/PageBreadCrumb";
// import Button from "../../../../components/ui/button/Button";
import DynamicForm, {
  FieldConfig,
} from "../../../../components/wms-components/inbound-component/form/DynamicForm";
// import HelperAssign from "./component/Tabs/HelperAssign";
// import ConfirmationModal from "./component/Modal/ConfirmationModal";
// import { ItemService } from "../../../../DynamicAPI/services/Service/MasterService";
import ItemTable from "./ItemTable";
// import TableComponent from "../../../../components/tables/MasterDataTable/TableComponent";
// import { Memo } from "../../../../DynamicAPI/types/MemoTypes";

type Props = {
  methods: UseFormReturn<FormValues>;
  isCreateMode: boolean;
  isDetailMode: boolean;
  formTitle: string;
  onFinalSubmit: (data: FormValues) => void;
  emptyFormValues: FormValues;
};

// MEMO Details
const buildFieldsConfig = (isDetailMode: boolean): FieldConfig[] =>
  [
    {
      name: "id",
      label: "Memo ID",
      type: "text" as const,
      disabled: true,
    },
    {
      name: "delivery_date",
      label: "Delivery Date",
      type: "date" as const,
      validation: { required: "Tanggal kedatangan wajib diisi" },
    },
    {
      name: "origin",
      label: "Origin",
      type: "text" as const,
      validation: { required: "Ekspedisi wajib diisi" }, // ✅
    },
    {
      name: "destination",
      label: "Destination",
      type: "text" as const,
      validation: { required: "Nama driver wajib diisi" },
    },
    {
      name: "ship_to",
      label: "Ship To",
      type: "text" as const,
      validation: { required: "No polisi wajib diisi" },
    },
    {
      name: "requestor",
      label: "Requestor",
      type: "text" as const,
      validation: { required: "Origin wajib diisi" },
    },
  ].map((f) => ({
    ...f,
    disabled: f.name === "memo_id" ? true : isDetailMode,
  }));

const MemoFormView = (props: Props) => {
  const { methods, isDetailMode, onFinalSubmit } = props;

  const fieldsConfig = buildFieldsConfig(isDetailMode);

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <PageBreadcrumb
        breadcrumbs={[
          { title: "MEMO List", path: "/memo" },
          {
            title: "Create MEMO",
            path: "/memo/create_memo",
          },
        ]}
      />

      {/* Header Form */}
      <section className="bg-white p-6 rounded-xl shadow-sm mb-6">
        <div className="text-lg font-semibold text-gray-700 mb-4">
          MEMO Details
        </div>
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

      <ItemTable />

      {/* Footer Buttons */}
      <div className="flex justify-end gap-2 mt-4">
        <button
          type="button"
          // onClick={onClose}
          className="border border-gray-300 text-gray-600 px-4 py-1 rounded hover:bg-gray-100 transition"
        >
          Back
        </button>
        <button
          type="submit"
          className="bg-orange-500 text-white px-4 py-1 rounded hover:bg-orange-600 transition"
        >
          Create MEMO
        </button>
      </div>
    </div>
  );
};

export default MemoFormView;
