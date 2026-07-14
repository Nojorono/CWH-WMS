import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import axiosInstance from "../../../../DynamicAPI/AxiosInstance";
import { useStoreShipConfirmByDO } from "../../../../DynamicAPI/stores/Store/MasterStore";
import { ShipConfirmServiceByDO } from "../../../../DynamicAPI/services/Service/MasterService";
import { EndPoint } from "../../../../utils/EndPoint";
import { showErrorToast, showSuccessToast } from "../../../../components/toast";
import { showConfirmDialog } from "../../../../components/swal-confirm";
import { mapShipConfirmList } from "../Helper/mapShipConfirmList";
import { uploadFileDO } from "../Helper/uploadFileDO";
import { deleteFileFromS3 } from "../Helper/deleteFileFromS3";
import { OutboundDo } from "../Helper/doTypes";
import { OutboundDoUI } from "../../../../DynamicAPI/types/ShipConfirmType";

interface UsePickingActionsProps {
    currentPage: number;
    pageSize: number;
    globalFilter?: string;
    filteredStatus?: any;
    fetchUsingPagination: any;
    updateData: any;
}

export const usePickingActions = ({
    currentPage,
    pageSize,
    globalFilter,
    filteredStatus,
    fetchUsingPagination,
    updateData,
}: UsePickingActionsProps) => {
    const navigate = useNavigate();
    const { fetchById } = useStoreShipConfirmByDO();

    // 🔹 State Umum
    const [showSealModal, setShowSealModal] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedDO, setSelectedDO] = useState<OutboundDo | null>(null);
    const [sealInput, setSealInput] = useState("");

    // 🔹 State Khusus Penyesuaian Qty Ship Confirm Subdist
    const [showQtyModal, setShowQtyModal] = useState(false);
    const [qtyModalData, setQtyModalData] = useState<OutboundDoUI | null>(null);
    const [isSubmittingQty, setIsSubmittingQty] = useState(false);
    const [pendingShipConfirmDO, setPendingShipConfirmDO] = useState<OutboundDo | null>(null);
    const [pickReleaseStatusMap, setPickReleaseStatusMap] = useState<Record<string, boolean>>({});
    const [manifestUploadedMap, setManifestUploadedMap] = useState<Record<string, boolean>>({});
    const [manifestUrlMap, setManifestUrlMap] = useState<Record<string, string>>({});

    // 🔹 State Shipping Lines (Sudah dipindahkan ke dalam bodi hook dengan benar)
    const [shippingLines, setShippingLines] = useState<Array<{
        outbound_memo_item_id: string;
        sku: string;
        quantity_plan: number;
        shipped_quantity: number;
    }>>([]);

    // Helper: Sinkronisasi pembaruan data tabel
    const refreshTable = () => {
        if (fetchUsingPagination) {
            fetchUsingPagination({
                page: currentPage,
                limit: pageSize,
                search: globalFilter || "",
                status: filteredStatus || "",
            });
        }
    };

    // Helper internal: Ambil detail terbaru dari store dan konversi via mapper UI
    const getLatestDoDetail = async (id: string): Promise<OutboundDoUI | null> => {
        await fetchById(id);
        const currentDetail = useStoreShipConfirmByDO.getState().detail;
        if (!currentDetail || !Array.isArray(currentDetail) || currentDetail.length === 0) {
            return null;
        }
        const mapped = mapShipConfirmList(currentDetail);
        return mapped[0] || null;
    };

    const resolvePickReleaseStatus = async (id: string): Promise<boolean> => {
        try {
            const detail = await ShipConfirmServiceByDO.fetchById(id);
            if (!detail || !Array.isArray(detail) || detail.length === 0) {
                return false;
            }

            const mapped = mapShipConfirmList(detail);
            return !!mapped[0]?.is_success_pick_release;
        } catch {
            return false;
        }
    };

    const syncPickReleaseStatuses = useCallback(async (dos: OutboundDo[]) => {
        const subdistDos = dos.filter((d) => d.outbound_type === "SUBDIST");
        if (subdistDos.length === 0) return;

        const entries = await Promise.all(
            subdistDos.map(async (d) => {
                const pickReleaseDone = await resolvePickReleaseStatus(d.id);
                return [d.id, pickReleaseDone] as const;
            }),
        );

        setPickReleaseStatusMap((prev) => ({
            ...prev,
            ...Object.fromEntries(entries),
        }));
    }, []);


    const hasSubdistDocument = (value?: string | null) =>
        Boolean(value && value.trim() !== "");

    const openShipConfirmQtyModal = async (
        data: OutboundDo,
        doDetail?: OutboundDoUI | null,
        options?: { manifestUploaded?: boolean },
    ) => {
        const detail = doDetail ?? (await getLatestDoDetail(data.id));

        if (!detail) {
            showErrorToast("Gagal mengambil data validasi akhir.");
            return false;
        }

        const isManifestUploaded =
            options?.manifestUploaded ||
            manifestUploadedMap[data.id] ||
            hasSubdistDocument(data.subdist_document);

        if (!detail.is_success_pick_release) {
            Swal.fire({
                icon: "warning",
                title: "Belum Siap Ship Confirm",
                text: "Silakan lakukan Pick Release terlebih dahulu sebelum Ship Confirm Subdist.",
                confirmButtonColor: "#3085d6",
            });
            return false;
        }

        if (!isManifestUploaded) {
            Swal.fire({
                icon: "warning",
                title: "File DO Subdist Belum Diupload",
                text: "Silakan upload File DO Subdist terlebih dahulu sebelum melakukan Ship Confirm Subdist.",
                confirmButtonColor: "#3085d6",
            });
            return false;
        }

        const enrichedMemos = detail.outbound_memos?.map((memo: any) => ({
            ...memo,
            outbound_memo_items: memo.outbound_memo_items?.map((integrationItem: any) => {
                const matchText = data.uiItems?.find(
                    (ui) => ui.item_id === integrationItem.item_id,
                );

                return {
                    ...integrationItem,
                    sku: matchText?.sku || "N/A",
                    description: matchText?.description || "Tanpa Deskripsi",
                    uom: matchText?.uom || integrationItem.uom,
                };
            }),
        }));

        setQtyModalData({
            ...detail,
            outbound_memos: enrichedMemos,
        });
        setShowQtyModal(true);
        return true;
    };

    const handleCloseUploadModal = () => {
        setShowUploadModal(false);
        setPendingShipConfirmDO(null);
    };

    // --- GENERAL HANDLERS ---
    const handleConfirmSeal = async () => {
        if (!selectedDO || !sealInput) return;
        try {
            const res = await updateData(selectedDO.id, { seal_number: sealInput });
            if (res) {
                setShowSealModal(false);
                navigate("/outbound_do/print_surat_jalan", { state: { params: selectedDO.id } });
                refreshTable();
            }
        } catch (error) {
            Swal.fire("Error", "Gagal menyimpan Seal Number", "error");
        }
    };

    const handleAdjust = (data: OutboundDo) => {
        navigate("/outbound_do/detach_attach", {
            state: { params: data, mode: "adjust", title: "Adjust Picking Transaction" },
        });
    };

    const handlePrintAction = (data: OutboundDo) => {
        if (data.seal_number && data.seal_number.trim() !== "") {
            navigate("/outbound_do/print_surat_jalan", { state: { params: data.id } });
        } else {
            setSelectedDO(data);
            setSealInput("");
            setShowSealModal(true);
        }
    };

    // ==========================================
    // 🔹 SUBDIST SEQUENTIAL WORKFLOW GUARD PILLARS
    // ==========================================

    // 1️⃣ TAHAP AWAL: Pick Release Subdist
    const handlePickRelease = async (data: OutboundDo) => {
        try {
            const doDetail = await getLatestDoDetail(data.id);
            if (!doDetail) {
                showErrorToast("Gagal memvalidasi status. Data detail kosong.");
                return;
            }

            if (doDetail.is_success_pick_release) {
                Swal.fire({
                    icon: "info",
                    title: "Sudah Diproses",
                    text: "Semua item dalam DO ini sudah berhasil di-Pick Release sebelumnya.",
                    confirmButtonColor: "#3085d6",
                });
                return;
            }

            showConfirmDialog(
                async () => {
                    try {
                        const response = await axiosInstance.post(`${EndPoint}outbound-do/pick-release-subdist/${data.id}`);
                        console.log("response pick rilis", response);
                        
                        if (response.status === 200 || response.status === 201) {
                            showSuccessToast("Pick Release berhasil diproses!");
                            setPickReleaseStatusMap((prev) => ({
                                ...prev,
                                [data.id]: true,
                            }));
                            refreshTable();
                        }
                    } catch (error: any) {
                        showErrorToast(error.response?.data?.message || "Gagal melakukan Pick Release");
                    }
                },
                {
                    title: "Konfirmasi Pick Release",
                    text: `Apakah Anda yakin ingin melakukan Pick Release untuk DO: ${data.outbound_do_number}?`,
                    confirmButtonText: "Ya, Proses!",
                    cancelButtonText: "Batal",
                },
            );
        } catch (error) {
            showErrorToast("Gagal melakukan pengecekan status Pick Release.");
        }
    };

    // 2️⃣ TAHAP KEDUA + FINAL: Upload File DO Subdist lalu Ship Confirm Subdist
    const handleShipConfirmSubdistFlow = async (data: OutboundDo) => {
        try {
            const doDetail = await getLatestDoDetail(data.id);
            if (!doDetail) {
                showErrorToast("Gagal mengambil detail item. Data kosong.");
                return;
            }

            if (!doDetail.is_success_pick_release) {
                Swal.fire({
                    icon: "warning",
                    title: "Akses Ditolak",
                    text: "Belum bisa Ship Confirm. Silakan lakukan proses Pick Release terlebih dahulu hingga sukses.",
                    confirmButtonColor: "#3085d6",
                });
                return;
            }

            const isManifestUploaded =
                manifestUploadedMap[data.id] ||
                hasSubdistDocument(data.subdist_document);

            if (!isManifestUploaded) {
                setSelectedDO(data);
                setPendingShipConfirmDO(data);
                setShowUploadModal(true);
                return;
            }

            await openShipConfirmQtyModal(data, doDetail);
        } catch (error) {
            showErrorToast("Terjadi kesalahan saat memvalidasi status DO.");
        }
    };

    // 2.5️⃣ PROSES UPLOAD FILE DO SUBDIST KE S3 + UPDATE DO
    const handleUploadManifestFile = async (file: File) => {
        if (!selectedDO) return;

        const manifestUrl = await uploadFileDO(file, selectedDO.id);
        if (!manifestUrl) {
            throw new Error("Gagal mengunggah File DO Subdist ke S3");
        }

        const updateRes = await updateData(selectedDO.id, {
            subdist_document: file.name,
        });

        if (!updateRes?.success) {
            await deleteFileFromS3(manifestUrl).catch(() => null);
            throw new Error("Gagal menyimpan subdist_document ke DO");
        }

        showSuccessToast("File DO Subdist berhasil diunggah dan disimpan ke DO!");
        setManifestUploadedMap((prev) => ({
            ...prev,
            [selectedDO.id]: true,
        }));
        setManifestUrlMap((prev) => ({
            ...prev,
            [selectedDO.id]: manifestUrl,
        }));
        refreshTable();

        if (pendingShipConfirmDO) {
            const doData = {
                ...pendingShipConfirmDO,
                subdist_document: file.name,
            };
            setShowUploadModal(false);
            setPendingShipConfirmDO(null);

            const latestDetail = await getLatestDoDetail(doData.id);
            await openShipConfirmQtyModal(doData, latestDetail, {
                manifestUploaded: true,
            });
        }
    };

    const handleCloseShipConfirmQtyModal = async () => {
        const doId = qtyModalData?.id;

        if (doId && manifestUrlMap[doId]) {
            try {
                await deleteFileFromS3(manifestUrlMap[doId]);
                await updateData(doId, { subdist_document: null });
            } catch (error) {
                console.error("Gagal menghapus File DO Subdist dari S3:", error);
                showErrorToast("Gagal menghapus File DO Subdist dari S3.");
            }

            setManifestUploadedMap((prev) => {
                const next = { ...prev };
                delete next[doId];
                return next;
            });
            setManifestUrlMap((prev) => {
                const next = { ...prev };
                delete next[doId];
                return next;
            });
            refreshTable();
        }

        setShowQtyModal(false);
        setQtyModalData(null);
    };

    // 3️⃣ TAHAP FINAL: Buka Modal Penyesuaian Kuantitas Sebelum Post
    const handleFinalShipConfirmSubdist = async (data: OutboundDo) => {
        try {
            await openShipConfirmQtyModal(data);
        } catch (error) {
            console.error("Error final ship confirm:", error);
            showErrorToast("Terjadi kesalahan sistem saat validasi pengiriman final.");
        }
    };

    // 3.5️⃣ EKSEKUSI POST PAYLOAD KE API SERVER
    const handleExecuteShipConfirmWithQty = async (payload: {
        lines: Array<{ outbound_memo_item_id: string; shipped_quantity: number }>;
    }) => {
        if (!qtyModalData) return;

        try {
            const response = await axiosInstance.post(
                `${EndPoint}outbound-do/ship-confirm-subdist/${qtyModalData.id}`,
                payload
            );

            if (response.status === 200 || response.status === 201) {
                showSuccessToast("Final Ship Confirm Subdist berhasil diproses!");
                setShowQtyModal(false);
                setQtyModalData(null);
                refreshTable();
            }
        } catch (error: any) {
            showErrorToast(error.response?.data?.message || "Gagal melakukan Ship Confirm");
        } finally {
            setIsSubmittingQty(false);
        }
    };

    // --- AMO INTERNAL HANDLER ---
    const handleShipConfirmInternalAMO = async (data: OutboundDo) => {
        showConfirmDialog(
            async () => {
                try {
                    await axiosInstance.post(`${EndPoint}outbound-do/ship-confirm-internal/${data.id}`);
                    showSuccessToast("Ship confirm internal berhasil!");
                    refreshTable();
                } catch (error: any) {
                    showErrorToast(error.response?.data?.message || "Gagal Ship-confirm");
                }
            },
            {
                title: "Confirm Ship Confirm AMO",
                text: `Apakah anda yakin ingin melakukan Ship Confirm AMO untuk ${data.outbound_do_number}?`,
                confirmButtonText: "Ya!",
                cancelButtonText: "Tidak",
            },
        );
    };

    return {
        showSealModal,
        setShowSealModal,
        showUploadModal,
        handleCloseUploadModal,
        pendingShipConfirmAfterUpload: !!pendingShipConfirmDO,
        selectedDO,
        sealInput,
        setSealInput,
        handleConfirmSeal,
        handleAdjust,
        handlePrintAction,
        handlePickRelease,
        handleShipConfirmSubdistFlow,
        handleUploadManifestFile,
        handleFinalShipConfirmSubdist,
        handleShipConfirmInternalAMO,
        pickReleaseStatusMap,
        syncPickReleaseStatuses,

        showQtyModal,
        handleCloseShipConfirmQtyModal,
        qtyModalData,
        isSubmittingQty,
        handleExecuteShipConfirmWithQty,
        shippingLines,
        setShippingLines
    };
};