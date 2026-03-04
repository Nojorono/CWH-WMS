import { useEffect, useMemo, useState } from "react";
import { FaPlus } from "react-icons/fa";
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

  const [resetPasswordId, setResetPasswordId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState("");

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
        type: "username",
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
    [roles, gateZoneOptions, gateRoleId],
  );

  const updateFormFields = useMemo(
    () => formFields.filter((f) => f.name !== "password"),
    [formFields],
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

  const handleUpdate = (data: any): Promise<any> => {
    const { id, zoneId, ...rest } = data;

    if (!id) {
      return Promise.reject(new Error("ID is required for update"));
    }

    const payload = Object.fromEntries(
      Object.entries({
        username: rest.username,
        isActive: rest.isActive,
        roleId: rest.roleId ? Number(rest.roleId) : undefined,
        employeeId: rest.employeeId,
        email: rest.email,
        phone: rest.phone,
        organizationId: rest.organizationId,
        warehouseSubId:
          String(rest.roleId) === String(gateRoleId) ? zoneId : undefined,
      }).filter(([_, v]) => v !== undefined && v !== null && v !== ""),
    );

    console.log("Final Update Payload:", payload);
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
    [roles],
  );

  const handleResetPassword = async () => {
    if (!resetPasswordId || !newPassword) return;

    const payload = { password: newPassword };
    await updateData(resetPasswordId, payload);
    setResetPasswordId(null);
    setNewPassword("");
    fetchAll();
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
        data={userData}
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
        title="Form Data"
        onResetPassword={(id) => setResetPasswordId(id)}
      />

      {/* Modal Reset Password */}
      {resetPasswordId && (
        <div className="fixed inset-0 z-1000 flex items-center justify-center p-4">
          {/* Overlay dengan Backdrop Blur agar terasa premium */}
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setResetPasswordId(null)}
          />

          {/* Modal Container */}
          <div className="relative bg-white w-full max-w-sm overflow-hidden rounded-2xl shadow-2xl ring-1 ring-black/5 animate-in zoom-in-95 duration-200">
            {/* Header dengan sedikit aksen warna */}
            <div className="px-6 pt-8 pb-4 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
                <svg
                  className="h-6 w-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                Reset Password
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Enter new password
              </p>
            </div>

            {/* Body */}
            <div className="px-6 py-4 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700 ml-1">
                  Password Baru
                </label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  className="w-full border-gray-200 focus:ring-blue-500 focus:border-blue-500 rounded-lg transition-all"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
            </div>

            {/* Footer / Actions */}
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
                Submit
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DataTable;
