import { checkIsGenerated } from "../../../../API/store/DOsuggestionServices/checkIsGeneratedDO";

export const processCallPlanData = async (callPlanList: any[] = []) => {
    if (!callPlanList || callPlanList.length === 0) return [];

    // 1. Flatten Data: Ekstrak semua objek di dalam array 'DETAIL' menjadi satu array sejajar (flat)
    const flatDetails = callPlanList.flatMap((supervisorGroup) => {
        const supervisorName = supervisorGroup.SALES_SUPERVISOR_NAME;
        const supervisorNik = supervisorGroup.SALES_SUPERVISOR_NIK;

        return (supervisorGroup.DETAIL || []).map((detail: any) => ({
            ...detail,
            SALES_SUPERVISOR_NAME: supervisorName,
            SALES_SUPERVISOR_NIK: supervisorNik,
        }));
    });

    // 2. Map ke UI & Cek API: Loop array yang sudah diratakan untuk hit API checkIsGenerated
    const processedResults = await Promise.all(
        flatDetails.map(async (item) => {
            let isGenerated = false;
            // 1. Jadikan null sebagai default (tidak ada status sama sekali)
            let currentStatus: string | null = null;

            // Pengecekan kondisi ke API lain
            if (item.CALL_PLAN_NUMBER) {
                // 2. Karena dia punya Call Plan, status awalnya adalah NOT_STARTED
                currentStatus = "NOT_STARTED";

                try {
                    const existingData = await checkIsGenerated(item.CALL_PLAN_NUMBER);
                    if (existingData) {
                        isGenerated = true;
                        // Tangkap statusnya jika ada, misalnya "DRAFT", "REVISED", "SUBMITTED"
                        currentStatus = existingData.status || "DRAFT";
                    }
                } catch (error) {
                    console.error(`Gagal mengecek status untuk ${item.CALL_PLAN_NUMBER}`, error);
                    isGenerated = false;
                }
            }

            return {
                ...item,
                is_generated: isGenerated,
                do_status: currentStatus, 
            };
        })
    );

    return processedResults;
};