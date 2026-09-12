import { checkIsGenerated } from "../../../../API/services/DOsuggestionServices/checkIsGeneratedDO";

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
            let currentStatus = null;
            let createdBy = null

            // --- LOGIKA BARU UNTUK TRIP_TYPE ---
            let tripType = "";

            if (item.CALL_PLAN_NUMBER) {
                tripType = item.ISLUARKOTA === true ? "MD" : "SD";
                currentStatus = "";

                try {
                    const existingData = await checkIsGenerated(item.CALL_PLAN_NUMBER);

                    if (existingData) {
                        isGenerated = true;
                        currentStatus = existingData.status || "DRAFT";
                        createdBy = existingData.created_by;
                    }

                } catch (error) {
                    console.error(`Gagal mengecek status untuk ${item.CALL_PLAN_NUMBER}`, error);
                    isGenerated = false;
                }
            }
            // ------------------------------------

            return {
                ...item,
                is_generated: isGenerated,
                do_status: currentStatus,
                trip_type: tripType,
                created_by: createdBy
            };
        })
    );

    return processedResults;
};