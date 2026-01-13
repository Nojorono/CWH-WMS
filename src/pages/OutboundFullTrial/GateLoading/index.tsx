// ...existing code...
import React, { useEffect, useState } from "react";
import { mapOutboundGateToUILoading } from "./helper/mapOutboundGateToUILoading";
import GateLoadingDOList from "./components/GateLoadingDOList";
import { fetchAssignedGate } from "./service/fetchData";
import Button from "../../../components/ui/button/Button";
import { FaSyncAlt } from "react-icons/fa";

const GateLoadingPage = () => {
  const [loading, setLoading] = useState(true);
  const [assignedGateList, setAssignedGateList] = useState<any[]>([]);

  const [openedDOId, setOpenedDOId] = useState<string | null>(null);
  const [loadingDOId, setLoadingDOId] = useState<string | null>(null);

  const refreshAssignedGate = async () => {
    setLoading(true);
    try {
      const res = await fetchAssignedGate();
      if (res.success) {
        const uiData = mapOutboundGateToUILoading(res.data);
        setAssignedGateList(uiData);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAssignedGate();
  }, []);

  if (loading) {
    return (
      <div className="text-sm text-gray-500">Loading assigned gate...</div>
    );
  }

  return (
    <div className="min-h-screen w-full px-6 py-6 bg-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Gate Loading – DO List</h1>
        <Button
          variant="action"
          onClick={refreshAssignedGate}
          disabled={loading}
          startIcon={<FaSyncAlt />}
        >
          Refresh Halaman
        </Button>
      </div>

      <GateLoadingDOList
        data={assignedGateList}
        onRefresh={refreshAssignedGate}
        openedDOId={openedDOId}
        loadingDOId={loadingDOId}
        setLoadingDOId={setLoadingDOId}
        setOpenedDOId={setOpenedDOId}
      />
    </div>
  );
};

export default GateLoadingPage;
