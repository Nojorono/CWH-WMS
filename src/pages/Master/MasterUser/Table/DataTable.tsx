import { useEffect, useMemo, useState } from "react";
import { FaPlus, FaEye, FaEyeSlash, FaLock } from "react-icons/fa";
import Input from "../../../../components/form/input/InputField";
import Label from "../../../../components/form/Label";
import Button from "../../../../components/ui/button/Button";
import { useDebounce } from "../../../../helper/useDebounce";
import DynamicTable from "../../../../components/wms-components/DynamicTable";
import {
  useStoreUser,
  useStoreSubWarehouse,
} from "../../../../DynamicAPI/stores/Store/MasterStore";
import { useRoleStore } from "../../../../API/store/MasterStore";
import { EndPoint } from "../../../../utils/EndPoint";

const DataTable = () => {
  const { list: userData, createData, updateData, fetchAll } = useStoreUser();
  const { list: subWarehouseList, fetchAll: fetchSubWarehouses } =
    useStoreSubWarehouse();
  const { fetchRoles, roles } = useRoleStore();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  // State untuk Reset Password
  const [resetPasswordId, setResetPasswordId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState(""); // Untuk menampilkan pesan error di modal

  useEffect(() => {
    fetchAll();
    fetchRoles();
    fetchSubWarehouses();
  }, []);

  const gateRoleId = useMemo(() => {
    return roles?.find((r: any) => r.name === "GATE")?.id;
  }, [roles]);

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

  // Regex: Minimal 8 karakter, harus ada minimal 1 huruf dan 1 angka
  const PWD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;

  const formFields = useMemo(
    () => [
      {
        name: "username",
        label: "Username",
        type: "username",
        validation: { required: "Required" },
      },
      {
        name: "firstName",
        label: "First Name",
        type: "text",
        validation: { required: "Required" },
      },
      {
        name: "lastName",
        label: "Last Name",
        type: "text",
        validation: { required: "Required" },
      },
      {
        name: "email",
        label: "Email",
        type: "email",
        validation: { required: "Required" },
      },
      {
        name: "phone",
        label: "Phone",
        type: "phone",
        validation: { required: "Required" },
      },
      {
        name: "password",
        label: "Password",
        type: "password",
        validation: {
          required: "Password wajib diisi",
          minLength: {
            value: 8,
            message: "Password minimal harus 8 karakter",
          },
          pattern: {
            value: PWD_REGEX,
            message: "Password harus mengandung kombinasi huruf dan angka",
          },
        },
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
    [roles, gateZoneOptions, gateRoleId],
  );

  const updateFormFields = useMemo(
    () => formFields.filter((f) => f.name !== "password"),
    [formFields],
  );

  const handleCreate = (data: any) => {
    const { zoneId, ...rest } = data;
    const payload = {
      ...rest,
      roleId: Number(data.roleId),
      warehouseSubId:
        String(data.roleId) === String(gateRoleId) ? data.zoneId : null,
    };

    return createData(payload);
  };

  const handleUpdate = (data: any): Promise<any> => {
    const { id, zoneId, ...rest } = data;
    if (!id) return Promise.reject(new Error("ID is required"));

    const payload = Object.fromEntries(
      Object.entries({
        username: rest.username,
        firstName: rest.firstName,
        lastName: rest.lastName,
        phone: rest.phone,
        email: rest.email,
        isActive: rest.isActive,
        roleId: rest.roleId ? Number(rest.roleId) : undefined,
        warehouseSubId:
          String(rest.roleId) === String(gateRoleId) ? zoneId : undefined,
      }).filter(([_, v]) => v !== undefined && v !== null && v !== ""),
    );
    return updateData(id, payload);
  };

  const handleHardDelete = async (id: number): Promise<void> => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      await fetch(`${EndPoint}user/${id}/hard`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      await fetchAll();
    } catch (error) {
      console.error("Hard delete failed:", error);
    }
  };

  const handleResetPassword = async () => {
    setPasswordError(""); // Reset error setiap kali submit ditekan

    if (!newPassword) {
      setPasswordError("Password tidak boleh kosong");
      return;
    }

    // VALIDASI REGEX MANUAL UNTUK MODAL RESET
    if (!PWD_REGEX.test(newPassword)) {
      setPasswordError("Minimal 8 karakter (kombinasi huruf & angka)");
      return;
    }

    try {
      const payload = { password: newPassword };
      await updateData(resetPasswordId!, payload);
      setResetPasswordId(null);
      setNewPassword("");
      fetchAll();
    } catch (error) {
      setPasswordError("Gagal memperbarui password");
    }
  };

  const columns = useMemo(
    () => [
      { accessorKey: "username", header: "Username" },
      { accessorKey: "firstName", header: "First Name" },
      { accessorKey: "lastName", header: "Last Name" },
      { accessorKey: "phone", header: "Phone" },
      { accessorKey: "email", header: "Email" },
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
    [roles],
  );

  // Mapping data dari API response ke flat structure untuk UI
  const mapUserToFlat = (user: any) => ({
    id: user.id,
    username: user.username,
    password: user.password,
    isActive: user.isActive,
    roleId: user.roleId,
    role: user.role,
    // Flatten dari userDetail
    firstName: user.userDetail?.firstName ?? "",
    lastName: user.userDetail?.lastName ?? "",
    email: user.userDetail?.email ?? "",
    phone: user.userDetail?.phone ?? "",
    employeeId: user.userDetail?.employee_id ?? "",
    organizationId: user.userDetail?.organizationId ?? "",
  });

  // Tambahkan mapping saat render
  const mappedUserData = useMemo(
    () => (userData ?? []).map(mapUserToFlat),
    [userData],
  );

  return (
    <>
      <div className="p-4 bg-white shadow rounded-md mb-5">
        <div className="flex justify-between items-center">
          <div className="space-x-4 flex items-center">
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
            <FaPlus className="mr-2" /> Add Data
          </Button>
        </div>
      </div>

      <DynamicTable
        data={mappedUserData}
        globalFilter={debouncedSearch}
        isCreateModalOpen={isCreateModalOpen}
        onCloseCreateModal={() => setCreateModalOpen(false)}
        columns={columns}
        formFields={formFields}
        updateFormFields={updateFormFields}
        onSubmit={handleCreate}
        onUpdate={handleUpdate}
        onDelete={handleHardDelete}
        onRefresh={fetchAll}
        getRowId={(row) => row.id}
        title="Form Data User"
        onResetPassword={(id) => {
          setResetPasswordId(id);
          setPasswordError(""); // Clear error saat buka modal baru
          setNewPassword("");
        }}
      />

      {/* Modal Reset Password */}
      {resetPasswordId && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setResetPasswordId(null)}
          />

          <div className="relative bg-white w-full max-w-sm overflow-hidden rounded-2xl shadow-2xl ring-1 ring-black/5 animate-in zoom-in-95 duration-200">
            <div className="px-6 pt-8 pb-4 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
                <FaLock className="h-5 w-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                Reset Password
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Masukkan password baru untuk user ini
              </p>
            </div>

            <div className="px-6 py-4 space-y-4">
              <div className="space-y-1 text-left">
                <label className="text-xs font-semibold text-gray-600 ml-1">
                  Password Baru
                </label>
                <div className="relative group">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className={`w-full pr-10 rounded-xl transition-all duration-200 outline-none ${
                      passwordError
                        ? "border-red-500 ring-1 ring-red-500"
                        : "border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    }`}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (passwordError) setPasswordError(""); // Hapus error saat user mengetik ulang
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-blue-600 transition-colors focus:outline-none"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <FaEyeSlash className="text-lg" />
                    ) : (
                      <FaEye className="text-lg" />
                    )}
                  </button>
                </div>
                {passwordError && (
                  <p className="text-[11px] text-red-500 mt-1 ml-1 font-medium">
                    {passwordError}
                  </p>
                )}

                {/* Petunjuk Password (UX Guide) */}
                {!passwordError && (
                  <div className="mt-2 space-y-1">
                    <p
                      className={`text-[10px] ${newPassword.length >= 8 ? "text-green-600 font-semibold" : "text-gray-400"}`}
                    >
                      {newPassword.length >= 8 ? "✓" : "○"} Minimal 8 karakter
                    </p>
                    <p
                      className={`text-[10px] ${PWD_REGEX.test(newPassword) ? "text-green-600 font-semibold" : "text-gray-400"}`}
                    >
                      {PWD_REGEX.test(newPassword) ? "✓" : "○"} Kombinasi huruf
                      & angka
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-end">
              <Button
                variant="danger"
                className="text-gray-600 hover:bg-gray-200 font-medium"
                onClick={() => setResetPasswordId(null)}
              >
                Batal
              </Button>
              <Button
                variant="secondary"
                className="bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-200 px-6 font-medium transition-all active:scale-95"
                onClick={handleResetPassword}
              >
                Update Password
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DataTable;
