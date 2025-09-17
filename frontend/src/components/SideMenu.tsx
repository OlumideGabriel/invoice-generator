import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import UpgradeProCard from "./UpgradeProCard";
import { useCurrency } from "../context/CurrencyContext";
import Tooltip from "./Tooltip";

// Heroicons - Outline
import {
  Squares2X2Icon as Squares2X2Outline,
  DocumentTextIcon as DocumentTextOutline,
  UsersIcon as UsersOutline,
  Cog6ToothIcon as CogOutline,
  SquaresPlusIcon as SquaresPlusOutline,
  ChatBubbleLeftIcon
} from "@heroicons/react/24/outline";

// Heroicons - Solid
import {
  Squares2X2Icon as Squares2X2Solid,
  DocumentTextIcon as DocumentTextSolid,
  UsersIcon as UsersSolid,
  Cog6ToothIcon as CogSolid,
  SquaresPlusIcon as SquaresPlusSolid,
} from "@heroicons/react/24/solid";

interface MenuItem {
  path: string;
  label: string;
  outline: React.ElementType;
  solid: React.ElementType;
  submenu?: { label: string; path: string }[];
}

const menuItems: MenuItem[] = [
  { path: "/Dashboard", label: "Dashboard", outline: Squares2X2Outline, solid: Squares2X2Solid },
  { path: "/invoices", label: "Invoices", outline: DocumentTextOutline, solid: DocumentTextSolid },
  { path: "/clients", label: "Clients", outline: UsersOutline, solid: UsersSolid },
  { path: "/settings", label: "Settings", outline: CogOutline, solid: CogSolid },
  { path: "/new", label: "Create", outline: SquaresPlusOutline, solid: SquaresPlusSolid },
];

const SideMenu: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, openAuthModal } = useAuth();

  const [collapsed, setCollapsed] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const handleClick = (item: MenuItem) => {
    if (item.submenu) {
      setCollapsed(true);
      setExpandedItem((prev) => (prev === item.label ? null : item.label));
    }
  };

  const handleNavigation = (
    e: React.MouseEvent,
    path: string,
    item: MenuItem
  ) => {
    e.preventDefault();

    // Unauthenticated users: block all except /new
    if (!user && path !== "/new") {
      openAuthModal("login");
      return;
    }



    // Finally, navigate
    navigate(path);
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1120) {
        setCollapsed(true);
      } else {
        setCollapsed(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="bg-neutral-900 border-r border-gray-200 overflow-hidden">
      <div className="hidden md:flex relative items-stretch h-full">
        {/* Sidebar */}
        <aside
          className={`transition-all duration-500 delay-150 ease-in-out flex-1 justify-between ${
            collapsed ? "w-55" : "w-60"
          } sidebar px-4 py-8 flex flex-col font-medium gap-8 border-neutral-800`}
        >
          <nav className="flex flex-col gap-1">
            {menuItems.map(({ path, label, outline: OutlineIcon, solid: SolidIcon, submenu }) => {
              const isActive = location.pathname === path;
              const Icon = isActive ? SolidIcon : OutlineIcon;

              return submenu ? (
                <a
                  key={label}
                  onClick={(e) =>
                    handleNavigation(e, path, {
                      path,
                      label,
                      outline: OutlineIcon,
                      solid: SolidIcon,
                      submenu,
                    })
                  }
                  className={`flex items-center gap-3 px-4 py-3 h-[3.2rem] max-h-[3.2rem] font-medium transition-colors duration-150 text-xl ${
                    expandedItem === label
                      ? "text-black/100 bg-neutral-900"
                      : "text-gray-700"
                  }`}
                >
                  <Icon className="h-6 w-6 text-gray-500" />
                  {!collapsed && label}
                </a>
              ) : (
                <a
                  key={label}
                  href={path} // dummy href for accessibility
                  onClick={(e) =>
                    handleNavigation(e, path, {
                      path,
                      label,
                      outline: OutlineIcon,
                      solid: SolidIcon,
                      submenu,
                    })
                  }
                  className={`flex items-center gap-3 h-[3 rem] max-h-[3rem] px-3 py-2 font-medium transition-colors duration-150 text-xl rounded-lg ${
                    isActive
                      ? "text-black bg-gray-100 hover:text-neutral-900"
                      : "text-gray-700 hover:text-black/80 hover:bg-gray-100"
                  } ${!user ? "cursor-pointer" : ""}`}
                >
                  <Icon className="h-6 w-6" />
                  {!collapsed && label}
                </a>
              );
            })}
          </nav>

          {/* Upgrade Card */}
          <aside className="mt-auto">
            <UpgradeProCard />
          </aside>

          {/* Support button */}
          <button
            onClick={(e) => {
              if (!user) {
                e.preventDefault();
                openAuthModal("login");
              } else {
                navigate("/support");
              }
            }}
            className="flex items-center gap-2 p-2 justify-center bg-gray-100 rounded hover:bg-gray-200 text-gray-700 hover:text-black transition"
          >
            <ChatBubbleLeftIcon className="w-4 h-4" />
            {!collapsed && <span>Contact support</span>}
          </button>
        </aside>

        {/* Submenu Panel */}
        {collapsed && expandedItem && (
          <div className="w-48 bg-[#f6e9df] pt-10 border-neutral-300 shadow-sm">
            {menuItems
              .find((item) => item.label === expandedItem)
              ?.submenu?.map(({ label, path }) => (
                <div className="border-neutral-300" key={path}>
                  <a
                    href={path}
                    onClick={(e) => {
                      if (!user) {
                        e.preventDefault();
                        openAuthModal("login");
                      } else {
                        navigate(path);
                      }
                    }}
                    className="flex font-medium cursor-pointer items-center text-lg gap-2 py-3 hover:bg-gray-100 px-4 text-gray-700 hover:text-gray-100"
                  >
                    {label}
                  </a>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Mobile Menubar */}
      <div className="fixed md:hidden max-h-16 h-16 bottom-0 left-0 right-0 bg-neutral-50 border-t border-t-1 border-t-gray-200 border-t-dashed z-40">
        <nav className="flex justify-around items-center">
          {menuItems.map(({ path, label, outline: OutlineIcon, solid: SolidIcon }) => {
            const isActive = location.pathname === path;
            const Icon = isActive ? SolidIcon : OutlineIcon;

            return (
              <a
                key={label}
                href={path}
                onClick={(e) => handleNavigation(e, path, { path, label, outline: OutlineIcon, solid: SolidIcon })}
                className={`flex transition-all duration-300 delay-100 ease-in-out flex-col gap-1 w-1/6 py-2 px-3 text-xs border-t-4 border-transparent items-center cursor-pointer ${
                  isActive
                    ? "text-black/80 hover:text-black/80 border-black/80"
                    : "text-gray-800 hover:text-black/80"
                }`}
              >
                <Icon className="h-6 w-6" />
              </a>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default SideMenu;
