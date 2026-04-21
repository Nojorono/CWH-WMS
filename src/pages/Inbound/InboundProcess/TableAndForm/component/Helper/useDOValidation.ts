import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { validateDOservice } from "../Services/validateDOservice";
import { showErrorToast, showSuccessToast } from "../../../../../../components/toast";
import { FormValues } from "../formTypes";

// helper type
const getInboundType = (inbType: any): "PO" | "SO" => {
    if (inbType === "PO" || inbType?.value === "PO") return "PO";
    return "SO";
};

// helper extract doc number (🔥 inti fix ada disini)
const extractDocNumbers = (rawList: any[], type: "PO" | "SO"): string[] => {
    if (type === "PO") {
        return rawList.flatMap((item: any) => {
            const raw = item.DAFTAR_NO_PO;

            return raw
                ? raw.split(",").map((s: string) => s.trim()).filter(Boolean)
                : [];
        });
    }

    // SO (beda struktur!)
    return rawList.map((item: any) => String(item.ORDER_NUMBER));
};

export const useDOValidation = (
    doIndex: number,
    replacePos: any,
    append: any,
    inbType: any
) => {
    const { setValue, watch } = useFormContext<FormValues>();

    const [doStatus, setDoStatus] = useState<"success" | "failed" | null>(null);
    const [isDOChecked, setIsDOChecked] = useState(false);

    const watchedDONo = watch(`deliveryOrders.${doIndex}.do_no`);

    const handleCheckDO = async (): Promise<boolean> => {
        if (!watchedDONo) {
            showErrorToast("No Surat Jalan wajib diisi");
            return false;
        }

        try {
            const data = await validateDOservice(watchedDONo, inbType);

            if (!data?.success) return false;

            const type = getInboundType(inbType);
            const isPO = type === "PO";

            // ambil list sesuai type
            const rawList = isPO
                ? data?.data?.data_po ?? []
                : data?.data?.data_so ?? [];

                console.log("rawList", rawList);
                

            // 🔥 FIX utama: parsing beda PO vs SO
            const docNumbers = extractDocNumbers(rawList, type);

            // set flag form
            setValue(`deliveryOrders.${doIndex}.flag_validated`, true);
            setValue(
                `deliveryOrders.${doIndex}.validation_surat_jalan`,
                docNumbers.length > 0
            );

            if (docNumbers.length > 0) {
                setDoStatus("success");

                replacePos(
                    docNumbers.map((no: string) => ({
                        ...(isPO ? { po_no: no } : { so_no: no }),
                        items: [],
                        vendor_name: "",
                        principal: "",
                    }))
                );

                showSuccessToast(
                    `Validasi berhasil: ditemukan ${docNumbers.length} Dokumen`
                );
            } else {
                setDoStatus("failed");

                replacePos([]);
                append({
                    ...(isPO ? { po_no: "" } : { so_no: "" }),
                    items: [],
                    vendor_name: "",
                    principal: "",
                });

                showErrorToast(
                    "Nomor dokumen tidak ditemukan, silakan isi manual."
                );
            }

            setIsDOChecked(true);
            return true;
        } catch (err: any) {
            setDoStatus("failed");
            showErrorToast(err.message || "Terjadi kesalahan koneksi");
            return false;
        }
    };

    return {
        doStatus,
        setDoStatus,
        isDOChecked,
        setIsDOChecked,
        watchedDONo,
        handleCheckDO,
    };
};