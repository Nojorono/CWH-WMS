import { useCallback, useState } from "react";
import Swal from "sweetalert2";
import { showErrorToast, showSuccessToast } from "../../../../../components/toast";
import { updateDO } from "../../../../../API/services/DOsuggestionServices/postDOsuggestion";
import { DOSuggestionPayload } from "../../../../../API/types/DOsuggestion";
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
};

export const useGoodPrepActions = ({
  prepCallplans,
  enrichedData,
  refetchPrepCallplans,
}: UseGoodPrepActionsParams) => {
  const [isSavingAdjust, setIsSavingAdjust] = useState(false);
  const [isIntegrating, setIsIntegrating] = useState(false);
  const [isIntegrateModalOpen, setIsIntegrateModalOpen] = useState(false);
  const [integrateTriggerSpb, setIntegrateTriggerSpb] =
    useState<EnrichedCallplan | null>(null);
  const [adjustFromIntegrate, setAdjustFromIntegrate] =
    useState<EnrichedCallplan | null>(null);

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
      text: `${changedItems.length} item akan diupdate ke server, lalu data GoodPrep di-refresh.`,
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
      await refetchPrepCallplans();

      showSuccessToast(
        `Qty berhasil diupdate (${changedItems.length} item). Data GoodPrep telah disegarkan.`,
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

  const handleIntegratePerSpb = async () => {
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

    setIsIntegrating(true);
    try {
      await integrateDmsService.integrateBkbFromCallplan(callplan);

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
          `Integrate DMS berhasil, tetapi Meta gagal untuk SPB ${spbLabel}: ${message}`,
        );
        return;
      }

      showSuccessToast(
        `Integrate DMS & Meta berhasil untuk SPB ${spbLabel}`,
      );
      await refetchPrepCallplans();
    } catch (error: unknown) {
      showErrorToast(
        `Integrate DMS gagal untuk SPB ${spbLabel}: ${parseIntegrateDmsError(error)}`,
      );
    } finally {
      setIsIntegrating(false);
    }
  };

  const openIntegrateModal = useCallback((row: EnrichedCallplan) => {
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
