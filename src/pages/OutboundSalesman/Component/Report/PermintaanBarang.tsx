import GudangFormModal from "./GudangForm/GudangFormModal";
import type { GudangFormRow } from "./GudangForm/types";

export type { GudangFormRow as PermintaanBarangRow } from "./GudangForm/types";

type PermintaanBarangProps = {
  onClose: () => void;
  organizationName?: string;
  requestDate?: string;
  doDate?: string;
  rows?: GudangFormRow[];
};

const PermintaanBarang = ({
  onClose,
  organizationName,
  requestDate,
  doDate,
  rows,
}: PermintaanBarangProps) => (
  <GudangFormModal
    variant="permintaan"
    onClose={onClose}
    organizationName={organizationName}
    formDate={requestDate}
    doDate={doDate}
    rows={rows}
  />
);

export default PermintaanBarang;
