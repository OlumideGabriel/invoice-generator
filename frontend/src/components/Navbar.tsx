import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthModal from "./AuthModal";

// Heroicons - Outline
import {
  Squares2X2Icon as Squares2X2Outline,
  DocumentTextIcon as DocumentTextOutline,
  UsersIcon as UsersOutline,
  Cog6ToothIcon as CogOutline,
  PlusIcon,
} from "@heroicons/react/24/outline";

// Heroicons - Solid
import {
  Squares2X2Icon as Squares2X2Solid,
  DocumentTextIcon as DocumentTextSolid,
  UsersIcon as UsersSolid,
  Cog6ToothIcon as CogSolid,
} from "@heroicons/react/24/solid";

interface MenuItem {
  path: string;
  label: string;
  outline: React.ElementType;
  solid: React.ElementType;
}

const menuItems: MenuItem[] = [
  { path: "/Dashboard", label: "Dashboard", outline: Squares2X2Outline, solid: Squares2X2Solid },
  { path: "/invoices", label: "Invoices", outline: DocumentTextOutline, solid: DocumentTextSolid },
  { path: "/clients", label: "Clients", outline: UsersOutline, solid: UsersSolid },
  { path: "/settings", label: "Settings", outline: CogOutline, solid: CogSolid },
  { path: "/new", label: "Create", outline: PlusIcon, solid: PlusIcon },
];

const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');

  const openAuthModal = (mode: 'login' | 'signup') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const handleAuthModeChange = (mode: 'login' | 'signup') => {
    setAuthModalMode(mode);
  };

  const handleNavigation = (
    e: React.MouseEvent,
    path: string
  ) => {
    e.preventDefault();

    // Unauthenticated users: block all except /new
    if (!user && path !== "/new") {
      openAuthModal("login");
      return;
    }

    // Navigate
    navigate(path);
  };

  return (
    <>
      {/* Mobile Navbar */}
      <div className="fixed md:hidden max-h-16 h-16 bottom-0 left-0 right-0 bg-neutral-50 border-t border-t-1 border-t-gray-200 border-t-dashed">
        <nav className="flex justify-around items-center">
          {menuItems.map(({ path, label, outline: OutlineIcon, solid: SolidIcon }) => {
            const isActive = location.pathname === path;
            const Icon = isActive ? SolidIcon : OutlineIcon;

            return (
              <a
                key={label}
                href={path}
                onClick={(e) => handleNavigation(e, path)}
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

export default Navbar;