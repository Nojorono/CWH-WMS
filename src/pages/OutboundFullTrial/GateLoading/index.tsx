// GateLoadingPage.tsx
import React, { useEffect, useState } from "react";
import { mapOutboundGateToUILoading } from "./helper/mapOutboundGateToUILoading";
import GateLoadingDOList from "./components/GateLoadingDOList";
import { fetchAssignedGate } from "./service/fetchData";

const GateLoadingPage = () => {
  const [loading, setLoading] = useState(true);
  const [assignedGateList, setAssignedGateList] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      const res = await fetchAssignedGate();

      if (res.success) {
        const uiData = mapOutboundGateToUILoading(res.data);
        console.log("uiDATA GATE", uiData);
        
        setAssignedGateList(uiData);
      }

      setLoading(false);
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="text-sm text-gray-500">Loading assigned gate...</div>
    );
  }

  return (
    <div className="min-h-screen w-full px-6 py-6 bg-gray-100">
      <h1 className="text-2xl font-bold mb-6">Gate Loading – DO List</h1>

      <GateLoadingDOList data={assignedGateList} />
    </div>
  );
};

export default GateLoadingPage;
