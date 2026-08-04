import { Callplan } from "../Services/types";

export type OutboundSalesmanStep =
  | "SUBMITTED"
  | "CALCULATION"
  | "PREPARATION";

export const STEP_CONFIG: Record<
  OutboundSalesmanStep,
  { title: string; breadcrumb: string }
> = {
  SUBMITTED: {
    title: "SPB Submitted",
    breadcrumb: "SPB Submitted",
  },
  CALCULATION: {
    title: "Stock on Hand & Calculation",
    breadcrumb: "Stock on Hand & Calculation",
  },
  PREPARATION: {
    title: "Goods Preparation",
    breadcrumb: "Goods Preparation",
  },
};

export type SPBViewProps = {
  onProceedToCalculation: (callplans: Callplan[]) => void;
  onProceedToPreparation: (callplans: Callplan[]) => void;
};

export type CalculationViewProps = {
  callplans: Callplan[];
  onBack: () => void;
  /** Hasil kalkulasi (FINAL + item_qty_final) dikirim ke Goods Preparation */
  onProceedToPreparation?: (calculatedCallplans?: Callplan[]) => void;
};

export type GoodPrepViewProps = {
  callplans: Callplan[];
  onBack: () => void;
};
