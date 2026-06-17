import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import axiosInstance from "../../../../DynamicAPI/AxiosInstance";
import { useStoreShipConfirmByDO } from "../../../../DynamicAPI/stores/Store/MasterStore";
import { EndPoint } from "../../../../utils/EndPoint";
import { showErrorToast, showSuccessToast } from "../../../../components/toast";
import { showConfirmDialog } from "../../../../components/swal-confirm";
import { mapShipConfirmList } from "../Helper/mapShipConfirmList";
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
                        if (response.status === 200 || response.status === 201) {
                            showSuccessToast("Pick Release berhasil diproses!");
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

    // 2️⃣ TAHAP KEDUA: Buka Modal Upload Manifest
    const handleOpenUploadModal = async (data: OutboundDo) => {
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
                    text: "Belum bisa mengunggah dokumen. Silakan lakukan proses Pick Release terlebih dahulu hingga sukses.",
                    confirmButtonColor: "#3085d6",
                });
                return;
            }

            setSelectedDO(data);
            setShowUploadModal(true);
        } catch (error) {
            showErrorToast("Terjadi kesalahan saat memvalidasi status DO.");
        }
    };

    // 2.5️⃣ PROSES UPLOAD FILE MANIFEST
    const handleUploadManifestFile = async (file: File) => {
        if (!selectedDO) return;

        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await axiosInstance.post(
                `${EndPoint}outbound-do/upload-manifest-subdist/${selectedDO.id}`,
                formData,
                { headers: { "Content-Type": "multipart/form-data" } }
            );

            if (response.status === 200 || response.status === 201) {
                showSuccessToast("File manifes sukses diunggah!");
                refreshTable();
            }
        } catch (error: any) {
            showErrorToast(error.response?.data?.message || "Gagal mengunggah file manifes");
            throw error;
        }
    };

    // 3️⃣ TAHAP FINAL: Buka Modal Penyesuaian Kuantitas Sebelum Post
    const handleFinalShipConfirmSubdist = async (data: OutboundDo) => {
        try {
            // 1. Ambil data integrasi terbaru (Wajib untuk validasi status S/U)
            const doDetail = await getLatestDoDetail(data.id);

            if (!doDetail) {
                showErrorToast("Gagal mengambil data validasi akhir.");
                return;
            }

            // 2. Validasi Kesiapan (Wajib dari data integrasi)
            if (!doDetail.is_ready_ship_confirm) {
                Swal.fire({
                    icon: "warning",
                    title: "Belum Siap Ship Confirm",
                    text: "Pastikan semua item berstatus Pick Release (S) sebelum melakukan penyelesaian pengiriman.",
                    confirmButtonColor: "#3085d6",
                });
                return;
            }

            // 3. REFACTOR SUPER BERSIH: Satukan id Transaksi ERP dengan info teks dari Tabel Utama
            const enrichedMemos = doDetail.outbound_memos?.map((memo: any) => ({
                ...memo,
                outbound_memo_items: memo.outbound_memo_items?.map((integrationItem: any) => {
                    // Cari data teks pasangannya di tabel utama
                    const matchText = data.uiItems?.find((ui) => ui.item_id === integrationItem.item_id);

                    return {
                        ...integrationItem, // 👈 Tetap bawa ID transaksi asli (id, outbound_memo_id, integration_data)
                        sku: matchText?.sku || "N/A",
                        description: matchText?.description || "Tanpa Deskripsi",
                        uom: matchText?.uom || integrationItem.uom,
                    };
                })
            }));

            // 4. Set ke Modal
            setQtyModalData({
                ...doDetail,
                outbound_memos: enrichedMemos,
            });
            setShowQtyModal(true);

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
                title: "Confirm Submit",
                text: `Apakah anda yakin?`,
                confirmButtonText: "Ya!",
                cancelButtonText: "Tidak",
            },
        );
    };

    return {
        showSealModal,
        setShowSealModal,
        showUploadModal,
        setShowUploadModal,
        selectedDO,
        sealInput,
        setSealInput,
        handleConfirmSeal,
        handleAdjust,
        handlePrintAction,
        handlePickRelease,
        handleOpenUploadModal,
        handleUploadManifestFile,
        handleFinalShipConfirmSubdist,
        handleShipConfirmInternalAMO,

        // 🔹 FIX: State yang sempat tertinggal kini sudah diekspos keluar penuh
        showQtyModal,
        setShowQtyModal,
        qtyModalData,
        isSubmittingQty,
        handleExecuteShipConfirmWithQty,
        shippingLines,
        setShippingLines
    };
};