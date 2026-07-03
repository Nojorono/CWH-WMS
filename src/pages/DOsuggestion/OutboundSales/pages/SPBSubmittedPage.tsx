import React, { useEffect, useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { FaArrowRight } from "react-icons/fa";
import Button from "../../../../components/ui/button/Button";
import { GroupedSPBData } from "../MainTable";
import { DOSuggestionDetail } from "../../../../API/types/draftDOsuggestion";
import { FaPrint } from "react-icons/fa6";
import { formatDateTimeIndo } from "../../../../helper/FormatDateTime";
import { BaseTable } from "../component/BaseTable";
import { useStoreItem } from "../../../../DynamicAPI/stores/Store/MasterStore";
import { getServerDayjs, getTargetDate } from "../../Suggestion/global/allowedDate";
import dayjs from "dayjs";
import { log } from "node:console";
import { usePersistAuthStore } from "../../../../API/store/AuthStore/PersistAuthStore";

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
        Data product details kosong.
      </div>
    );
  }

  return (
    <div className="p-3 bg-white border-t border-slate-100">
      {/* Header Panel */}
      <div className="flex justify-between items-center mb-2 px-1">
        <h4 className="font-bold text-slate-700 text-[11px] uppercase tracking-wider flex items-center gap-2">
          Product Details
          <span className="bg-blue-50 text-blue-600 py-0.5 px-2 rounded text-[10px] font-bold border border-blue-100">
            {processedData.length} Items
          </span>
        </h4>
      </div>

      {/* Table Container */}
      <div className="overflow-hidden border border-slate-200 rounded-lg">
        <div className="max-h-[250px] overflow-y-auto custom-scrollbar">
          <table className="w-full text-left text-sm text-slate-600 border-collapse">
            <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-bold uppercase text-slate-500 text-xs w-12">
                  No
                </th>
                <th className="px-4 py-3 font-bold uppercase text-slate-500 text-xs">
                  Item Name
                </th>
                <th className="px-4 py-3 font-bold uppercase text-slate-500 text-xs">
                  SKU
                </th>
                <th className="px-4 py-3 font-bold uppercase text-slate-500 text-xs text-right">
                  Qty
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {processedData.map((item, idx) => (
                <tr key={idx} className="hover:bg-blue-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-400">
                    {idx + 1}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-800">
                    {item.itemName}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-500">
                    {item.item_code}
                  </td>
                  <td className="px-4 py-3 font-bold text-blue-600 text-right">
                    {item.item_qty_submitted}
                  </td>
                </tr>
              ))}
            </tbody>
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
  const user = state.user;
  const role_name = user?.role?.name;

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

  // SUBMITTED : hanya 09:00
  const canCalculate = status === "SUBMITTED"

  // FINAL : 09:00 - 08:59 (selalu selain jam 09-10 untuk calculate)
  const canPrint = status === "FINAL" && (hour >= 9 || hour < 9);

  const footerButton = useMemo(() => {
    const isPrint = status === "FINAL";

    return {
      label: isPrint ? "Proceed to Printing" : "Proceed to Calculation",
      icon: isPrint ? <FaPrint /> : <FaArrowRight />,
      action: isPrint ? onGoToPreparation : onProceed,
      className: isPrint
        ? "bg-emerald-600 hover:bg-emerald-700"
        : "bg-blue-600 hover:bg-blue-700",

      disabled: isPrint ? !canPrint : !canCalculate,
      tooltip: isPrint
        ? "Printing is available from 09:00 until 08:59 the next day."
        : "Calculation is only available from 09:00 to 10:00.",
    };
  }, [status, canCalculate, canPrint, onProceed, onGoToPreparation]);

  const isBypass =
    localStorage.getItem("BYPASS_SOP_TIME") === "true";

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
