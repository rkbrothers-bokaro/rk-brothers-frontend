import { Outlet, Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function MastersLayout() {
  const { t } = useTranslation();
  const location = useLocation();

  const tabs = [
    { path: "/masters/vehicles", label: t("masters.vehicles.title") },
    { path: "/masters/operators", label: t("masters.operators.title") },
    { path: "/masters/parties", label: t("masters.parties.title") },
    { path: "/masters/work-orders", label: t("masters.workOrders.title") },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="mb-6 flex gap-4 border-b border-zinc-200 overflow-x-auto pb-[-1px]">
        {tabs.map((tab) => {
          const isActive = location.pathname.startsWith(tab.path);
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`whitespace-nowrap px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                isActive
                  ? "border-blue-600 text-blue-700"
                  : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
}
