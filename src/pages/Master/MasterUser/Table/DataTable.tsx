import React, { useEffect, useMemo, useState } from "react";
import { FaPlus } from "react-icons/fa";
import Input from "../../../../components/form/input/InputField";
import Label from "../../../../components/form/Label";
import Button from "../../../../components/ui/button/Button";
import { useDebounce } from "../../../../helper/useDebounce";
import DynamicTable from "../../../../components/wms-components/DynamicTable";
import {
  useStoreUser,
  useStoreIo,
  useStoreSubWarehouse,
} from "../../../../DynamicAPI/stores/Store/MasterStore";
import { useRoleStore } from "../../../../API/store/MasterStore";
import { EndPoint } from "../../../../utils/EndPoint";

const DataTable = () => {
  const {
    list: userData,
    createData,
    updateData,
    // deleteData,
    fetchAll,
  } = useStoreUser();

  const { list: subWarehouseList, fetchAll: fetchSubWarehouses } =
    useStoreSubWarehouse();
  const { fetchRoles, roles } = useRoleStore();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  useEffect(() => {
    fetchAll();
    fetchRoles();
    fetchSubWarehouses();
  }, []);

  // 1. Dapatkan ID untuk role "GATE" agar perbandingan lebih akurat
  const gateRoleId = useMemo(() => {
    return roles?.find((r: any) => r.name === "GATE")?.id;
  }, [roles]);

  // 2. Filter list zona yang hanya memiliki is_gate: true
  const gateZoneOptions = useMemo(() => {
    return (
      subWarehouseList
        ?.filter((zone: any) => zone.is_gate === true)
        ?.map((zone: any) => ({
          label: zone.name,
          value: zone.id,
        })) || []
    );
  }, [subWarehouseList]);

  // 3. Konfigurasi formFields dengan memanfaatkan hiddenWhen
  const formFields = useMemo(
    () => [
      {
        name: "username",
        label: "Username",
        type: "text",
        validation: { required: "Required" },
      },
      {
        name: "password",
        label: "Password",
        type: "password",
        validation: { required: "Required" },
      },
      {
        name: "roleId",
        label: "Role",
        type: "select",
        options:
          roles?.map((role: any) => ({
            label: role.name,
            value: role.id,
          })) || [],
        validation: { required: "Required" },
      },
      {
        name: "zoneId",
        label: "Zone (Gate Only)",
        type: "select",
        options: gateZoneOptions,
        validation: { required: "Required" },
        // LOGIKA UTAMA: Sembunyikan jika roleId yang dipilih BUKAN gateRoleId
        hiddenWhen: (values: any) => {
          if (!values.roleId || !gateRoleId) return true;
          return String(values.roleId) !== String(gateRoleId);
        },
      },
      {
        name: "isActive",
        label: "is Active?",
        type: "checkbox",
      },
    ],
    [roles, gateZoneOptions, gateRoleId]
  );

  const handleCreate = (data: any) => {
    // Hapus zoneId dari payload, hanya kirim warehouseSubId jika role GATE
    const { zoneId, ...rest } = data;
    const payload = {
      ...rest,
      roleId: Number(data.roleId),
      warehouseSubId:
        String(data.roleId) === String(gateRoleId) ? data.zoneId : null,
    };

    console.log("Create Payload:", payload);
    return createData(payload);
  };

  const handleUpdate = (data: any) => {
    const { id, ...rest } = data;
    const payload = {
      ...rest,
      roleId: Number(rest.roleId),
      zoneId: String(rest.roleId) === String(gateRoleId) ? rest.zoneId : null,
    };
    return updateData(id, payload);
  };

  const handleHardDelete = async (id: number): Promise<void> => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found in localStorage");
      return;
    }
    try {
      await fetch(`${EndPoint}user/${id}/hard`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      // Refresh data setelah penghapusan
      await fetchAll();
    } catch (error) {
      console.error("Hard delete failed:", error);
    }
  };

  const columns = useMemo(
    () => [
      { accessorKey: "username", header: "Username" },
      {
        accessorKey: "roleId",
        header: "Role",
        cell: (info: any) =>
          roles?.find((r: any) => r.id === info.getValue())?.name || "-",
      },
      {
        accessorKey: "isActive",
        header: "Active",
        cell: (info: any) => (info.getValue() ? "Active" : "Inactive"),
      },
    ],
    [roles]
  );

  return (
    <>
      <div className="p-4 bg-white shadow rounded-md mb-5">
        <div className="flex justify-between items-center">
          <div className="space-x-4">
            <Label htmlFor="search">Search</Label>
            <Input
              onChange={(e) => setSearch(e.target.value)}
              type="text"
              id="search"
              placeholder="🔍 Masukan data.."
            />
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setCreateModalOpen(true)}
          >
            <FaPlus className="mr-2" /> Tambah Data
          </Button>
        </div>
      </div>

      <DynamicTable
        data={userData}
        globalFilter={debouncedSearch}
        isCreateModalOpen={isCreateModalOpen}
        onCloseCreateModal={() => setCreateModalOpen(false)}
        columns={columns}
        formFields={formFields}
        onSubmit={handleCreate}
        onUpdate={handleUpdate}
        onDelete={handleHardDelete}
        onRefresh={fetchAll}
        getRowId={(row) => row.id}
        title="Form Data"
      />
    </>
  );
};

export default DataTable;

// import React, { useEffect, useMemo, useState } from "react";
// import { FaPlus } from "react-icons/fa";
// import Input from "../../../../components/form/input/InputField";
// import Label from "../../../../components/form/Label";
// import Button from "../../../../components/ui/button/Button";
// import { useDebounce } from "../../../../helper/useDebounce";
// import DynamicTable from "../../../../components/wms-components/DynamicTable";
// import {
//   useStoreUser,
//   useStoreIo,
//   useStoreSubWarehouse,
// } from "../../../../DynamicAPI/stores/Store/MasterStore";
// import { useRoleStore } from "../../../../API/store/MasterStore";

// const DataTable = () => {
//   const {
//     list: userData,
//     createData,
//     updateData,
//     deleteData,
//     fetchAll,
//   } = useStoreUser();

//   const { list: IoList, fetchAll: fetchIO } = useStoreIo();
//   const { list: subWarehouseList, fetchAll: fetchSubWarehouses } =
//     useStoreSubWarehouse();
//   const { fetchRoles, roles } = useRoleStore();

//   const [search, setSearch] = useState("");
//   const debouncedSearch = useDebounce(search, 500);
//   const [isCreateModalOpen, setCreateModalOpen] = useState(false);
//   const [selectedRoleId, setSelectedRoleId] = useState<number | string | null>(
//     null
//   );

//   useEffect(() => {
//     fetchAll();
//     fetchRoles();
//     fetchIO();
//     fetchSubWarehouses();
//   }, []);

//   const gateZones = useMemo(() => {
//     return subWarehouseList?.filter((zone: any) => zone.is_gate === true) || [];
//   }, [subWarehouseList]);

//   const isGateRoleSelected = useMemo(() => {
//     const selectedRole = roles?.find(
//       (r: any) => r.id === Number(selectedRoleId)
//     );
//     return selectedRole?.name === "GATE";
//   }, [selectedRoleId, roles]);

//   // Fungsi untuk format payload create
//   const handleCreate = (data: any) => {
//     const formattedData = {
//       username: data.username,
//       password: data.password,
//       isActive: data.isActive,
//       roleId: Number(data.roleId),
//     };

//     console.log("Formatted Create Data:", formattedData);

//     // return createData(formattedData);
//   };

//   // Fungsi untuk format payload update
//   const handleUpdate = (data: any) => {
//     const { id, ...rest } = data;
//     return updateData(id, {
//       username: rest.username,
//       password: rest.password,
//       isActive: rest.isActive,
//       roleId: Number(rest.roleId),
//     });
//   };

//   const columns = useMemo(
//     () => [
//       {
//         accessorKey: "username",
//         header: "Username",
//       },
//       {
//         accessorKey: "roleId",
//         header: "Role",
//         cell: (info: any) => {
//           const role = roles?.find((role: any) => role.id === info.getValue());
//           return role ? role.name : "-";
//         },
//       },
//       {
//         accessorKey: "isActive",
//         header: "Active",
//         cell: (info: any) => (info.getValue() ? "Active" : "Inactive"),
//       },
//     ],
//     [IoList, roles]
//   );

//   // const formFields = [
//   //   {
//   //     name: "username",
//   //     label: "Username",
//   //     type: "text",
//   //     validation: { required: "Required" },
//   //   },
//   //   {
//   //     name: "password",
//   //     label: "Password",
//   //     type: "password",
//   //     validation: { required: "Required" },
//   //   },
//   //   {
//   //     name: "roleId",
//   //     label: "Role",
//   //     type: "select",
//   //     options:
//   //       roles?.map((role: any) => ({
//   //         label: role.name,
//   //         value: role.id,
//   //       })) || [],
//   //     validation: { required: "Required" },
//   //     onChange: (e: any) => setSelectedRoleId(e.target.value),
//   //   },
//   //   {
//   //     name: "zoneId",
//   //     label: "Zone",
//   //     type: "select",
//   //     options:
//   //       subWarehouseList?.map((zone: any) => ({
//   //         label: zone.name,
//   //         value: zone.id,
//   //       })) || [],
//   //     validation: { required: "Required" },
//   //   },
//   //   {
//   //     name: "isActive",
//   //     label: "is Active?",
//   //     type: "checkbox",
//   //     options: [
//   //       { label: "Active", value: true },
//   //       { label: "Inactive", value: false },
//   //     ],
//   //   },
//   // ];

//   console.log("Selected Role ID:", selectedRoleId, "Is Gate Role:", isGateRoleSelected);

//   const formFields = useMemo(() => {
//     const baseFields = [
//       {
//         name: "username",
//         label: "Username",
//         type: "text",
//         validation: { required: "Required" },
//       },
//       {
//         name: "password",
//         label: "Password",
//         type: "password",
//         validation: { required: "Required" },
//       },
//       {
//         name: "roleId",
//         label: "Role",
//         type: "select",
//         options:
//           roles?.map((role: any) => ({
//             label: role.name,
//             value: role.id,
//           })) || [],
//         validation: { required: "Required" },
//         onChange: (e: any) => setSelectedRoleId(e.target.value),
//       },
//     ];

//     // Jika role "GATE" dipilih, masukkan field Zone ke dalam array
//     if (isGateRoleSelected) {
//       baseFields.push({
//         name: "zoneId",
//         label: "Zone (Gate Only)",
//         type: "select",
//         options: gateZones.map((zone: any) => ({
//           label: zone.name,
//           value: zone.id,
//         })),
//         validation: { required: "Required" },
//       } as any);
//     }

//     baseFields.push({
//       name: "isActive",
//       label: "is Active?",
//       type: "checkbox",
//       options: [
//         { label: "Active", value: true },
//         { label: "Inactive", value: false },
//       ],
//     } as any);

//     return baseFields;
//   }, [roles, gateZones, isGateRoleSelected]);

//   return (
//     <>
//       <div className="p-4 bg-white shadow rounded-md mb-5">
//         <div className="flex justify-between items-center">
//           <div className="space-x-4">
//             <Label htmlFor="search">Search</Label>
//             <Input
//               onChange={(e) => setSearch(e.target.value)}
//               type="text"
//               id="search"
//               placeholder="🔍 Masukan data.."
//             />
//           </div>
//           <div className="space-x-4">
//             <Button
//               variant="primary"
//               size="sm"
//               onClick={() => setCreateModalOpen(true)}
//             >
//               <FaPlus className="mr-2" /> Tambah Data
//             </Button>
//           </div>
//         </div>
//       </div>

//       <DynamicTable
//         data={userData}
//         globalFilter={debouncedSearch}
//         isCreateModalOpen={isCreateModalOpen}
//         onCloseCreateModal={() => setCreateModalOpen(false)}
//         columns={columns}
//         formFields={formFields}
//         onSubmit={handleCreate}
//         onUpdate={handleUpdate}
//         onDelete={async (id) => {
//           await deleteData(id);
//         }}
//         onRefresh={fetchAll}
//         getRowId={(row) => row.id}
//         title="Form Data"
//       />
//     </>
//   );
// };

// export default DataTable;
