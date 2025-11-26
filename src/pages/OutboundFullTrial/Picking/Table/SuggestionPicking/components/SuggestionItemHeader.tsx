import React from "react";
import Select from "react-select"; // atau Select custom kamu
import { formatDateIndo } from "../../../../../../helper/FormatDate";

interface MemoDetail {
  id: any;
  origin: string;
  ship_to: string;
  delivery_date: string;
}

interface DeliveryOrder {
  id: string;
}

interface MemoHeaderProps {
  memoDetail: MemoDetail;
  deliveryOrder: DeliveryOrder;

  selectedDestination: string;
  setSelectedDestination: (val: string) => void;

  availableBins: Array<{ id: string; code: string }>;
}

export const SuggestionItemHeader: React.FC<MemoHeaderProps> = ({
  memoDetail,
  deliveryOrder,
  selectedDestination,
  setSelectedDestination,
  availableBins,
}) => {
  return (
    <div className="p-5 grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
      {/* Delivery Order */}
      <div>
        <span className="text-gray-500 block">Delivery Order ID</span>
        <span className="font-medium">{deliveryOrder.id}</span>
      </div>

      {/* Origin */}
      <div>
        <span className="text-gray-500 block">Origin</span>
        <span className="font-medium">{memoDetail.origin}</span>
      </div>

      {/* Ship To */}
      <div>
        <span className="text-gray-500 block">Ship To</span>
        <span className="font-medium">{memoDetail.ship_to}</span>
      </div>

      {/* Delivery Date */}
      <div>
        <span className="text-gray-500 block">Delivery Date</span>
        <span className="font-medium">{formatDateIndo(memoDetail.delivery_date)}</span>
      </div>

      {/* Destination BIN */}
      <div className="md:col-span-1">
        <label htmlFor="destination-bin" className="text-gray-500 block mb-1">
          Destination Bin/Line
        </label>

        <Select
          value={
            selectedDestination
              ? {
                  value: selectedDestination,
                  label:
                    availableBins.find((bin) => bin.id === selectedDestination)
                      ?.code || "",
                }
              : null
          }
          onChange={(val: any) => setSelectedDestination(val?.value || "")}
          options={[
            {
              value: "",
              label: "select bin destination...",
            },
            ...availableBins.map((bin) => ({
              value: bin.id,
              label: `${bin.code}`,
            })),
          ]}
          placeholder="select bin destination..."
          isDisabled={availableBins.length === 0}
        />

        {availableBins.length === 0 && selectedDestination === "" && (
          <p className="text-xs text-orange-500 mt-1">Memuat daftar BIN...</p>
        )}
      </div>

      <div>
        <span className="text-gray-500 block">Memo ID</span>
        <span className="font-medium">{memoDetail.id}</span>
      </div>
    </div>
  );
};
