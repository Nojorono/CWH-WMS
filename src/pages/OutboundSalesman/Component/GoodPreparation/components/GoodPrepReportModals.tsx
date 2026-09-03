import React, { useCallback } from "react";
import dayjs from "dayjs";
import { showErrorToast, showSuccessToast } from "../../../../../components/toast";
import { usePersistAuthStore } from "../../../../../API/store/AuthStore/PersistAuthStore";
import { GudangFormModal, GudangFormRow } from "../../Report/GudangForm";
import { Callplan } from "../../../types/CallplanTypes";
import { BTB } from "../../../types/BTBtypes";
import { EnrichedCallplan } from "../types";
import { runGudangPrintMarkUpdates } from "../utils/gudangPrintMark";

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
  /** Sumber Form Retur (report/retur + enrich BTB) */
  returEnrichedData: EnrichedCallplan[];
  /** Good Prep SPB + enrich BTB (untuk Form Tambahan) */
  enrichedData: EnrichedCallplan[];
  prepCallplans: Callplan[];
  btbData: BTB[];
  refetchPrepCallplans: () => Promise<unknown>;
  refetchReturSource: () => Promise<unknown>;
  refetchBtb: (options?: { silent?: boolean }) => Promise<unknown>;
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
  returEnrichedData,
  enrichedData,
  prepCallplans,
  btbData,
  refetchPrepCallplans,
  refetchReturSource,
  refetchBtb,
}: GoodPrepReportModalsProps) => {
  const today = dayjs().format("YYYY-MM-DD");
  const user = usePersistAuthStore((s) => s.user);
  const updatedBy =
    user?.username || user?.userDetail?.employee_id || "";

  const refetchAfterPrint = useCallback(async () => {
    try {
      await Promise.all([
        refetchPrepCallplans(),
        refetchReturSource(),
        refetchBtb({ silent: true }),
      ]);
    } catch (error) {
      console.error("Gagal refresh setelah print form gudang:", error);
    }
  }, [refetchPrepCallplans, refetchReturSource, refetchBtb]);

  const handleBeforeReturPrint = useCallback(
    async (setProgress: (text: string) => void) => {
      try {
        await runGudangPrintMarkUpdates({
          mode: "retur",
          updatedBy,
          returSource: returEnrichedData,
          prepEnriched: enrichedData,
          prepCallplans,
          btbData,
          onProgress: (p) => setProgress(p.label),
        });
        showSuccessToast("Data Retur berhasil di-update. Membuka print…");
        return true;
      } catch (error) {
        console.error("Gagal mark print retur:", error);
        showErrorToast(
          error instanceof Error
            ? `${error.message}. Silakan coba Print lagi.`
            : "Gagal update data Retur. Silakan coba Print lagi.",
        );
        return false;
      }
    },
    [updatedBy, returEnrichedData, enrichedData, prepCallplans, btbData],
  );

  const handleBeforeTambahanPrint = useCallback(
    async (setProgress: (text: string) => void) => {
      try {
        await runGudangPrintMarkUpdates({
          mode: "tambahan",
          updatedBy,
          returSource: returEnrichedData,
          prepEnriched: enrichedData,
          prepCallplans,
          btbData,
          onProgress: (p) => setProgress(p.label),
        });
        showSuccessToast("Data Tambahan berhasil di-update. Membuka print…");
        return true;
      } catch (error) {
        console.error("Gagal mark print tambahan:", error);
        showErrorToast(
          error instanceof Error
            ? `${error.message}. Silakan coba Print lagi.`
            : "Gagal update data Tambahan. Silakan coba Print lagi.",
        );
        return false;
      }
    },
    [updatedBy, returEnrichedData, enrichedData, prepCallplans, btbData],
  );

  const handleAfterReturPrint = useCallback(async () => {
    await refetchAfterPrint();
    onCloseRetur();
  }, [refetchAfterPrint, onCloseRetur]);

  const handleAfterTambahanPrint = useCallback(async () => {
    await refetchAfterPrint();
    onCloseTambahan();
  }, [refetchAfterPrint, onCloseTambahan]);

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
          onBeforePrint={handleBeforeReturPrint}
          onAfterPrintSuccess={handleAfterReturPrint}
          updatingLabel="Mengupdate data Retur & status BTB…"
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
          onBeforePrint={handleBeforeTambahanPrint}
          onAfterPrintSuccess={handleAfterTambahanPrint}
          updatingLabel="Meng-nol-kan qty revision (+)…"
        />
      )}
    </>
  );
};
