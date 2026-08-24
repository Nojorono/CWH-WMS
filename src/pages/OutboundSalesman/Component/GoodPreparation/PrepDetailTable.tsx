import React, { useMemo, useState } from "react";
import { FaEdit } from "react-icons/fa";
import { useStoreItem } from "../../../../DynamicAPI/stores/Store/MasterStore";
import { BTBDetail } from "../../types/BTBtypes";
import AdjustQtySPB, { AdjustQtyHeader, AdjustQtyItem } from "./AdjustQtySPB";
import { EnrichedDetail } from "./types";

const hasQtyRevision = (revision: string | number | null | undefined) => {
  if (revision === null || revision === undefined) return false;
  const raw = String(revision).trim();
  if (raw === "") return false;
  return !Number.isNaN(Number(raw));
};

type PrepDetailTableProps = {
  callplanId: string;
  details: EnrichedDetail[];
  unmatchedDetails?: BTBDetail[];
  header?: AdjustQtyHeader;
  onSaveAdjustments: (
    callplanId: string,
    payload: {
      items: AdjustQtyItem[];
      approvalUrl: string | null;
    },
  ) => Promise<boolean>;
  highlightedSku?: string;
};

export const PrepDetailTable = ({
  callplanId,
  details,
  unmatchedDetails = [],
  header,
  onSaveAdjustments,
  highlightedSku,
}: PrepDetailTableProps) => {
  const { list: itemList } = useStoreItem();
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const normalizedHighlightSku = String(highlightedSku || "").trim().toLowerCase();

  const showQtyRevisionCol = useMemo(
    () => details.some((d) => hasQtyRevision(d.item_qty_revision)),
    [details],
  );

  const { pickList, excessList } = useMemo(() => {
    const picked = details
      .map((d) => {
        const final = Number(d.item_qty_final ?? d.item_qty_submitted) || 0;
        const suggestion = Number(d.item_qty_suggestion) || 0;
        const btb = Number(d.qty_btb) || 0;
        const qtyRevision = hasQtyRevision(d.item_qty_revision)
          ? Number(d.item_qty_revision)
          : null;
        const master = itemList?.find((m: any) => m.sku === d.item_code);
        return {
          ...d,
          itemName: master?.description || d.item_code,
          suggestionQty: suggestion,
          finalQty: final,
          qtyRevision,
          btbQty: btb,
          topUpQty: Math.max(0, final - btb),
        };
      })
      .sort((a, b) => {
        if (normalizedHighlightSku) {
          const aMatch = String(a.item_code || "")
            .toLowerCase()
            .includes(normalizedHighlightSku);
          const bMatch = String(b.item_code || "")
            .toLowerCase()
            .includes(normalizedHighlightSku);
          if (aMatch !== bMatch) return aMatch ? -1 : 1;
          // Jika sama-sama match SKU yang dicari, tampilkan Qty terbesar lebih dulu.
          if (aMatch && bMatch) {
            const aQty = Number(a.finalQty ?? 0);
            const bQty = Number(b.finalQty ?? 0);
            if (aQty !== bQty) return bQty - aQty;
          }
        }
        return a.itemName.localeCompare(b.itemName);
      });

    const excess = unmatchedDetails
      .map((u: BTBDetail) => ({
        ...u,
        itemName:
          itemList?.find((m: any) => m.sku === u.item_code)?.description ||
          u.item_name ||
          u.item_code,
        btbQty: Number(u.btb_qty) || 0,
      }))
      .sort((a, b) => a.itemName.localeCompare(b.itemName));

    return { pickList: picked, excessList: excess };
  }, [details, unmatchedDetails, itemList, normalizedHighlightSku]);

  const colSpan = showQtyRevisionCol ? 7 : 6;

  return (
    <div className="grid grid-cols-1 gap-6 border-t bg-slate-50 p-4 lg:grid-cols-2">
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-2 border-b bg-emerald-50 px-4 py-3">
          <div className="text-xs font-bold uppercase text-slate-700">
            Picking List (Top Up) {pickList.length} Items
            {showQtyRevisionCol && (
              <span className="ml-2 rounded bg-orange-100 px-1.5 py-0.5 text-[10px] font-bold normal-case text-orange-700">
                Qty Revision
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsAdjustOpen(true)}
            className="inline-flex items-center gap-1.5 rounded border border-emerald-300 bg-white px-2.5 py-1 text-[11px] font-bold uppercase text-emerald-700 transition-colors hover:bg-emerald-100"
          >
            <FaEdit size={11} /> Adjust Qty
          </button>
        </div>
        <div className="max-h-72 overflow-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-emerald-50 text-slate-500">
              <tr>
                <th className="px-3 py-2">No</th>
                <th className="px-3 py-2">Item</th>
                <th className="px-3 py-2 text-center">Qty Suggestion</th>
                <th className="px-3 py-2 text-center">Qty Final</th>
                {showQtyRevisionCol && (
                  <th className="px-3 py-2 text-center text-orange-600">
                    Qty Revision
                  </th>
                )}
                <th className="px-3 py-2 text-center">Qty BTB</th>
                <th className="px-3 py-2 text-center text-emerald-600">
                  Top Up
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pickList.length === 0 ? (
                <tr>
                  <td
                    colSpan={colSpan}
                    className="px-3 py-6 text-center italic text-slate-400"
                  >
                    Tidak ada item pick list
                  </td>
                </tr>
              ) : (
                pickList.map((item, i) => {
                  const itemSku = String(item.item_code || "").toLowerCase();
                  const isHighlightedBySku =
                    normalizedHighlightSku.length > 0 &&
                    itemSku.includes(normalizedHighlightSku);

                  return (
                    <tr
                      key={item.id || i}
                      className={
                        isHighlightedBySku
                          ? "bg-yellow-100 ring-1 ring-yellow-300 hover:bg-yellow-100"
                          : item.finalQty === 0
                            ? "bg-red-50 text-red-700 hover:bg-red-100"
                            : item.qtyRevision !== null
                              ? "bg-orange-50/60 hover:bg-orange-50"
                              : "hover:bg-slate-50"
                      }
                    >
                      <td
                        className={`px-3 py-2 font-medium ${
                          item.finalQty === 0 ? "text-red-700" : "text-slate-800"
                        }`}
                      >
                        {i + 1}
                      </td>
                      <td
                        className={`px-3 py-2 font-medium ${
                          isHighlightedBySku
                            ? "text-yellow-900"
                            : item.finalQty === 0
                              ? "text-red-700"
                              : "text-slate-800"
                        }`}
                      >
                        {item.itemName}
                        {isHighlightedBySku && (
                          <span className="ml-2 rounded border border-yellow-400 bg-yellow-200 px-1.5 py-0.5 text-[10px] font-bold uppercase text-yellow-900">
                            match
                          </span>
                        )}
                      </td>
                      <td
                        className={`px-3 py-2 text-center ${
                          item.finalQty === 0 ? "font-bold text-red-600" : ""
                        }`}
                      >
                        {item.item_qty_suggestion}
                      </td>
                      <td
                        className={`px-3 py-2 text-center ${
                          item.finalQty === 0 ? "font-bold text-red-600" : ""
                        }`}
                      >
                        {item.finalQty}
                      </td>
                      {showQtyRevisionCol && (
                        <td className="px-3 py-2 text-center font-bold text-orange-600">
                          {item.qtyRevision !== null
                            ? item.qtyRevision > 0
                              ? `+${item.qtyRevision}`
                              : item.qtyRevision
                            : "-"}
                        </td>
                      )}
                      <td
                        className={`px-3 py-2 text-center ${
                          item.finalQty === 0 ? "text-red-500" : "text-blue-600"
                        }`}
                      >
                        {item.btbQty}
                      </td>
                      <td
                        className={`px-3 py-2 text-center font-bold ${
                          item.finalQty === 0 ? "text-red-600" : "text-emerald-600"
                        }`}
                      >
                        {item.topUpQty}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-rose-200 bg-white shadow-sm">
        <div className="border-b border-rose-100 bg-rose-50 px-4 py-3 text-xs font-bold uppercase text-rose-700">
          Unmatched BTB SKU
        </div>
        <div className="max-h-72 overflow-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-rose-50 text-rose-600">
              <tr>
                <th className="px-3 py-2">No</th>
                <th className="px-3 py-2">Item</th>
                <th className="px-3 py-2 text-center">Qty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rose-50">
              {excessList.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-3 py-6 text-center italic text-slate-400"
                  >
                    Tidak ada unmatched BTB
                  </td>
                </tr>
              ) : (
                excessList.map((item, i) => (
                  <tr key={i} className="hover:bg-rose-50">
                    <td className="px-3 py-2 font-medium text-slate-800">
                      {i + 1}
                    </td>
                    <td className="px-3 py-2 font-medium text-slate-800">
                      {item.itemName}
                    </td>
                    <td className="px-3 py-2 text-center font-bold text-rose-600">
                      {item.btbQty}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AdjustQtySPB
        isOpen={isAdjustOpen}
        header={header}
        items={pickList.map((item) => ({
          id: String(item.id),
          name: item.itemName || item.item_code,
          sku: item.item_code,
          qtySuggestion: Number(item.suggestionQty ?? item.item_qty_suggestion) || 0,
          qtyAwal: Number(item.finalQty) || 0,
          adjustment: 0,
        }))}
        onClose={() => setIsAdjustOpen(false)}
        onSave={async ({ items: adjustedItems, approvalUrl }) => {
          try {
            const saved = await onSaveAdjustments(callplanId, {
              items: adjustedItems,
              approvalUrl,
            });
            if (saved === true) {
              setIsAdjustOpen(false);
              return true;
            }
            return false;
          } catch {
            return false;
          }
        }}
      />
    </div>
  );
};

