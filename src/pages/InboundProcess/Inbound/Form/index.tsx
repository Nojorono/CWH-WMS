import { FormProvider, useForm, useFieldArray } from "react-hook-form";
import { useState } from "react";
import { FormValues } from "./formTypes";
import DeliveryOrderCard from "./DeliveryOrderCard";
import Button from "../../../../components/ui/button/Button";
import { FaPlus, FaRedoAlt } from "react-icons/fa";
import ConfirmationModal from "./ConfirmationModal";
import { toLocalISOString } from "../../../../helper/FormatDate";
import DynamicForm, {
  FieldConfig,
} from "../../../../components/wms-components/inbound-component/form/DynamicForm";
import { useStoreInboundGoodStock } from "../../../../DynamicAPI/stores/Store/MasterStore";
import { CreateInboundPlanning } from "../../../../DynamicAPI/types/InboundGoodStock";
import { showErrorToast } from "../../../../components/toast";

// Reusable header field config
const headerFields: FieldConfig[] = [
  {
    name: "inbound_plan_no",
    label: "inbound_plan_no",
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

export default function InboundPlanningForm() {
  const { createData } = useStoreInboundGoodStock();

  const methods = useForm<FormValues>({
    defaultValues: {
      inbound_plan_no: "AUTO GENERATED",
      expedition: "",
      driver: "",
      no_pol: "",
      origin: "",
      destination: "",
      driver_phone: "",
      arrival_date: "",
      inbound_type: "",
      deliveryOrders: [
        {
          do_no: "",
          date: "",
          attachment: null,
          pos: [{ po_no: "", items: [] }],
        },
      ],
    },
  });

  const { handleSubmit, reset, control, getValues } = methods;
  const {
    fields: doFields,
    append: appendDO,
    remove: removeDO,
  } = useFieldArray({ control, name: "deliveryOrders" });

  // Modal state
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [previewData, setPreviewData] = useState<FormValues | null>(null);

  // Transform form → API payload
  const mapToPayload = (data: FormValues): CreateInboundPlanning => {
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
  };

  // Final submit
  const onSubmit = async (data: FormValues) => {
    const payload = mapToPayload(data);
    console.log("Payload API:", payload);
    const res = await createData(payload);
    console.log("createData response:", res);

    if (res?.success) {
      reset();
      setIsConfirmOpen(false);
    }
  };

  // Preview before confirm
  const handlePreview = async () => {
    // jalankan validasi react-hook-form
    const isValid = await methods.trigger([
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

    const values = getValues();
    setPreviewData(values);
    setIsConfirmOpen(true);
  };

  return (
    <FormProvider {...methods}>
      <div className="p-6 bg-slate-50 min-h-screen">
        <h1 className="text-2xl font-semibold mb-4">Create Inbound Planning</h1>

        {/* Header Form */}
        <section className="bg-white p-4 rounded-xl shadow-sm mb-6">
          <h2 className="text-lg font-medium mb-3">Inbound Planning Details</h2>
          <DynamicForm
            fields={headerFields}
            onSubmit={methods.handleSubmit(onSubmit)}
            defaultValues={{}}
            control={methods.control}
            register={methods.register}
            setValue={methods.setValue}
            handleSubmit={methods.handleSubmit}
            isEditMode={true}
            watch={methods.watch}
          />
        </section>

        {/* Action buttons */}
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
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={() => reset()}
          >
            <FaRedoAlt className="inline mr-1" /> Reset All
          </Button>
        </div>

        {/* Delivery Orders Section */}
        <section className="space-y-4 mt-4">
          {doFields.map((doField, doIndex) => (
            <DeliveryOrderCard
              key={doField.id}
              doIndex={doIndex}
              removeDO={() => removeDO(doIndex)}
              totalDO={doFields.length}
            />
          ))}
        </section>

        <div className="mt-4 flex justify-end">
          <Button type="button" variant="secondary" onClick={handlePreview}>
            Preview & Submit
          </Button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {previewData && (
        <ConfirmationModal
          isOpen={isConfirmOpen}
          onClose={() => setIsConfirmOpen(false)}
          onSubmit={handleSubmit(onSubmit)}
          formData={previewData}
        />
      )}
    </FormProvider>
  );
}

// import { FormProvider, useForm, useFieldArray } from "react-hook-form";
// import { useState } from "react";
// import { FormValues } from "./formTypes";
// import DeliveryOrderCard from "./DeliveryOrderCard";
// import Button from "../../../../components/ui/button/Button";
// import { FaPlus, FaRedoAlt } from "react-icons/fa";
// import ConfirmationModal from "./ConfirmationModal";
// import { toLocalISOString } from "../../../../helper/FormatDate";
// import DynamicForm, {
//   FieldConfig,
// } from "../../../../components/wms-components/inbound-component/form/DynamicForm";
// import { useStoreInboundGoodStock } from "../../../../DynamicAPI/stores/Store/MasterStore";
// import { CreateInboundPlanning } from "../../../../DynamicAPI/types/InboundGoodStock";

// export default function InboundPlanningForm() {
//   const { createData } = useStoreInboundGoodStock();

//   const methods = useForm<FormValues>({
//     defaultValues: {
//       inbound_plan_no: "AUTO GENERATED",
//       expedition: "",
//       driver: "",
//       no_pol: "",
//       origin: "",
//       destination: "",
//       driver_phone: "",
//       arrival_date: "",
//       inbound_type: "",
//       deliveryOrders: [
//         {
//           do_no: "",
//           date: "",
//           attachment: null,
//           pos: [{ po_no: "", items: [] }],
//         },
//       ],
//     },
//   });

//   const { handleSubmit, reset, control, getValues, setValue } = methods;

//   const {
//     fields: doFields,
//     append: appendDO,
//     remove: removeDO,
//   } = useFieldArray({
//     control,
//     name: "deliveryOrders",
//   });

//   // === NEW: State modal summary ===
//   const [isConfirmOpen, setIsConfirmOpen] = useState(false);
//   const [previewData, setPreviewData] = useState<FormValues | null>(null);

//   // Final submit
//   const onSubmit = async (data: FormValues) => {
//     console.log("Inbound Planning Payload (raw):", data);

//     const normalizedInboundType =
//       typeof data.inbound_type === "string"
//         ? data.inbound_type
//         : (data.inbound_type as any)?.value || "";

//     // transform ke schema API
//     const payload: CreateInboundPlanning = {
//       expedition: data.expedition ?? "",
//       origin: data.origin ?? "",
//       license_plate: data.no_pol ?? "",
//       driver_name: data.driver ?? "",
//       driver_phone: data.driver_phone ?? "",
//       status: "CREATED",
//       inbound_type: normalizedInboundType ?? "",
//       arrival_date: data.arrival_date
//         ? new Date(data.arrival_date).toISOString()
//         : "",
//       inbound_dos: data.deliveryOrders.flatMap((doItem) =>
//         doItem.pos.map((po) => ({
//           inbound_do_number: doItem.do_no ?? "",
//           inbound_do_date: doItem.date
//             ? toLocalISOString(new Date(doItem.date))
//             : "",
//           attachment: doItem.attachment ? String(doItem.attachment) : "",
//           inbound_po_number: po.po_no ?? "",
//           inbound_po_date: po.po_date
//             ? toLocalISOString(new Date(po.po_date))
//             : "",
//           flag_validated: false,
//           inbound_items: po.items.map((item) => ({
//             item_id: item.item_id ?? "",
//             quantity: item.qty ? Number(item.qty) : 0,
//             uom: item.uom ?? "",
//           })),
//         }))
//       ),
//     };

//     await createData(payload);

//     console.log("Inbound Planning Payload (API):", payload);
//     alert("Payload API printed to console.");
//     setIsConfirmOpen(false);
//   };

//   // Preview before confirm
//   const handlePreview = () => {
//     const data = getValues();

//     console.log("Preview Inbound Planning Data:", data);

//     setPreviewData(data);
//     setIsConfirmOpen(true);
//   };

//   const headerFields: FieldConfig[] = [
//     {
//       name: "inbound_plan_no",
//       label: "inbound_plan_no",
//       type: "text",
//       disabled: true,
//       validation: { required: false },
//     },
//     {
//       name: "inbound_type",
//       label: "Tipe Inbound",
//       type: "select",
//       options: [
//         { value: "PRINCIPAL", label: "PRINCIPAL" },
//         { value: "RETUR", label: "RETUR" },
//       ],
//       validation: { required: true },
//     },
//     {
//       name: "expedition",
//       label: "Ekspedisi",
//       type: "text",
//       validation: { required: true },
//     },
//     {
//       name: "driver",
//       label: "Driver",
//       type: "text",
//       validation: { required: true },
//     },
//     {
//       name: "no_pol",
//       label: "No Polisi",
//       type: "text",
//       validation: { required: true },
//     },
//     {
//       name: "origin",
//       label: "Asal",
//       type: "text",
//       validation: { required: true },
//     },
//     {
//       name: "destination",
//       label: "Tujuan",
//       type: "text",
//       validation: { required: true },
//     },
//     {
//       name: "driver_phone",
//       label: "No Telp Driver",
//       type: "text",
//       validation: { required: true },
//     },
//     {
//       name: "arrival_date",
//       label: "Tanggal Kedatangan",
//       type: "date",
//       validation: { required: true },
//     },
//   ];

//   return (
//     <FormProvider {...methods}>
//       <div className="p-6 bg-slate-50 min-h-screen">
//         <h1 className="text-2xl font-semibold mb-4">Create Inbound Planning</h1>

//         {/* Header */}
//         <section className="bg-white p-4 rounded-xl shadow-sm mb-6">
//           <h2 className="text-lg font-medium mb-3">Inbound Planning Details</h2>
//           <FormProvider {...methods}>
//             <DynamicForm
//               fields={headerFields}
//               onSubmit={methods.handleSubmit(onSubmit)}
//               defaultValues={{}}
//               control={methods.control}
//               register={methods.register}
//               setValue={methods.setValue}
//               handleSubmit={methods.handleSubmit}
//               isEditMode={true}
//               watch={methods.watch}
//             />
//           </FormProvider>
//         </section>

//         <div className="mt-4 flex justify-end gap-1">
//           <Button
//             type="button"
//             variant="primary"
//             size="sm"
//             onClick={() =>
//               appendDO({ do_no: "", date: "", attachment: null, pos: [] })
//             }
//           >
//             <FaPlus className="inline mr-1" />
//             Add Surat Jalan
//           </Button>

//           <Button
//             type="button"
//             variant="danger"
//             size="sm"
//             onClick={() => reset()}
//           >
//             <FaRedoAlt className="inline mr-1" />
//             Reset All
//           </Button>
//         </div>

//         {/* DO Section */}
//         <section className="space-y-4 mt-4">
//           {doFields.map((doField, doIndex) => (
//             <DeliveryOrderCard
//               key={doField.id}
//               doIndex={doIndex}
//               removeDO={() => removeDO(doIndex)}
//               totalDO={doFields.length}
//             />
//           ))}
//         </section>

//         <div className="mt-4 flex justify-end">
//           <Button type="button" variant="secondary" onClick={handlePreview}>
//             Preview & Submit
//           </Button>
//         </div>
//       </div>

//       {/* Confirmation Modal */}
//       {previewData && (
//         <ConfirmationModal
//           isOpen={isConfirmOpen}
//           onClose={() => setIsConfirmOpen(false)}
//           onSubmit={handleSubmit(onSubmit)}
//           formData={previewData}
//         />
//       )}
//     </FormProvider>
//   );
// }
