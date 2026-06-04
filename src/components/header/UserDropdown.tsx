import { useState } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { useNavigate } from "react-router-dom";
import { signOut } from "../../utils/SignOut";
import { FaRegUserCircle } from "react-icons/fa";
import { HiOutlineLogout, HiChevronDown } from "react-icons/hi";

export default function UserDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }
  function closeDropdown() {
    setIsOpen(false);
  }

  const handleLogout = () => {
    closeDropdown();
    setTimeout(() => {
      signOut(navigate);
    }, 1000);
  };

  // --- Ambil Data ---
  const roleName = localStorage.getItem("role_name");
  const emailUser = localStorage.getItem("email");
  const storedFullName = localStorage.getItem("full_name");
  const orgName = localStorage.getItem("organization_name");
  const NIK = localStorage.getItem("NIK");


  // --- Logika Penamaan ---
  // Jika role adalah superadmin (case-insensitive), tampilkan "Superadmin"
  const isSuperAdmin = roleName?.toLowerCase() === "superadmin";
  const displayName = isSuperAdmin
    ? "Superadmin"
    : storedFullName || "Guest User";

  return (
    <div className="relative inline-block text-left">
      {/* TRIGGER BUTTON */}
      <button
        onClick={toggleDropdown}
        className="flex items-center gap-2.5 p-1.5 pr-4 transition-all duration-300 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 group"
      >
        <div className="relative">
          <div
            className={`flex items-center justify-center w-10 h-10 rounded-full shadow-inner transition-transform group-hover:scale-105 ${
              isSuperAdmin
                ? "bg-gradient-to-tr from-amber-500 to-orange-600"
                : "bg-gradient-to-tr from-blue-500 to-indigo-600"
            }`}
          >
            <FaRegUserCircle className="w-7 h-7 text-white/90" />
          </div>
          <span className="absolute bottom-0 right-0 block w-3 h-3 rounded-full bg-green-500 ring-2 ring-white dark:ring-gray-900 shadow-sm"></span>
        </div>

        <div className="hidden text-left md:block">
          <p className="text-sm font-bold text-gray-800 dark:text-gray-100 leading-tight">
            {isSuperAdmin ? "Superadmin" : roleName || "Guest"}
          </p>
          <p className="text-[13px] font-black text-blue-400 dark:text-gray-500 uppercase tracking-[0.1em]">
            {isSuperAdmin ? "System Master" : orgName}
          </p>
        </div>

        <HiChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* DROPDOWN MENU */}
      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute right-0 mt-3 w-72 origin-top-right divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-white shadow-2xl ring-1 ring-black/5 dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-950 overflow-hidden"
      >
        {/* User Profile Header */}
        <div className="px-5 py-5 bg-gray-50/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <div
              className={`h-12 w-12 rounded-2xl flex items-center justify-center font-bold text-xl shadow-sm ${
                isSuperAdmin
                  ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                  : "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
              }`}
            >
              {displayName.charAt(0)}
            </div>
            <div className="flex flex-col truncate">
              <span className="text-base font-extrabold text-gray-900 dark:text-white truncate tracking-tight">
                {displayName}
              </span>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate">
                {emailUser || "No email assigned"}
              </span>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate">
                {NIK || "No NIK exist"}
              </span>
            </div>
          </div>
        </div>

        {/* Logout Section */}
        <div className="p-2">
          <button
            onClick={handleLogout}
            className="group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-bold text-red-600 transition-all hover:bg-red-50 dark:hover:bg-red-500/10"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100 group-hover:bg-red-200 dark:bg-red-500/20 transition-colors">
              <HiOutlineLogout className="h-5 w-5" />
            </div>
            Sign Out
          </button>
        </div>
      </Dropdown>
    </div>
  );
}
