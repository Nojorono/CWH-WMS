import { useState } from "react";
import { useFormContext, UseFieldArrayReplace, UseFieldArrayAppend } from "react-hook-form";
import { validateDOService } from "../Services/DoService";
import { showErrorToast, showSuccessToast } from "../../../../../../components/toast";
import { FormValues } from "../formTypes";

// useDOValidation.ts
export const useDOValidation = (doIndex: number, replacePos: any, append: any) => {
    const { setValue, watch } = useFormContext<FormValues>();
    const [doStatus, setDoStatus] = useState<"success" | "failed" | null>(null);
    const [isDOChecked, setIsDOChecked] = useState(false);

    const watchedDONo = watch(`deliveryOrders.${doIndex}.do_no`);

    const handleCheckDO = async (): Promise<boolean> => { // Tambahkan return boolean
        if (!watchedDONo) {
            showErrorToast("No Surat Jalan wajib diisi");
            return false;
        }

        try {
            const data = await validateDOService(watchedDONo);
            if (data?.success) {
                const poString = data?.data?.data?.[0]?.DAFTAR_NO_PO || "";
                const poArr = poString ? poString.split(",").map((s: string) => s.trim()) : [];

                setValue(`deliveryOrders.${doIndex}.flag_validated`, true);
                setValue(`deliveryOrders.${doIndex}.validation_surat_jalan`, poArr.length > 0);

                if (poArr.length > 0) {
                    setDoStatus("success");
                    replacePos(poArr.map((po: string) => ({
                        po_no: po,
                        items: [],
                        vendor_name: "",
                        principal: "",
                    })));
                    showSuccessToast(`Validasi berhasil: ditemukan ${poArr.length} Dokumen`);
                } else {
                    setDoStatus("failed");
                    replacePos([]);
                    append({ po_no: "", items: [], vendor_name: "", principal: "" });
                    showErrorToast("Nomor PO tidak ditemukan, silakan isi manual.");
                }
                setIsDOChecked(true); // Set TRUE di sini sebelum return
                return true;
            }
            return false;
        } catch (err: any) {
            setDoStatus("failed");
            showErrorToast(err.message || "Terjadi kesalahan koneksi");
            return false;
        }
    };

    return { doStatus, setDoStatus, isDOChecked, setIsDOChecked, watchedDONo, handleCheckDO };
};