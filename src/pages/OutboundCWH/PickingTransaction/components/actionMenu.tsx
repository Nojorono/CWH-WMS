import { useState, useRef, useEffect, useLayoutEffect, CSSProperties } from "react";
import { createPortal } from "react-dom";
import { FaEllipsisV } from "react-icons/fa";

type ActionItem = {
  label: string;
  icon: React.ElementType;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
};

const MENU_WIDTH = 224; // w-56
const GAP = 8;
const VIEWPORT_PADDING = 8;

export const ActionMenu = ({ actions }: { actions: ActionItem[] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({
    visibility: "hidden",
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    const button = buttonRef.current;
    const menu = menuRef.current;
    if (!button || !menu) return;

    const rect = button.getBoundingClientRect();
    const menuHeight = menu.offsetHeight;
    const menuWidth = menu.offsetWidth || MENU_WIDTH;

    // Sejajar horizontal: buka di kiri tombol (bukan di bawah)
    let left = rect.left - menuWidth - GAP;
    if (left < VIEWPORT_PADDING) {
      left = rect.right + GAP;
    }
    if (left + menuWidth > window.innerWidth - VIEWPORT_PADDING) {
      left = window.innerWidth - menuWidth - VIEWPORT_PADDING;
    }

    // Vertikal sejajar dengan baris tombol
    let top = rect.top;
    if (top + menuHeight > window.innerHeight - VIEWPORT_PADDING) {
      top = rect.bottom - menuHeight;
    }
    if (top < VIEWPORT_PADDING) {
      top = VIEWPORT_PADDING;
    }

    setMenuStyle({
      position: "fixed",
      left,
      top,
      zIndex: 9999,
      visibility: "visible",
    });
  };

  useLayoutEffect(() => {
    if (!isOpen) return;

    updatePosition();
    const raf = requestAnimationFrame(updatePosition);

    const handleReposition = () => updatePosition();
    window.addEventListener("scroll", handleReposition, true);
    window.addEventListener("resize", handleReposition);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", handleReposition, true);
      window.removeEventListener("resize", handleReposition);
    };
  }, [isOpen, actions]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setIsOpen(false);
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setMenuStyle({ visibility: "hidden" });
    }
  }, [isOpen]);

  if (actions.length === 0) return null;

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 hover:text-slate-800"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <FaEllipsisV />
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            style={menuStyle}
            className="w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-1"
            role="menu"
          >
            {actions.map((action, i) => (
              <button
                key={i}
                type="button"
                role="menuitem"
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
                <action.icon className="size-4 shrink-0" />
                <span className="text-left">{action.label}</span>
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
};
