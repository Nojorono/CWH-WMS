// GateLoadingDOList.tsx
import React from "react";
import { UIGateLoadingDO } from "../helper/mapOutboundGateToUILoading";
import GateLoadingDOCard from "./GateLoadingCard";

interface Props {
  data: UIGateLoadingDO[];
}

const GateLoadingDOList: React.FC<Props> = ({ data }) => {
  if (!data.length) {
    return (
      <div className="text-center text-gray-500 py-10">
        Tidak ada DO di Gate
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.map((doItem) => (
        <GateLoadingDOCard key={doItem.do_id} doData={doItem} />
      ))}
    </div>
  );
};

export default GateLoadingDOList;
