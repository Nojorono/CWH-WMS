import { useEffect, useMemo, useState } from "react";
import {
  FaPlus,
  FaEye,
  FaEyeSlash,
  FaLock,
  FaCheckCircle,
} from "react-icons/fa";
import Input from "../../../../components/form/input/InputField";
import Label from "../../../../components/form/Label";
import Button from "../../../../components/ui/button/Button";
import { useDebounce } from "../../../../helper/useDebounce";
import DynamicTable from "../../../../components/wms-components/DynamicTable";
import {
  useStoreUser,
  useStoreSubWarehouse,
  useStoreIo,
} from "../../../../DynamicAPI/stores/Store/MasterStore";
import { useRoleStore } from "../../../../API/store/MasterStore";
import { UserVerifyService } from "../../../../DynamicAPI/services/Service/UserVerifyService";
import { showErrorToast, showSuccessToast } from "../../../../components/toast";

const DataTable = () => {
  const { list: userData, createData, updateData, fetchAll } = useStoreUser();
  const { list: subWarehouseList, fetchAll: fetchSubWarehouses } =
    useStoreSubWarehouse();
  const { fetchRoles, roles } = useRoleStore();
  const { list: IoList, fetchAll: fetchIO } = useStoreIo();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  // State Verifikasi NIK
  const [isNikVerified, setIsNikVerified] = useState(false);
  const [nikLoading, setNikLoading] = useState(false);
  const [nikInput, setNikInput] = useState("");

  // State untuk Reset Password
  const [resetPasswordId, setResetPasswordId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    fetchAll();
    fetchRoles();
    fetchSubWarehouses();
    fetchIO();
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

  const PWD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;

  const formFields = useMemo(
    () => [
      {
        name: "roleId",
        label: "Role",
        type: "select",
        options:
          roles
            ?.filter((role: any) => role.name !== "superadmin")
            ?.map((role: any) => ({
              label: role.name,
              value: role.id,
            })) || [],
        validation: { required: "Required" },
        onChange: () => {
          setIsNikVerified(false);
          setNikInput("");
        },
      },
      {
        name: "nik_verify_section",
        label: "Verifikasi NIK",
        type: "custom",
        hiddenWhen: (values: any) => {
          const selectedRole = roles?.find(
            (r: any) => String(r.id) === String(values.roleId),
          );
          return !values.roleId || selectedRole?.name === "HELPER";
        },
        renderCustom: ({ setValue }: { setValue: any }) => {
          const handleVerify = async () => {
            if (!nikInput)
              return showErrorToast("Masukkan NIK terlebih dahulu");

            setNikLoading(true);
            try {
              const res = await UserVerifyService.verifyEmployee(nikInput);

              if (res.valid) {
                setIsNikVerified(true);

                // 1. Simpan Employee Number (NIK) untuk payload create
                setValue("employeeId", res.data.employee_number);

                // 2. Auto-fill Nama (First & Last Name)
                if (res.data.employee_name) {
                  const names = res.data.employee_name.trim().split(" ");
                  setValue("firstName", names[0] || "");
                  setValue(
                    "lastName",
                    names.length > 1 ? names.slice(1).join(" ") : "-",
                  );
                }

                // 3. Auto-fill Organization/IO
                if (res.data.organization_id) {
                  setValue("organizationId", String(res.data.organization_id));
                }

                showSuccessToast(
                  `Karyawan Ditemukan: ${res.data.employee_name}`,
                );
              } else {
                showErrorToast("NIK tidak terdaftar di database pusat!");
                setIsNikVerified(false);
              }
            } catch (err: any) {
              showErrorToast("Gagal verifikasi: Koneksi server bermasalah");
            } finally {
              setNikLoading(false);
            }
          };

          return (
            <div className="space-y-2 border-l-4 border-blue-500 pl-3 py-1 bg-blue-50/50 rounded-r-md">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Masukkan NIK Karyawan..."
                  className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-400 outline-none transition-all"
                  value={nikInput}
                  onChange={(e) => {
                    setNikInput(e.target.value);
                    setIsNikVerified(false);
                  }}
                />
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleVerify}
                  disabled={nikLoading || !nikInput}
                >
                  {nikLoading ? "..." : "Verify"}
                </Button>
              </div>
              {isNikVerified && (
                <p className="text-[11px] text-green-600 font-bold flex items-center gap-1">
                  <FaCheckCircle /> NIK Terverifikasi & Data Sinkron.
                </p>
              )}
            </div>
          );
        },
      },
      {
        name: "organizationId",
        label: "Organization / IO",
        type: "select",
        options:
          IoList?.map((io: any) => ({
            label: io.organization_name,
            value: io.id,
          })) || [],
        validation: { required: "Required" },
        hiddenWhen: (values: any) => {
          const selectedRole = roles?.find(
            (r: any) => String(r.id) === String(values.roleId),
          );
          if (selectedRole?.name === "HELPER") return false;
          return !isNikVerified;
        },
      },
      {
        name: "username",
        label: "Username",
        type: "username",
        validation: { required: "Required" },
        hiddenWhen: (values: any) => {
          const selectedRole = roles?.find(
            (r: any) => String(r.id) === String(values.roleId),
          );
          if (selectedRole?.name === "HELPER") return false;
          return !isNikVerified;
        },
      },
      {
        name: "firstName",
        label: "First Name",
        type: "text",
        validation: { required: "Required" },
        hiddenWhen: (values: any) => {
          const selectedRole = roles?.find(
            (r: any) => String(r.id) === String(values.roleId),
          );
          if (selectedRole?.name === "HELPER") return false;
          return !isNikVerified;
        },
      },
      {
        name: "lastName",
        label: "Last Name",
        type: "text",
        validation: { required: "Required" },
        hiddenWhen: (values: any) => {
          const selectedRole = roles?.find(
            (r: any) => String(r.id) === String(values.roleId),
          );
          if (selectedRole?.name === "HELPER") return false;
          return !isNikVerified;
        },
      },
      {
        name: "email",
        label: "Email",
        type: "email",
        validation: { required: "Required" },
        hiddenWhen: (values: any) => {
          const selectedRole = roles?.find(
            (r: any) => String(r.id) === String(values.roleId),
          );
          if (selectedRole?.name === "HELPER") return false;
          return !isNikVerified;
        },
      },
      {
        name: "phone",
        label: "Phone",
        type: "phone",
        validation: { required: "Required" },
        hiddenWhen: (values: any) => {
          const selectedRole = roles?.find(
            (r: any) => String(r.id) === String(values.roleId),
          );
          if (selectedRole?.name === "HELPER") return false;
          return !isNikVerified;
        },
      },
      {
        name: "password",
        label: "Password",
        type: "password",
        validation: {
          required: "Password wajib diisi",
          minLength: { value: 8, message: "Password minimal harus 8 karakter" },
          pattern: { value: PWD_REGEX, message: "Kombinasi huruf dan angka" },
        },
        hiddenWhen: (values: any) => {
          const selectedRole = roles?.find(
            (r: any) => String(r.id) === String(values.roleId),
          );
          if (selectedRole?.name === "HELPER") return false;
          return !isNikVerified;
        },
      },
      {
        name: "zoneId",
        label: "Zone (Gate Only)",
        type: "select",
        options: gateZoneOptions,
        validation: { required: "Required" },
        hiddenWhen: (values: any) => {
          if (!values?.roleId || !gateRoleId) return true;
          const selectedRole = roles?.find(
            (r: any) => String(r.id) === String(values.roleId),
          );
          if (selectedRole?.name !== "HELPER" && !isNikVerified) return true;
          return String(values.roleId) !== String(gateRoleId);
        },
      },
      {
        name: "isActive",
        label: "is Active?",
        type: "checkbox",
        onlyUpdate: true,
      },
    ],
    [
      roles,
      gateZoneOptions,
      gateRoleId,
      IoList,
      isNikVerified,
      nikLoading,
      nikInput,
    ],
  );

  const createFormFields = useMemo(
    () => formFields.filter((f) => !f.onlyUpdate),
    [formFields],
  );
  const updateFormFields = useMemo(
    () => formFields.filter((f) => f.name !== "password"),
    [formFields],
  );

  const handleCreate = (data: any) => {
    const selectedRole = roles?.find(
      (r: any) => String(r.id) === String(data.roleId),
    );
    if (selectedRole?.name !== "HELPER" && !isNikVerified) {
      showErrorToast("Harap verifikasi NIK terlebih dahulu!");
      return Promise.reject();
    }

    const { zoneId, organizationId, nik_verify_section, ...rest } = data;
    const payload = {
      ...rest,
      roleId: Number(data.roleId),
      organizationId: String(organizationId),
      warehouseSubId:
        String(data.roleId) === String(gateRoleId) ? data.zoneId : null,
    };
    return createData(payload);
  };

  const handleUpdate = (data: any): Promise<any> => {
    const { id, zoneId, organizationId, ...rest } = data;
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
        organizationId: String(organizationId),
        warehouseSubId:
          String(rest.roleId) === String(gateRoleId) ? zoneId : undefined,
      }).filter(([_, v]) => v !== undefined && v !== null && v !== ""),
    );
    return updateData(id, payload);
  };

  const handleResetPassword = async () => {
    setPasswordError("");
    if (!newPassword) return setPasswordError("Password tidak boleh kosong");
    if (!PWD_REGEX.test(newPassword))
      return setPasswordError("Minimal 8 karakter (kombinasi huruf & angka)");

    try {
      await updateData(resetPasswordId!, { password: newPassword });
      showSuccessToast("Password berhasil diperbarui");
      setResetPasswordId(null);
      setNewPassword("");
      fetchAll();
    } catch (error) {
      setPasswordError("Gagal memperbarui password");
    }
  };

  const columns = useMemo(
    () => [
      { accessorKey: "organizationId", header: "Organization/Io" },
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

  const mapUserToFlat = (user: any) => ({
    id: user.id,
    username: user.username,
    isActive: user.isActive,
    roleId: user.roleId,
    role: user.role,
    firstName: user.userDetail?.firstName ?? "",
    lastName: user.userDetail?.lastName ?? "",
    email: user.userDetail?.email ?? "",
    phone: user.userDetail?.phone ?? "",
    employeeId: user.userDetail?.employee_id ?? "",
    organizationId: user.userDetail?.organizationId ?? "",
  });

  const mappedUserData = useMemo(
    () =>
      (userData ?? [])
        .map(mapUserToFlat)
        .filter((user: any) => user.role?.name !== "superadmin"),
    [userData],
  );

  const handleDelete = async (id: any) => {
    await updateData(id, { isActive: false });
  };

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
            onClick={() => {
              setIsNikVerified(false);
              setNikInput("");
              setCreateModalOpen(true);
            }}
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
        formFields={createFormFields}
        updateFormFields={updateFormFields}
        onSubmit={handleCreate}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        onRefresh={fetchAll}
        getRowId={(row) => row.id}
        title="Form Data User"
        onResetPassword={(id) => {
          setResetPasswordId(id);
          setPasswordError("");
          setNewPassword("");
        }}
      />

      {resetPasswordId && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setResetPasswordId(null)}
          />
          <div className="relative bg-white w-full max-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="text-center mb-6">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
                <FaLock className="h-5 w-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                Reset Password
              </h2>
              <p className="text-sm text-gray-500">
                Masukkan password baru untuk user ini
              </p>
            </div>

            <div className="space-y-4 text-left">
              <label className="text-xs font-semibold text-gray-600 ml-1">
                Password Baru
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (passwordError) setPasswordError("");
                  }}
                  className={
                    passwordError ? "border-red-500 ring-1 ring-red-500" : ""
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {passwordError && (
                <p className="text-[11px] text-red-500 ml-1">{passwordError}</p>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <Button variant="danger" onClick={() => setResetPasswordId(null)}>
                Batal
              </Button>
              <Button variant="secondary" onClick={handleResetPassword}>
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
