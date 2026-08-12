import { Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../core/hooks/useAuth";
import PageHeader from "../../../core/components/PageHeader";
import UserManagementTab from "../components/admin/UserManagementTab";

export default function AdminPanelPage() {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div>
      <PageHeader title={t("fleet.admin.users")} />
      <UserManagementTab />
    </div>
  );
}
