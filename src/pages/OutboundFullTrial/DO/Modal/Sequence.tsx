import React, { useState, useEffect } from "react";
import { formatDateIndo } from "../../../../helper/FormatDate";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reorderedList: any[]) => void;
  formData: any;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  formData,
}) => {
  // 🧠 Hooks harus tetap dipanggil meskipun modal tertutup
  const [memoList, setMemoList] = useState<any[]>([]);
  const sensors = useSensors(useSensor(PointerSensor));

  // Sinkronisasi data formData → memoList
  useEffect(() => {
    if (formData?.memo_list) setMemoList(formData.memo_list);
  }, [formData]);

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setMemoList((prev) => {
      const oldIndex = prev.findIndex((m) => m.id === active.id);
      const newIndex = prev.findIndex((m) => m.id === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  // 🚫 Jangan letakkan return null sebelum hook
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-[999]">
      <div className="bg-white rounded-2xl w-[1000px] max-h-[85vh] overflow-y-auto shadow-xl p-6 animate-fadeIn">
        <h2 className="text-xl font-semibold text-gray-800 border-b pb-3 mb-4">
          Konfirmasi Data Outbound
        </h2>

        {/* Detail Info */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-700">
          <DetailItem label="Origin" value={formData?.origin || "-"} />
          <DetailItem
            label="Destination"
            value={formData?.destination || "-"}
          />
          <DetailItem
            label="Delivery Date"
            value={
              formData?.delivery_date
                ? formatDateIndo(formData.delivery_date)
                : "-"
            }
          />
          <DetailItem
            label="License Plate"
            value={formData?.license_plate || "-"}
          />
          <DetailItem label="Expedition" value={formData?.expedition || "-"} />
          <DetailItem label="Driver" value={formData?.driver || "-"} />
          <DetailItem
            label="Driver Phone"
            value={formData?.driver_phone || "-"}
          />
          <DetailItem
            label="PO Expedition"
            value={formData?.po_expedition || "-"}
          />
          <DetailItem
            label="Type Outbound"
            value={formData?.type_outbound || "-"}
          />
        </div>

        <div className="border-t my-5"></div>

        {/* Tabel Memo List */}
        <div>
          <h3 className="text-md font-semibold text-gray-800 mb-2">
            Daftar Memo Terkait (Geser untuk ubah urutan)
          </h3>

          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={memoList.map((m) => m.id)}
                strategy={verticalListSortingStrategy}
              >
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 text-gray-700 font-medium">
                    <tr>
                      <th className="p-2 border w-[40px] text-center">Sequence</th>
                      <th className="p-2 border text-left">Memo Id</th>
                      <th className="p-2 border text-left">Requestor</th>
                      <th className="p-2 border text-left">Origin</th>
                      <th className="p-2 border text-left">Destination</th>
                      <th className="p-2 border text-left">Ship To</th>
                    </tr>
                  </thead>
                  <tbody>
                    {memoList.length > 0 ? (
                      memoList.map((memo, index) => (
                        <SortableRow
                          key={memo.id || index}
                          memo={memo}
                          index={index}
                        />
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={5}
                          className="p-3 border text-center text-gray-500 italic"
                        >
                          Tidak ada memo dipilih
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </SortableContext>
            </DndContext>
          </div>
        </div>

        {/* Tombol Aksi */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition-all"
          >
            Batal
          </button>
          <button
            onClick={() => onConfirm(memoList)}
            className="px-5 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-all"
          >
            Konfirmasi
          </button>
        </div>
      </div>
    </div>
  );
};

// Komponen detail
const DetailItem = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col">
    <span className="text-xs text-gray-500">{label}</span>
    <span className="font-medium text-gray-800">{value}</span>
  </div>
);

// Baris yang bisa digeser
const SortableRow = ({ memo, index }: { memo: any; index: number }) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: memo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: "grab",
  };

  return (
    <tr ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <td className="p-2 border text-center">{index + 1}</td>
      <td className="p-2 border">{memo.id}</td>
      <td className="p-2 border">{memo.requestor}</td>
      <td className="p-2 border">{memo.origin}</td>
      <td className="p-2 border">{memo.destination}</td>
      <td className="p-2 border">{memo.ship_to}</td>
    </tr>
  );
};

export default ConfirmationModal;
