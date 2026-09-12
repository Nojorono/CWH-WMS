import { updateDO } from "../../../../API/services/DOsuggestionServices/postDOsuggestion";
import { DOSuggestionPayload, DOSuggestionLine } from "../../../../API/types/DOsuggestion"; // Sesuaikan path
import { showConfirmDialog } from "../../../../components/swal-confirm";
import { showErrorToast, showSuccessToast } from "../../../../components/toast";

interface UseSubmitDOProps {
    data: any; // Ganti dengan tipe data asli Anda (misal DOSuggestionPayload)
    localDetails: any[]; // Ganti dengan tipe data lines/detail Anda
    revisions: Map<string, number>;
    onSuccess: () => void; // Callback untuk membersihkan state di UI setelah sukses
}

export const useSubmitDOSuggestion = ({
    data,
    localDetails,
    revisions,
    onSuccess,
}: UseSubmitDOProps) => {

    const handleSubmit = async (actionType: "revision" | "submit" = "submit") => {
        if (!data) return;

        const isRevisionAction = actionType === "revision";

        const dialogConfig = isRevisionAction
            ? {
                title: "Simpan Revisi?",
                text: "Perubahan akan disimpan sementara sebagai Revision Data. Anda masih bisa mengubahnya nanti.",
                confirmBtn: "Ya, Simpan",
                successMsg: "Revisi berhasil disimpan.",
            }
            : {
                title: "Konfirmasi Submit",
                text: "Data yang telah disubmit tidak dapat diubah kembali. Apakah Anda yakin ingin melanjutkan?",
                confirmBtn: "Ya, Submit",
                successMsg: "Data berhasil disubmit.",
            };

        // Note: Pastikan showConfirmDialog tersedia di scope ini (di-import di atas)
        showConfirmDialog(
            async () => {
                try {
                    const payload: DOSuggestionPayload = {
                        id: data.id,
                        organization_id: data.organization?.id || "",
                        callplan_number: data.callplan_number,
                        callplan_date_start: data.callplan_date_start,
                        callplan_date_end: data.callplan_date_end,
                        route_number: data.route_number,
                        trip_type: data.trip_route,
                        sales_nik: data.sales_nik,
                        sales_name: data.sales_name,
                        sales_spv: data.sales_spv,
                        status: isRevisionAction ? "REVISED" : "SUBMITTED",
                        lines: [],
                    };

                    const itemsToProcess = isRevisionAction
                        ? localDetails.filter(
                            (item) =>
                                revisions.has(item.item_code) || // Item yang angkanya baru saja diubah
                                String(item.id).startsWith("temp-") // Item baru yang ditambahkan manual
                        )
                        : localDetails; // Jika Submit final, bawa semua data

                    // Jika setelah difilter ternyata kosong (user klik save tapi tidak merubah apa-apa)
                    if (isRevisionAction && itemsToProcess.length === 0) {
                        showSuccessToast("Tidak ada perubahan revisi yang perlu disimpan.");
                        onSuccess(); // Langsung kembalikan ke layar utama tanpa hit API
                        return;
                    }

                    payload.lines = itemsToProcess.map((item): DOSuggestionLine => {
                        const isRevisedLocally = revisions.has(item.item_code);

                        // UPDATE: Anggap item baru jika ID kosong/falsy ATAU berawalan temp-
                        const isNewItem = !item.id || String(item.id).startsWith("temp-");

                        const hasPreviousRevision =
                            item.item_qty_revision !== undefined &&
                            item.item_qty_revision !== null;

                        const latestRevisionQty = isRevisedLocally
                            ? Number(revisions.get(item.item_code))
                            : hasPreviousRevision
                                ? Number(item.item_qty_revision)
                                : null;

                        let submittedQty = undefined;

                        if (!isRevisionAction) {
                            if (latestRevisionQty !== null) {
                                submittedQty = latestRevisionQty;
                            } else {
                                submittedQty = Number(item.item_qty_suggestion || 0);
                            }
                        }

                        return {
                            ...(!isNewItem && { id: item.id }),
                            item_code: item.item_code,
                            item_qty_suggestion: Number(item.item_qty_suggestion || 0),
                            item_qty_revision: latestRevisionQty !== null ? latestRevisionQty : undefined,
                            item_qty_submitted: submittedQty,
                            item_uom: item.item_uom,
                            inventory_item_id: item.inventory_item_id
                        };
                    });

                    await updateDO(payload);
                    showSuccessToast(dialogConfig.successMsg);
                    onSuccess();

                } catch (err) {
                    showErrorToast(
                        `Gagal ${isRevisionAction ? "menyimpan revisi" : "submit"}. Periksa kembali koneksi Anda.`
                    );
                    console.error(err);
                }
            },
            {
                title: dialogConfig.title,
                text: dialogConfig.text,
                confirmButtonText: dialogConfig.confirmBtn,
                cancelButtonText: "Batal",
            }
        );
    };

    return { handleSubmit };
};