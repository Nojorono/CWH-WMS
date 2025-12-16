import { DoGateVisibility } from "./DoGateVisibility";

export interface GateLoadingVisibility {
    gate: {
        gate_id: string;
        gate_name: string;
        gate_code: string;
    };

    do: DoGateVisibility;
}
