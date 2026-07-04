import React, { useEffect, useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { FaArrowRight } from "react-icons/fa";
import Button from "../../../../components/ui/button/Button";
import { GroupedSPBData } from "../MainTable";
import { DOSuggestionDetail } from "../../../../API/types/draftDOsuggestion";
import { FaPrint } from "react-icons/fa6";
import { BaseTable } from "../component/BaseTable";
import { useStoreItem } from "../../../../DynamicAPI/stores/Store/MasterStore";
import { getServerDayjs, getTargetDate } from "../../Suggestion/global/allowedDate";
import { usePersistAuthStore } from "../../../../API/store/AuthStore/PersistAuthStore";
import { useGetStockOnHand } from "../hook/useGetStockOnHand";
import dayjs from "dayjs";

interface SPBSubmittedPageProps {
  data: GroupedSPBData[];
  onProceed: () => void;
  onGoToPreparation: () => void;
}

const StandardSubTable = ({
  details,
}: {
  details: DOSuggestionDetail[];
  status?: string;
}) => {

  const { fetchAll, list: itemList } = useStoreItem();

  useEffect(() => {
    fetchAll();
  }, []);

  const processedData = useMemo(() => {
    const mappedData = details.map((item: any) => {
      const matchedItem = itemList?.find(
        (master: any) => master.sku === item.item_code,
      );
      const itemName = matchedItem ? matchedItem.description : item.item_code;
      return { ...item, itemName };
    });

    return mappedData.sort((a, b) => a.itemName.localeCompare(b.itemName));
  }, [details, itemList]);

  if (!details?.length) {
    return (
      <div className="text-center py-6 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-slate-400 text-xs italic mx-4 my-2">
        Data SPB kosong.
      </div>
    );
  }

  // ⚡ 1. Hitung total SKU dan total Qty SPB secara dinamis
  const totalSkuSpb = processedData.length;
  const totalQtySpb = processedData.reduce(
    (sum, item) => sum + (Number(item.item_qty_submitted) || 0),
    0
  );

  return (
    <div className="p-4 bg-white border-t border-slate-200">
      {/* 📊 STATS PANEL: Ringkasan Total SKU & Qty */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Card Total SKU */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex flex-col shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Total SKU SPB
          </span>
          <span className="text-lg font-extrabold text-slate-800 mt-1">
            {totalSkuSpb}{" "}
            <span className="text-xs font-semibold text-slate-400 ml-0.5">Item</span>
          </span>
        </div>

        {/* Card Total Qty */}
        <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 flex flex-col shadow-sm">
          <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">
            Total Qty SPB
          </span>
          <span className="text-lg font-extrabold text-blue-600 mt-1">
            {totalQtySpb.toLocaleString("id-ID")}{" "}
            <span className="text-xs font-semibold text-blue-400 ml-0.5">BKS</span>
          </span>
        </div>
      </div>

      {/* 📋 TABLE CONTAINER */}
      <div className="overflow-hidden border border-slate-200 rounded-xl shadow-sm">
        <div className="max-h-[220px] overflow-y-auto custom-scrollbar">
          <table className="w-full text-left text-sm text-slate-600 border-collapse">
            <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200 shadow-sm">
              <tr>
                <th className="px-4 py-2.5 font-bold uppercase text-slate-500 text-[10px] tracking-wider w-12 text-center">
                  No
                </th>
                <th className="px-4 py-2.5 font-bold uppercase text-slate-500 text-[10px] tracking-wider">
                  Item Name
                </th>
                <th className="px-4 py-2.5 font-bold uppercase text-slate-500 text-[10px] tracking-wider">
                  SKU
                </th>
                <th className="px-4 py-2.5 font-bold uppercase text-slate-500 text-[10px] tracking-wider text-right">
                  Qty
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {processedData.map((item, idx) => (
                <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-4 py-2.5 font-medium text-slate-400 text-center">
                    {idx + 1}
                  </td>
                  <td className="px-4 py-2.5 font-semibold text-slate-800 text-xs">
                    {item.itemName}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-slate-400 text-[11px] tracking-tight">
                    {item.item_code}
                  </td>
                  <td className="px-4 py-2.5 font-bold text-slate-700 text-right text-xs">
                    {Number(item.item_qty_submitted).toLocaleString("id-ID")}
                  </td>
                </tr>
              ))}
            </tbody>

            {/* 🧮 SUMMARY ROW: Tfoot nempel di bagian paling bawah tabel */}
            <tfoot className="bg-slate-50 sticky bottom-0 z-10 border-t border-slate-200">
              <tr>
                <td colSpan={3} className="px-4 py-2.5 font-bold text-slate-500 text-[10px] tracking-wider text-right uppercase">
                  Total
                </td>
                <td className="px-4 py-2.5 font-black text-blue-600 text-right text-xs">
                  {totalQtySpb.toLocaleString("id-ID")}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

// 2. MAIN PAGE COMPONENT
export const SPBSubmittedPage = ({
  data,
  onProceed,
  onGoToPreparation,
}: SPBSubmittedPageProps) => {
  const [globalFilter, setGlobalFilter] = React.useState("");
  const state = usePersistAuthStore.getState();
  const { user } = usePersistAuthStore.getState();
  const organization_name = user?.userDetail?.organization?.organization_name;

  const allSalesmen = useMemo(() => {
    return data.flatMap((spvGroup) =>
      spvGroup.salesmenDO.map((salesman) => ({
        ...salesman,
        sales_spv_name: spvGroup.sales_spv_name,
        sales_spv_nik: spvGroup.sales_spv_nik,
      })),
    );
  }, [data]);

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      { accessorKey: "callplan_number", header: "Callplan Number" },
      { accessorKey: "sales_nik", header: "NIK Sales" },
      { accessorKey: "sales_name", header: "Nama Sales" },
      { accessorKey: "sales_spv_name", header: "Nama SPV" },
      { accessorKey: "sales_spv_nik", header: "NIK SPV" },
      {
        id: "total_sku",
        header: "Total SKU",
        cell: ({ row }) => row.original.details?.length || 0,
      },
      {
        accessorKey: "callplan_date_start",
        header: "Start Date",
        cell: (info) => info.getValue<string>(),
      },
      {
        accessorKey: "callplan_date_end",
        header: "End Date",
        cell: (info) => info.getValue<string>(),
      },
      { accessorKey: "status", header: "status" },
    ],
    [],
  );

  const status = allSalesmen[0]?.status;
  const now = getServerDayjs();
  const hour = now.hour();

  // Ambil flag bypass dari local storage
  const isBypass = localStorage.getItem("BYPASS_SOP_TIME") === "true";

  // Cek apakah saat ini berada di dalam jendela tarik stok (09:00 - 10:00)
  const isStockWindow = hour === 9;

  // Tombol kalkulasi aktif jika status SUBMITTED dan sudah masuk jam 9 ke atas (atau jika bypass aktif)
  const canCalculate = status === "SUBMITTED" && (hour >= 9 || isBypass);

  // FINAL : Selalu diizinkan untuk mencetak
  const canPrint = status === "FINAL";

  const footerButton = useMemo(() => {
    const isPrint = status === "FINAL";

    // Default label di luar jam 9-10 adalah "Proceed Calculate"
    let label = "Proceed Calculate";
    let icon = <FaArrowRight />;
    let action = onProceed;
    let className = "bg-blue-600 hover:bg-blue-700";

    if (isPrint) {
      label = "Proceed to Printing";
      icon = <FaPrint />;
      action = onGoToPreparation;
      className = "bg-emerald-600 hover:bg-emerald-700";
    } else if (isStockWindow) {
      label = "Get Stock on Hand";
    }

    return {
      label,
      icon,
      action,
      className,
      disabled: isPrint ? !canPrint : !canCalculate,
      tooltip: isPrint
        ? "Printing is available from 09:00 until 08:59 the next day."
        : hour < 9
          ? "Get Stock on Hand is only available from 09:00 to 10:00."
          : "",
    };
  }, [status, canCalculate, canPrint, hour, isStockWindow, onProceed, onGoToPreparation]);


  const [showBypass, setShowBypass] = useState(false);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setShowBypass((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const { data: stockList } = useGetStockOnHand({
    org: String(organization_name),
    sub: "KECIL",
  });

  const sohGeneratedTime = useMemo(() => {
    // Pastikan stockList valid dan memiliki data
    const list = Array.isArray(stockList) ? stockList : (stockList as any)?.data || [];
    if (!list || list.length === 0) return null;
    const firstItem = list[0];
    if (!firstItem?.createdAt) return null;
    // Format otomatis ke Jam:Menit sesuai waktu lokal browser user (contoh: 10:00)
    return dayjs(firstItem.createdAt).format("HH:mm");
  }, [stockList]);

  return (
    <>
      <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex flex-wrap items-center gap-6 text-sm">

          {showBypass && <> <div>
            <span className="font-semibold text-slate-600">From</span>
            <div
              className={`font-bold ${isBypass ? "text-orange-600" : "text-green-600"
                }`}
            >
              {isBypass ? "BP" : "SERVER"}
            </div>
          </div>

            <div>
              <span className="font-semibold text-slate-600">Status</span>
              <div className="font-bold">{status}</div>
            </div>
          </>
          }

          <div>
            <span className="font-semibold text-slate-600">Current Time</span>
            <div className="font-mono font-bold">
              {now.format("DD MMM YYYY HH:mm:ss")}
            </div>
          </div>


          <div>
            <span className="font-semibold text-slate-600">
              Calculate Allowed
            </span>
            <div
              className={`font-bold ${canCalculate ? "text-green-600" : "text-red-600"
                }`}
            >
              {canCalculate ? "YES" : "NO"}
            </div>
          </div>

          <div>
            <span className="font-semibold text-slate-600">
              Print Allowed
            </span>
            <div
              className={`font-bold ${canPrint ? "text-green-600" : "text-red-600"
                }`}
            >
              {canPrint ? "YES" : "NO"}
            </div>
          </div>
        </div>
      </div>

      <BaseTable
        data={allSalesmen}
        columns={columns}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
        isExpandable={true}
        renderSubComponent={(row) => (
          <StandardSubTable details={row.details} status={row.status} />
        )}
        footerAction={
          <div title={footerButton.disabled ? footerButton.tooltip : ""}>
            <Button
              onClick={footerButton.action}
              disabled={footerButton.disabled}
              variant="primary"
              className={footerButton.className}
              endIcon={footerButton.icon}
            >
              {footerButton.label}
            </Button>
          </div>
        }
      />
    </>
  );
};
