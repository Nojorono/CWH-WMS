import Swal, { SweetAlertIcon } from "sweetalert2";

interface ConfirmOptions {
  title?: string;
  text?: string;
  icon?: SweetAlertIcon;
  confirmButtonText?: string;
  cancelButtonText?: string;
  confirmButtonColor?: string;
  cancelButtonColor?: string;
  reverseButtons?: boolean;
}

/**
 * Helper dinamis untuk menampilkan dialog konfirmasi SweetAlert2
 * @param onConfirm Callback function yang dijalankan jika user menekan tombol konfirmasi
 * @param options Kustomisasi teks, ikon, dan warna
 */
export const showConfirmDialog = (
  onConfirm: () => void,
  options: ConfirmOptions = {}
) => {
  const {
    title = "Apakah Anda yakin?",
    text = "Tindakan ini tidak dapat dibatalkan!",
    icon = "warning",
    confirmButtonText = "Ya, Lanjutkan!",
    cancelButtonText = "Batal",
    confirmButtonColor = "#3085d6",
    cancelButtonColor = "#d33",
    reverseButtons = true,
  } = options;

  Swal.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonColor,
    cancelButtonColor,
    confirmButtonText,
    cancelButtonText,
    reverseButtons,
  }).then((result) => {
    if (result.isConfirmed) {
      onConfirm();
    }
  });
};
