// import { useState } from "react";
// import { CompactPickingRow } from "../../../Types/types";

// export const usePickingQuantities = (compactRows: CompactPickingRow[]) => {
//     const [quantities, setQuantities] = useState<Record<string, number>>(() => {
//         const initial: Record<string, number> = {};
//         compactRows.forEach((row, index) => {
//             initial[`${row.item_id}-${index}`] = row.qty_ready_to_pick;
//         });
//         return initial;
//     });

//     const updateQty = (key: string, value: number, max: number) => {
//         const safe = Math.max(0, Math.min(value, max));
//         setQuantities((prev) => ({ ...prev, [key]: safe }));
//     };

//     return { quantities, updateQty };
// };


import { useEffect, useState } from "react";
import { CompactPickingRow } from "../../../Types/types";

export const usePickingQuantities = (compactRows: CompactPickingRow[]) => {
    const [quantities, setQuantities] = useState<Record<string, number>>({});

    // Sync ulang tiap compactRows berubah
    useEffect(() => {
        if (!compactRows) return;

        const initial: Record<string, number> = {};
        compactRows.forEach((row, index) => {
            initial[`${row.item_id}-${index}`] = row.qty_ready_to_pick;
        });

        setQuantities(initial);
    }, [compactRows]);  // <-- ini penting banget!

    const updateQty = (key: string, value: number, max: number) => {
        const safe = Math.max(0, Math.min(value, max));
        setQuantities((prev) => ({ ...prev, [key]: safe }));
    };

    return { quantities, updateQty };
};
