import React from "react";
import AdjustQtySPB, { AdjustQtyItem } from "../AdjustQtySPB";
import IntegrateSOHCheckModal, { SohCheckLine } from "../IntegrateSOHCheckModal";
import { EnrichedCallplan } from "../types";

type GoodPrepWorkflowModalsProps = {
  isIntegrateModalOpen: boolean;
  integrateTriggerSpb: EnrichedCallplan | null;
  adjustFromIntegrate: EnrichedCallplan | null;
  singleIntegrateLines: SohCheckLine[];
  isSohLoading: boolean;
  itemList: any[] | undefined;
  onCloseIntegrate: () => void;
  onAdjustFromIntegrate: () => void;
  onProceedIntegrate: () => Promise<void>;
  onCloseAdjust: () => void;
  onSaveAdjust: (payload: {
    items: AdjustQtyItem[];
    approvalUrl: string | null;
  }) => Promise<boolean>;
};

export const GoodPrepWorkflowModals = ({
  isIntegrateModalOpen,
  integrateTriggerSpb,
  adjustFromIntegrate,
  singleIntegrateLines,
  isSohLoading,
  itemList,
  onCloseIntegrate,
  onAdjustFromIntegrate,
  onProceedIntegrate,
  onCloseAdjust,
  onSaveAdjust,
}: GoodPrepWorkflowModalsProps) => {
  return (
    <>
      <IntegrateSOHCheckModal
        isOpen={isIntegrateModalOpen}
        mode="single"
        callplanNumber={
          integrateTriggerSpb?.spb_number ||
          integrateTriggerSpb?.callplan_number
        }
        salesName={integrateTriggerSpb?.sales_name}
        lines={singleIntegrateLines}
        isSohLoading={isSohLoading}
        onClose={onCloseIntegrate}
        onAdjust={onAdjustFromIntegrate}
        onProceed={onProceedIntegrate}
      />

      <AdjustQtySPB
        isOpen={Boolean(adjustFromIntegrate)}
        header={{
          callplanNumber:
            adjustFromIntegrate?.callplan_number ||
            adjustFromIntegrate?.spb_number,
          salesName: adjustFromIntegrate?.sales_name,
          salesNik: adjustFromIntegrate?.sales_nik,
          spvName: adjustFromIntegrate?.sales_spv,
          spvNik: adjustFromIntegrate?.sales_spv_nik,
          status: adjustFromIntegrate?.status,
        }}
        items={(adjustFromIntegrate?.details || []).map((d) => {
          const final = Number(d.item_qty_final ?? d.item_qty_submitted) || 0;
          return {
            id: String(d.id),
            name:
              itemList?.find((m: any) => m.sku === d.item_code)?.description ||
              d.item_code,
            sku: d.item_code,
            qtySuggestion: Number(d.item_qty_suggestion) || 0,
            qtyAwal: final,
            adjustment: 0,
          };
        })}
        onClose={onCloseAdjust}
        onSave={onSaveAdjust}
      />
    </>
  );
};
