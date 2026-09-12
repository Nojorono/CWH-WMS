// src/pages/CallPlan/hook/useDOActions.ts
import { useNavigate } from "react-router-dom";

export const useDOActions = () => {
    const navigate = useNavigate();

    const handleAdjust = (rowData: any, organization_id: any) => {
        console.log("Adjusting:", rowData.CALL_PLAN_NUMBER);
        navigate("generate_do", { state: { selectedSales: rowData, organization_id: organization_id } });
    };

    const handlePrintLabel = (rowData: any) => {
        console.log("Printing label for:", rowData.CALL_PLAN_NUMBER);
        // Masukkan logika print Anda di sini
    };

    return {
        handleAdjust,
        handlePrintLabel,
    };
};