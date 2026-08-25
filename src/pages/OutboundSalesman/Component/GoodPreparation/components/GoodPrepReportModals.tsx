import React from "react";
import dayjs from "dayjs";
import { GudangFormModal, GudangFormRow } from "../../Report/GudangForm";

type GoodPrepReportModalsProps = {
  organizationName: string;
  targetDate: string;
  isPermintaanOpen: boolean;
  isReturOpen: boolean;
  isTambahanOpen: boolean;
  permintaanReportRows: GudangFormRow[];
  returReportRows: GudangFormRow[];
  tambahanReportRows: GudangFormRow[];
  onClosePermintaan: () => void;
  onCloseRetur: () => void;
  onCloseTambahan: () => void;
};

export const GoodPrepReportModals = ({
  organizationName,
  targetDate,
  isPermintaanOpen,
  isReturOpen,
  isTambahanOpen,
  permintaanReportRows,
  returReportRows,
  tambahanReportRows,
  onClosePermintaan,
  onCloseRetur,
  onCloseTambahan,
}: GoodPrepReportModalsProps) => {
  const today = dayjs().format("YYYY-MM-DD");

  return (
    <>
      {isPermintaanOpen && (
        <GudangFormModal
          variant="permintaan"
          onClose={onClosePermintaan}
          organizationName={organizationName}
          formDate={today}
          doDate={targetDate}
          rows={permintaanReportRows}
        />
      )}

      {isReturOpen && (
        <GudangFormModal
          variant="retur"
          onClose={onCloseRetur}
          organizationName={organizationName}
          formDate={today}
          doDate={targetDate}
          rows={returReportRows}
        />
      )}

      {isTambahanOpen && (
        <GudangFormModal
          variant="tambahan"
          onClose={onCloseTambahan}
          organizationName={organizationName}
          formDate={today}
          doDate={targetDate}
          rows={tambahanReportRows}
        />
      )}
    </>
  );
};
