import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import { navItems } from "./navConfig";

export default function BottomNav() {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const location = useLocation();

  const visibleItems = navItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex overflow-x-auto border-t border-zinc-200 bg-white md:hidden">
      {visibleItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname.startsWith(item.matchPrefix || item.path);
        return (
          <Link
            key={item.key}
            to={item.path}
            className={`flex min-w-[72px] flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${
              isActive ? "text-blue-700" : "text-zinc-500"
            }`}
          >
            <Icon className="h-5 w-5" />
            <span className="truncate">{t(item.labelKey)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
