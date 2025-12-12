import { useEffect, useState } from "react";
import { CompactPickingRow } from "../../../Types/types";

export const usePickingQuantities = (compactRows: CompactPickingRow[]) => {
    const [quantities, setQuantities] = useState<Record<string, number>>({});

    // Sync ulang tiap compactRows berubah
    useEffect(() => {
        if (!compactRows || compactRows.length === 0) return;

        const initial: Record<string, number> = {};
        compactRows.forEach((row, index) => {
            initial[`${row.item_id}-${index}`] = row.qty_ready_to_pick || 0; // Pastikan ada nilai default
        });

        setQuantities(initial);
    }, [compactRows]);  // Pastikan compactRows stabil

    const updateQty = (key: string, value: number, max: number) => {
        const safe = Math.max(0, Math.min(value, max));
        setQuantities((prev) => ({ ...prev, [key]: safe }));
    };

    return { quantities, updateQty };
};