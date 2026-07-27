import React, { useState } from "react";
import Button from "../../../components/ui/button/Button";
import TabsSection from "../../../components/wms-components/inbound-component/tabs/TabsSection";
import MovementHistoryTable from "../../Inventory/Tabs/HistoryTable";
import CurrentQuantityTable from "../../Master/MasterPallet/Tabs/Current";

type PalletHistoryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  palletId: string | null;
  palletCode?: string | null;
};

const PalletHistoryModal: React.FC<PalletHistoryModalProps> = ({
  isOpen,
  onClose,
  palletId,
  palletCode,
}) => {
  const [activeTab, setActiveTab] = useState(0);

  if (!isOpen || !palletId) return null;

  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-orange-500 px-6 py-4 flex items-center justify-between text-white shrink-0">
          <div>
            <h3 className="font-bold text-lg">Pallet Detail</h3>
            <p className="text-xs text-orange-100 mt-0.5 font-mono">
              {palletCode || "-"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-2xl leading-none hover:rotate-90 transition-transform"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="p-4 overflow-auto flex-1">
          <TabsSection
            tabs={[
              {
                label: "Movement History",
                content: <MovementHistoryTable palletId={palletId} />,
              },
              {
                label: "Current Assets",
                content: (
                  <CurrentQuantityTable palletCode={palletCode || undefined} />
                ),
              },
            ]}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>

        <div className="px-6 py-3 border-t border-slate-100 flex justify-end shrink-0 bg-white">
          <Button type="button" variant="danger" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PalletHistoryModal;
