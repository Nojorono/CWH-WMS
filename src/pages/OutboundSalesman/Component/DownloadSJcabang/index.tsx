import React, { useState } from "react";
import {
  generateSuratJalanCabangPdf,
  type SuratJalanCabangData,
  type SuratJalanItem,
} from "./generateSuratJalanCabangPdf";

const EMPTY_ITEMS: SuratJalanItem[] = Array.from({ length: 5 }, () => ({
  namaBarang: "",
  banyaknya: "",
}));

/** Data preview kosong — UI hanya tampilan template, bukan form aktif */
const PREVIEW_DATA: SuratJalanCabangData = {
  amo: "",
  namaPengirim: "",
  nomorSuratJalan: "",
  nomorKendaraan: "",
  tujuan: "",
  noSegel: "",
  alamatPenerima: "",
  tanggal: "",
  keterangan: "",
  items: EMPTY_ITEMS,
  total: "",
  diterimaTgl: "",
};

const fieldClass =
  "h-7 w-full cursor-default border border-gray-300 bg-blue-50 px-2 outline-none pointer-events-none";

function DownloadSJcabang() {
  const [isDownloading, setIsDownloading] = useState(false);
  const data = PREVIEW_DATA;

  const handleDownloadPdf = () => {
    setIsDownloading(true);
    try {
      generateSuratJalanCabangPdf(data);
    } catch (error) {
      console.error("Gagal mengunduh PDF", error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center p-8 font-sans">
      <div className="mb-4 flex w-full max-w-[1100px] items-center justify-between gap-4">
        <p className="text-sm text-slate-500">
          Preview template Surat Jalan (bukan form input)
        </p>
        <button
          type="button"
          onClick={handleDownloadPdf}
          disabled={isDownloading}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white shadow-md transition-all hover:bg-blue-700 disabled:opacity-60"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          {isDownloading ? "Menyiapkan PDF..." : "Download PDF"}
        </button>
      </div>

      <div className="relative w-full max-w-[1100px] select-none bg-white p-10 text-gray-800 shadow-2xl">
        <div className="mb-6 flex items-end justify-between">
          <h1 className="text-2xl font-bold tracking-wide text-blue-900">
            PT Niaga Nusa Abadi
          </h1>
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold">AMO :</label>
            <input
              type="text"
              value={data.amo}
              readOnly
              tabIndex={-1}
              disabled
              className="h-8 w-48 cursor-default border border-gray-300 bg-blue-50 px-2 outline-none pointer-events-none"
            />
          </div>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-x-12 gap-y-3 text-sm">
          <div className="grid grid-cols-[130px_10px_1fr] items-center">
            <label>Nama Pengirim</label>
            <span>:</span>
            <input type="text" value={data.namaPengirim} readOnly disabled tabIndex={-1} className={fieldClass} />
          </div>
          <div className="grid grid-cols-[130px_10px_1fr] items-center">
            <label>Nomor Surat Jalan</label>
            <span>:</span>
            <input type="text" value={data.nomorSuratJalan} readOnly disabled tabIndex={-1} className={fieldClass} />
          </div>
          <div className="grid grid-cols-[130px_10px_1fr] items-center">
            <label>Nomor Kendaraan</label>
            <span>:</span>
            <input type="text" value={data.nomorKendaraan} readOnly disabled tabIndex={-1} className={fieldClass} />
          </div>
          <div className="grid grid-cols-[130px_10px_1fr] items-center">
            <label>Tujuan</label>
            <span>:</span>
            <input type="text" value={data.tujuan} readOnly disabled tabIndex={-1} className={fieldClass} />
          </div>
          <div className="grid grid-cols-[130px_10px_1fr] items-center">
            <label>No Segel</label>
            <span>:</span>
            <input type="text" value={data.noSegel} readOnly disabled tabIndex={-1} className={fieldClass} />
          </div>
          <div className="grid grid-cols-[130px_10px_1fr] items-center">
            <label>Alamat Penerima</label>
            <span>:</span>
            <input type="text" value={data.alamatPenerima} readOnly disabled tabIndex={-1} className={fieldClass} />
          </div>
          <div className="col-start-2 grid grid-cols-[130px_10px_1fr] items-center">
            <label>Tanggal</label>
            <span>:</span>
            <input type="text" value={data.tanggal} readOnly disabled tabIndex={-1} className={fieldClass} />
          </div>
        </div>

        <div className="mb-4 text-center">
          <h2 className="text-2xl font-bold tracking-wider text-blue-900">
            SURAT JALAN
          </h2>
        </div>

        <p className="mb-2 text-sm">
          Harap diterima dengan baik barang sebagai berikut :
        </p>

        <table className="mb-6 w-full border-collapse border border-gray-400 text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="w-12 border border-gray-400 py-2 text-center font-medium">
                No
              </th>
              <th className="border border-gray-400 py-2 font-medium">
                Nama Barang
              </th>
              <th className="w-48 border border-gray-400 py-2 font-medium">
                Banyaknya
              </th>
              <th className="w-1/3 border border-gray-400 py-2 font-medium">
                Keterangan
              </th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, index) => (
              <tr key={index}>
                <td className="border border-gray-400 py-2 text-center">
                  {index + 1}
                </td>
                <td className="border border-gray-400 p-1">
                  <input
                    type="text"
                    value={item.namaBarang}
                    readOnly
                    disabled
                    tabIndex={-1}
                    className="pointer-events-none h-full w-full cursor-default bg-blue-50/50 px-1 outline-none"
                  />
                </td>
                <td className="border border-gray-400 p-1">
                  <input
                    type="text"
                    value={item.banyaknya}
                    readOnly
                    disabled
                    tabIndex={-1}
                    className="pointer-events-none h-full w-full cursor-default bg-blue-50/50 px-1 text-center outline-none"
                  />
                </td>
                {index === 0 && (
                  <td
                    rowSpan={5}
                    className="border border-gray-400 bg-blue-50/30 p-2 align-top"
                  >
                    <textarea
                      value={data.keterangan}
                      readOnly
                      disabled
                      tabIndex={-1}
                      className="pointer-events-none min-h-[120px] h-full w-full cursor-default resize-none bg-transparent outline-none"
                    />
                  </td>
                )}
              </tr>
            ))}
            <tr>
              <td
                colSpan={2}
                className="border border-gray-400 py-2 text-center font-medium"
              >
                Total
              </td>
              <td className="border border-gray-400 p-1">
                <input
                  type="text"
                  value={data.total}
                  readOnly
                  disabled
                  tabIndex={-1}
                  className="pointer-events-none h-full w-full cursor-default bg-blue-50/50 px-1 text-center font-medium outline-none"
                />
              </td>
              <td className="border border-gray-400 bg-blue-50/30" />
            </tr>
          </tbody>
        </table>

        <div className="mb-1 flex items-center gap-2 text-sm font-bold">
          <label>Diterima Tgl :</label>
          <input
            type="text"
            value={data.diterimaTgl}
            readOnly
            disabled
            tabIndex={-1}
            className="pointer-events-none h-7 w-48 cursor-default border border-gray-400 bg-blue-50 px-2 font-normal outline-none"
          />
        </div>
        <p className="mb-6 text-xs italic text-gray-500">
          * Isikan tanggal diterimanya barang di lokasi tujuan.
        </p>

        <div className="grid grid-cols-3 gap-6 text-sm">
          {["Penerima", "Transporter", "Pengirim"].map((title) => (
            <div
              key={title}
              className="flex h-40 flex-col border border-gray-400"
            >
              <div className="border-b border-gray-400 bg-gray-50 py-1 text-center font-medium">
                {title}
              </div>
              <div className="relative flex-grow bg-blue-50/30" />
              <div className="mx-4 mt-auto mb-2 h-8 border-t border-dashed border-gray-400 bg-blue-50/30" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default DownloadSJcabang;
