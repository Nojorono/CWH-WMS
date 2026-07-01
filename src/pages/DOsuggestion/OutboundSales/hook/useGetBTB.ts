import { useState, useEffect, useCallback } from 'react';
import { CallPlanBindings } from '../../../../API/types/callPlan';
import { BTBSalesmanGroup, BTBFlatItem } from '../../../../API/types/BTBdata';
import { getBTB } from '../../../../API/services/DOsuggestionServices/getBTBservice';
import { showErrorToast } from '../../../../components/toast';
import { getBTBErrorMessage, getServerDayjs, isBypassMode, isGetBTBTimeAllowed } from '../../Suggestion/global/allowedDate';
import dayjs from 'dayjs';

interface UseGetBTBOptions {
    enabled?: boolean;
}

export const useGetBTB = (
    params: CallPlanBindings,
    options: UseGetBTBOptions = { enabled: true }
) => {
    const [data, setData] = useState<BTBSalesmanGroup[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false); // Tambahan state untuk penanda aman

    const cabang = params.CABANG;
    const startDate = params.CALL_PLAN_START_DATE;
    const isEnabled = options.enabled;

    const btbDate = dayjs(startDate).subtract(2, 'day').format('YYYY-MM-DD');

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setIsSuccess(false);

        try {
            const flatResult: BTBFlatItem[] = await getBTB({
                CABANG: cabang,
                CALL_PLAN_START_DATE: btbDate
            });

            if (!flatResult || !Array.isArray(flatResult)) {
                setData([]);
                setIsSuccess(true); // Data kosong bukan berarti error, melainkan sales memang bawa 0 barang.
                return;
            }

            const groupedData = flatResult.reduce((acc, curr) => {
                const salesNik = curr.SALES_NIK || "UNKNOWN_NIK";
                if (!acc[salesNik]) {
                    acc[salesNik] = {
                        SALES_NIK: salesNik,
                        SALES_NAME: curr.SALES_NAME || "Unknown Sales",
                        BTB_NUMBER: curr.BTB_NUMBER,
                        TANGGAL_BTB: curr.TANGGAL_BTB,
                        CABANG: curr.CABANG,
                        details: []
                    };
                }
                acc[salesNik].details.push({
                    PRODUCT_SKU: curr.PRODUCT_SKU,
                    PRODUCT_NAME: curr.PRODUCT_NAME,
                    INVENTORYID: curr.INVENTORYID,
                    QTY_BTB: curr.QTY_BTB
                });
                return acc;
            }, {} as Record<string, BTBSalesmanGroup>);

            setData(Object.values(groupedData));
            setIsSuccess(true); // Tandai bahwa sinkronisasi DWH sukses

        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            setError(errorMsg);
            // Pindahkan Toast ke sini agar hanya muncul 1x saat gagal fetch
            showErrorToast("Gagal sinkronisasi data BTB dari DWH: " + errorMsg);
            console.error("Fetch BTB Error:", err);
        } finally {
            setIsLoading(false);
        }
    }, [cabang, startDate]);

    // Di dalam hook useGetBTB
    useEffect(() => {
        // 1. Ambil waktu server yang akurat
        const serverNow = getServerDayjs();

        // 2. Gunakan fungsi validasi Anda
        const isAllowed = isGetBTBTimeAllowed(startDate);

        const isValidBranch = cabang && cabang !== "null" && cabang !== "undefined";
        const isValidDate = startDate && startDate !== "null" && startDate !== "undefined";

        // 3. Logika Proteksi
        if (isEnabled && isValidBranch && isValidDate) {
            if (isAllowed || isBypassMode()) {
                fetchData();
            } else {
                // Tampilkan error jika mencoba tarik data di luar jam 09:00 - 10:00
                setError(getBTBErrorMessage(startDate));
                // showErrorToast(getBTBErrorMessage(startDate));
                setData([]); // Bersihkan data agar tidak over-picking
            }
        } else if (!isEnabled) {
            setData([]);
        }
    }, [fetchData, isEnabled, cabang, startDate]);

    return { data, isLoading, error, isSuccess, refetch: fetchData };
};