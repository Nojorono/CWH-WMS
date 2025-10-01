import React from "react";

type DetailItem = {
  label: string;
  value: string | number;
};

type Props = {
  title?: string;
  items: DetailItem[];
};

const DetailCard: React.FC<Props> = ({ title = "Details", items }) => {
  return (
    <div className="bg-white shadow-md rounded-md border border-gray-200 p-4">
      <h2 className="text-lg font-semibold mb-4">{title}</h2>

      <div className="grid grid-cols-2 gap-y-4 gap-x-6">
        {items.map((item, index) => (
          <div key={index} className="flex items-center">
            <span className="w-32 text-sm font-medium text-gray-700">
              {item.label}
            </span>
            <span className="flex-1 px-3 py-2 rounded bg-gray-200 text-sm text-gray-800">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DetailCard;
