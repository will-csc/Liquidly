import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeftRight, ClipboardList, FileText, Folder, Home, LogOut, Trash2, User } from "lucide-react";
import logoGreen from "../assets/images/logo-green.png";
import SafeIcon from "../components/ui/SafeIcon";
import homeIcon from "../assets/icons/home.svg";
import bomIcon from "../assets/icons/clipboard-list.svg";
import reportIcon from "../assets/icons/file-text.svg";
import conversionsIcon from "../assets/icons/arrow-left-right.svg";
const projectsIcon = reportIcon;
import userIcon from "../assets/icons/user.svg";
import logoutIcon from "../assets/icons/log-out.svg";
import trashIcon from "../assets/icons/trash-2.svg";
import { useI18n } from "@/i18n/i18n";
import type { User as StoredUser } from "@/types";
import { Button } from "@/components/ui/button";
import { userService } from "@/services/api";

const navItems = [
  { icon: Home, fallback: homeIcon, labelKey: "nav.home", path: "/dashboard" },
  { icon: Folder, fallback: projectsIcon, labelKey: "nav.projects", path: "/dashboard/projects" },
  { icon: ClipboardList, fallback: bomIcon, labelKey: "nav.bom", path: "/dashboard/bom" },
  { icon: FileText, fallback: reportIcon, labelKey: "nav.report", path: "/dashboard/report" },
  { icon: ArrowLeftRight, fallback: conversionsIcon, labelKey: "nav.conversions", path: "/dashboard/conversions" },
];

const readStoredUser = (): StoredUser | null => {
  const tryParse = (raw: string | null): StoredUser | null => {
    if (!raw) return null;
    try {
      return JSON.parse(raw) as StoredUser;
    } catch {
      return null;
    }
  };

  try {
    const user = tryParse(localStorage.getItem("user"));
    if (user) return user;
  } catch {
    void 0;
  }

  try {
    const user = tryParse(sessionStorage.getItem("user"));
    if (user) return user;
  } catch {
    void 0;
  }

  return null;
};

const clearSession = () => {
  try {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  } catch {
    void 0;
  }
  try {
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("token");
  } catch {
    void 0;
  }
};

const ControlPanelNav = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useI18n();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  const userName = readStoredUser()?.username || "";

  const confirmDelete = async () => {
    const user = readStoredUser();
    if (!user?.id) {
      setDeleteError("Usuário não encontrado.");
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);
    try {
      await userService.delete(user.id);
      clearSession();
      navigate("/login", { replace: true });
      setIsDeleteOpen(false);
    } catch (error) {
      console.error("Failed to delete account", error);
      setDeleteError("Falha ao deletar. Tente novamente.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <nav className="flex items-center justify-between mb-6 px-4 flex-shrink-0">
      <div className="w-16 h-16 rounded-2xl bg-card flex items-center justify-center shadow-md p-3 border border-border/50">
        <img src={logoGreen} alt="Liquidly" className="w-full h-full object-contain" />
      </div>

      <div className="flex items-center gap-2 bg-card rounded-2xl p-2 shadow-elevated border border-border/50">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path === "/dashboard" && location.pathname === "/dashboard/");
          return (
            <button
              key={item.labelKey}
              onClick={() => navigate(item.path)}
              className={`flex items-center gap-3 px-6 py-3 rounded-xl transition-all text-base font-semibold ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-md scale-105"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              <SafeIcon icon={item.icon} fallbackSrc={item.fallback} className="w-5 h-5" />
              <span className="hidden sm:inline">{t(item.labelKey)}</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-4" ref={menuRef}>
        <span className="text-sm font-semibold text-foreground hidden md:block">{t("nav.hello", { name: userName })}</span>
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="w-16 h-16 rounded-full bg-card shadow-elevated border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all hover:bg-secondary/20 hover:scale-105"
          >
            <SafeIcon icon={User} fallbackSrc={userIcon} className="w-8 h-8" />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-full mt-3 w-56 bg-card rounded-xl shadow-xl border border-border/50 p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
              <button
                className="w-full text-left px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors flex items-center gap-3 font-medium mb-1"
                onClick={() => {
                  setIsMenuOpen(false);
                  setDeleteError(null);
                  setIsDeleteOpen(true);
                }}
              >
                <SafeIcon icon={Trash2} fallbackSrc={trashIcon} className="w-4 h-4" />
                {t("nav.deleteAccount")}
              </button>
              <button
                className="w-full text-left px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-lg transition-colors flex items-center gap-3 font-medium"
                onClick={() => {
                  clearSession();
                  navigate("/login", { replace: true });
                  setIsMenuOpen(false);
                }}
              >
                <SafeIcon icon={LogOut} fallbackSrc={logoutIcon} className="w-4 h-4" />
                {t("nav.logout")}
              </button>
            </div>
          )}
        </div>
      </div>

      {isDeleteOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(e) => {
            if (e.currentTarget === e.target && !isDeleting) setIsDeleteOpen(false);
          }}
        >
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-4 shadow-elevated">
            <div className="text-base font-semibold text-foreground">{t("nav.deleteAccount")}</div>
            <div className="mt-1 text-sm text-muted-foreground">
              Tem certeza que deseja deletar sua conta? Essa ação não pode ser desfeita.
            </div>
            {deleteError && <div className="mt-3 text-sm text-destructive">{deleteError}</div>}
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" type="button" disabled={isDeleting} onClick={() => setIsDeleteOpen(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" type="button" disabled={isDeleting} onClick={confirmDelete}>
                Deletar
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default ControlPanelNav;
