// GateLoadingDOList.tsx
import React from "react";
import { UIGateLoadingDO } from "../helper/mapOutboundGateToUILoading";
import GateLoadingDOCard from "./GateLoadingCard";

interface Props {
  data: UIGateLoadingDO[];
  onRefresh?: () => void;
  openedDOId?: string | null;
  loadingDOId?: string | null;
  setLoadingDOId?: (id: string | null) => void;
  setOpenedDOId?: (id: string | null) => void;
}

const GateLoadingDOList: React.FC<Props> = ({
  data,
  onRefresh,
  openedDOId,
  loadingDOId,
  setLoadingDOId,
  setOpenedDOId,
}) => {
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
        <GateLoadingDOCard
          key={doItem.do_id}
          doData={doItem}
          assignedGateLoads={[]}
          onRefresh={onRefresh}
          openedDOId={openedDOId}
          loadingDOId={loadingDOId}
          setLoadingDOId={setLoadingDOId}
          setOpenedDOId={setOpenedDOId}
        />
      ))}
    </div>
  );
};

export default GateLoadingDOList;
