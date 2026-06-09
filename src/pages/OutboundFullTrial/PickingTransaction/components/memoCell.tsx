import { useState } from "react";

interface MemoItem {
  id: string;
  item?: {
    sku?: string;
    description?: string;
  };
  quantity_plan: number;
  uom: string;
}

interface MemoData {
  id: string;
  status: string;
  outbound_memo_number: string;
  outbound_memo_items?: MemoItem[];
}

interface MemoCellProps {
  memos: MemoData[];
}

const MemoCell = ({ memos }: MemoCellProps) => {
  const [openMemoId, setOpenMemoId] = useState<string | null>(null);

  if (!memos || memos.length === 0) {
    return (
      <div className="p-4 border-2 border-dashed border-slate-200 rounded-lg text-center">
        <span className="text-slate-400 italic text-xs font-medium">
          Belum ada data memo
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 min-w-[450px]">
      {memos
        .filter((memo) => memo.status !== "CANCELLED")
        .map((memo) => {
          const isOpen = openMemoId === memo.id;
          const memoItems = memo.outbound_memo_items || [];

          return (
            <div
              key={memo.id}
              className={`rounded-xl transition-all duration-300 border-2 ${
                isOpen
                  ? "border-blue-500 shadow-lg"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              {/* Header Memo */}
              <div
                onClick={() => setOpenMemoId(isOpen ? null : memo.id)}
                className={`p-4 cursor-pointer flex items-center justify-between gap-4 ${
                  isOpen ? "bg-blue-50/50" : "bg-white hover:bg-slate-50"
                }`}
              >
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-black text-slate-800 tracking-tight">
                    {memo.outbound_memo_number}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Total {memoItems.length} Items
                  </span>
                </div>
                <div
                  className={`transition-transform duration-300 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className="text-slate-400"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </div>
              </div>

              {/* Body Memo */}
              {isOpen && (
                <div className="bg-slate-50/50 p-3 flex flex-col gap-3 border-t border-slate-100">
                  {memoItems.length === 0 ? (
                    <div className="p-4 text-center text-slate-400 text-xs italic">
                      Tidak ada item
                    </div>
                  ) : (
                    memoItems.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-3"
                      >
                        <div className="flex justify-between items-start border-b border-slate-50 pb-2">
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-blue-600 uppercase tracking-wide">
                              {item.item?.sku || "N/A"}
                            </span>
                            <span className="text-[11px] font-bold text-slate-700">
                              {item.item?.description || "-"}
                            </span>
                          </div>
                          <div className="text-right flex flex-col">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">
                              Plan Qty Pick
                            </span>
                            <span className="text-sm font-black text-slate-800">
                              {item.quantity_plan} {item.uom}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
};

export default MemoCell;
