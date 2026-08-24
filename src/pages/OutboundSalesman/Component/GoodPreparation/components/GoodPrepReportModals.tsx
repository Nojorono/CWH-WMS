import React from "react";
import dayjs from "dayjs";
import PermintaanBarang, {
  PermintaanBarangRow,
} from "../../Report/PermintaanBarang";
import ReturBarang, { ReturBarangRow } from "../../Report/ReturBarang";
import TambahanBarang, { TambahanBarangRow } from "../../Report/TambahanBarang";

type GoodPrepReportModalsProps = {
  organizationName: string;
  targetDate: string;
  isPermintaanOpen: boolean;
  isReturOpen: boolean;
  isTambahanOpen: boolean;
  permintaanReportRows: PermintaanBarangRow[];
  returReportRows: ReturBarangRow[];
  tambahanReportRows: TambahanBarangRow[];
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
  return (
    <>
      {isPermintaanOpen && (
        <PermintaanBarang
          onClose={onClosePermintaan}
          organizationName={organizationName}
          requestDate={dayjs().format("YYYY-MM-DD")}
          doDate={targetDate}
          rows={permintaanReportRows}
        />
      )}

      {isReturOpen && (
        <ReturBarang
          onClose={onCloseRetur}
          organizationName={organizationName}
          returDate={dayjs().format("YYYY-MM-DD")}
          doDate={targetDate}
          rows={returReportRows}
        />
      )}

      {isTambahanOpen && (
        <TambahanBarang
          onClose={onCloseTambahan}
          organizationName={organizationName}
          tambahanDate={dayjs().format("YYYY-MM-DD")}
          doDate={targetDate}
          rows={tambahanReportRows}
        />
      )}
    </>
  );
};
