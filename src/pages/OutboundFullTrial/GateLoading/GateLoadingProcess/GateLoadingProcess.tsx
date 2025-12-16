import React, { useEffect, useState } from "react";
import { EndPoint } from "../../../../utils/EndPoint";
import DoVisibilityCard from "../components/DOVisibiltyCard";
import { mapDoGateVisibility } from "../helper/mapDOGateVisibility";
import { DoGateVisibility } from "../helper/mapDOGateVisibility";

const GateLoadingProcess = () => {
  const [data, setData] = useState<DoGateVisibility[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDoId, setExpandedDoId] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");

    fetch(`${EndPoint}assigned-gate`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((res) => {
        const mapped = res.data.map(mapDoGateVisibility);
        setData(mapped);

        // 👉 optional: auto expand DO pertama
        if (mapped.length > 0) {
          setExpandedDoId(mapped[0].do_id);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = (doId: string) => {
    setExpandedDoId((prev) => (prev === doId ? null : doId));
  };

  if (loading) {
    return <p className="text-center">Loading Gate Data...</p>;
  }

  if (data.length === 0) {
    return (
      <p className="text-center text-gray-500">No assigned gate loading data</p>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* SCROLLABLE DO LIST */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-6">
        {data.map((doData) => (
          <DoVisibilityCard
            key={doData.do_id}
            data={doData}
            expanded={expandedDoId === doData.do_id}
            onToggle={handleToggle}
          />
        ))}
      </div>
    </div>
  );
};

export default GateLoadingProcess;
