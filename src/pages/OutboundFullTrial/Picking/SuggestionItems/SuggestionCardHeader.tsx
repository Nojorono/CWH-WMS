import React, { useEffect, useMemo } from "react";
import Select from "react-select";
import Button from "../../../../components/ui/button/Button";
import { useStoreBinByZone } from "../../../../DynamicAPI/stores/Store/MasterStore";
import { formatDateIndo } from "../../../../helper/FormatDate";

interface HeaderProps {
  onChangeMetode: (v: any) => void;
  onChangeDestination: (v: any) => void;
  onSearch: () => void;
  memoDetail: {
    id: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    outbound_memo_number: string;
    requestor: string;
    origin: string;
    ship_to: string;
    destination: string;
    delivery_date: string;
    status: string;
    type: string;
    notes: string;
    has_do: boolean;
  };
  metodeSuggestion: string;
  destinationBinId: string;
}

export const SuggestionCardHeader: React.FC<HeaderProps> = ({
  memoDetail,
  metodeSuggestion,
  destinationBinId,
  onChangeMetode,
  onChangeDestination,
  onSearch,
}) => {
  const { detail: binDataRaw, fetchById: fetchBINbyZoneId } =
    useStoreBinByZone();

  // Fetch bin list once
  useEffect(() => {
    fetchBINbyZoneId("73b1e685-d258-440b-b3cf-d66f34dd8187");
  }, [fetchBINbyZoneId]);

  // Convert API data -> Select options
  const binOptions = useMemo(() => {
    if (!Array.isArray(binDataRaw)) return [];
    return binDataRaw.map((bin: any) => ({
      value: bin.id, // Gunakan id sebagai value
      label: bin.name, // Gunakan name sebagai label
      warehouse_sub_id: bin.warehouse_sub_id, // Simpan warehouse_sub_id
    }));
  }, [binDataRaw]);

  // Find selected item so Select shows correct label
  const selectedBinValue = useMemo(() => {
    return binOptions.find((x) => x.value === destinationBinId) || null;
  }, [binOptions, destinationBinId]);

  return (
    <div className="bg-white shadow rounded-lg p-4 mb-6">
      {/* TOP INFO */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm mb-4">
        <div>
          <p className="text-gray-500">Memo ID</p>
          <p className="font-semibold break-all">{memoDetail.id}</p>
        </div>

        <div>
          <p className="text-gray-500">Outbound Memo Number</p>
          <p className="font-semibold">{memoDetail.outbound_memo_number}</p>
        </div>

        <div>
          <p className="text-gray-500">Requestor</p>
          <p className="font-semibold">{memoDetail.requestor}</p>
        </div>

        <div>
          <p className="text-gray-500">Origin</p>
          <p className="font-semibold">{memoDetail.origin}</p>
        </div>

        <div>
          <p className="text-gray-500">Ship To</p>
          <p className="font-semibold">{memoDetail.ship_to}</p>
        </div>

        <div>
          <p className="text-gray-500">Delivery Date</p>
          <p className="font-semibold">
            {formatDateIndo(memoDetail.delivery_date)}
          </p>
        </div>
      </div>

      {/* FILTERS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        {/* Destination Bin */}
        <div>
          <p className="text-gray-500 mb-1">Destination Bin/Line</p>
          <Select
            options={binOptions}
            value={selectedBinValue}
            onChange={(selected: any) => {
              if (selected) {
                onChangeDestination({
                  id: selected.value, // id dari bin
                  warehouse_sub_id: selected.warehouse_sub_id, // warehouse_sub_id
                });
              }
            }}
            placeholder="Pilih Bin"
            isLoading={!binDataRaw}
          />
        </div>

        {/* Metode Suggestion */}
        <div className="flex items-end">
          <div className="mr-4">
            <p className="text-gray-500 mb-1">Metode Suggestion</p>
            <Select
              options={[
                { value: "FIFO", label: "FEFO" },
                { value: "LIFO", label: "LEFO" },
              ]}
              value={{ value: metodeSuggestion, label: metodeSuggestion }}
              onChange={onChangeMetode}
            />
          </div>

          {/* Search Button */}
          <Button size="sm" onClick={onSearch}>Cari Suggestion</Button>
        </div>
      </div>
    </div>
  );
};
