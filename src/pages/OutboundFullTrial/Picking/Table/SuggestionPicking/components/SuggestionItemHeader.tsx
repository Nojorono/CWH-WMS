import React from "react";
import Select from "react-select";
import { formatDateIndo } from "../../../../../../helper/FormatDate";
import Button from "../../../../../../components/ui/button/Button";
import { FaSearch } from "react-icons/fa";

interface MemoDetail {
  id: any;
  outbound_memo_number: string;
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
  setSortMethod: (val: string) => void;
  sortMethod: string;
  handleFetchSuggestions: () => void;
}

export const SuggestionItemHeader: React.FC<MemoHeaderProps> = ({
  memoDetail,
  deliveryOrder,
  selectedDestination,
  setSelectedDestination,
  availableBins,
  sortMethod,
  setSortMethod,
  handleFetchSuggestions,
}) => {
  
  const sortOptions = [
    { value: "", label: "select method.." },
    { value: "FIFO", label: "FEFO" },
    { value: "LIFO", label: "LEFO" },
  ];

  return (
    <div className="p-5">
      {/* ✅ BAR ATAS: Sort Method + Fetch Suggestions */}

      {/* ✅ GRID DETAIL */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
        <div>
          <span className="text-gray-500 block">Memo ID</span>
          <span className="font-medium">{memoDetail.id}</span>
        </div>

        {/* Memo Number */}
        <div>
          <span className="text-gray-500 block">Memo Number</span>
          <span className="font-medium">{memoDetail.outbound_memo_number}</span>
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
          <span className="font-medium">
            {formatDateIndo(memoDetail.delivery_date)}
          </span>
        </div>

        {/* SELECT METHOD FETCH  SUGGESTION*/}
        <div className="flex items-end gap-4 mb-2">
          <div className="w-48">
            <label className="text-gray-500 block mb-1">Metode Suggestion</label>
            <Select
              value={sortOptions.find((option) => option.value === sortMethod)}
              onChange={(selectedOption) =>
                setSortMethod(selectedOption?.value || "")
              }
              options={sortOptions}
            />
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleFetchSuggestions}
            disabled={!sortMethod}
          >
            <FaSearch />
          </Button>
        </div>

        {/* Destination Bin */}
        <div className="md:col-span-1">
          <label className="text-gray-500 block mb-1">
            Destination Bin/Line
          </label>

          <Select
            value={
              selectedDestination
                ? {
                    value: selectedDestination,
                    label:
                      availableBins.find(
                        (bin) => bin.id === selectedDestination
                      )?.code || "",
                  }
                : null
            }
            onChange={(val: any) => setSelectedDestination(val?.value || "")}
            options={[
              { value: "", label: "select bin/line destination..." },
              ...availableBins.map((bin) => ({
                value: bin.id,
                label: `${bin.code}`,
              })),
            ]}
            placeholder="select bin/line destination..."
            isDisabled={availableBins.length === 0 || !sortMethod}
          />

          {availableBins.length === 0 && selectedDestination === "" && (
            <p className="text-xs text-orange-500 mt-1">Memuat daftar BIN...</p>
          )}
        </div>
      </div>
    </div>
  );
};
