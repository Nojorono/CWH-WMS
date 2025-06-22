import React, { useRef, useEffect, useMemo } from "react";
import PageBreadcrumb from "../../../../components/common/PageBreadCrumb";
import DynamicForm, {
  FieldConfig,
} from "../../../../components/form-input/DynamicForm";
import TableMenuPermission from "../Table/CreatePermission";
import { useRoleStore } from "../../../../API/store/MasterStore/MasterRoleStore";
import { useStoreMenu } from "../../../../DynamicAPI/stores/Store/MasterStore";
import { useNavigate } from "react-router-dom";
import { showErrorToast, showSuccessToast } from "../../../../components/toast";

const fields: FieldConfig[] = [
  { name: "name", label: "Name", type: "text" },
  { name: "description", label: "Description", type: "textarea" },
  {
    name: "status",
    label: "Status",
    type: "select",
    options: [
      { value: "active", label: "Active" },
      { value: "inactive", label: "Inactive" },
    ],
  },
  {
    name: "accessMobile",
    label: "Akses Mobile",
    type: "select",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
  {
    name: "accessDashboard",
    label: "Akses Dashboard",
    type: "select",
    options: [
      { value: "admin", label: "Admin" },
      { value: "user", label: "User" },
    ],
  },
];

function CreateRole() {
  const navigate = useNavigate();
  const { createRole } = useRoleStore();
  const {
    list: menus,
    createData,
    updateData,
    deleteData,
    fetchAll: fetchMenus,
  } = useStoreMenu();
  const tablePermissionRef = useRef<any>(null);

  useEffect(() => {
    fetchMenus(); // Fetch menu saat mount
  }, [fetchMenus]);

  const handleSubmit = async (formData: any) => {
    const selectedPermissions =
      tablePermissionRef.current?.getSelectedPermissions() || [];

    const payload = {
      name: formData.name.toUpperCase(),
      description: formData.description,
      permissions: selectedPermissions,
    };

    console.log("Payload to create role:", payload);

    const res = await createRole(payload);
    // if (res.ok === false) {
    //   showErrorToast(res.message);
    //   return;
    // }
    showSuccessToast("Role berhasil ditambahkan");
    setTimeout(() => {
      navigate("/master_role");
    }, 1000);
  };

  const flattenMenus = (menuData: any[]) => {
    const result: any[] = [];
    const traverse = (items: any[]) => {
      items.forEach((item) => {
        result.push(item);
        if (item.children && item.children.length > 0) {
          traverse(item.children);
        }
      });
    };
    traverse(menuData);
    return result;
  };

  const flattenedMenus = useMemo(() => {
    return flattenMenus(menus);
  }, [menus]);

  return (
    <>
      <PageBreadcrumb
        breadcrumbs={[
          { title: "Master Role", path: "/master_role" },
          { title: "Create Role" },
        ]}
      />

      <div className="p-4">
        <div className="grid grid-cols-1">
          <DynamicForm fields={fields} onSubmit={handleSubmit} />
        </div>
        <div className="mt-6">
          <TableMenuPermission
            ref={tablePermissionRef}
            menus={flattenedMenus.map((menu: any) => ({
              id: menu.id,
              name: menu.name, // dari API-nya kamu name bukan menu_name
            }))}
          />
        </div>

        {/* Tombol Bawah */}
        <div className="flex justify-end mt-6 gap-4">
          <button
            className="px-6 py-2 border border-orange-500 text-orange-500 rounded-md hover:bg-orange-50"
            onClick={() => navigate(-1)}
          >
            Kembali
          </button>
          <button
            className="px-6 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
            onClick={() =>
              document
                .querySelector("form")
                ?.dispatchEvent(
                  new Event("submit", { cancelable: true, bubbles: true })
                )
            }
          >
            Tambah
          </button>
        </div>
      </div>
    </>
  );
}

export default CreateRole;
