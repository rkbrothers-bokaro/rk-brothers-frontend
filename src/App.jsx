import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./modules/auth/LoginPage";
import AppShell from "./core/layout/AppShell";
import ProtectedRoute from "./core/components/ProtectedRoute";
import VehiclesPage from "./modules/fleet/masters/VehiclesPage";
import OperatorsPage from "./modules/fleet/masters/OperatorsPage";
import PartiesPage from "./modules/fleet/masters/PartiesPage";
import WorkOrdersPage from "./modules/fleet/masters/WorkOrdersPage";
import DailyLogPage from "./modules/fleet/pages/DailyLogPage";
import DieselControlPage from "./modules/fleet/pages/DieselControlPage";
import BillingPage from "./modules/fleet/pages/BillingPage";
import DocumentsPage from "./modules/fleet/pages/DocumentsPage";
import DashboardPage from "./modules/fleet/pages/DashboardPage";
import AdminPanelPage from "./modules/fleet/pages/AdminPanelPage";
import DevBackendSwitch from "./core/components/DevBackendSwitch";
import MastersLayout from "./modules/fleet/masters/MastersLayout";

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/fleet/daily-log" element={<DailyLogPage />} />
            <Route path="/fleet/diesel" element={<DieselControlPage />} />
            <Route path="/fleet/billing" element={<BillingPage />} />
            <Route path="/fleet/documents" element={<DocumentsPage />} />

            <Route element={<ProtectedRoute adminOnly />}>
              <Route element={<MastersLayout />}>
                <Route path="/masters/vehicles" element={<VehiclesPage />} />
                <Route path="/masters/operators" element={<OperatorsPage />} />
                <Route path="/masters/parties" element={<PartiesPage />} />
                <Route path="/masters/work-orders" element={<WorkOrdersPage />} />
              </Route>
              <Route path="/admin/users" element={<AdminPanelPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <DevBackendSwitch />
    </>
  );
}
