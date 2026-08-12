import { useTranslation } from "react-i18next";
import { LogOut, Globe } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import Button from "../components/Button";

export default function Topbar() {
  const { t, i18n } = useTranslation();
  const { user, logout, isAdmin } = useAuth();

  function toggleLanguage() {
    i18n.changeLanguage(i18n.language === "en" ? "hi" : "en");
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-4 sm:px-6">
      <span className="text-lg font-semibold text-zinc-900 md:hidden">RK Brothers</span>
      <div className="hidden md:block" />

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          aria-label={t("common.changeLanguage")}
        >
          <Globe className="h-4 w-4" />
          {i18n.language === "en" ? "हिं" : "EN"}
        </button>

        {user && (
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-zinc-900">{user.name}</p>
            <p className="text-xs text-zinc-500">{isAdmin ? t("common.admin") : t("common.staff")}</p>
          </div>
        )}

        <Button variant="ghost" size="sm" onClick={logout}>
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">{t("common.logout")}</span>
        </Button>
      </div>
    </header>
  );
}
