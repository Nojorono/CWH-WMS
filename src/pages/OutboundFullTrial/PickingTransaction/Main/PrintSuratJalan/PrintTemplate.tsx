import React from "react";
import { OutboundMemo } from "../../../../../DynamicAPI/types/DeliverOrderTypes";
import { formatDateIndo } from "../../../../../helper/FormatDate";
import { usePersistAuthStore } from "../../../../../API/store/AuthStore/PersistAuthStore";

type DoHeader = {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  organization_id?: string;
  outbound_do_number?: string;
  expedition?: string;
  origin?: string;
  license_plate?: string;
  container_number?: string;
  seal_number?: string;
  driver_name?: string;
  driver_phone?: string;
  vendor_id?: string;
  vendor_po_number?: string | null;
  status?: string;
  outbound_type?: string;
  delivery_date?: string;
};

type PrintMemoPayload = OutboundMemo & {
  do_header?: DoHeader;
};

type PrintTemplateProps = {
  memo: PrintMemoPayload;
};

const PrintTemplate = React.forwardRef<
  HTMLDivElement,
  React.PropsWithChildren<PrintTemplateProps>
>((props, ref) => {
  const { memo } = props;
  const doHeader = memo?.do_header ?? {};

  const items: { nama: string; qtyValue: number; uom: string }[] = [];
  const totalsByUom: Record<string, number> = {};

  memo?.outbound_memo_items?.forEach((item: any) => {
    item?.assigned_gate_load?.forEach((agl: any) => {
      const qty = Number(agl?.quantity_loaded || 0);
      const uom = agl?.uom || "";

      items.push({
        nama: agl?.item?.description ?? "-",
        qtyValue: qty,
        uom,
      });

      if (uom) {
        totalsByUom[uom] = (totalsByUom[uom] || 0) + qty;
      }
    });
  });

  const FIXED_UOMS = ["DUS", "BAL", "PRESS", "BKS"];
  const totalQtyString = FIXED_UOMS.map(
    (uom) => `${totalsByUom[uom] ?? 0} ${uom}`,
  ).join(", ");

  // layout tetap rapi seperti contoh
  const MIN_ROWS = Math.max(items.length, 4);
  const paddedItems = [...items];
  while (paddedItems.length < MIN_ROWS) {
    paddedItems.push({ nama: "", qtyValue: 0, uom: "" });
  }
  
  // Ambil snapshot data langsung dari memory state Zustand tanpa memicu siklus render
  const userState = usePersistAuthStore.getState().user;
  const storedFullName =
    `${userState?.userDetail?.firstName ?? ""} ${userState?.userDetail?.lastName ?? ""}`.trim() ||
    "IT";

  const printDate = new Date();

  return (
    <div
      ref={ref}
      className="bg-white text-black font-sans w-[210mm] min-h-[297mm] mx-auto px-9 py-7 text-[11px] leading-tight"
    >
      {/* HEADER */}
      <div className="flex justify-between items-start gap-8 mb-3">
        <div className="flex-1">
          <p className="font-semibold text-[15px]">PT. Niaga Nusa Abadi</p>
          <p className="text-[15px] mb-3">
            {memo?.origin ?? doHeader?.origin ?? "-"}
          </p>

          <div className="space-y-0.5">
            <p>
              <span className="inline-block w-20">Vendor</span>:{" "}
              {doHeader?.expedition ?? "-"}
            </p>
            <p>
              <span className="inline-block w-20">Driver</span>:{" "}
              {doHeader?.driver_name ?? "-"}
            </p>
            <p>
              <span className="inline-block w-20">Driver Phone</span>:{" "}
              {doHeader?.driver_phone ?? "-"}
            </p>
            <p>
              <span className="inline-block w-20">No. Pol</span>:{" "}
              {doHeader?.license_plate}
            </p>
            <p>
              <span className="inline-block w-20">Segel</span>:{" "}
              {doHeader?.seal_number ?? "-"}
            </p>
          </div>
        </div>

        <div className="flex-1">
          <p>
            <span className="inline-block w-36">Nomor Surat Jalan</span>:{" "}
            {doHeader?.outbound_do_number ?? "-"}
          </p>
          <p>
            <span className="inline-block w-36">Nomor Sales Order</span>:{" "}
            {memo?.outbound_memo_number ?? "-"}
          </p>
          <p className="flex items-start">
            <span className="inline-block w-36 shrink-0">Customer</span>:
            <span className="ml-1 break-words">{memo?.destination ?? "-"}</span>
          </p>
          <p className="flex items-start">
            <span className="inline-block w-36 shrink-0">
              Alamat Pengiriman
            </span>
            :<span className="ml-1 break-words">{memo?.ship_to ?? "-"}</span>
          </p>
        </div>
      </div>

      <h1 className="text-center font-bold text-[17px] mb-2">Surat Jalan</h1>
      <p className="mb-1">
        Harap diterima dengan baik barang sebagai berikut :
      </p>

      {/* TABLE */}
      <table className="w-full border-collapse border border-black text-[11px]">
        <thead>
          <tr>
            <th className="border border-black px-2 py-1 w-[50px] text-center">
              No
            </th>
            <th className="border border-black px-2 py-1 w-[180px] text-center">
              Banyaknya
            </th>
            <th className="border border-black px-2 py-1 text-center">
              Nama Barang
            </th>
            <th className="border border-black px-2 py-1 w-[220px] text-center">
              Keterangan
            </th>
          </tr>
        </thead>
        <tbody>
          {paddedItems.map((item, index) => (
            <tr key={index} className="h-7">
              <td className="border border-black px-2 text-center">
                {index + 1}
              </td>
              <td className="border border-black px-2">
                {item.nama ? `${item.qtyValue} ${item.uom}` : ""}
              </td>
              <td className="border border-black px-2 uppercase">
                {item.nama}
              </td>
              <td className="border border-black px-2" />
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="h-10 align-top">
            <td colSpan={4} className="border border-black px-2 py-1">
              <div className="flex justify-between items-start w-full">
                <div className="font-semibold">{totalQtyString}</div>
                <div className="text-right italic max-w-[60%] break-words">
                  {/* {totalQtyTerbilang} */}
                </div>
              </div>
            </td>
          </tr>
        </tfoot>
      </table>

      {/* DATE RECEIVED */}
      <div className="mt-6 mb-1 flex justify-between items-center">
        <p>Diterima Tgl :</p>
        <p>
          {formatDateIndo(
            memo?.delivery_date ?? doHeader?.delivery_date ?? printDate,
          )}
        </p>
      </div>

      {/* SIGNATURE GRID */}
      <div className="border border-black grid grid-cols-3">
        <div className="h-24 border-r border-black flex flex-col justify-between p-1">
          <p className="text-center">Gudang Penerima,</p>
          <div className="w-full border-t border-black mt-auto text-center">
            (.............................)
          </div>
        </div>

        <div className="h-24 border-r border-black flex flex-col justify-between p-1">
          <p className="text-center">Ekspedisi,</p>
          <div className="w-full border-t border-black mt-auto text-center">
            ( {doHeader?.expedition ?? "-"})
          </div>
        </div>

        <div className="h-24 flex flex-col justify-between p-1">
          <p className="text-center">Gudang Pengirim,</p>
          <div className="w-full border-t border-black mt-auto text-center">
            ({storedFullName})
          </div>
        </div>
      </div>

      {/* BOTTOM FOOTER - tambahan PO Ekspedisi + print meta */}
      <div className="mt-1 flex justify-between items-start">
        <p className="text-[13px]">
          Po Ekspedisi : {doHeader?.vendor_po_number ?? "-"}
        </p>

        <div className="text-right leading-tight">
          <p>
            Print Date :{" "}
            {new Intl.DateTimeFormat("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })
              .format(printDate)
              .replace(",", "")}
          </p>
          <p>Print By : {storedFullName}</p>
        </div>
      </div>
    </div>
  );
});

PrintTemplate.displayName = "PrintTemplate";

export default PrintTemplate;
