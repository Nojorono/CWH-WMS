import React, { useEffect, useState, useMemo } from "react";
import Input from "../../../../components/form/input/InputField";
import Label from "../../../../components/form/Label";
import Button from "../../../../components/ui/button/Button";
import { useDebounce } from "../../../../helper/useDebounce";
import DynamicTable from "../../../../components/wms-components/DynamicTable";
import {
  useStoreMenu,
  useStoreParentMenu,
} from "../../../../DynamicAPI/stores/Store/MasterStore";
import {
  FaRegFileAlt,
  FaClipboardList,
  FaRoute,
  FaPlus,
  FaWarehouse,
  FaCog,
  FaBoxes,
  FaTruckMoving,
} from "react-icons/fa";

const iconOptions = [
  { value: "FaRegFileAlt", label: "Master Data", icon: <FaRegFileAlt /> },
  { value: "FaWarehouse  ", label: "Inbound", icon: <FaWarehouse /> },
  { value: "FaTruckMoving ", label: "Outbound", icon: <FaTruckMoving /> },
  { value: "FaBoxes ", label: "Inventory", icon: <FaBoxes /> },
  { value: "FaCog ", label: "Settings", icon: <FaCog /> },
  { value: "FaClipboardList", label: "Report", icon: <FaClipboardList /> },
  { value: "FaRoute", label: "Route", icon: <FaRoute /> },
];

const DataTable = () => {
  const {
    list: menus,
    createData,
    updateData,
    deleteData,
    fetchAll: fetchAllMenus,
  } = useStoreMenu();

  const { list: parentMenu, fetchAll: fetchParentMenus } = useStoreParentMenu();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  useEffect(() => {
    fetchAllMenus();
    fetchParentMenus();
  }, []);

  const columns = useMemo(
    () => [
      { accessorKey: "id", header: "ID" },
      { accessorKey: "name", header: "Nama Menu" },
      { accessorKey: "path", header: "Path" },
      { accessorKey: "icon", header: "Icon" },
      { accessorKey: "parentId", header: "Parent ID" },
      { accessorKey: "order", header: "Order" },
    ],
    []
  );

  const formFields = [
    {
      name: "name",
      label: "Nama Menu",
      type: "text",
      validation: { required: "Required" },
    },
    {
      name: "path",
      label: "Path",
      type: "text",
      validation: { required: "Required" },
    },
    {
      name: "order",
      label: "Order",
      type: "number",
      validation: { required: "Required" },
    },
    {
      name: "icon",
      label: "Icon",
      type: "select",
      options: iconOptions.map((option) => ({
        value: option.value,
        label: (
          <div key={option.value} className="flex items-center space-x-1">
            {option.icon}
            <span>{option.label}</span>
          </div>
        ),
      })),
      validation: { required: "Required" },
    },
    {
      name: "parentId",
      label: "Parent Menu",
      type: "select",
      options: [
        { label: "Tidak Ada Parent", value: "" },
        ...parentMenu.map((menu: any) => ({
          label: menu.name,
          value: menu.id,
        })),
      ],
      placeholder: "Pilih Parent Menu (opsional)",
    },
  ];

  const tableData = useMemo(() => {
    const flattenMenus = (
      menus: any[],
      parentId: number | null = null
    ): any[] =>
      menus.reduce((acc, menu) => {
        const { children, ...rest } = menu;
        acc.push({ ...rest, parentId: parentId });
        if (children?.length) acc.push(...flattenMenus(children, menu.id));
        return acc;
      }, []);
    return flattenMenus(menus);
  }, [menus]);

  // Fungsi untuk format payload create
  const handleCreate = (data: any) => {
    const { name, path, order, icon, parentId } = data;
    return createData({
      name,
      path,
      order: Number(order),
      icon,
      parentId: parentId === "" ? null : parentId,
    });
  };

  // Fungsi untuk format payload update
  const handleUpdate = (data: any) => {
    const { id, name, path, icon, parentId, order } = data;
    return updateData(id, {
      name,
      path,
      icon,
      parentId: parentId === "" ? null : parentId,
      order: Number(order),
    });
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
              <FaPlus className="mr-2" /> Tambah Data
            </Button>
          </div>
        </div>
      </div>

      <DynamicTable
        data={tableData}
        globalFilter={debouncedSearch}
        isCreateModalOpen={isCreateModalOpen}
        onCloseCreateModal={() => setCreateModalOpen(false)}
        columns={columns}
        formFields={formFields}
        onSubmit={handleCreate}
        onUpdate={handleUpdate}
        onDelete={async (id) => {
          await deleteData(id);
        }}
        onRefresh={fetchAllMenus}
        getRowId={(row) => row.id}
        title="Form UOM"
      />
    </>
  );
};

export default DataTable;
