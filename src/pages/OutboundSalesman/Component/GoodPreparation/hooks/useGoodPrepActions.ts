import { useCallback, useRef, useState } from "react";
import Swal from "sweetalert2";
import {
  showErrorToast,
  showSuccessToast,
  showToast,
} from "../../../../../components/toast";
import {
  updateDO,
  updateDOStatus,
} from "../../../../../API/services/do-suggestion/postDOsuggestion";
import { DOSuggestionPayload } from "../../../../../API/types/DOsuggestion";
import { usePersistAuthStore } from "../../../../../API/store/AuthStore/PersistAuthStore";
import { integrateService } from "../../../Services/IntegrateService";
import {
  integrateDmsService,
  parseIntegrateDmsError,
} from "../../../Services/IntegrateDMSservice";
import { Callplan } from "../../../types/CallplanTypes";
import { AdjustQtyItem } from "../AdjustQtySPB";
import { EnrichedCallplan, isSpbIntegratedToMeta } from "../types";

type UseGoodPrepActionsParams = {
  prepCallplans: Callplan[];
  enrichedData: EnrichedCallplan[];
  refetchPrepCallplans: () => Promise<Callplan[]>;
  /** Form Retur pakai sumber terpisah (report/retur) — wajib di-refresh setelah Adjust */
  refetchReturSource?: () => Promise<unknown>;
  /** Patch lokal detail setelah Adjust agar Form langsung ter-update */
  applyLocalDetailPatch?: (
    callplanId: string,
    lines: Array<{
      id: string;
      item_qty_revision: number;
      item_qty_final: number;
    }>,
  ) => void;
};

type StatusStepResult =
  | { kind: "completed" }
  | { kind: "skipped"; currentStatus: string }
  | { kind: "failed"; message: string };

export const useGoodPrepActions = ({
  prepCallplans,
  enrichedData,
  refetchPrepCallplans,
  refetchReturSource,
  applyLocalDetailPatch,
}: UseGoodPrepActionsParams) => {
  const [isSavingAdjust, setIsSavingAdjust] = useState(false);
  const [isIntegrating, setIsIntegrating] = useState(false);
  const [integratingStep, setIntegratingStep] = useState<string>("");
  const isIntegratingRef = useRef(false);
  const [isIntegrateModalOpen, setIsIntegrateModalOpen] = useState(false);
  const [integrateTriggerSpb, setIntegrateTriggerSpb] =
    useState<EnrichedCallplan | null>(null);
  const [adjustFromIntegrate, setAdjustFromIntegrate] =
    useState<EnrichedCallplan | null>(null);

  const waitBetweenIntegrateSteps = (ms = 3000) =>
    new Promise<void>((resolve) => {
      window.setTimeout(resolve, ms);
    });

  const handleSaveAdjustments = async (
    callplanId: string,
    payload: {
      items: AdjustQtyItem[];
      approvalUrl: string | null;
    },
  ): Promise<boolean> => {
    const callplan = prepCallplans.find((cp) => cp.id === callplanId);
    if (!callplan) {
      showErrorToast("Callplan tidak ditemukan");
      return false;
    }

    if (isSpbIntegratedToMeta(callplan)) {
      showErrorToast("Tidak bisa Adjust — SPB sudah di-integrate ke Meta");
      return false;
    }

    const changedItems = payload.items.filter((item) => item.adjustment !== 0);
    if (changedItems.length === 0) {
      showErrorToast("Tidak ada perubahan qty untuk disimpan");
      return false;
    }

    const confirm = await Swal.fire({
      title: "Konfirmasi Perubahan Qty?",
      text: `${changedItems.length} item akan diupdate ke server, lalu Form Retur / Form Tambahan di-refresh.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Simpan",
      cancelButtonText: "Batal",
      confirmButtonColor: "#F26522",
      cancelButtonColor: "#6b7280",
      reverseButtons: true,
      didOpen: () => {
        const container = Swal.getContainer();
        if (container) container.style.zIndex = "100000";
      },
    });

    if (!confirm.isConfirmed) return false;

    setIsSavingAdjust(true);
    try {
      // Pola: revision kumulatif (existing + adjustment baru), final = qty saat ini + adjustment
      const detailById = new Map(
        (callplan.details || []).map((d) => [d.id, d]),
      );

      const lines = changedItems
        .map((item) => {
          const detail = detailById.get(item.id);
          if (!detail) return null;

          const existingRevision = Number(detail.item_qty_revision) || 0;
          const totalRevision = existingRevision + item.adjustment;
          const finalQty = item.qtyAwal + item.adjustment;

          return {
            id: detail.id,
            item_code: detail.item_code,
            inventory_item_id: detail.inventory_item_id,
            item_qty_suggestion: Number(detail.item_qty_suggestion || 0),
            item_qty_revision: totalRevision,
            item_qty_submitted: Number(detail.item_qty_submitted || 0),
            item_qty_final: finalQty,
            contribution_percentage: Number(
              detail.contribution_percentage || 0,
            ),
            item_uom: detail.item_uom,
          };
        })
        .filter((line): line is NonNullable<typeof line> => line !== null);

      if (lines.length === 0) {
        showErrorToast("Detail item yang diubah tidak ditemukan");
        return false;
      }

      const updatePayload: DOSuggestionPayload & {
        sales_spv_nik?: string;
        spb_date?: string;
        spb_number?: string;
        approval_url?: string | null;
      } = {
        id: callplan.id,
        organization_id: callplan.organization_id,
        callplan_number: callplan.callplan_number,
        callplan_date_start: callplan.callplan_date_start,
        callplan_date_end: callplan.callplan_date_end,
        route_number: callplan.route_number,
        trip_type: callplan.trip_type,
        sales_nik: callplan.sales_nik,
        sales_name: callplan.sales_name,
        sales_spv: callplan.sales_spv,
        sales_spv_nik: callplan.sales_spv_nik,
        status: "FINAL",
        created_by: callplan.created_by,
        updated_by: callplan.created_by,
        spb_date: callplan.spb_date,
        spb_number: callplan.spb_number,
        lines,
        // approval_url: payload.approvalUrl,
      };

      await updateDO(updatePayload);

      const localPatchLines = lines.map((line) => ({
        id: line.id,
        item_qty_revision: line.item_qty_revision,
        item_qty_final: line.item_qty_final,
      }));

      // 1) Patch lokal dulu → Form Tambahan (+) & Form Retur (-) langsung update
      applyLocalDetailPatch?.(callplanId, localPatchLines);

      // 2) Sync server: prep callplans + report/retur
      await Promise.all([
        refetchPrepCallplans(),
        refetchReturSource?.() ?? Promise.resolve(),
      ]);

      // 3) Re-apply patch jika refetch masih stale (lag BE)
      applyLocalDetailPatch?.(callplanId, localPatchLines);

      showSuccessToast(
        `Qty berhasil diupdate (${changedItems.length} item).\nForm Retur / Form Tambahan ikut di-refresh.`,
      );

      // Jika Adjust dari alur Integrate Meta → buka ulang panel cek global
      if (adjustFromIntegrate?.id === callplanId) {
        queueMicrotask(() => {
          setAdjustFromIntegrate(null);
          setIsIntegrateModalOpen(true);
        });
      }

      return true;
    } catch (error) {
      console.error("Gagal simpan adjustment qty:", error);
      showErrorToast(
        error instanceof Error
          ? error.message
          : "Gagal menyimpan perubahan qty ke server",
      );
      return false;
    } finally {
      setIsSavingAdjust(false);
    }
  };

  const resolveIntegrateCallplan = (): Callplan | null => {
    if (!integrateTriggerSpb?.id) return null;
    return (
      prepCallplans.find((cp) => cp.id === integrateTriggerSpb.id) ||
      enrichedData.find((cp) => cp.id === integrateTriggerSpb.id) ||
      integrateTriggerSpb
    );
  };

  /** Setelah DMS sukses: FINAL → COMPLETED via POST /do-suggestion/update-status */
  const markSpbCompletedAfterDms = async (
    callplan: Callplan,
  ): Promise<StatusStepResult> => {
    const currentStatus = String(callplan.status || "").trim().toUpperCase();
    if (currentStatus !== "FINAL") {
      return {
        kind: "skipped",
        currentStatus: currentStatus || "(kosong)",
      };
    }

    const loginNik = String(
      usePersistAuthStore.getState().user?.userDetail?.employee_id || "",
    ).trim();
    if (!loginNik) {
      throw new Error("NIK user login tidak ditemukan untuk updated_by");
    }

    await updateDOStatus({
      id: callplan.id,
      status: "COMPLETED",
      updated_by: loginNik,
    });
    return { kind: "completed" };
  };

  const handleIntegratePerSpb = async () => {
    if (isIntegratingRef.current) return;

    if (!integrateTriggerSpb?.id) {
      showErrorToast("SPB target integrasi tidak ditemukan");
      return;
    }

    const callplan = resolveIntegrateCallplan();
    if (!callplan) {
      showErrorToast("Data SPB untuk integrasi tidak ditemukan");
      return;
    }

    const spbLabel =
      integrateTriggerSpb.spb_number || integrateTriggerSpb.callplan_number;

    isIntegratingRef.current = true;
    setIsIntegrating(true);
    setIntegratingStep("1/3 Mengirim ke DMS...");
    try {
      // Urutan sync via await: DMS → jeda → COMPLETED → jeda → Meta
      const dmsResult =
        await integrateDmsService.integrateBkbFromCallplan(callplan);
      const dmsAlreadyIssued = Boolean(dmsResult?.alreadyIssued);
      const dmsStatusLabel = String(dmsResult?.status || "")
        .trim()
        .toUpperCase();
      const dmsSummary = dmsAlreadyIssued
        ? `Sudah ada di DMS (${dmsStatusLabel || "BKB_ISSUED/RECEIVED"}) — dianggap sukses`
        : "Integrasi BKB baru ke DMS berhasil";

      showSuccessToast(
        `[1/3] Integrate DMS — SPB ${spbLabel}\n${dmsSummary}${
          dmsResult?.message ? `\nDetail: ${dmsResult.message}` : ""
        }`,
      );

      setIntegratingStep("Jeda 3 detik sebelum update status SPB...");
      await waitBetweenIntegrateSteps(3000);

      let statusResult: StatusStepResult = {
        kind: "skipped",
        currentStatus: String(callplan.status || "").trim() || "(kosong)",
      };
      setIntegratingStep("2/3 Update status SPB → COMPLETED...");
      try {
        statusResult = await markSpbCompletedAfterDms(callplan);
        if (statusResult.kind === "completed") {
          showSuccessToast(
            `[2/3] Update Status — SPB ${spbLabel}\nStatus berhasil diubah: FINAL → COMPLETED.`,
          );
        } else if (statusResult.kind === "skipped") {
          showToast(
            `[2/3] Update Status — SPB ${spbLabel}\nDilewati: status saat ini "${statusResult.currentStatus}" (bukan FINAL).\nLanjut ke Integrate Meta.`,
          );
        }
      } catch (statusError) {
        const statusMessage =
          statusError instanceof Error
            ? statusError.message
            : "Gagal update status SPB ke COMPLETED";
        statusResult = { kind: "failed", message: statusMessage };
        showErrorToast(
          `[2/3] Update Status GAGAL — SPB ${spbLabel}\n${statusMessage}\nLanjut ke Integrate Meta.`,
        );
      }

      const statusSummary =
        statusResult.kind === "completed"
          ? "FINAL → COMPLETED berhasil"
          : statusResult.kind === "skipped"
            ? `Dilewati (status: ${statusResult.currentStatus})`
            : `Gagal: ${statusResult.message}`;

      setIntegratingStep("Jeda 3 detik sebelum Integrate Meta...");
      await waitBetweenIntegrateSteps(3000);

      setIntegratingStep("3/3 Mengirim Integrate Meta...");
      try {
        await integrateService.integrateToMetaGit(integrateTriggerSpb.id);
      } catch (metaError) {
        await refetchPrepCallplans();
        const message =
          (metaError as { response?: { data?: { message?: string } } })
            ?.response?.data?.message ||
          (metaError as Error)?.message ||
          "Gagal melakukan Integrate Meta";
        showErrorToast(
          `[3/3] Integrate Meta GAGAL — SPB ${spbLabel}\n${message}\n\nRingkasan:\n• DMS: ${dmsSummary}\n• Status: ${statusSummary}\n• Meta: GAGAL`,
        );
        return;
      }

      showSuccessToast(
        `[3/3] Integrate Meta BERHASIL — SPB ${spbLabel}\n\nRingkasan:\n• DMS: ${dmsSummary}\n• Status: ${statusSummary}\n• Meta: Berhasil`,
      );
      await refetchPrepCallplans();
    } catch (error: unknown) {
      showErrorToast(
        `[1/3] Integrate DMS GAGAL — SPB ${spbLabel}\n${parseIntegrateDmsError(error)}\n\nProses dihentikan.\nUpdate status SPB & Integrate Meta tidak dijalankan.`,
      );
    } finally {
      isIntegratingRef.current = false;
      setIsIntegrating(false);
      setIntegratingStep("");
    }
  };

  const openIntegrateModal = useCallback((row: EnrichedCallplan) => {
    if (isIntegratingRef.current) return;
    setIntegrateTriggerSpb(row);
    setIsIntegrateModalOpen(true);
  }, []);

  const closeIntegrateModal = useCallback(() => {
    setIsIntegrateModalOpen(false);
    setIntegrateTriggerSpb(null);
  }, []);

  const goToAdjustFromIntegrate = () => {
    if (!integrateTriggerSpb) return;
    if (isSpbIntegratedToMeta(integrateTriggerSpb)) {
      showErrorToast("Tidak bisa Adjust — SPB sudah di-integrate ke Meta");
      return;
    }
    const target =
      enrichedData.find((cp) => cp.id === integrateTriggerSpb.id) ||
      integrateTriggerSpb;
    setAdjustFromIntegrate(target);
    setIsIntegrateModalOpen(false);
  };

  const closeAdjustBackToIntegrate = () => {
    const target = adjustFromIntegrate;
    setAdjustFromIntegrate(null);
    if (target) {
      setIntegrateTriggerSpb(target);
      setIsIntegrateModalOpen(true);
    }
  };

  const proceedIntegrate = async () => {
    if (isIntegratingRef.current) return;
    setIsIntegrateModalOpen(false);
    await handleIntegratePerSpb();
    setIntegrateTriggerSpb(null);
  };

  const saveAdjustFromIntegrate = async ({
    items,
    approvalUrl,
  }: {
    items: AdjustQtyItem[];
    approvalUrl: string | null;
  }) => {
    if (!adjustFromIntegrate) return false;
    try {
      const saved = await handleSaveAdjustments(adjustFromIntegrate.id, {
        items,
        approvalUrl,
      });
      return saved === true;
    } catch {
      return false;
    }
  };

  return {
    isSavingAdjust,
    isIntegrating,
    integratingStep,
    isIntegrateModalOpen,
    integrateTriggerSpb,
    adjustFromIntegrate,
    handleSaveAdjustments,
    openIntegrateModal,
    closeIntegrateModal,
    goToAdjustFromIntegrate,
    closeAdjustBackToIntegrate,
    proceedIntegrate,
    saveAdjustFromIntegrate,
  };
};
