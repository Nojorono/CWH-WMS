import { useEffect, useMemo, useState } from "react";
import { FaPlus, FaLock, FaCheckCircle } from "react-icons/fa";
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
import { UserVerifyService } from "../../../../DynamicAPI/services/Service/UserVerifyService";
import { showErrorToast, showSuccessToast } from "../../../../components/toast";
import { usePersistAuthStore } from "../../../../API/store/AuthStore/PersistAuthStore";

const DataTable = () => {
  const {
    list: userData,
    createData,
    updateData,
    fetchAll,
    deleteData,
  } = useStoreUser();

  const { list: subWarehouseList, fetchAll: fetchSubWarehouses } =
    useStoreSubWarehouse();

  const { fetchRoles, roles } = useRoleStore();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  const [userType, setUserType] = useState<"EMPLOYEE" | "NON" | "">("");
  const [isNikVerified, setIsNikVerified] = useState(false);
  const [nikLoading, setNikLoading] = useState(false);
  const [nikInput, setNikInput] = useState("");
  const [verifiedEmployeeId, setVerifiedEmployeeId] = useState("");

  const [resetPasswordId, setResetPasswordId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const [editNikInput, setEditNikInput] = useState("");
  const [isEditNikVerified, setIsEditNikVerified] = useState(false);
  const [editNikLoading, setEditNikLoading] = useState(false);

  const normalizeStorageValue = (val: string | null) => {
    if (!val) return "";
    const cleaned = String(val).trim();
    if (!cleaned || cleaned === "undefined" || cleaned === "null") return "";
    return cleaned;
  };

  const globalIoList = usePersistAuthStore((state) => state.ioList) || [];
  const user = usePersistAuthStore((state) => state.user);

  useEffect(() => {
    fetchAll();
    fetchRoles();
    fetchSubWarehouses();
  }, []);

  const IoList = useMemo(() => {
    const organizationId = user?.userDetail?.organization?.id || null;
    if (!organizationId) return globalIoList;
    return globalIoList.filter(
      (io: any) => String(io?.id) === String(organizationId),
    );
  }, [globalIoList, user]);

  const gateRoleId = useMemo(
    () => roles?.find((r: any) => r.name === "GATE")?.id,
    [roles],
  );

  const gateZoneOptions = useMemo(() => {
    return (
      subWarehouseList
        ?.filter((zone: any) => zone.is_gate === true)
        ?.map((zone: any) => ({ label: zone.name, value: zone.id })) || []
    );
  }, [subWarehouseList]);

  const PWD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;

  const formFields = useMemo(
    () => [
      {
        name: "userType",
        label: "Tipe User",
        type: "select",
        options: [
          { label: "Internal Employee", value: "EMPLOYEE" },
          { label: "Non-Employee / External", value: "NON" },
        ],
        validation: { required: "Pilih tipe user terlebih dahulu" },
        onChange: (val: any) => {
          setUserType(val);
          setIsNikVerified(false);
          setNikInput("");
          setVerifiedEmployeeId("");
        },
      },
      {
        name: "nik_verify_section",
        label: "Verifikasi NIK",
        type: "custom",
        // HANYA muncul saat CREATE dan tipe EMPLOYEE
        hiddenWhen: (values: any) =>
          !!values.id || values.userType !== "EMPLOYEE",
        renderCustom: ({ setValue }: { setValue: any }) => {
          const handleVerify = async () => {
            if (!nikInput)
              return showErrorToast("Masukkan NIK terlebih dahulu");
            setNikLoading(true);
            try {
              const res = await UserVerifyService.verifyEmployee(nikInput);
              if (res.valid) {
                setIsNikVerified(true);
                setVerifiedEmployeeId(res.data.employee_number);
                setValue(
                  "firstName",
                  res.data.employee_name?.split(" ")[0] || "",
                );
                setValue(
                  "lastName",
                  res.data.employee_name?.split(" ").slice(1).join(" ") || "-",
                );
                if (res.data.organization_id) {
                  setValue("organizationId", String(res.data.organization_id));
                }
                showSuccessToast(
                  `Karyawan Ditemukan: ${res.data.employee_name}`,
                );
              } else {
                showErrorToast("NIK tidak terdaftar!");
              }
            } catch (err) {
              showErrorToast("Gagal verifikasi server");
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
                  className="flex-1 px-3 py-2 border rounded-md text-sm outline-none"
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
                  <FaCheckCircle /> NIK Terverifikasi.
                </p>
              )}
            </div>
          );
        },
      },
      {
        name: "employeeId",
        label: "Employee ID / NIK",
        type: "text",
        validation: { required: "Employee ID wajib diisi" },
        hiddenWhen: (values: any) => !values.id, // Hanya tampil saat EDIT
      },
      {
        name: "manualEmployeeId",
        label: "Id Non-Employee",
        type: "text",
        placeholder: "Masukkan ID (Akan jadi prefix NON-ID)",
        validation: { required: "ID wajib diisi untuk tipe Non-Employee" },
        hiddenWhen: (values: any) => !!values.id || values.userType !== "NON",
      },
      {
        name: "roleId",
        label: "Role",
        type: "select",
        options:
          roles
            ?.filter((r: any) => r.name !== "superadmin")
            .map((role: any) => ({ label: role.name, value: role.id })) || [],
        validation: { required: "Role wajib dipilih" },
        hiddenWhen: (values: any) => {
          if (values.id) return false; // Selalu tampil saat update
          return (
            !values.userType ||
            (values.userType === "EMPLOYEE" && !isNikVerified)
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
          if (values.id) return false;
          return (
            !values.userType ||
            (values.userType === "EMPLOYEE" && !isNikVerified)
          );
        },
      },
      {
        name: "username",
        label: "Username",
        type: "text",
        validation: { required: "Required" },
        hiddenWhen: (values: any) => {
          if (values.id) return false;
          return (
            !values.userType ||
            (values.userType === "EMPLOYEE" && !isNikVerified)
          );
        },
      },
      {
        name: "firstName",
        label: "First Name",
        type: "text",
        validation: { required: "Required" },
        hiddenWhen: (values: any) => {
          if (values.id) return false;
          return (
            !values.userType ||
            (values.userType === "EMPLOYEE" && !isNikVerified)
          );
        },
      },
      {
        name: "lastName",
        label: "Last Name",
        type: "text",
        validation: { required: "Required" },
        hiddenWhen: (values: any) => {
          if (values.id) return false;
          return (
            !values.userType ||
            (values.userType === "EMPLOYEE" && !isNikVerified)
          );
        },
      },
      {
        name: "email",
        label: "Email",
        type: "email",
        validation: { required: "Required" },
        hiddenWhen: (values: any) => {
          if (values.id) return false;
          return (
            !values.userType ||
            (values.userType === "EMPLOYEE" && !isNikVerified)
          );
        },
      },
      {
        name: "phone",
        label: "Phone",
        type: "text",
        validation: { required: "Required" },
        hiddenWhen: (values: any) => {
          if (values.id) return false;
          return (
            !values.userType ||
            (values.userType === "EMPLOYEE" && !isNikVerified)
          );
        },
      },
      {
        name: "password",
        label: "Password",
        type: "password",
        validation: {
          required: "Password wajib diisi",
          minLength: { value: 8, message: "Minimal 8 karakter" },
          pattern: { value: PWD_REGEX, message: "Kombinasi huruf & angka" },
        },
        hiddenWhen: (values: any) => {
          if (values.id) return true; // Sembunyikan saat UPDATE
          return (
            !values.userType ||
            (values.userType === "EMPLOYEE" && !isNikVerified)
          );
        },
      },
      {
        name: "zoneId",
        label: "Zone (Gate Only)",
        type: "select",
        options: gateZoneOptions,
        validation: { required: "Required" },
        hiddenWhen: (values: any) => {
          // Tampil hanya jika role-nya GATE
          return String(values.roleId) !== String(gateRoleId);
        },
      },
      {
        name: "isActive",
        label: "is Active?",
        type: "checkbox",
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
      editNikInput, // ← tambah
      isEditNikVerified, // ← tambah
      editNikLoading, // ← tambah
    ],
  );

  const handleCreate = (data: any) => {
    const {
      zoneId,
      organizationId,
      userType: type,
      nik_verify_section,
      manualEmployeeId,
      ...rest
    } = data;

    const payload = {
      ...rest,
      employeeId:
        userType === "EMPLOYEE"
          ? verifiedEmployeeId
          : `NON-${manualEmployeeId}`,
      roleId: Number(data.roleId),
      organizationId: String(organizationId),
      warehouseSubId:
        String(data.roleId) === String(gateRoleId) ? data.zoneId : null,
    };

    return createData(payload);
  };

  const handleUpdate = async (data: any): Promise<any> => {
    const { id, zoneId, organizationId, userType, ...rest } = data;

    // Sesuai kebutuhan Payload Update Anda
    const payload = {
      username: rest.username,
      isActive: rest.isActive,
      roleId: rest.roleId ? Number(rest.roleId) : 0,
      employeeId: rest.employeeId,
      email: rest.email,
      phone: rest.phone,
      organizationId: organizationId ? String(organizationId) : "",
      warehouseSubId:
        String(rest.roleId) === String(gateRoleId) ? String(zoneId) : null,
      firstName: rest.firstName,
      lastName: rest.lastName,
    };

    // Filter undefined saja, nilai null (warehouseSubId) atau "" tetap dikirim jika memang kontrak API-nya string/null
    const cleanPayload = Object.fromEntries(
      Object.entries(payload).filter(([_, v]) => v !== undefined),
    );

    return updateData(id, cleanPayload);
  };

  const handleResetPassword = async () => {
    if (!newPassword || !PWD_REGEX.test(newPassword))
      return setPasswordError("Min 8 karakter (Huruf & Angka)");
    try {
      await updateData(resetPasswordId!, { password: newPassword });
      showSuccessToast("Password berhasil diperbarui");
      setResetPasswordId(null);
      fetchAll();
    } catch (error) {
      setPasswordError("Gagal memperbarui password");
    }
  };

  const mappedUserData = useMemo(
    () =>
      (userData ?? [])
        .map((user: any) => ({
          ...user, // Bawa semua data asli (id, employeeId, dll)
          id: user.id,
          username: user.username,
          isActive: user.isActive,
          roleId: user.roleId,
          role: user.role,
          // Buat data menjadi FLAT agar form otomatis terisi (defaultValue)
          firstName: user.userDetail?.firstName ?? "",
          lastName: user.userDetail?.lastName ?? "",
          email: user.userDetail?.email ?? "",
          phone: user.userDetail?.phone ?? "",
          organizationId: user.userDetail?.organizationId ?? "",
          zoneId: user.warehouseSubId ?? "",
          // userType untuk logika internal form
          userType: user.employeeId?.startsWith("NON-") ? "NON" : "EMPLOYEE",
          employeeId: user.userDetail?.employee_id ?? user.employeeId ?? "",
        }))
        .filter((user: any) => user.role?.name !== "superadmin"),
    [userData],
  );

  const handleDelete = async (id: any) => {
    // await updateData(id, { isActive: false });
    await deleteData(id);
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
              setUserType("");
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
        columns={[
          {
            accessorKey: "organization_id",
            header: "Organization",
            cell: ({ row }: { row: { original: any } }) => {
              const rowOrgId = row.original.organizationId;

              const org = IoList.find(
                (item: any) => String(item.id) === String(rowOrgId),
              );

              return (
                <span className="">
                  {org ? org.organization_name : `ID Not Found: ${rowOrgId}`}
                </span>
              );
            },
          },
          { accessorKey: "username", header: "Username" },
          { accessorKey: "firstName", header: "First Name" },
          { accessorKey: "lastName", header: "Last Name" },
          { accessorKey: "employeeId", header: "Employee Id" },

          {
            accessorKey: "roleId",
            header: "Role",
            cell: (info: any) =>
              roles?.find((r: any) => r.id === info.getValue())?.name || "-",
          },
          {
            accessorKey: "isActive",
            header: "Active",
            cell: (info: any) =>
              info.getValue() ? "✅ Active" : "❌ Inactive",
          },
        ]}
        formFields={formFields.filter((f) => f.name !== "isActive")}
        updateFormFields={formFields.filter(
          (f) =>
            ![
              "password",
              "userType",
              "nik_verify_section",
              "manualEmployeeId",
            ].includes(f.name),
        )}
        onSubmit={handleCreate}
        onUpdate={handleUpdate}
        // onDelete={async (id) => { await updateData(id, { isActive: false }) }}
        onDelete={async (id) => {
          await handleDelete(id);
        }}
        onRefresh={fetchAll}
        getRowId={(row) => row.id}
        title="Form Data User"
        onResetPassword={(id) => {
          setResetPasswordId(id);
          setPasswordError("");
          setNewPassword("");
        }}
      />

      {/* Modal Reset Password */}
      {resetPasswordId && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setResetPasswordId(null)}
          />
          <div className="relative bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl">
            <div className="text-center mb-6">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
                <FaLock className="h-5 w-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                Reset Password
              </h2>
            </div>
            <div className="space-y-4">
              <Input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Password Baru"
              />
              {passwordError && (
                <p className="text-[11px] text-red-500">{passwordError}</p>
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
