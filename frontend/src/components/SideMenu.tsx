import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import UpgradeProCard from "./UpgradeProCard";
import Advert from "./Advert";
import { useCurrency } from "../context/CurrencyContext";
import Tooltip from "./Tooltip";
import AuthModal from "./AuthModal";
import { PanelLeft} from 'lucide-react';

// Heroicons - Outline
import {
  Squares2X2Icon as Squares2X2Outline,
  DocumentTextIcon as DocumentTextOutline,
  UsersIcon as UsersOutline,
  Cog6ToothIcon as CogOutline,
  SquaresPlusIcon as SquaresPlusOutline,
  ChatBubbleLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from "@heroicons/react/24/outline";

// Heroicons - Solid
import {
  Squares2X2Icon as Squares2X2Solid,
  DocumentTextIcon as DocumentTextSolid,
  UsersIcon as UsersSolid,
  Cog6ToothIcon as CogSolid,
  PlusIcon,
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
  { path: "/new", label: "Create", outline: PlusIcon, solid: PlusIcon },
];

const SideMenu: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [collapsed, setCollapsed] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');

  const handleClick = (item: MenuItem) => {
    if (item.submenu) {
      setCollapsed(true);
      setExpandedItem((prev) => (prev === item.label ? null : item.label));
    }
  };

  const openAuthModal = (mode: 'login' | 'signup') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const handleAuthModeChange = (mode: 'login' | 'signup') => {
    setAuthModalMode(mode);
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

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
    setExpandedItem(null); // Close any expanded submenus when toggling
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
    <>
      <div className="bg-neutral-900 items-stretch min-h-screen  border-r  border-gray-200">


        <div className="hidden md:flex relative h-full ">

          {/* Sidebar */}
          <aside
            className={`transition-all duration-500 delay-150 ease-in-out flex-1 justify-between ${
              collapsed ? "w-55" : "w-[14rem]"
            } sidebar px-4 py-8 flex flex-col font-medium gap-8 border-neutral-800`}
          >
          {/* Logo Section */}

          <div className="flex items-center ml-1 -mt-3.5 space-x-6">
            <Link to="/" className="flex items-start justify-center gap-1 hover:contrast-125">
              <img
                src="/envoyce.svg"
                alt="Envoyce Logo"
                className="h-10 md:h-10 w-auto "
              />
              {!collapsed && (
              <span className="md:text-3xl text-3xl sm:block tracking-tight text-[#0e423e] font-[Open Sauce Sans]">
                envoyce
              </span>
                )}
            </Link>
          </div>

            {/* Collapse Toggle Button */}
            <button
              onClick={toggleCollapsed}
              title={collapsed ? "Open sidebar" : "Collapse sidebar"}
              className={`absolute top-[1.23rem] items-center justify-center rounded-xl p-[0.5rem]  border-white
                ${collapsed ? "left-[1.34rem]  bg-[#0e423e] text-[#8eda91] opacity-0 hover:opacity-100"
                    : "right-0 text-[#0e423e]/40 hover:text-[#0e423e]/70 opacity-100 " }`}
            >
              <PanelLeft size={20} />
            </button>

            <nav className="flex flex-col gap-1">
              {menuItems.map(({ path, label, outline: OutlineIcon, solid: SolidIcon, submenu }) => {
                const isActive = location.pathname === path;
                const Icon = isActive ? SolidIcon : OutlineIcon;

                return submenu ? (
                  <Tooltip key={label} content={label} disabled={!collapsed} placement="right">
                    <a
                      onClick={(e) =>
                        handleNavigation(e, path, {
                          path,
                          label,
                          outline: OutlineIcon,
                          solid: SolidIcon,
                          submenu,
                        })
                      }
                      className={`flex items-center gap-3 px-4 py-3 h-[3rem] max-h-[3rem] font-medium transition-colors duration-150 text-xl ${
                        expandedItem === label
                          ? "text-black/100 bg-neutral-900"
                          : "text-gray-700"
                      }`}
                    >
                      <Icon className="h-6 w-6 text-gray-500" />
                      {!collapsed && label}
                    </a>
                  </Tooltip>
                ) : (
                  <Tooltip key={label} content={label} disabled={!collapsed} placement="right">
                    <a
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
                      className={`flex items-center gap-3 h-[3rem] max-h-[3rem] px-3 py-2 font-medium transition-colors duration-150 text-xl rounded-lg ${
                        isActive
                          ? "text-black bg-gray-100 hover:text-neutral-900"
                          : "text-gray-700 hover:text-black/80 hover:bg-gray-100"
                      } ${!user ? "cursor-pointer" : ""}`}
                    >
                      <Icon className="h-6 w-6" />
                      {!collapsed && label}
                    </a>
                  </Tooltip>
                );
              })}
            </nav>

            {/* Upgrade Card */}
            <aside className="mt-auto">
              <UpgradeProCard />
            </aside>

           {/* Advert Card - Only show when not collapsed */}
            {!collapsed && (
              <aside className="mt-auto">
                <Advert />
              </aside>
            )}

            {/* Support button */}
            <Tooltip content="Contact support" disabled={!collapsed} placement="right">
              <button
                onClick={(e) => {
                  if (!user) {
                    e.preventDefault();
                    openAuthModal("login");
                  } else {
                    navigate("/support");
                  }
                }}
                className="flex items-center gap-2 p-2 px-4 justify-center bg-gray-100 rounded hover:bg-gray-200 text-gray-700 hover:text-black transition"
              >
                <ChatBubbleLeftIcon className="w-4 h-4" />
                {!collapsed && <span>Contact support</span>}
              </button>
            </Tooltip>
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
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        mode={authModalMode}
        onModeChange={handleAuthModeChange}
      />
    </>
  );
};

export default SideMenu;