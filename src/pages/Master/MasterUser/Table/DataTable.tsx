import { useEffect, useMemo, useState } from "react";
import { FaPlus, FaCheckCircle, FaLock } from "react-icons/fa";
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

  // State Utama (Hanya untuk mode Create)
  const [userType, setUserType] = useState<"EMPLOYEE" | "NON" | "">("");
  const [isNikVerified, setIsNikVerified] = useState(false);
  const [nikLoading, setNikLoading] = useState(false);
  const [nikInput, setNikInput] = useState("");
  const [verifiedEmployeeId, setVerifiedEmployeeId] = useState("");

  const [resetPasswordId, setResetPasswordId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    fetchAll();
    fetchRoles();
    fetchSubWarehouses();
    fetchIO();
  }, []);

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
          { label: "NNA Employee", value: "EMPLOYEE" },
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
        // Sembunyikan jika mode Update (values.id ada) atau bukan EMPLOYEE
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
                showSuccessToast(`Terverifikasi: ${res.data.employee_name}`);
              } else {
                showErrorToast("NIK tidak ditemukan!");
              }
            } catch (err) {
              showErrorToast("Gagal verifikasi server");
            } finally {
              setNikLoading(false);
            }
          };

          return (
            <div className="p-3 bg-blue-50 border-l-4 border-blue-500 rounded-r-md space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Input NIK..."
                  className="flex-1 px-3 py-2 border rounded text-sm outline-none"
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
                  disabled={nikLoading}
                >
                  {nikLoading ? "..." : "Verify"}
                </Button>
              </div>
              {isNikVerified && (
                <p className="text-[11px] text-green-600 font-bold flex items-center gap-1">
                  <FaCheckCircle /> Data Karyawan Sinkron.
                </p>
              )}
            </div>
          );
        },
      },
      {
        name: "roleId",
        label: "Role",
        type: "select",
        options:
          roles?.map((role: any) => ({ label: role.name, value: role.id })) ||
          [],
        validation: { required: "Role wajib dipilih" },
        hiddenWhen: (values: any) => {
          if (values.id) return false; // Tampilkan jika mode update
          if (!values.userType) return true;
          if (values.userType === "EMPLOYEE") return !isNikVerified;
          return false;
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
          if (!values.userType) return true;
          if (values.userType === "EMPLOYEE") return !isNikVerified;
          return false;
        },
      },
      {
        name: "username",
        label: "Username",
        type: "text",
        validation: { required: "Required" },
        hiddenWhen: (values: any) => {
          if (values.id) return false;
          if (!values.userType) return true;
          if (values.userType === "EMPLOYEE") return !isNikVerified;
          return false;
        },
      },
      {
        name: "firstName",
        label: "First Name",
        type: "text",
        validation: { required: "Required" },
        hiddenWhen: (values: any) => {
          if (values.id) return false;
          if (!values.userType) return true;
          if (values.userType === "EMPLOYEE") return !isNikVerified;
          return false;
        },
      },
      {
        name: "lastName",
        label: "Last Name",
        type: "text",
        validation: { required: "Required" },
        hiddenWhen: (values: any) => {
          if (values.id) return false;
          if (!values.userType) return true;
          if (values.userType === "EMPLOYEE") return !isNikVerified;
          return false;
        },
      },
      {
        name: "email",
        label: "Email",
        type: "email",
        validation: { required: "Required" },
        hiddenWhen: (values: any) => {
          if (values.id) return false;
          if (!values.userType) return true;
          if (values.userType === "EMPLOYEE") return !isNikVerified;
          return false;
        },
      },
      {
        name: "phone",
        label: "Phone",
        type: "text",
        validation: { required: "Required" },
        hiddenWhen: (values: any) => {
          if (values.id) return false;
          if (!values.userType) return true;
          if (values.userType === "EMPLOYEE") return !isNikVerified;
          return false;
        },
      },
      {
        name: "password",
        label: "Password",
        type: "password",
        validation: {
          required: "Wajib diisi",
          minLength: { value: 8, message: "Min 8 karakter" },
          pattern: { value: PWD_REGEX, message: "Huruf & Angka" },
        },
        hiddenWhen: (values: any) => {
          if (values.id) return true; // Sembunyikan di update mode (pakai fungsi Reset Password)
          if (!values.userType) return true;
          if (values.userType === "EMPLOYEE") return !isNikVerified;
          return false;
        },
      },
      {
        name: "zoneId",
        label: "Zone (Gate Only)",
        type: "select",
        options: gateZoneOptions,
        validation: { required: "Required" },
        hiddenWhen: (values: any) => {
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
    ],
  );

  const handleCreate = (data: any) => {
    const {
      zoneId,
      organizationId,
      userType: type,
      nik_verify_section,
      ...rest
    } = data;

    const payload = {
      ...rest,
      employeeId: userType === "EMPLOYEE" ? verifiedEmployeeId : "NON",
      roleId: Number(data.roleId),
      organizationId: String(organizationId),
      warehouseSubId:
        String(data.roleId) === String(gateRoleId) ? data.zoneId : null,
    };

    return createData(payload);
  };

  const handleUpdate = async (data: any): Promise<any> => {
    const { id, zoneId, organizationId, userType, ...rest } = data;
    const payload = {
      username: rest.username,
      isActive: rest.isActive ?? true,
      roleId: rest.roleId ? Number(rest.roleId) : undefined,
      employeeId: rest.employeeId, // Diambil dari mapping data table
      email: rest.email,
      phone: rest.phone,
      organizationId: organizationId ? String(organizationId) : undefined,
      warehouseSubId:
        String(rest.roleId) === String(gateRoleId) ? String(zoneId) : null,
      firstName: rest.firstName,
      lastName: rest.lastName,
    };

    // 3. Bersihkan payload dari nilai undefined/null string yang kosong
    const cleanPayload = Object.fromEntries(
      Object.entries(payload).filter(([_, v]) => v !== undefined && v !== ""),
    );

    return updateData(id, cleanPayload);
  };

  return (
    <>
      <div className="p-4 bg-white shadow rounded-md mb-5 text-sm">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Label htmlFor="search">Search</Label>
            <Input
              onChange={(e) => setSearch(e.target.value)}
              type="text"
              placeholder="🔍 Cari data.."
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
        data={(userData ?? []).map((u: any) => ({
          ...u,
          id: u.id,
          // Mapping data ke struktur FLAT agar form mudah membacanya saat edit
          username: u.username,
          isActive: u.isActive,
          roleId: u.roleId,
          employeeId: u.employeeId,
          firstName: u.userDetail?.firstName ?? "",
          lastName: u.userDetail?.lastName ?? "",
          email: u.userDetail?.email ?? "",
          phone: u.userDetail?.phone ?? "",
          organizationId: u.userDetail?.organizationId ?? "",
          zoneId: u.warehouseSubId ?? "",
          userType: u.employeeId === "NON" ? "NON" : "EMPLOYEE",
        }))}
        globalFilter={debouncedSearch}
        isCreateModalOpen={isCreateModalOpen}
        onCloseCreateModal={() => setCreateModalOpen(false)}
        columns={useMemo(
          () => [
            { accessorKey: "organizationId", header: "Organization Id" },
            { accessorKey: "username", header: "Username" },
            {
              accessorKey: "firstName",
              header: "Name",
              cell: (info: any) =>
                `${info.row.original.firstName} ${info.row.original.lastName}`,
            },
            {
              accessorKey: "roleId",
              header: "Role",
              cell: (info: any) =>
                roles?.find((r: any) => r.id === info.getValue())?.name || "-",
            },
            {
              accessorKey: "isActive",
              header: "Status",
              cell: (info: any) =>
                info.getValue() ? "✅ Active" : "❌ Inactive",
            },
          ],
          [roles],
        )}
        formFields={formFields.filter((f) => f.name !== "isActive")}
        updateFormFields={formFields.filter(
          (f) =>
            !["password", "userType", "nik_verify_section"].includes(f.name),
        )}
        onSubmit={handleCreate}
        onUpdate={handleUpdate}
        onDelete={async (id) => {
          await updateData(id, { isActive: false });
        }}
        onRefresh={fetchAll}
        getRowId={(row) => row.id}
        title="Management User WMS"
        onResetPassword={(id) => {
          setResetPasswordId(id);
          setNewPassword("");
        }}
      />

      {/* Modal Reset Password */}
      {resetPasswordId && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-xl p-6 shadow-xl">
            <div className="text-center mb-6">
              <h2 className="text-lg font-bold mb-4">Reset Password</h2>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
                <FaLock className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Password Baru"
            />
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="danger" onClick={() => setResetPasswordId(null)}>
                Batal
              </Button>
              <Button
                variant="secondary"
                onClick={async () => {
                  await updateData(resetPasswordId, { password: newPassword });
                  setResetPasswordId(null);
                  fetchAll();
                }}
              >
                Update
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DataTable;
