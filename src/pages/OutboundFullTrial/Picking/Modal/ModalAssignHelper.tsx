// import React, { useEffect } from "react";
// import {
//   useStoreUserManagement,
//   useStoreUser,
// } from "../../../../DynamicAPI/stores/Store/MasterStore";
// import Button from "../../../../components/ui/button/Button";
// import { useForm, Controller } from "react-hook-form";
// import Select from "../../../../components/form/Select";

// type FormValues = {
//   helperDriverDeviceId?: string;
//   helperDriverName?: string;
//   helperDriverPhone?: string;
// };

// type Props = {
//   isDetail?: boolean;
//   isEdit?: boolean;
//   onSubmit?: (data: any) => void;
//   memoId?: string;
// };

// export default function ModalAssignHelper({
//   isDetail = false,
//   isEdit = false,
//   onSubmit,
//   memoId,
// }: Props) {
//   const { list: userDevice = [], fetchAll: fetchUserDevice } = useStoreUser();
//   const { list: userList = [], fetchAll: fetchUserList } =
//     useStoreUserManagement();

//     console.log("userList", userList);

//   const { control, handleSubmit, setValue, formState } = useForm<FormValues>({
//     defaultValues: {
//       helperDriverDeviceId: "",
//       helperDriverName: "",
//       helperDriverPhone: "",
//     },
//   });

//   useEffect(() => {
//     fetchUserDevice?.();
//     fetchUserList?.();
//   }, [fetchUserDevice, fetchUserList]);

//   const driverDeviceOptions = (userDevice as any[])
//     .filter(
//       (d: any) => d?.role?.name === "HELPER"
//     )
//     .map((d: any) => ({ value: d.id, label: d.username ?? d.id }));

//   const driverNameOptions = (userList as any[]).map((u: any) => ({
//     value: u.id,
//     label: u.name ?? u.id,
//   }));

//   const handleDriverNameSelect = (userId?: string) => {
//     const u = userList.find((x: any) => x.id === userId);
//     setValue("helperDriverPhone", u?.phone ?? "");
//   };

//   const onFormSubmit = (data: FormValues) => {
//     const selectedDevice = (userDevice as any[]).find(
//       (d) => d.id === data.helperDriverDeviceId
//     );
//     const selectedUser = (userList as any[]).find(
//       (u) => u.id === data.helperDriverName
//     );

//     const payload = {
//       memo_id: memoId,
//       picking_user_id: data.helperDriverDeviceId ?? selectedDevice?.id ?? "",
//       picking_name: selectedUser?.name ?? data.helperDriverName ?? "",
//       picking_phone: data.helperDriverPhone ?? "",
//     };

//     onSubmit?.(payload);
//   };

//   return (
//     <div>
//       <form
//         onSubmit={handleSubmit(onFormSubmit)}
//         className="border rounded-lg p-4 shadow-md space-y-4"
//       >
//         <div className="grid grid-cols-2 gap-4">
//           <div>
//             <label className="block text-sm font-medium mb-1">
//               Device <span className="text-red-500">*</span>
//             </label>
//             <Controller
//               name="helperDriverDeviceId"
//               control={control}
//               rules={{ required: "Please select a forklift driver" }}
//               render={({ field }) => (
//                 <>
//                   <Select
//                     options={driverDeviceOptions}
//                     value={field.value}
//                     onChange={(val: string) => {
//                       field.onChange(val);
//                     }}
//                     placeholder="-- Select Device --"
//                     disabled={isDetail}
//                     width="100%"
//                   />
//                   {formState.errors.helperDriverDeviceId && (
//                     <p className="text-red-500 text-sm mt-1">
//                       {formState.errors.helperDriverDeviceId.message as string}
//                     </p>
//                   )}
//                 </>
//               )}
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium mb-1">
//               Name <span className="text-red-500">*</span>
//             </label>
//             <Controller
//               name="helperDriverName"
//               control={control}
//               rules={{ required: "Driver name is required" }}
//               render={({ field }) => (
//                 <>
//                   <Select
//                     options={driverNameOptions}
//                     value={field.value}
//                     onChange={(val: string) => {
//                       field.onChange(val);
//                       handleDriverNameSelect(val);
//                     }}
//                     placeholder="-- Select User --"
//                     disabled={isDetail}
//                     width="100%"
//                   />
//                   {formState.errors.helperDriverName && (
//                     <p className="text-red-500 text-sm mt-1">
//                       {formState.errors.helperDriverName.message as string}
//                     </p>
//                   )}
//                 </>
//               )}
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium mb-1">
//               Phone Number <span className="text-red-500">*</span>
//             </label>
//             <Controller
//               name="helperDriverPhone"
//               control={control}
//               rules={{
//                 required: "Driver phone number is required",
//                 pattern: {
//                   value: /^[0-9+]+$/,
//                   message: "Phone must contain only numbers or +",
//                 },
//               }}
//               render={({ field }) => (
//                 <>
//                   <input
//                     {...field}
//                     disabled={isDetail}
//                     type="text"
//                     className={`border p-2 rounded w-full ${
//                       formState.errors.helperDriverPhone ? "border-red-500" : ""
//                     }`}
//                   />
//                   {formState.errors.helperDriverPhone && (
//                     <p className="text-red-500 text-sm mt-1">
//                       {formState.errors.helperDriverPhone.message as string}
//                     </p>
//                   )}
//                 </>
//               )}
//             />
//           </div>
//         </div>

//         <div className="flex justify-end">
//           <Button type="submit" variant="primary">
//             Assign
//           </Button>
//         </div>
//       </form>
//     </div>
//   );
// }

"use client";

import React, { useEffect, useMemo } from "react";
import { useStoreUserManagement } from "../../../../DynamicAPI/stores/Store/MasterStore";
import Button from "../../../../components/ui/button/Button";
import { useForm, Controller } from "react-hook-form";
import Select from "../../../../components/form/Select";

type FormValues = {
  helperDriverDeviceId: string;
  helperDriverName: string;
  helperDriverPhone: string;
};

type Props = {
  isDetail?: boolean;
  isEdit?: boolean;
  onSubmit?: (data: any) => void;
  memoId?: string;
};

export default function ModalAssignHelper({
  isDetail = false,
  isEdit = false,
  onSubmit,
  memoId,
}: Props) {
  const { list: userList = [], fetchAll: fetchUserList } =
    useStoreUserManagement();

  const { control, handleSubmit, setValue, formState } = useForm<FormValues>({
    defaultValues: {
      helperDriverDeviceId: "",
      helperDriverName: "",
      helperDriverPhone: "",
    },
  });

  useEffect(() => {
    fetchUserList?.();
  }, [fetchUserList]);

  // Filter Helper: Role "HELPER" dan status isActive: true
  const helperUsers = useMemo(() => {
    return (userList as any[]).filter(
      (u: any) => u.role?.name === "HELPER" && u.isActive === true,
    );
  }, [userList]);

  // Option untuk Dropdown Device (Username)
  const deviceOptions = helperUsers.map((u: any) => ({
    value: u.id,
    label: u.username || u.id,
  }));

  // Fungsi sinkronisasi data saat username dipilih
  const handleUserSync = (userId: string) => {
    const selected = helperUsers.find((u: any) => u.id === userId);
    if (selected) {
      const fullName =
        `${selected.userDetail?.firstName || ""} ${selected.userDetail?.lastName || ""}`.trim();

      setValue("helperDriverDeviceId", selected.id);
      setValue("helperDriverName", fullName || selected.username); // Fallback ke username jika nama kosong
      setValue("helperDriverPhone", selected.userDetail?.phone || "");
    }
  };

  const onFormSubmit = (data: FormValues) => {
    const payload = {
      memo_id: memoId,
      picking_user_id: data.helperDriverDeviceId,
      picking_name: data.helperDriverName,
      picking_phone: data.helperDriverPhone,
    };

    console.log("DEBUG PAYLOAD ASSIGN HELPER:", payload);
    onSubmit?.(payload);
  };

  return (
    <div>
      <form
        onSubmit={handleSubmit(onFormSubmit)}
        className="border rounded-lg p-4 shadow-md space-y-4"
      >
        <div className="grid grid-cols-2 gap-4">
          {/* Helper Device / Username - SATU-SATUNYA SELECT */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Helper Device (Username) <span className="text-red-500">*</span>
            </label>
            <Controller
              name="helperDriverDeviceId"
              control={control}
              rules={{ required: "Please select helper account" }}
              render={({ field }) => (
                <>
                  <Select
                    options={deviceOptions}
                    value={field.value}
                    onChange={(val: string) => {
                      field.onChange(val);
                      handleUserSync(val);
                    }}
                    placeholder="-- Select Username --"
                    disabled={isDetail}
                    width="100%"
                  />
                  {formState.errors.helperDriverDeviceId && (
                    <p className="text-red-500 text-sm mt-1">
                      {formState.errors.helperDriverDeviceId.message as string}
                    </p>
                  )}
                </>
              )}
            />
          </div>

          {/* Helper Name - SEKARANG INPUT READONLY */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Helper Name
            </label>
            <Controller
              name="helperDriverName"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  readOnly
                  type="text"
                  placeholder="Full name display"
                  className="border p-2 rounded w-full bg-gray-100 cursor-not-allowed"
                />
              )}
            />
          </div>

          {/* Phone Number - INPUT READONLY */}
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">
              Phone Number
            </label>
            <Controller
              name="helperDriverPhone"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  readOnly
                  type="text"
                  placeholder="Phone number display"
                  className="border p-2 rounded w-full bg-gray-100 cursor-not-allowed"
                />
              )}
            />
          </div>
        </div>

        {!isDetail && (
          <div className="flex justify-end">
            <Button type="submit" variant="primary">
              Assign Helper
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
