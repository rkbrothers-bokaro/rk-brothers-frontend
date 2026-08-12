import { LayoutDashboard, ClipboardList, Fuel, Receipt, FileText, Database, ShieldCheck } from "lucide-react";

export const navItems = [
  { key: "dashboard", path: "/dashboard", icon: LayoutDashboard, labelKey: "nav.dashboard" },
  { key: "dailyLog", path: "/fleet/daily-log", icon: ClipboardList, labelKey: "nav.dailyLog" },
  { key: "dieselControl", path: "/fleet/diesel", icon: Fuel, labelKey: "nav.dieselControl" },
  { key: "billing", path: "/fleet/billing", icon: Receipt, labelKey: "nav.billing" },
  { key: "documents", path: "/fleet/documents", icon: FileText, labelKey: "nav.documents" },
  {
    key: "masters",
    path: "/masters/vehicles",
    matchPrefix: "/masters",
    icon: Database,
    labelKey: "nav.masters",
    adminOnly: true,
  },
  {
    key: "adminPanel",
    path: "/admin/users",
    matchPrefix: "/admin",
    icon: ShieldCheck,
    labelKey: "nav.adminPanel",
    adminOnly: true,
  },
];
