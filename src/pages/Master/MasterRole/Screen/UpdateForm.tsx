import React, { useMemo, useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import Checkbox from "../../../../components/form/input/Checkbox";

import { useRoleStore } from "../../../../API/store/MasterStore";
import { showErrorToast, showSuccessToast } from "../../../../components/toast";
import Button from "../../../../components/ui/button/Button";
import { signOut } from "../../../../utils/SignOut";
import { useStoreMenu } from "../../../../DynamicAPI/stores/Store/MasterStore";

// Constants for options
const STATUS_OPTIONS = [
  { value: "", label: "-- Pilih Status --" },
  { value: true, label: "Active" },
  { value: false, label: "Inactive" },
];

const ACCESS_OPTIONS = [
  { value: "", label: "-- Pilih Opsi --" },
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

const PERMISSION_TYPES = ["Create", "Update", "View", "Delete", "Manage"];

const commonClasses =
  "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-blue-300";

// Reusable Input Component
const InputField = ({
  label,
  id,
  register,
  placeholder,
  type = "text",
  ...rest
}: any) => (
  <div className="mt-4">
    <label htmlFor={id} className="block text-sm font-medium text-gray-700">
      {label}
    </label>
    <input
      type={type}
      id={id}
      {...register(id)}
      placeholder={placeholder}
      className={commonClasses}
      {...rest}
    />
  </div>
);

// Reusable Select Component
const SelectField = ({ label, name, control, options, placeholder }: any) => (
  <div className="mt-4">
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Select
          {...field}
          options={options}
          placeholder={placeholder}
          className="mt-1"
        />
      )}
    />
  </div>
);

export default function UpdateFormWithTable(paramRole: any) {
  const navigate = useNavigate();
  const {
    list: menus,
    createData,
    updateData,
    deleteData,
    fetchAll: fetchMenus,
  } = useStoreMenu();
  const { updateRole } = useRoleStore();

  type StatusOption = { value: boolean | ""; label: string } | null;

  interface FormValues {
    nama: string;
    deskripsi: string;
    status: StatusOption;
    aksesMobile?: any;
    aksesDashboard?: any;
  }

  const { control, register, getValues } = useForm<FormValues>({
    defaultValues: {
      nama: paramRole.paramRole.name || "",
      deskripsi: paramRole.paramRole.description || "",
      status: null,
      aksesMobile: null,
      aksesDashboard: null,
    },
  });

  const [selectedPermissions, setSelectedPermissions] = useState<any>({});

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
  const flattenedMenus = useMemo(() => flattenMenus(menus), [menus]);

  useEffect(() => {
    fetchMenus();
  }, []);

  useEffect(() => {
    // Use permissions if available, otherwise fallback to menus
    const sourcePermissions =
      paramRole.paramRole.permissions &&
      paramRole.paramRole.permissions.length > 0
        ? paramRole.paramRole.permissions
        : paramRole.paramRole.menus || [];

    if (sourcePermissions.length > 0) {
      const permissionsMap: any = {};
      sourcePermissions.forEach((permission: any) => {
        const menuId = permission.menu_id;
        const permTypes = Array.isArray(permission.permission_type)
          ? permission.permission_type
          : [permission.permission_type];
        if (!permissionsMap[menuId]) {
          permissionsMap[menuId] = {};
        }
        permTypes.forEach((permType: string) => {
          permissionsMap[menuId][permType] = true;
        });
      });
      setSelectedPermissions(permissionsMap);
    }
  }, [paramRole.paramRole.permissions, paramRole.paramRole.menus]);

  const handleCheckboxChange = (menuId: number, permissionType: string) => {
    setSelectedPermissions((prev: any) => {
      const isCurrentlyChecked = prev[menuId]?.[permissionType] || false;

      return {
        ...prev,
        [menuId]: {
          ...prev[menuId],
          [permissionType]: !isCurrentlyChecked,
        },
      };
    });
  };

  const handleSubmitData = async () => {
    const formData = getValues();
    const tableData = Object.entries(selectedPermissions).flatMap(
      ([menuId, permissions]: any) =>
        Object.entries(permissions)
          .filter(([_, isChecked]) => isChecked)
          .map(([permissionType]) => ({
            menu_id: Number(menuId),
            action: permissionType,
          }))
    );

    const updateId = paramRole.paramRole.id;
    if (!updateId) {
      console.error("Error: Role ID is missing.");
      return;
    }

    if (tableData.length === 0) {
      console.error("Error: At least one permission must be selected.");
      return;
    }

    const finalPayload = {
      name: formData.nama,
      description: formData.deskripsi,
      // isActive: formData.status?.value ?? formData.status,
      permissions: tableData,
    };

    if (!finalPayload.name || !finalPayload.description) {
      console.error("Error: Name and description cannot be empty.");
      return;
    }

    const res = await updateRole(updateId, finalPayload);
    if (!res.ok) {
      showErrorToast(res.message);
      return;
    }

    showSuccessToast(
      "Role berhasil diupdate. Dan silahkan sign in kembali untuk update state"
    );
    setTimeout(() => {
      signOut(navigate);
    }, 800);
  };

  return (
    <div>
      {/* FORM */}
      <div className="p-4 bg-white shadow-md rounded-lg">
        <form>
          <h3 className="text-xl font-semibold mb-4">Update Role</h3>

          <InputField
            label="Nama"
            id="nama"
            register={register}
            placeholder="Nama Posisi"
          />

          <div className="mt-4">
            <label
              htmlFor="deskripsi"
              className="block text-sm font-medium text-gray-700"
            >
              Deskripsi
            </label>
            <textarea
              id="deskripsi"
              {...register("deskripsi")}
              placeholder="Deskripsi"
              rows={4}
              className={commonClasses}
            />
          </div>

          <SelectField
            label="Status"
            name="status"
            control={control}
            options={STATUS_OPTIONS}
            placeholder="-- Pilih Status --"
          />

          {/* <SelectField
            label="Akses Mobile"
            name="aksesMobile"
            control={control}
            options={ACCESS_OPTIONS}
            placeholder="-- Pilih Opsi --"
          />

          <SelectField
            label="Akses Dashboard"
            name="aksesDashboard"
            control={control}
            options={ACCESS_OPTIONS}
            placeholder="-- Pilih Opsi --"
          /> */}
        </form>
      </div>

      {/* TABLE */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Akses Menu</h3>

        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-2">Id</th>
              <th className="border border-gray-300 px-4 py-2">Nama Menu</th>
              {PERMISSION_TYPES.map((type) => (
                <th key={type} className="border border-gray-300 px-4 py-2">
                  {type}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {flattenedMenus.map((menu: any) => (
              <tr key={menu.id}>
                <td className="border border-gray-300 px-4 py-2">{menu.id}</td>
                <td className="border border-gray-300 px-4 py-2">
                  {menu.name}
                </td>
                {PERMISSION_TYPES.map((perm) => (
                  <td
                    key={perm}
                    className="border border-gray-300 px-4 py-2 text-center"
                  >
                    <Checkbox
                      checked={selectedPermissions[menu.id]?.[perm] || false}
                      onChange={() => handleCheckboxChange(menu.id, perm)}
                      label=""
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end mt-4">
        <Button
          onClick={handleSubmitData}
          className="bg-blue-500 text-white px-4 py-2 rounded shadow hover:bg-blue-600"
        >
          Update
        </Button>
      </div>
    </div>
  );
}
