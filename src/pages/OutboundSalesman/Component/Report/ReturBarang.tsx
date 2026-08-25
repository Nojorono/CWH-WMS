import GudangFormModal from "./GudangForm/GudangFormModal";
import type { GudangFormRow } from "./GudangForm/types";

export type { GudangFormRow as ReturBarangRow } from "./GudangForm/types";

type ReturBarangProps = {
  onClose: () => void;
  organizationName?: string;
  returDate?: string;
  doDate?: string;
  rows?: GudangFormRow[];
};

const ReturBarang = ({
  onClose,
  organizationName,
  returDate,
  doDate,
  rows,
}: ReturBarangProps) => (
  <GudangFormModal
    variant="retur"
    onClose={onClose}
    organizationName={organizationName}
    formDate={returDate}
    doDate={doDate}
    rows={rows}
  />
);

export default ReturBarang;
