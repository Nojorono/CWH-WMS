type Props = {
  title: string;
  data: Record<string, any>;
  labelMap?: Record<string, string>; // optional: custom label
};

export default function KeyValueCard({ title, data, labelMap = {} }: Props) {
  return (
    <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-md">
      <h3 className="font-semibold text-gray-800 mb-5 text-lg">{title}</h3>

      <div className="space-y-4 text-sm">
        {Object.keys(data).map((key, index, arr) => (
          <div
            key={key}
            className={`flex justify-between ${
              index !== arr.length - 1 ? "border-b pb-2" : ""
            }`}
          >
            <span className="text-gray-500 font-medium">
              {labelMap[key] || key.replace(/_/g, " ")}
            </span>

            <span className="text-gray-900 font-semibold text-right max-w-[60%] truncate">
              {data[key] ?? "-"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
