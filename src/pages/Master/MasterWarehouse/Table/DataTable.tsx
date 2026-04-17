// import { useEffect, useState, useMemo } from "react";
// import { FaPlus } from "react-icons/fa";
// import Input from "../../../../components/form/input/InputField";
// import Label from "../../../../components/form/Label";
// import Button from "../../../../components/ui/button/Button";
// import { useDebounce } from "../../../../helper/useDebounce";
// import DynamicTable from "../../../../components/wms-components/DynamicTable";
// import {
//   useStoreWarehouse,
//   useStoreIo,
// } from "../../../../DynamicAPI/stores/Store/MasterStore";
// import { showConfirmDialog } from "../../../../components/swal-confirm";

// const DataTable = () => {
//   const {
//     list: Warehouse,
//     createData,
//     updateData,
//     deleteData,
//     fetchAll,
//   } = useStoreWarehouse();

//   const { fetchAll: fetchAllIo, list: ioList } = useStoreIo();

//   const [search, setSearch] = useState("");
//   const debouncedSearch = useDebounce(search, 500);
//   const [isCreateModalOpen, setCreateModalOpen] = useState(false);

//   useEffect(() => {
//     fetchAll();
//     fetchAllIo();
//   }, []);

//   const dumnmyLocator = [
//     { id: 1, name: "Locator A" },
//     { id: 2, name: "Locator B" },
//     { id: 3, name: "Locator C" },
//   ];

//   const columns = useMemo(
//     () => [
//       {
//         accessorKey: "organization_id",
//         header: "Organization",
//         cell: ({ row }: any) => {
//           const org = ioList.find((item: any) => item.id === row.original.id);
//           return org ? org.organization_name : row.original.id;
//         },
//       },
//       {
//         accessorKey: "locator_name",
//         header: "Locator Name",
//         cell: ({ row }: any) => {
//           const loc = dumnmyLocator.find(
//             (locator: any) => locator.id === row.original.id,
//           );
//           return loc ? loc.name : row.original.id;
//         },
//       },
//       { accessorKey: "name", header: "Warehouse Name" },
//       { accessorKey: "description", header: "Description" },
//     ],
//     [ioList],
//   );

//   const formFields = [
//     {
//       name: "organization_id",
//       label: "Organization ID",
//       type: "select",
//       options: ioList.map((item: any) => ({
//         label: item.organization_name,
//         value: item.id,
//       })),
//       validation: { required: "Required" },
//     },
//     {
//       name: "locator_name",
//       label: "Locator Name",
//       type: "select",
//       options: dumnmyLocator.map((item) => ({
//         label: item.name,
//         value: item.id,
//       })),
//       validation: { required: "Required" },
//     },
//     {
//       name: "name",
//       label: "Warehouse Name",
//       type: "text",
//       validation: { required: "Required" },
//     },
//     {
//       name: "description",
//       label: "Description",
//       type: "text",
//       validation: { required: "Required" },
//     },
//   ];

//   // Fungsi untuk format payload create
//   const handleCreate = (data: any) => {
//     console.log("data", data);

//     const { id, name, description, locator_id, locator_name } = data;
//     return createData({
//       organization_id: id,
//       name,
//       description,
//       locator_id,
//       locator_name,
//     });
//   };

//   // Fungsi untuk format payload update
//   const handleUpdate = (data: any) => {
//     const { id, name, description, locator_id, locator_name } = data;
//     return updateData(id, {
//       organization_id: id,
//       name,
//       description,
//       locator_id,
//       locator_name,
//     });
//   };

//   const handleDelete = (id: any) => {
//     showConfirmDialog(
//       async () => {
//         try {
//           await deleteData(id);
//           fetchAll();
//         } catch (error) {
//           console.error(error);
//         }
//       },
//       {
//         title: "Confirm Delete",
//         text: "Anda yakin ingin menghapus data ini?",
//         confirmButtonText: "Yes, Delete!",
//         cancelButtonText: "No, Cancel",
//       },
//     );
//   };

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
//               <FaPlus className="mr-2" /> Add Data
//             </Button>
//           </div>
//         </div>
//       </div>

//       <DynamicTable
//         data={Warehouse}
//         globalFilter={debouncedSearch}
//         isCreateModalOpen={isCreateModalOpen}
//         onCloseCreateModal={() => setCreateModalOpen(false)}
//         columns={columns}
//         formFields={formFields}
//         onSubmit={handleCreate}
//         onUpdate={handleUpdate}
//         onDelete={async (id) => {
//           handleDelete(id);
//         }}
//         onRefresh={fetchAll}
//         getRowId={(row) => row.id}
//         title="Form UOM"
//         isView={true}
//       />
//     </>
//   );
// };

// export default DataTable;

import { useEffect, useState, useMemo } from "react";
import { FaPlus } from "react-icons/fa";
import Input from "../../../../components/form/input/InputField";
import Label from "../../../../components/form/Label";
import Button from "../../../../components/ui/button/Button";
import { useDebounce } from "../../../../helper/useDebounce";
import DynamicTable from "../../../../components/wms-components/DynamicTable";
import {
  useStoreWarehouse,
  useStoreIo,
} from "../../../../DynamicAPI/stores/Store/MasterStore";
import { showConfirmDialog } from "../../../../components/swal-confirm";

const DataTable = () => {
  const {
    list: Warehouse,
    createData,
    updateData,
    deleteData,
    fetchAll,
  } = useStoreWarehouse();

  const { fetchAll: fetchAllIo, list: ioList } = useStoreIo();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  useEffect(() => {
    fetchAll();
    fetchAllIo();
  }, []);

  const dumnmyLocator = [
    { id: 1, name: "Locator A" },
    { id: 2, name: "Locator B" },
    { id: 3, name: "Locator C" },
  ];

  const columns = useMemo(
    () => [
      {
        accessorKey: "organization_id",
        header: "Organization",
        cell: ({ row }: any) => {
          // Cari berdasarkan organization_id yang ada di data baris tersebut
          const org = ioList.find(
            (item: any) => item.id === row.original.organization_id,
          );
          return org ? org.organization_name : "N/A";
        },
      },
      {
        accessorKey: "locator_id", // Ubah accessor ke locator_id
        header: "Locator Name",
        cell: ({ row }: any) => {
          const loc = dumnmyLocator.find(
            (locator: any) => locator.id === row.original.locator_id,
          );
          return loc ? loc.name : "N/A";
        },
      },
      { accessorKey: "name", header: "Warehouse Name" },
      { accessorKey: "description", header: "Description" },
    ],
    [ioList],
  );

  const formFields = [
    {
      name: "organization_id",
      label: "Organization",
      type: "select",
      options: ioList.map((item: any) => ({
        label: item.organization_name,
        value: item.id,
      })),
      validation: { required: "Required" },
    },
    {
      name: "locator_id", // Konsisten menggunakan locator_id
      label: "Locator",
      type: "select",
      options: dumnmyLocator.map((item) => ({
        label: item.name,
        value: item.id,
      })),
      validation: { required: "Required" },
    },
    {
      name: "name",
      label: "Warehouse Name",
      type: "text",
      validation: { required: "Required" },
    },
    {
      name: "description",
      label: "Description",
      type: "text",
      validation: { required: "Required" },
    },
  ];

  const handleCreate = async (data: any) => {
    try {
      // Pastikan payload yang dikirim sesuai dengan yang diharapkan API
      await createData({
        organization_id: data.organization_id,
        name: data.name,
        description: data.description,
        locator_id: data.locator_id,
      });
      fetchAll(); // Refresh data setelah create
      setCreateModalOpen(false);
    } catch (error) {
      console.error("Create Error:", error);
    }
  };

  const handleUpdate = async (data: any) => {
    try {
      // ID baris biasanya ada di data.id saat mode edit di DynamicTable
      const id = data.id;
      await updateData(id, {
        organization_id: data.organization_id,
        name: data.name,
        description: data.description,
        locator_id: data.locator_id,
      });
      fetchAll(); // Refresh data setelah update
    } catch (error) {
      console.error("Update Error:", error);
    }
  };

  const handleDelete = (id: any) => {
    showConfirmDialog(
      async () => {
        try {
          await deleteData(id);
          fetchAll();
        } catch (error) {
          console.error(error);
        }
      },
      {
        title: "Confirm Delete",
        text: "Anda yakin ingin menghapus data ini?",
        confirmButtonText: "Yes, Delete!",
        cancelButtonText: "No, Cancel",
      },
    );
  };

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
          <div className="space-x-4">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setCreateModalOpen(true)}
            >
              <FaPlus className="mr-2" /> Add Data
            </Button>
          </div>
        </div>
      </div>

      <DynamicTable
        data={Warehouse}
        globalFilter={debouncedSearch}
        isCreateModalOpen={isCreateModalOpen}
        onCloseCreateModal={() => setCreateModalOpen(false)}
        columns={columns}
        formFields={formFields}
        onSubmit={handleCreate}
        onUpdate={handleUpdate}
        onDelete={async (id) => {
          handleDelete(id);
        }}
        onRefresh={fetchAll}
        getRowId={(row) => row.id}
        title="Warehouse Management"
        isView={true}
      />
    </>
  );
};

export default DataTable;
