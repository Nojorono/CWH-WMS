import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, To, useLocation } from "react-router";
import { ChevronDownIcon, HorizontaLDots } from "../icons";
import { useSidebar } from "../context/SidebarContext";
import { useDynamicSidebarItems } from "./useDynamicSidebarItems";

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();
  const { menuItems, settingsItems } = useDynamicSidebarItems();

  const [openMainSubmenu, setOpenMainSubmenu] = useState<number | null>(null);
  const [openSettingsSubmenu, setOpenSettingsSubmenu] = useState<number | null>(
    null
  );
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );

  useEffect(() => {
    menuItems.forEach((nav, index) => {
      nav.subItems?.forEach((sub) => {
        if (isActive(sub.path)) {
          setOpenMainSubmenu(index);
        }
      });
    });
    settingsItems.forEach((nav, index) => {
      nav.subItems?.forEach((sub) => {
        if (isActive(sub.path)) {
          setOpenSettingsSubmenu(index);
        }
      });
    });
  }, [location.pathname, isActive, menuItems, settingsItems]);

  useEffect(() => {
    const refs = [
      ...(openMainSubmenu !== null ? [`main-${openMainSubmenu}`] : []),
      ...(openSettingsSubmenu !== null
        ? [`settings-${openSettingsSubmenu}`]
        : []),
    ];

    refs.forEach((key) => {
      const el = subMenuRefs.current[key];
      if (el) {
        setSubMenuHeight((prev) => ({
          ...prev,
          [key]: el.scrollHeight,
        }));
      }
    });
  }, [openMainSubmenu, openSettingsSubmenu]);

  const handleSubmenuToggle = (type: "main" | "settings", index: number) => {
    if (type === "main") {
      setOpenMainSubmenu((prev) => (prev === index ? null : index));
    } else {
      setOpenSettingsSubmenu((prev) => (prev === index ? null : index));
    }
  };

  const sortMenuItems = (items: any[]) => [
    ...items.filter((item) => !item.subItems || item.subItems.length === 0),
    ...items.filter((item) => item.subItems && item.subItems.length > 0),
  ];

  const renderSection = (
    items: typeof menuItems,
    type: "main" | "settings",
    title: string
  ) => (
    <div>
      <h2
        className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        {isExpanded || isHovered || isMobileOpen ? (
          title
        ) : (
          <HiDotsHorizontal className="size-6" />
        )}
      </h2>
      <ul className="flex flex-col gap-4">
        {sortMenuItems(items).map((nav, index) => {
          const isOpen =
            type === "main"
              ? openMainSubmenu === index
              : openSettingsSubmenu === index;
          const key = `${type}-${index}`;
          return (
            <li key={nav.name}>
              {nav.subItems ? (
                <button
                  onClick={() => handleSubmenuToggle(type, index)}
                  className={`menu-item group ${
                    isOpen ? "menu-item-active" : "menu-item-inactive"
                  } ${
                    !isExpanded && !isHovered
                      ? "lg:justify-center"
                      : "lg:justify-start"
                  }`}
                >
                  <span
                    className={`menu-item-icon-size ${
                      isOpen
                        ? "menu-item-icon-active"
                        : "menu-item-icon-inactive"
                    }`}
                  >
                    {nav.icon}
                  </span>
                  {(isExpanded || isHovered || isMobileOpen) && (
                    <span className="menu-item-text">{nav.name}</span>
                  )}
                  {(isExpanded || isHovered || isMobileOpen) && (
                    <FaChevronDown
                      className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-brand-500" : ""
                      }`}
                    />
                  )}
                </button>
              ) : (
                nav.path && (
                  <Link
                    to={nav.path}
                    className={`menu-item group ${
                      isActive(nav.path)
                        ? "menu-item-active"
                        : "menu-item-inactive"
                    }`}
                  >
                    <span
                      className={`menu-item-icon-size ${
                        isActive(nav.path)
                          ? "menu-item-icon-active"
                          : "menu-item-icon-inactive"
                      }`}
                    >
                      {nav.icon}
                    </span>
                    {(isExpanded || isHovered || isMobileOpen) && (
                      <span className="menu-item-text">{nav.name}</span>
                    )}
                  </Link>
                )
              )}
              {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
                <div
                  ref={(el) => {
                    subMenuRefs.current[key] = el;
                  }}
                  className="overflow-hidden transition-all duration-300"
                  style={{
                    height: isOpen ? `${subMenuHeight[key] || 0}px` : "0px",
                  }}
                >
                  <ul className="mt-2 space-y-1 ml-9">
                    {nav.subItems.map((sub: { name: boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | React.Key | null | undefined; path: To; }, subIndex: number) => (
                      <li key={`subitem-${index}-${subIndex}`}>
                        <Link
                          to={sub.path}
                          className={`menu-dropdown-item ${
                            isActive(String(sub.path))
                              ? "menu-dropdown-item-active"
                              : "menu-dropdown-item-inactive"
                          }`}
                        >
                          {sub.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 ${
        isExpanded || isMobileOpen || isHovered ? "w-[290px]" : "w-[90px]"
      } ${
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      } lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo Section */}
      <div
        className={`py-8 flex ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link to="">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <img
                className="dark:hidden"
                src="/images/logo/logo_nna.png"
                alt="Logo"
                width={150}
                height={40}
              />
              <img
                className="hidden dark:block"
                src="/images/logo/logo-dark.svg"
                alt="Logo"
                width={150}
                height={40}
              />
            </>
          ) : (
            <img
              src="/images/logo/logo-icon.svg"
              alt="Logo"
              width={32}
              height={32}
            />
          )}
        </Link>
      </div>

      {/* Main + Settings */}
      <div className="flex flex-col justify-between flex-1 overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6 flex flex-col flex-grow">
          <div className="flex flex-col gap-8 flex-grow">
            {renderSection(menuItems, "main", "Menu")}
          </div>
          {settingsItems.length > 0 && (
            <div className="mt-auto pt-6 border-t border-gray-200 dark:border-gray-800">
              {renderSection(settingsItems, "settings", "Settings")}
            </div>
          )}
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;