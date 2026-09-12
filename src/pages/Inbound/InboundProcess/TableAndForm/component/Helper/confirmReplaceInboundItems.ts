import Swal from "sweetalert2";

type ConfirmReplaceInboundItemsParams = {
  /** Mis. "PO 123456", "SO …", "SJ/DO …" */
  contextLabel: string;
  itemCount: number;
};

/**
 * Peringatan sebelum data item lama diganti (search baru / ganti nomor / validasi SJ).
 * Return true jika user OK.
 */
export async function confirmReplaceInboundItems({
  contextLabel,
  itemCount,
}: ConfirmReplaceInboundItemsParams): Promise<boolean> {
  if (itemCount <= 0) return true;

  const result = await Swal.fire({
    icon: "warning",
    title: "Data item akan diganti",
    html: `
      <p style="text-align:left;font-size:13px;color:#334155;line-height:1.55;margin:0;">
        Sudah ada <b>${itemCount}</b> item pada form.
        Melanjutkan untuk <b>${contextLabel}</b> akan
        <b>menghapus data lama</b> dan diganti data baru
        (hasil search API, atau form kosong untuk input manual jika data tidak ditemukan).
      </p>
      <p style="text-align:left;font-size:12px;color:#64748b;margin:12px 0 0;">
        Setelah itu Anda tetap akan melihat <b>Confirmation Inbound Plan</b> sebelum submit.
      </p>
    `,
    showCancelButton: true,
    confirmButtonText: "OK, Ganti Data",
    cancelButtonText: "Batal",
    confirmButtonColor: "#d97706",
    cancelButtonColor: "#64748b",
    reverseButtons: true,
    width: 520,
    didOpen: () => {
      const container = Swal.getContainer();
      if (container) container.style.zIndex = "100000";
    },
  });

  return Boolean(result.isConfirmed);
}
