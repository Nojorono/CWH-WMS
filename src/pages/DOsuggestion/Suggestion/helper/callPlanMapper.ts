import { SupervisorData, CallPlanDetail, BTBResponse } from "../../../../API/types/callPlan";

// Di helper/callPlanMapper.ts
export const mergeSalesWithCallPlan = (
    supervisorData: SupervisorData[] = [],
    masterData: CallPlanDetail[] = [],
) => {
    // Pastikan supervisorData valid sebelum di-flatMap
    const activeDetailsMap = new Map(
        (supervisorData || []).flatMap(s => s.DETAIL || []).map(d => [d.SALES_NIK, d])
    );


    return masterData.map(master => {
        const activePlan = activeDetailsMap.get(master.SALES_NIK);

        return {
            ...master,
            CALL_PLAN_NUMBER: activePlan?.CALL_PLAN_NUMBER || master.CALL_PLAN_NUMBER || "-",
            CALL_PLAN_START_DATE: activePlan?.CALL_PLAN_START_DATE || master.CALL_PLAN_START_DATE || "-",
            CALL_PLAN_END_DATE: activePlan?.CALL_PLAN_END_DATE || master.CALL_PLAN_END_DATE || "-",
            ROUTE_NUMBER: activePlan?.ROUTE_NUMBER || master.ROUTE_NUMBER || "-",
            is_active_plan: !!activePlan,
        };
    });
};