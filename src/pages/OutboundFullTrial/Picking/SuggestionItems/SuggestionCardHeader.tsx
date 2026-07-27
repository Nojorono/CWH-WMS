import React, { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import Button from "../../../../components/ui/button/Button";
import {
  useStoreBinByZone,
  useStoreSubWarehouse,
} from "../../../../DynamicAPI/stores/Store/MasterStore";
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
  const { fetchUsingParam, list: lsOutBound } = useStoreSubWarehouse();
  const [selectedZoneId, setSelectedZoneId] = useState<string>("");

  const needsZoneSelect = (lsOutBound?.length ?? 0) > 1;

  const zoneOptions = useMemo(() => {
    if (!Array.isArray(lsOutBound)) return [];
    return lsOutBound.map((zone: any) => ({
      value: zone.id,
      label: zone.code ? `${zone.code} - ${zone.name}` : zone.name,
    }));
  }, [lsOutBound]);

  const selectedZoneValue = useMemo(() => {
    return zoneOptions.find((z) => z.value === selectedZoneId) || null;
  }, [zoneOptions, selectedZoneId]);

  useEffect(() => {
    fetchUsingParam({
      is_staging: "OUTBOUND",
      is_gate: false,
    });
  }, [fetchUsingParam]);

  // 1 zone → auto-pick; >1 zone → tunggu user pilih
  useEffect(() => {
    if (!lsOutBound || lsOutBound.length === 0) {
      setSelectedZoneId("");
      return;
    }

    if (lsOutBound.length === 1) {
      setSelectedZoneId(lsOutBound[0].id);
      return;
    }

    setSelectedZoneId((prev) =>
      lsOutBound.some((z: any) => z.id === prev) ? prev : "",
    );
  }, [lsOutBound]);

  useEffect(() => {
    if (!selectedZoneId) return;
    fetchBINbyZoneId(selectedZoneId);
  }, [selectedZoneId, fetchBINbyZoneId]);

  const binOptions = useMemo(() => {
    if (!selectedZoneId || !Array.isArray(binDataRaw)) return [];
    const options = binDataRaw.map((bin: any) => ({
      value: bin.id,
      label: bin.name,
      warehouse_sub_id: bin.warehouse_sub_id ?? selectedZoneId,
    }));
    options.unshift({
      value: "",
      label: "All Line",
      warehouse_sub_id: selectedZoneId,
    });
    return options;
  }, [binDataRaw, selectedZoneId]);

  const selectedBinValue = useMemo(() => {
    return binOptions.find((x) => x.value === destinationBinId) || null;
  }, [binOptions, destinationBinId]);

  const handleChangeZone = (selected: any) => {
    const zoneId = selected?.value ?? "";
    setSelectedZoneId(zoneId);
    // Reset bin saat zone diganti
    onChangeDestination({
      id: "",
      warehouse_sub_id: zoneId || undefined,
    });
  };

  return (
    <div className="bg-white shadow rounded-lg p-4 mb-6">
      <h1 className="text-lg font-semibold col-span-3 mb-4">
        Picking Suggestion List
      </h1>

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
        {needsZoneSelect && (
          <div>
            <p className="text-gray-500 mb-1">Outbound Zone</p>
            <Select
              options={zoneOptions}
              value={selectedZoneValue}
              onChange={handleChangeZone}
              placeholder="Pilih Zone dahulu"
              isClearable
            />
          </div>
        )}

        {/* Destination Bin */}
        <div>
          <p className="text-gray-500 mb-1">Destination Bin/Line</p>
          <Select
            options={binOptions}
            value={selectedBinValue}
            onChange={(selected: any) => {
              if (selected) {
                onChangeDestination({
                  id: selected.value,
                  warehouse_sub_id: selected.warehouse_sub_id,
                });
              }
            }}
            placeholder={
              needsZoneSelect && !selectedZoneId
                ? "Pilih Zone dahulu"
                : "Pilih Bin"
            }
            isDisabled={needsZoneSelect && !selectedZoneId}
            isLoading={Boolean(selectedZoneId) && !binDataRaw}
          />
        </div>

        {/* Metode Suggestion */}
        <div className="flex items-end">
          <div className="mr-4">
            <p className="text-gray-500 mb-1">Suggestion Method</p>
            <Select
              options={[
                { value: "", label: "Pilih Metode" },
                { value: "FIFO", label: "FIFO" },
                { value: "LIFO", label: "LIFO" },
              ]}
              value={{ value: metodeSuggestion, label: metodeSuggestion }}
              onChange={onChangeMetode}
            />
          </div>

          {/* Search Button */}
          <Button size="sm" onClick={onSearch} disabled={!metodeSuggestion}>
            Search Suggestion
          </Button>
        </div>
      </div>
    </div>
  );
};
