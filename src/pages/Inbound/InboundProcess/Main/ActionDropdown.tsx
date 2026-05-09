import { useEffect, useRef, useState } from "react";
import { FaEye, FaEdit, FaTrash, FaEllipsisV } from "react-icons/fa";

export const ActionDropdown = ({
  item,
  handleDetail,
  handleUpdate,
  handleDelete,
}: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cek kondisi status
  const showEditDelete = [
    "CREATED",
    "WAITING FOR REVISION",
    "UNLOADING",
  ].includes(item.status);

  // Tutup dropdown jika user klik di luar area menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      className="relative flex items-center justify-center"
      ref={dropdownRef}
    >
      {/* Tombol Titik Tiga - Area klik diperbesar, ada state active */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-lg transition-all duration-200 focus:outline-none ${
          isOpen
            ? "bg-blue-50 text-blue-700 ring-2 ring-blue-200/50"
            : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
        }`}
        title="Actions"
      >
        <FaEllipsisV className="size-[14px]" />
      </button>

      {/* Menu Dropdown - Diperlebar, posisi digeser agar tidak nabrak layar kanan */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-44 bg-white border border-slate-100 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] z-[999] py-1.5 text-[13px] font-medium animate-in fade-in zoom-in-95 duration-150 origin-top-right">
          <button
            onClick={() => {
              handleDetail(item);
              setIsOpen(false);
            }}
            className="w-full text-left px-3 py-2.5 hover:bg-slate-50 flex items-center gap-3 text-slate-700 transition-colors"
          >
            <div className="bg-green-100 text-green-600 p-1.5 rounded-md">
              <FaEye className="size-3.5" />
            </div>
            View Detail
          </button>

          {showEditDelete && (
            <>
              <button
                onClick={() => {
                  handleUpdate(item);
                  setIsOpen(false);
                }}
                className="w-full text-left px-3 py-2.5 hover:bg-slate-50 flex items-center gap-3 text-slate-700 transition-colors"
              >
                <div className="bg-blue-100 text-blue-600 p-1.5 rounded-md">
                  <FaEdit className="size-3.5" />
                </div>
                Edit Data
              </button>
              <div className="h-px bg-slate-100 my-1 mx-3"></div>{" "}
              {/* Divider */}
              <button
                onClick={() => {
                  handleDelete(item.id);
                  setIsOpen(false);
                }}
                className="w-full text-left px-3 py-2.5 hover:bg-red-50 flex items-center gap-3 text-red-600 transition-colors group"
              >
                <div className="bg-red-100 text-red-600 p-1.5 rounded-md group-hover:bg-red-200 transition-colors">
                  <FaTrash className="size-3.5" />
                </div>
                Delete
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
