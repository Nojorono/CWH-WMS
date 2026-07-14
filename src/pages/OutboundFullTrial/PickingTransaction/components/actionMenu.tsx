import { useState, useRef, useEffect } from "react";
import { FaEllipsisV } from "react-icons/fa";

type ActionItem = {
  label: string;
  icon: React.ElementType;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
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
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 hover:text-slate-800"
      >
        <FaEllipsisV />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1 animate-in fade-in zoom-in duration-200">
          {actions.map((action, i) => (
            <button
              key={i}
              disabled={action.disabled}
              onClick={() => {
                if (action.disabled || !action.onClick) return;
                action.onClick();
                setIsOpen(false);
              }}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-xs font-bold transition-colors ${
                action.disabled
                  ? "text-slate-400 cursor-not-allowed opacity-60"
                  : `hover:bg-slate-50 ${action.className || "text-slate-600"}`
              }`}
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
