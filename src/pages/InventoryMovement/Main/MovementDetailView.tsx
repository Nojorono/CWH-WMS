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
  const [showModal, setShowModal] = useState(false);

  // State untuk Hirarki Form
  const [selectedSub, setSelectedSub] = useState("");
  const [selectedBin, setSelectedBin] = useState("");
  const [selectedForklift, setSelectedForklift] = useState("");
  const [selectedDevice, setSelectedDevice] = useState("");

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

  // Tambahkan fungsi untuk reset semua form modal
  const resetModalForm = () => {
    setSelectedSub("");
    setSelectedBin("");
    setSelectedForklift("");
    setSelectedDevice("");
  };

  const handleSubmit = async () => {
  
    // 2. Cari data forklift driver yang dipilih
    const selectedForkliftDetail = listForklifts?.find(
      (f: any) => f.id === selectedForklift,
    );

    // 3. Susun Payload sesuai kontrak API Anda
    const payload = {
      movement_number: data.movement_number,
      movement_type: data.movement_type,
      pallets: data.pallets.map((p: any) => ({
        pallet_id: p.pallet_id,
        inventory_tracking_id: p.inventory_tracking_id,
      })),
      source_warehouse_id: data.source_warehouse_id,
      source_warehouse_sub_id: data.source_warehouse_sub_id,
      source_bin_id: data.source_bin_id,
      status: "PENDING",
      notes: data.notes || "",
      users: [
        {
          user_id: selectedDevice || "",
          user_name: selectedForkliftDetail?.name || "",
          user_phone: selectedForkliftDetail?.phone || "",
        },
      ],
      destination_warehouse_id: data.source_warehouse_id,
      destination_warehouse_sub_id: selectedSub,
      destination_bin_id: selectedBin,
      completed_date: new Date().toISOString(),
      moved_by: selectedForklift, // ID Forklift yang dipilih
    };

    try {
      updateData(data.id, payload as any);
      onBack(); 
    } catch (error) {
      console.error("Failed to submit:", error);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen relative">
      <div className="flex justify-between items-center mb-6">
        <div>
          <nav className="text-sm text-orange-500 mb-1">
            Movement &gt; Move Location &gt; Detail
          </nav>
          <h2 className="text-xl font-bold text-indigo-900">
            Move Location Detail
          </h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowModal(true)}
            className="bg-orange-500 text-white px-4 py-2 rounded shadow hover:bg-orange-600 transition"
          >
            Assign Forklift
          </button>
          <button
            onClick={onBack}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
          >
            Back
          </button>
        </div>
      </div>

      {/* Header Info Section */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-500 block">Data ID</label>
            <input
              disabled
              value={data.id}
              className="w-full bg-gray-200 p-2 rounded text-sm border"
            />
          </div>

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
            <label className="text-xs text-gray-500 block">Source</label>
            <input
              disabled
              value={data.sourceWarehouseSub?.name || "-"}
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
            <label className="text-xs text-gray-500 block">Action</label>
            <input
              disabled
              value={data.movement_type}
              className="w-full bg-gray-200 p-2 rounded text-sm border"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block">Destination</label>
            <input
              disabled
              value={data.destinationWarehouseSub?.name || "-"}
              className="w-full bg-gray-200 p-2 rounded text-sm border"
            />
          </div>
        </div>
      </div>

      {/* Pallet Table Section */}
      <div className="bg-white rounded shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-orange-500 text-white text-sm">
            <tr>
              <th className="p-3 border-r border-orange-400">Pallet</th>
              <th className="p-3 border-r border-orange-400">No. Of SKU</th>
              <th className="p-3">SKU</th>
            </tr>
          </thead>
          <tbody>
            {data.pallets.map((item: any) => (
              <tr key={item.id} className="border-b hover:bg-gray-50 text-sm">
                <td className="p-3">{item.pallet.pallet_code}</td>
                <td className="p-3">1</td>
                <td className="p-3">SKU-EXAMPLE</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- MODAL OVERLAY --- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-5000">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden">
            {/* max-w-2xl agar modal lebih besar */}
            <div className="bg-orange-500 p-6 flex justify-between items-center text-white">
              <h3 className="font-bold text-lg">Assign Forklift Driver</h3>
              <button
                onClick={() => setShowModal(false)}
                className="hover:rotate-90 transition-transform text-2xl"
              >
                ✕
              </button>
            </div>
            <div className="p-8 space-y-6">
              {/* Select Destination Zone */}
              <div>
                {/* Select Destination Zone */}
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
                            s.is_good_stock === true &&
                            s.is_gate === false &&
                            s.name !== data.sourceWarehouseSub?.name,
                        )
                        .map((s: any) => ({
                          value: s.id,
                          label: s.name,
                        })) || []
                    }
                    placeholder="Pilih Zone"
                    onChange={(val: string) => {
                      setSelectedSub(val);
                      setSelectedBin("");
                    }}
                    value={selectedSub}
                  />
                </div>
              </div>

              {/* Select Source Bin (Dependent) */}
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
                  placeholder="Pilih Zone"
                  onChange={(val: string) => {
                    setSelectedBin(val);
                  }}
                  value={selectedBin}
                />
              </div>

              <div className="border-t pt-6">
                <label className="text-xs font-bold text-gray-500 mb-1 block uppercase">
                  Select Device
                </label>
                <Select
                  width={"100%"}
                  options={
                    Array.isArray(listDeviceId)
                      ? listDeviceId
                          .filter(
                            (s: any) => s.role?.name === "DRIVER_FORKLIFT",
                          )
                          .map((s: any) => ({
                            value: s.id,
                            label: s.username,
                          }))
                      : []
                  }
                  placeholder="Pilih Device"
                  onChange={(val: string) => {
                    setSelectedDevice(val);
                  }}
                  value={selectedDevice}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block uppercase">
                  Select Forklift Driver
                </label>
                <Select
                  width={"100%"}
                  options={
                    listForklifts
                      ?.filter((s: any) => s.roleName !== "HELPER")
                      .map((s: any) => ({
                        value: s.id,
                        label: s.name,
                      })) || []
                  }
                  placeholder="Pilih Forklift"
                  onChange={(val: string) => {
                    setSelectedForklift(val);
                  }}
                  value={selectedForklift}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => {
                    resetModalForm();
                    setShowModal(false);
                  }}
                  className="flex-1 py-3 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 font-medium text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit} // <--- Tambahkan ini
                  disabled={
                    !selectedBin || !selectedForklift || !selectedDevice
                  } // Tambahkan pengecekan device
                  className="flex-1 py-3 bg-orange-500 text-white rounded shadow hover:bg-orange-600 disabled:bg-gray-300 font-medium text-base"
                >
                  Submit
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
