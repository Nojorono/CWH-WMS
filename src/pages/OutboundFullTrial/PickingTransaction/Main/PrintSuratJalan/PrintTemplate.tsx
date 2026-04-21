import React from "react";
import { OutboundMemo } from "../../../../../DynamicAPI/types/DeliverOrderTypes";
import { formatDateIndo } from "../../../../../helper/FormatDate";

type PrintTemplateProps = {
  memo: OutboundMemo;
  doNumber: string;
  expedition: string;
  licensePlate: string;
  sealNumber: string;
  containerNumber?: string;
};

const PrintTemplate = React.forwardRef<
  HTMLDivElement,
  React.PropsWithChildren<PrintTemplateProps>
>((props, ref) => {
  const {
    memo,
    doNumber,
    expedition,
    licensePlate,
    sealNumber,
    containerNumber,
  } = props;

  const items: { nama: string; qtyValue: number; uom: string }[] = [];

  // 1. Kumpulkan data dan hitung Total per UoM
  const totalsByUom: { [uom: string]: number } = {};

  memo.outbound_memo_items.forEach((item) => {
    item.assigned_gate_load?.forEach((agl) => {
      const qty = agl.quantity_loaded || 0;
      const uom = agl.uom || "";

      items.push({
        nama: agl.item.description,
        qtyValue: qty,
        uom: uom,
      });

      // Penjumlahan berdasarkan key UoM
      if (uom) {
        totalsByUom[uom] = (totalsByUom[uom] || 0) + qty;
      }
    });
  });

  const FIXED_UOMS = ["DUS", "BAL", "PRESS", "BKS"];
  const totalQtyString = FIXED_UOMS.map(
    (uom) => `${totalsByUom[uom] ?? 0} ${uom}`,
  ).join(", ");

  // Minimal 15 baris agar layout konsisten
  const MIN_ROWS = items.length;
  const paddedItems = [...items];
  while (paddedItems.length < MIN_ROWS) {
    paddedItems.push({ nama: "", qtyValue: 0, uom: "" });
  }
  const storedFullName = localStorage.getItem("full_name");

  return (
    <div
      ref={ref}
      className="p-8 bg-white text-black font-sans w-[210mm] min-h-[297mm] mx-auto print:m-0"
    >
      {/* Header Atas */}
      <div className="flex justify-between text-[11px] leading-tight mb-6 gap-8">
        <div className="flex-1 min-w-0 space-y-1">
          <p className="font-bold text-[16px]">PT. Niaga Nusa Abadi</p>
          <p className="truncate">{memo.origin}</p>
          <div className="mt-4 space-y-0.5">
            <p>
              <span className="inline-block w-20">VENDOR</span>: {expedition}
            </p>
            <p>
              <span className="inline-block w-20">No.Pol</span>: {licensePlate}
            </p>
            <p>
              <span className="inline-block w-20">No. Seal</span>: {sealNumber}
            </p>
            <p>
              <span className="inline-block w-20">No. Container</span>:{" "}
              {containerNumber}
            </p>
          </div>
        </div>
        <div className="flex-1 min-w-0 text-left space-y-1">
          <p>
            <span className="inline-block w-40">Nomor Surat Jalan</span>:{" "}
            {doNumber}
          </p>
          <p>
            <span className="inline-block w-40">Nomor Sales Order</span>:{" "}
            {memo.outbound_memo_number}
          </p>
          <div className="flex items-start">
            <span className="inline-block w-40 flex-shrink-0">Customer</span>:
            <span className="ml-1 break-words whitespace-pre-line max-w-xs">
              {memo.destination}
            </span>
          </div>
          <div className="flex items-start">
            <span className="inline-block w-40 flex-shrink-0">
              Alamat Pengiriman
            </span>
            :
            <span className="ml-1 break-words whitespace-pre-line max-w-xs">
              {memo.ship_to}
            </span>
          </div>
        </div>
      </div>

      <h1 className="text-center font-bold text-xl uppercase tracking-widest mb-4">
        SURAT JALAN
      </h1>

      {/* Tabel */}
      <table className="w-full border-collapse border border-black text-[11px]">
        <thead>
          <tr className="bg-gray-50">
            <th className="border border-black px-1 py-1 w-[40px]">NO</th>
            <th className="border border-black px-2 py-1 w-[120px]">QTY</th>
            <th className="border border-black px-2 py-1 uppercase">
              Nama Barang
            </th>
            <th className="border border-black px-2 py-1 w-[150px]">
              KETERANGAN
            </th>
          </tr>
        </thead>
        <tbody>
          {paddedItems.map((item, index) => (
            <tr key={index} className="h-7">
              <td className="border border-black text-center">{index + 1}</td>
              <td className="border border-black px-2 text-center">
                {item.nama ? `${item.qtyValue} ${item.uom}` : ""}
              </td>
              <td className="border border-black px-2 font-medium uppercase">
                {item.nama}
              </td>
              <td className="border border-black px-2"></td>
            </tr>
          ))}
        </tbody>
        {/* FOOTER TABEL UNTUK TOTAL QTY */}
        <tfoot>
          <tr className="h-8 font-bold italic">
            <td colSpan={1} className="border border-black text-center">
              Total Qty
            </td>
            <td colSpan={3} className="border border-black px-2 bg-gray-50">
              {totalQtyString}
            </td>
          </tr>
        </tfoot>
      </table>

      {/* Footer Tanda Tangan */}
      <div className="text-[11px] mt-10">
        <div className="flex justify-between items-center mb-1">
          <p className="">Diterima Tgl :</p>
          <p className="">{formatDateIndo(memo.delivery_date)}</p>
        </div>
        <div className="grid grid-cols-3 border border-black">
          <div className="border-r border-black h-24 flex flex-col justify-between p-1">
            <p className="text-center">Gudang Penerima,</p>
            <div className="w-full border-t border-black/20 mt-auto"></div>
          </div>
          <div className="border-r border-black h-24 flex flex-col justify-between p-1">
            <p className="text-center font-medium">Ekspedisi</p>
            <div className="w-full border-t border-black/20 mt-auto"></div>
          </div>
          <div className="h-24 flex flex-col justify-between p-1">
            <p className="text-center">Gudang Pengirim,</p>
            <div className="w-full border-t border-black/20 mt-auto">{storedFullName}</div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default PrintTemplate;
