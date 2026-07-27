import React, { useEffect, useState, useMemo } from "react";
import {
  useStoreSubWarehouse,
  useStoreBinByZone,
  useStoreUserManagement,
  useStoreInventoryMovement,
} from "../../../DynamicAPI/stores/Store/MasterStore";
import Select from "../../../components/form/Select";

const MovementDetailView = ({
  data = {},
  onBack,
}: {
  data: any;
  onBack: () => void;
}) => {
  // State untuk Modal
  const viewOnly = data?.viewOnly === true;
  const addOnly = data?.addOnly === true;
  const editOnly = data?.editOnly === true;

  const [showModal, setShowModal] = useState(false);

  // State untuk Hirarki Form Lokasi
  const [selectedSub, setSelectedSub] = useState("");
  const [selectedBin, setSelectedBin] = useState("");

  // State untuk Input User (Temporary)
  const [selectedDevice, setSelectedDevice] = useState("");
  const [tempUsername, setTempUsername] = useState("");
  const [tempDriverName, setTempDriverName] = useState("");
  const [tempDriverPhone, setTempDriverPhone] = useState("");

  // State untuk Menampung List User yang akan di-assign (Payload Utama)
  const [assignedUsers, setAssignedUsers] = useState<any[]>([]);

  const { fetchAll: fetchZone, list: listZone } = useStoreSubWarehouse();
  const { detail: binList, fetchById: fetchBinList } = useStoreBinByZone();
  const { fetchAll: fetchForklifts, list: listForklifts } =
    useStoreUserManagement();
  const { updateData } = useStoreInventoryMovement();

  useEffect(() => {
    fetchZone();
    fetchForklifts();
  }, [fetchZone, fetchForklifts]);

  useEffect(() => {
    if (selectedSub) {
      fetchBinList(selectedSub);
    }
  }, [selectedSub, fetchBinList]);

  const sourceZoneId =
    data.source_warehouse_sub_id || data.sourceWarehouseSub?.id || "";
  const sourceBinId = data.source_bin_id || data.sourceBin?.id || "";

  const isSelectableDestinationZone = (zone: any) => {
    if (zone.is_gate) return false;
    const staging = zone.is_staging;
    if (staging === "INBOUND" || staging === "OUTBOUND") return false;
    // storage: null / NO / false / kosong
    return (
      staging === null ||
      staging === undefined ||
      staging === false ||
      staging === "NO" ||
      staging === ""
    );
  };

  /**
   * Destination Zone: non-gate, non-staging (INBOUND/OUTBOUND).
   * Zone sama dengan source tetap boleh (pindah antar BIN dalam zone).
   */
  const destinationZoneOptions = useMemo(() => {
    if (!Array.isArray(listZone)) return [];

    return listZone
      .filter(isSelectableDestinationZone)
      .map((zone: any) => ({
        value: zone.id,
        label: zone.name,
      }));
  }, [listZone]);

  /**
   * Destination BIN:
   * - zone tujuan = zone sumber → exclude BIN sumber (A/BIN-A → A/BIN-B OK)
   * - zone berbeda → semua BIN zone tujuan
   */
  const destinationBinOptions = useMemo(() => {
    if (!Array.isArray(binList)) return [];

    const isSameZone = Boolean(selectedSub) && selectedSub === sourceZoneId;

    return binList
      .filter((bin: any) => !(isSameZone && bin.id === sourceBinId))
      .map((bin: any) => ({
        value: bin.id,
        label: bin.name,
      }));
  }, [binList, selectedSub, sourceZoneId, sourceBinId]);

  const isSameSourceLocation =
    Boolean(selectedSub) &&
    selectedSub === sourceZoneId &&
    (!selectedBin || selectedBin === sourceBinId);
  // Filter khusus untuk role DRIVER_FORKLIFT
  const forkliftDrivers = useMemo(() => {
    return Array.isArray(listForklifts)
      ? listForklifts.filter((u: any) => u.role?.name === "DRIVER_FORKLIFT")
      : [];
  }, [listForklifts]);

  // Fungsi untuk memasukkan data otomatis ke dalam list
  const addUserToList = () => {
    if (selectedDevice && tempDriverName) {
      const newUser = {
        user_id: selectedDevice,
        user_account: tempUsername,
        user_name: tempDriverName,
        user_phone: tempDriverPhone,
      };

      // Cek agar tidak ada duplikasi Device ID
      if (!assignedUsers.find((u) => u.user_id === selectedDevice)) {
        setAssignedUsers([...assignedUsers, newUser]);
      }

      // Reset dropdown dan temporary state
      setSelectedDevice("");
      setTempUsername("");
      setTempDriverName("");
      setTempDriverPhone("");
    }
  };

  const removeUserFromList = (userId: string) => {
    setAssignedUsers(assignedUsers.filter((u) => u.user_id !== userId));
  };

  const resetModalForm = () => {
    setSelectedSub("");
    setSelectedBin("");
    setSelectedDevice("");
    setTempUsername("");
    setTempDriverName("");
    setTempDriverPhone("");
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
      destination_bin_id: selectedBin || null,
    };

    try {
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
  }, [showModal, editOnly, data]);

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
              {data.pallets?.map((item: any) => (
                <tr key={item.id} className="border-b hover:bg-gray-50 text-sm">
                  <td className="p-3">{item.pallet?.pallet_code}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Device User Table */}
        <div className="bg-white rounded shadow overflow-hidden">
          <div className="bg-orange-500 text-white text-sm font-bold p-3">
            Driver Forklift
          </div>
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b text-gray-700">
              <tr>
                <th className="p-3">Username</th>
                <th className="p-3">Name</th>
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
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl overflow-hidden">
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
                    options={destinationZoneOptions}
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
                    options={destinationBinOptions}
                    placeholder={
                      selectedSub ? "Pilih Bin" : "Pilih Zone dahulu"
                    }
                    onChange={(val) => setSelectedBin(val)}
                    value={selectedBin}
                    disabled={!selectedSub}
                  />
                </div>
              </div>

              {/* Add User Section */}
              <div className="border-t pt-6">
                <div className="grid grid-cols-3 gap-4 mb-4">
                  {/* Select Username */}
                  <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block uppercase">
                      Username <span className="text-red-500">*</span>
                    </label>
                    <Select
                      width={"100%"}
                      options={forkliftDrivers.map((d: any) => ({
                        value: d.id,
                        label: d.username,
                      }))}
                      placeholder="Select Driver"
                      onChange={(val: string) => {
                        const selected = forkliftDrivers.find(
                          (u: any) => u.id === val,
                        );
                        if (selected) {
                          const fullName =
                            `${selected.userDetail?.firstName || ""} ${selected.userDetail?.lastName || ""}`.trim();

                          setSelectedDevice(selected.id);
                          setTempUsername(selected.username);
                          setTempDriverName(fullName);
                          setTempDriverPhone(selected.userDetail?.phone || "");
                        }
                      }}
                      value={selectedDevice}
                    />
                  </div>

                  {/* Driver Name (Auto-filled & Read Only) */}
                  <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block uppercase">
                      Driver Name
                    </label>
                    <input
                      readOnly
                      type="text"
                      value={tempDriverName}
                      placeholder="Auto-filled name"
                      className="border p-2 rounded w-full bg-gray-100 cursor-not-allowed text-sm h-[38px] outline-none"
                    />
                  </div>

                  {/* Driver Phone (Auto-filled & Read Only) */}
                  <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block uppercase">
                      Driver Phone
                    </label>
                    <input
                      readOnly
                      type="text"
                      value={tempDriverPhone}
                      placeholder="Auto-filled phone"
                      className="border p-2 rounded w-full bg-gray-100 cursor-not-allowed text-sm h-[38px] outline-none"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={addUserToList}
                  disabled={!selectedDevice}
                  className="w-full py-2 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded text-sm font-semibold hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  disabled={
                    assignedUsers.length === 0 ||
                    !selectedSub ||
                    isSameSourceLocation
                  }
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

// // NEW
// import React, { useEffect, useMemo, useState } from "react";
// import {
//   useStoreSubWarehouse,
//   useStoreBinByZone,
//   useStoreUserManagement,
//   useStoreInventoryMovement,
// } from "../../../DynamicAPI/stores/Store/MasterStore";
// import Select from "../../../components/form/Select";

// const MovementDetailView = ({
//   data = {},
//   onBack,
// }: {
//   data: any;
//   onBack: () => void;
// }) => {
//   // State untuk Modal
//   const viewOnly = data?.viewOnly === true;
//   const addOnly = data?.addOnly === true;
//   const editOnly = data?.editOnly === true;

//   const [showModal, setShowModal] = useState(false);

//   // State untuk Hirarki Form Lokasi
//   const [selectedSub, setSelectedSub] = useState("");
//   const [selectedBin, setSelectedBin] = useState("");

//   // State untuk Input User (Temporary)
//   const [selectedDevice, setSelectedDevice] = useState("");
//   const [tempUsername, setTempUsername] = useState("");
//   const [tempDriverName, setTempDriverName] = useState(""); // BARU: Menampung nama lengkap
//   const [tempDriverPhone, setTempDriverPhone] = useState(""); // BARU: Menampung nomor telepon

//   // State untuk Menampung List User yang akan di-assign (Payload Utama)
//   const [assignedUsers, setAssignedUsers] = useState<any[]>([]);

//   const { fetchAll: fetchZone, list: listZone } = useStoreSubWarehouse();

//   const { detail: binList, fetchById: fetchBinList } = useStoreBinByZone();
//   const { fetchAll: fetchForklifts, list: listForklifts } =
//     useStoreUserManagement();
//   const { updateData } = useStoreInventoryMovement();

//   useEffect(() => {
//     fetchZone();
//     fetchForklifts();
//   }, [fetchZone, fetchForklifts]);

//   useEffect(() => {
//     if (selectedSub) {
//       fetchBinList(selectedSub);
//     }
//   }, [selectedSub]);

//   console.log("listZone", listZone);

//   // Filter khusus untuk role DRIVER_FORKLIFT
//   const forkliftDrivers = useMemo(() => {
//     return Array.isArray(listForklifts)
//       ? listForklifts.filter((u: any) => u.role?.name === "DRIVER_FORKLIFT")
//       : [];
//   }, [listForklifts]);

//   // Fungsi untuk memasukkan pasangan Device + Driver ke dalam list
//   const addUserToList = () => {
//     if (selectedDevice && tempDriverName) {
//       const newUser = {
//         user_id: selectedDevice,
//         user_account: tempUsername,
//         user_name: tempDriverName, // Diambil dari auto-fill
//         user_phone: tempDriverPhone, // Diambil dari auto-fill
//       };

//       if (!assignedUsers.find((u) => u.user_id === selectedDevice)) {
//         setAssignedUsers([...assignedUsers, newUser]);
//       }

//       // Reset dropdown dan temporary state
//       setSelectedDevice("");
//       setTempUsername("");
//       setTempDriverName("");
//       setTempDriverPhone("");
//     }
//   };

//   const resetModalForm = () => {
//     setSelectedSub("");
//     setSelectedBin("");
//     setSelectedDevice("");
//     setTempUsername("");
//     setTempDriverName("");
//     setTempDriverPhone("");
//     setAssignedUsers([]);
//   };

//   const removeUserFromList = (userId: string) => {
//     setAssignedUsers(assignedUsers.filter((u) => u.user_id !== userId));
//   };

//   const handleSubmit = async () => {
//     // Membersihkan field UI (user_account) sebelum dikirim ke backend
//     const finalUsers = assignedUsers.map(
//       ({ user_id, user_name, user_phone }) => ({
//         user_id,
//         user_name,
//         user_phone,
//       }),
//     );

//     const payload = {
//       status: "APPROVED",
//       users: finalUsers,
//       destination_warehouse_id: data.source_warehouse_id,
//       destination_warehouse_sub_id: selectedSub,
//       destination_bin_id: selectedBin || null,
//     };

//     try {
//       await updateData(data.id, payload as any);
//       onBack();
//     } catch (error) {
//       console.error("Failed to submit:", error);
//     }
//   };

//   useEffect(() => {
//     if (showModal && editOnly) {
//       // Isi assignedUsers dari data.users
//       setAssignedUsers(
//         Array.isArray(data.users)
//           ? data.users.map((u: any) => ({
//               user_id: u.user_id,
//               user_account: u.user?.username || "",
//               user_name: u.user_name,
//               user_phone: u.user_phone,
//             }))
//           : [],
//       );
//       // Isi destination zone & bin dari data
//       setSelectedSub(data.destination_warehouse_sub_id || "");
//       setSelectedBin(data.destination_bin_id || "");
//     }
//     // Jika modal ditutup, reset form
//     if (!showModal) {
//       resetModalForm();
//     }
//     // eslint-disable-next-line
//   }, [showModal, editOnly, data]);

//   return (
//     <div className="p-6 bg-gray-50 min-h-screen relative">
//       {/* Header */}
//       <div className="flex justify-between items-center mb-6">
//         <div>
//           <nav className="text-sm text-orange-500 mb-1"></nav>
//           <h2 className="text-xl font-bold text-indigo-900"></h2>
//         </div>
//         <div className="flex gap-2">
//           {!viewOnly && (
//             <button
//               onClick={() => setShowModal(true)}
//               className="bg-orange-500 text-white px-4 py-2 rounded shadow hover:bg-orange-600 transition"
//             >
//               {editOnly
//                 ? "Update Forklift & Location"
//                 : " + Assign Forklift & Select Location"}
//             </button>
//           )}
//           <button
//             onClick={onBack}
//             className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
//           >
//             Back
//           </button>
//         </div>
//       </div>

//       {/* Info Cards */}
//       <div className="grid grid-cols-2 gap-4 mb-6">
//         <div className="space-y-4">
//           <div>
//             <label className="text-xs text-gray-500 block">Move Loc ID</label>
//             <input
//               disabled
//               value={data.movement_number}
//               className="w-full bg-gray-200 p-2 rounded text-sm border"
//             />
//           </div>
//           <div>
//             <label className="text-xs text-gray-500 block">Status</label>
//             <input
//               disabled
//               value={data.status}
//               className="w-full bg-gray-200 p-2 rounded text-sm border"
//             />
//           </div>
//           <div>
//             <label className="text-xs text-gray-500 block">Source Zone</label>
//             <input
//               disabled
//               value={data.sourceWarehouseSub?.name || "-"}
//               className="w-full bg-gray-200 p-2 rounded text-sm border"
//             />
//           </div>

//           <div>
//             <label className="text-xs text-gray-500 block">Source BIN</label>
//             <input
//               disabled
//               value={data.sourceBin?.name || "-"}
//               className="w-full bg-gray-200 p-2 rounded text-sm border"
//             />
//           </div>
//         </div>
//         <div className="space-y-4">
//           <div>
//             <label className="text-xs text-gray-500 block">Date</label>
//             <input
//               disabled
//               value={new Date(data.createdAt).toLocaleDateString()}
//               className="w-full bg-gray-200 p-2 rounded text-sm border"
//             />
//           </div>
//           <div>
//             <label className="text-xs text-gray-500 block">Move Type</label>
//             <input
//               disabled
//               value={data.movement_type}
//               className="w-full bg-gray-200 p-2 rounded text-sm border"
//             />
//           </div>
//           <div>
//             <label className="text-xs text-gray-500 block">
//               Destination Zone
//             </label>
//             <input
//               disabled
//               value={data.destinationWarehouseSub?.name || "-"}
//               className="w-full bg-gray-200 p-2 rounded text-sm border"
//             />
//           </div>
//           <div>
//             <label className="text-xs text-gray-500 block">
//               Destination BIN
//             </label>
//             <input
//               disabled
//               value={data.destinationBin?.name || "-"}
//               className="w-full bg-gray-200 p-2 rounded text-sm border"
//             />
//           </div>
//         </div>
//       </div>

//       {/* Table Main */}
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
//         {/* Pallet Table */}
//         <div className="bg-white rounded shadow overflow-hidden">
//           <table className="w-full text-left">
//             <thead className="bg-orange-500 text-white text-sm">
//               <tr>
//                 <th className="p-3">Pallet</th>
//               </tr>
//             </thead>
//             <tbody>
//               {data.pallets.map((item: any) => (
//                 <tr key={item.id} className="border-b hover:bg-gray-50 text-sm">
//                   <td className="p-3">{item.pallet.pallet_code}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>

//         {/* Device User Table */}
//         <div className="bg-white rounded shadow overflow-hidden">
//           <div className="bg-orange-500 text-white text-sm font-bold p-3">
//             Device User List
//           </div>
//           <table className="w-full text-left">
//             <thead className="bg-gray-50 border-b text-gray-700">
//               <tr>
//                 <th className="p-3">Device (Username)</th>
//                 <th className="p-3">Driver Name</th>
//                 <th className="p-3">Phone</th>
//               </tr>
//             </thead>
//             <tbody>
//               {Array.isArray(data.users) && data.users.length > 0 ? (
//                 data.users.map((user: any) => (
//                   <tr
//                     key={user.id}
//                     className="border-b hover:bg-gray-50 text-sm"
//                   >
//                     <td className="p-3">{user.user?.username || "-"}</td>
//                     <td className="p-3">{user.user_name || "-"}</td>
//                     <td className="p-3">{user.user_phone || "-"}</td>
//                   </tr>
//                 ))
//               ) : (
//                 <tr>
//                   <td className="p-3" colSpan={3}>
//                     No device user assigned.
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* --- MODAL OVERLAY --- */}
//       {showModal && (
//         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[5000]">
//           <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden">
//             <div className="bg-orange-500 p-6 flex justify-between items-center text-white">
//               <h3 className="font-bold text-lg">Assign Forklift Driver</h3>
//               <button
//                 onClick={() => setShowModal(false)}
//                 className="hover:rotate-90 transition-transform text-2xl"
//               >
//                 ✕
//               </button>
//             </div>

//             <div className="p-8 space-y-6 max-h-[80vh] overflow-y-auto">
//               {/* Destination Section */}
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <label className="text-xs font-bold text-gray-500 mb-1 block uppercase">
//                     Destination Zone
//                   </label>
//                   <Select
//                     width={"100%"}
//                     options={
//                       listZone
//                         ?.filter(
//                           (s: any) =>
//                             // s.is_good_stock &&
//                             s.is_staging == null &&
//                             !s.is_gate &&
//                             s.name !== data.sourceWarehouseSub?.name,
//                         )
//                         .map((s: any) => ({ value: s.id, label: s.name })) || []
//                     }
//                     placeholder="Pilih Zone"
//                     onChange={(val) => {
//                       setSelectedSub(val);
//                       setSelectedBin("");
//                     }}
//                     value={selectedSub}
//                   />
//                 </div>
//                 <div>
//                   <label className="text-xs font-bold text-gray-500 mb-1 block uppercase">
//                     Destination Bin
//                   </label>
//                   <Select
//                     width={"100%"}
//                     options={
//                       Array.isArray(binList)
//                         ? binList.map((s: any) => ({
//                             value: s.id,
//                             label: s.name,
//                           }))
//                         : []
//                     }
//                     placeholder="Pilih Bin"
//                     onChange={(val) => setSelectedBin(val)}
//                     value={selectedBin}
//                   />
//                 </div>
//               </div>

//               {/* Add User Section */}
//               <div className="border-t pt-6">
//                 <div className="grid grid-cols-3 gap-4 mb-4">
//                   {/* Select Username */}
//                   <div>
//                     <label className="text-xs font-bold text-gray-500 mb-1 block uppercase">
//                       Username <span className="text-red-500">*</span>
//                     </label>
//                     <Select
//                       width={"100%"}
//                       options={forkliftDrivers.map((d: any) => ({
//                         value: d.id,
//                         label: d.username,
//                       }))}
//                       placeholder="Select Driver"
//                       onChange={(val: string) => {
//                         const selected = forkliftDrivers.find(
//                           (u: any) => u.id === val,
//                         );
//                         if (selected) {
//                           const fullName =
//                             `${selected.userDetail?.firstName || ""} ${selected.userDetail?.lastName || ""}`.trim();

//                           setSelectedDevice(selected.id);
//                           setTempUsername(selected.username);
//                           setTempDriverName(fullName);
//                           setTempDriverPhone(selected.userDetail?.phone || "");
//                         }
//                       }}
//                       value={selectedDevice}
//                     />
//                   </div>

//                   {/* Driver Name (Auto-filled & Read Only) */}
//                   <div>
//                     <label className="text-xs font-bold text-gray-500 mb-1 block uppercase">
//                       Driver Name
//                     </label>
//                     <input
//                       readOnly
//                       type="text"
//                       value={tempDriverName}
//                       placeholder="Auto-filled name"
//                       className="border p-2 rounded w-full bg-gray-100 cursor-not-allowed text-sm h-[38px]"
//                     />
//                   </div>

//                   {/* Driver Phone (Auto-filled & Read Only) */}
//                   <div>
//                     <label className="text-xs font-bold text-gray-500 mb-1 block uppercase">
//                       Driver Phone
//                     </label>
//                     <input
//                       readOnly
//                       type="text"
//                       value={tempDriverPhone}
//                       placeholder="Auto-filled phone"
//                       className="border p-2 rounded w-full bg-gray-100 cursor-not-allowed text-sm h-[38px]"
//                     />
//                   </div>
//                 </div>

//                 <button
//                   type="button"
//                   onClick={addUserToList}
//                   disabled={!selectedDevice}
//                   className="w-full py-2 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded text-sm font-semibold hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed"
//                 >
//                   + Add Driver to Queue
//                 </button>
//               </div>

//               {/* List Assigned Users Table */}
//               {assignedUsers.length > 0 && (
//                 <div className="border rounded-lg overflow-hidden">
//                   <table className="w-full text-sm">
//                     <thead className="bg-gray-50 border-b">
//                       <tr>
//                         <th className="p-2 text-left text-gray-600">
//                           Account (Username)
//                         </th>
//                         <th className="p-2 text-left text-gray-600">
//                           Driver Name
//                         </th>
//                         <th className="p-2 text-center text-gray-600">
//                           Action
//                         </th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {assignedUsers.map((u) => (
//                         <tr
//                           key={u.user_id}
//                           className="border-b last:border-0 hover:bg-gray-50"
//                         >
//                           <td className="p-2 font-medium text-indigo-600">
//                             {u.user_account}
//                           </td>
//                           <td className="p-2">{u.user_name}</td>
//                           <td className="p-2 text-center">
//                             <button
//                               onClick={() => removeUserFromList(u.user_id)}
//                               className="text-red-500 hover:text-red-700"
//                             >
//                               Remove
//                             </button>
//                           </td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>
//               )}

//               {/* Action Buttons */}
//               <div className="flex gap-4 pt-4">
//                 <button
//                   onClick={() => {
//                     resetModalForm();
//                     setShowModal(false);
//                   }}
//                   className="flex-1 py-3 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 font-medium"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={handleSubmit}
//                   disabled={assignedUsers.length === 0}
//                   className="flex-1 py-3 bg-orange-500 text-white rounded shadow hover:bg-orange-600 disabled:bg-gray-300 font-medium"
//                 >
//                   Submit Movement
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default MovementDetailView;
