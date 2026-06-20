import { useState, useRef, useEffect } from "react";
import { FaEllipsisV } from "react-icons/fa";

type ActionItem = {
  label: string;
  icon: React.ElementType;
  onClick?: () => void;
  className?: string;
  disabled?: boolean; // Dukungan untuk menonaktifkan aksi
};

export const ActionMenu = ({ actions }: { actions: ActionItem[] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (actions.length === 0) return null;

  return (
    <div className="relative flex justify-center" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-slate-100 transition-all text-slate-400 hover:text-slate-600 focus:outline-none"
      >
        <FaEllipsisV className="size-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-[100] animate-in fade-in zoom-in duration-150">
          {actions.map((action, i) => (
            <button
              key={i}
              disabled={action.disabled}
              onClick={() => {
                if (action.onClick) action.onClick();
                setIsOpen(false);
              }}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all
                ${
                  action.disabled
                    ? "opacity-40 cursor-not-allowed"
                    : "hover:bg-slate-50 cursor-pointer"
                } 
                ${action.className || "text-slate-700"}`}
            >
              <action.icon className="size-4" />
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
