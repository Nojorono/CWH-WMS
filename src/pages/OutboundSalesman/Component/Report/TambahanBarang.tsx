import GudangFormModal from "./GudangForm/GudangFormModal";
import type { GudangFormRow } from "./GudangForm/types";

export type { GudangFormRow as TambahanBarangRow } from "./GudangForm/types";

type TambahanBarangProps = {
  onClose: () => void;
  organizationName?: string;
  tambahanDate?: string;
  doDate?: string;
  rows?: GudangFormRow[];
};

const TambahanBarang = ({
  onClose,
  organizationName,
  tambahanDate,
  doDate,
  rows,
}: TambahanBarangProps) => (
  <GudangFormModal
    variant="tambahan"
    onClose={onClose}
    organizationName={organizationName}
    formDate={tambahanDate}
    doDate={doDate}
    rows={rows}
  />
);

export default TambahanBarang;
