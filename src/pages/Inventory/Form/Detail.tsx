import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import Button from "../../../components/ui/button/Button";
import DynamicForm, {
  FieldConfig,
} from "../../../components/wms-components/inbound-component/form/DynamicForm";
import { FaPlus, FaRedoAlt } from "react-icons/fa";
import { UseFormReturn } from "react-hook-form";
import { useState } from "react";
// ==== Main Component ====
import { useForm } from "react-hook-form";

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

const onFinalSubmit = () => {
  console.log("submit");
};

export default function InboundPlanningFormView() {
  const methods = useForm();
  const isDetailMode = false; // Set this according to your logic

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <PageBreadcrumb
        breadcrumbs={[
          { title: "Inventory List", path: "/inventory" },
          // {
          //   title: isCreateMode
          //     ? "Create Inbound Planning"
          //     : isEditMode
          //     ? formTitle
          //     : "Detail Inbound Planning",
          //   path: "/inbound_planning/process",
          // },
        ]}
      />

      {/* Header Form */}
      <section className="bg-white p-4 rounded-xl shadow-sm mb-6">
        <DynamicForm
          fields={buildFieldsConfig(isDetailMode)}
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
    </div>
  );
}
