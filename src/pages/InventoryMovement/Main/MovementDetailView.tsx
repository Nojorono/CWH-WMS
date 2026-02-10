// NEW
import React, { useEffect, useState } from "react";
import {
  useStoreSubWarehouse,
  useStoreBinByZone,
  useStoreUserManagement,
  useStoreUser,
  useStoreInventoryMovement,
} from "../../../DynamicAPI/stores/Store/MasterStore";
import Select from "../../../components/form/Select";

const MovementDetailView = ({
  data,
  onBack,
}: {
  data: any;
  onBack: () => void;
}) => {
  // State untuk Modal
  const viewOnly = data.viewOnly === true;
  const addOnly = data.addOnly === true;
  const editOnly = data.editOnly === true;

  const [showModal, setShowModal] = useState(false);

  // State untuk Hirarki Form Lokasi
  const [selectedSub, setSelectedSub] = useState("");
  const [selectedBin, setSelectedBin] = useState("");

  // State untuk Input User (Temporary)
  const [selectedDevice, setSelectedDevice] = useState("");
  const [tempUsername, setTempUsername] = useState(""); // Menyimpan username terpilih untuk UI
  const [selectedForklift, setSelectedForklift] = useState("");

  // State untuk Menampung List User yang akan di-assign (Payload Utama)
  const [assignedUsers, setAssignedUsers] = useState<any[]>([]);

  const { fetchAll: fetchZone, list: listZone } = useStoreSubWarehouse();
  const { detail: binList, fetchById: fetchBinList } = useStoreBinByZone();
  const { fetchAll: fetchForklifts, list: listForklifts } =
    useStoreUserManagement();
  const { fetchAll: fetchDeviceId, list: listDeviceId } = useStoreUser();
  const { updateData } = useStoreInventoryMovement();

  useEffect(() => {
    fetchZone();
    fetchForklifts();
    fetchDeviceId();
  }, [fetchZone, fetchForklifts, fetchDeviceId]);

  useEffect(() => {
    if (selectedSub) {
      fetchBinList(selectedSub);
    }
  }, [selectedSub]);

  // Fungsi untuk memasukkan pasangan Device + Driver ke dalam list
  const addUserToList = () => {
    const selectedForkliftDetail = listForklifts?.find(
      (f: any) => f.id === selectedForklift,
    );

    if (selectedDevice && selectedForkliftDetail) {
      const newUser = {
        user_id: selectedDevice, // ID untuk backend
        user_account: tempUsername, // Username untuk tampilan UI
        user_name: selectedForkliftDetail.name || "",
        user_phone: selectedForkliftDetail.phone || "",
      };

      // Cek agar tidak ada duplikasi Device ID
      if (!assignedUsers.find((u) => u.user_id === selectedDevice)) {
        setAssignedUsers([...assignedUsers, newUser]);
      }

      // Reset dropdown dan temporary state
      setSelectedDevice("");
      setTempUsername("");
      setSelectedForklift("");
    }
  };

  const removeUserFromList = (userId: string) => {
    setAssignedUsers(assignedUsers.filter((u) => u.user_id !== userId));
  };

  const resetModalForm = () => {
    setSelectedSub("");
    setSelectedBin("");
    setSelectedForklift("");
    setSelectedDevice("");
    setTempUsername("");
    setAssignedUsers([]);
  };

  const handleSubmit = async () => {
    // Membersihkan field UI (user_account) sebelum dikirim ke backend
    const finalUsers = assignedUsers.map(
      ({ user_id, user_name, user_phone }) => ({
        user_id,
        user_name,
        user_phone,
      }),
    );

    const payload = {
      status: "APPROVED",
      users: finalUsers,
      destination_warehouse_id: data.source_warehouse_id,
      destination_warehouse_sub_id: selectedSub,
      destination_bin_id: selectedBin,
    };

    try {
      console.log("Submitting payload:", payload);
      await updateData(data.id, payload as any);
      onBack();
    } catch (error) {
      console.error("Failed to submit:", error);
    }
  };

  useEffect(() => {
    if (showModal && editOnly) {
      // Isi assignedUsers dari data.users
      setAssignedUsers(
        Array.isArray(data.users)
          ? data.users.map((u: any) => ({
              user_id: u.user_id,
              user_account: u.user?.username || "",
              user_name: u.user_name,
              user_phone: u.user_phone,
            }))
          : [],
      );
      // Isi destination zone & bin dari data
      setSelectedSub(data.destination_warehouse_sub_id || "");
      setSelectedBin(data.destination_bin_id || "");
    }
    // Jika modal ditutup, reset form
    if (!showModal) {
      resetModalForm();
    }
    // eslint-disable-next-line
  }, [showModal, editOnly]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <nav className="text-sm text-orange-500 mb-1"></nav>
          <h2 className="text-xl font-bold text-indigo-900"></h2>
        </div>
        <div className="flex gap-2">
          {!viewOnly && (
            <button
              onClick={() => setShowModal(true)}
              className="bg-orange-500 text-white px-4 py-2 rounded shadow hover:bg-orange-600 transition"
            >
              {editOnly
                ? "Update Forklift & Location"
                : " + Assign Forklift & Select Location"}
            </button>
          )}
          <button
            onClick={onBack}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
          >
            Back
          </button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-500 block">Move Loc ID</label>
            <input
              disabled
              value={data.movement_number}
              className="w-full bg-gray-200 p-2 rounded text-sm border"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block">Status</label>
            <input
              disabled
              value={data.status}
              className="w-full bg-gray-200 p-2 rounded text-sm border"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block">Source Zone</label>
            <input
              disabled
              value={data.sourceWarehouseSub?.name || "-"}
              className="w-full bg-gray-200 p-2 rounded text-sm border"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 block">Source BIN</label>
            <input
              disabled
              value={data.sourceBin?.name || "-"}
              className="w-full bg-gray-200 p-2 rounded text-sm border"
            />
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-500 block">Date</label>
            <input
              disabled
              value={new Date(data.createdAt).toLocaleDateString()}
              className="w-full bg-gray-200 p-2 rounded text-sm border"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block">Move Type</label>
            <input
              disabled
              value={data.movement_type}
              className="w-full bg-gray-200 p-2 rounded text-sm border"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block">
              Destination Zone
            </label>
            <input
              disabled
              value={data.destinationWarehouseSub?.name || "-"}
              className="w-full bg-gray-200 p-2 rounded text-sm border"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block">
              Destination BIN
            </label>
            <input
              disabled
              value={data.destinationBin?.name || "-"}
              className="w-full bg-gray-200 p-2 rounded text-sm border"
            />
          </div>
        </div>
      </div>

      {/* Table Main */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Pallet Table */}
        <div className="bg-white rounded shadow overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-orange-500 text-white text-sm">
              <tr>
                <th className="p-3">Pallet</th>
              </tr>
            </thead>
            <tbody>
              {data.pallets.map((item: any) => (
                <tr key={item.id} className="border-b hover:bg-gray-50 text-sm">
                  <td className="p-3">{item.pallet.pallet_code}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Device User Table */}
        <div className="bg-white rounded shadow overflow-hidden">
          <div className="bg-orange-500 text-white text-sm font-bold p-3">
            Device User List
          </div>
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b text-gray-700">
              <tr>
                <th className="p-3">Device (Username)</th>
                <th className="p-3">Driver Name</th>
                <th className="p-3">Phone</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(data.users) && data.users.length > 0 ? (
                data.users.map((user: any) => (
                  <tr
                    key={user.id}
                    className="border-b hover:bg-gray-50 text-sm"
                  >
                    <td className="p-3">{user.user?.username || "-"}</td>
                    <td className="p-3">{user.user_name || "-"}</td>
                    <td className="p-3">{user.user_phone || "-"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="p-3" colSpan={3}>
                    No device user assigned.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODAL OVERLAY --- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[5000]">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="bg-orange-500 p-6 flex justify-between items-center text-white">
              <h3 className="font-bold text-lg">Assign Forklift Driver</h3>
              <button
                onClick={() => setShowModal(false)}
                className="hover:rotate-90 transition-transform text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="p-8 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* Destination Section */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block uppercase">
                    Destination Zone
                  </label>
                  <Select
                    width={"100%"}
                    options={
                      listZone
                        ?.filter(
                          (s: any) =>
                            s.is_good_stock &&
                            !s.is_gate &&
                            s.name !== data.sourceWarehouseSub?.name,
                        )
                        .map((s: any) => ({ value: s.id, label: s.name })) || []
                    }
                    placeholder="Pilih Zone"
                    onChange={(val) => {
                      setSelectedSub(val);
                      setSelectedBin("");
                    }}
                    value={selectedSub}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block uppercase">
                    Destination Bin
                  </label>
                  <Select
                    width={"100%"}
                    options={
                      Array.isArray(binList)
                        ? binList.map((s: any) => ({
                            value: s.id,
                            label: s.name,
                          }))
                        : []
                    }
                    placeholder="Pilih Bin"
                    onChange={(val) => setSelectedBin(val)}
                    value={selectedBin}
                  />
                </div>
              </div>

              {/* Add User Section */}
              <div className="border-t pt-6">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block uppercase">
                      Select Device
                    </label>
                    <Select
                      width={"100%"}
                      options={
                        listDeviceId
                          ?.filter(
                            (s: any) => s.role?.name === "DRIVER_FORKLIFT",
                          )
                          .map((s: any) => ({
                            value: s.id,
                            label: s.username,
                          })) || []
                      }
                      placeholder="Pilih Akun/Device"
                      onChange={(val: any) => {
                        // Find the selected option's label for username
                        const selectedOption = (
                          listDeviceId
                            ?.filter(
                              (s: any) => s.role?.name === "DRIVER_FORKLIFT",
                            )
                            .map((s: any) => ({
                              value: s.id,
                              label: s.username,
                            })) || []
                        ).find((opt: any) => opt.value === val);
                        setSelectedDevice(val);
                        setTempUsername(selectedOption?.label || "");
                      }}
                      value={selectedDevice}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block uppercase">
                      Select Driver
                    </label>
                    <Select
                      width={"100%"}
                      options={
                        listForklifts
                          ?.filter((s: any) => s.roleName !== "HELPER")
                          .map((s: any) => ({ value: s.id, label: s.name })) ||
                        []
                      }
                      placeholder="Pilih Nama Driver"
                      onChange={(val) => setSelectedForklift(val)}
                      value={selectedForklift}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={addUserToList}
                  disabled={!selectedDevice || !selectedForklift}
                  className="w-full py-2 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded text-sm font-semibold hover:bg-indigo-100"
                >
                  + Add Driver to Queue
                </button>
              </div>

              {/* List Assigned Users Table */}
              {assignedUsers.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="p-2 text-left text-gray-600">
                          Account (Username)
                        </th>
                        <th className="p-2 text-left text-gray-600">
                          Driver Name
                        </th>
                        <th className="p-2 text-center text-gray-600">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignedUsers.map((u) => (
                        <tr
                          key={u.user_id}
                          className="border-b last:border-0 hover:bg-gray-50"
                        >
                          <td className="p-2 font-medium text-indigo-600">
                            {u.user_account}
                          </td>
                          <td className="p-2">{u.user_name}</td>
                          <td className="p-2 text-center">
                            <button
                              onClick={() => removeUserFromList(u.user_id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => {
                    resetModalForm();
                    setShowModal(false);
                  }}
                  className="flex-1 py-3 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!selectedBin || assignedUsers.length === 0}
                  className="flex-1 py-3 bg-orange-500 text-white rounded shadow hover:bg-orange-600 disabled:bg-gray-300 font-medium"
                >
                  Submit Movement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MovementDetailView;
