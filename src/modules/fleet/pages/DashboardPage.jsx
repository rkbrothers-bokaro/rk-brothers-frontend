import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Truck, Clock, Droplet, Bell, AlertTriangle, ClipboardList } from "lucide-react";
import { useAuth } from "../../../core/hooks/useAuth";
import PageHeader from "../../../core/components/PageHeader";
import Badge from "../../../core/components/Badge";
import { unwrapEnvelope } from "../../../core/api/unwrapEnvelope";
import { unwrapList } from "../masters/api";
import { getDashboardSummary } from "../api/dashboardApi";
import { getFuelAnomalies } from "../api/dieselApi";
import { getExpiringDocuments } from "../api/documentsApi";
import { daysLeftOf, statusOf, DOCUMENT_STATUS_VARIANT, DOCUMENT_TYPE_KEY_MAP } from "../utils/documentStatus";

const STAT_COLOR_CLASSES = {
  green: "bg-green-100 text-green-600",
  blue: "bg-blue-100 text-blue-600",
  amber: "bg-amber-100 text-amber-600",
  red: "bg-red-100 text-red-600",
  zinc: "bg-zinc-100 text-zinc-500",
};

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-zinc-200 bg-white p-4">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${STAT_COLOR_CLASSES[color]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
        <p className="text-xl font-semibold text-zinc-900">{value}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();

  const [summary, setSummary] = useState(null);
  const [anomalies, setAnomalies] = useState([]);
  const [expiringDocs, setExpiringDocs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    Promise.allSettled([
      getDashboardSummary(),
      isAdmin ? getFuelAnomalies() : Promise.resolve(null),
      isAdmin ? getExpiringDocuments(30) : Promise.resolve(null),
    ]).then(([summaryRes, anomaliesRes, expiringRes]) => {
      setSummary(summaryRes.status === "fulfilled" ? unwrapEnvelope(summaryRes.value.data) : null);

      setAnomalies(
        anomaliesRes.status === "fulfilled" && anomaliesRes.value ? unwrapList(anomaliesRes.value.data).items : [],
      );

      if (expiringRes.status === "fulfilled" && expiringRes.value) {
        const items = [...unwrapList(expiringRes.value.data).items].sort(
          (a, b) => (daysLeftOf(a) ?? 0) - (daysLeftOf(b) ?? 0),
        );
        setExpiringDocs(items);
      } else {
        setExpiringDocs([]);
      }

      setIsLoading(false);
    });
  }, [isAdmin]);

  function typeLabel(type) {
    const key = DOCUMENT_TYPE_KEY_MAP[type];
    return key ? t(key) : type || "—";
  }

  const vehiclesWorkingValue = summary ? `${summary.vehiclesWorking ?? 0} / ${summary.vehiclesTotal ?? 0}` : "—";
  const hoursTodayValue =
    summary?.hoursLoggedToday !== undefined && summary?.hoursLoggedToday !== null
      ? `${Number(summary.hoursLoggedToday).toFixed(1)} ${t("fleet.diesel.units.hrs")}`
      : "—";
  const dieselStockValue =
    summary?.dieselInStock !== undefined && summary?.dieselInStock !== null
      ? `${Number(summary.dieselInStock).toFixed(1)} ${t("fleet.dashboard.litresUnit")}`
      : "—";
  const openAlertsValue = summary?.openAlertsCount ?? anomalies.length;
  const myEntriesTodayValue = summary?.myEntriesTodayCount ?? summary?.myEntriesToday ?? "—";

  return (
    <div>
      <PageHeader title={t("fleet.dashboard.title")} subtitle={t("fleet.dashboard.subtitle")} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Truck} label={t("fleet.dashboard.vehiclesWorking")} value={vehiclesWorkingValue} color="green" />
        <StatCard icon={Clock} label={t("fleet.dashboard.hoursToday")} value={hoursTodayValue} color="blue" />
        <StatCard icon={Droplet} label={t("fleet.dashboard.dieselStock")} value={dieselStockValue} color="amber" />
        {isAdmin ? (
          <StatCard
            icon={Bell}
            label={t("fleet.dashboard.openAlerts")}
            value={isLoading ? "—" : openAlertsValue}
            color={openAlertsValue > 0 ? "red" : "zinc"}
          />
        ) : (
          <StatCard icon={ClipboardList} label={t("fleet.dashboard.myEntriesToday")} value={myEntriesTodayValue} color="blue" />
        )}
      </div>

      {isAdmin && (
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-zinc-200 bg-white p-5">
            <h2 className="mb-4 text-base font-semibold text-zinc-900">{t("fleet.dashboard.anomalyAlerts")}</h2>
            {anomalies.length === 0 ? (
              <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                {t("fleet.dashboard.allNormal")}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {anomalies.map((a, idx) => (
                  <div
                    key={a.vehicleId ?? idx}
                    className="flex items-start gap-3 rounded-md border border-red-300 bg-red-50 px-4 py-3"
                  >
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                    <div className="text-sm text-red-800">
                      <p className="font-semibold">{a.vehicleDisplayName || a.vehicleNo || "—"}</p>
                      <p>
                        {t("fleet.dashboard.today")}: {a.todayAvg ?? "—"} {t("fleet.dashboard.litresPerHourUnit")} ·{" "}
                        {t("fleet.dashboard.normal")}: {a.normalAvg ?? "—"} {t("fleet.dashboard.litresPerHourUnit")} ·{" "}
                        {t("fleet.dashboard.spike")}: +{a.spikePercent ?? a.spike ?? "—"}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-zinc-900">{t("fleet.dashboard.expiringDocs")}</h2>
              <Link
                to="/fleet/documents"
                state={{ initialTab: "expiring" }}
                className="text-sm font-medium text-blue-600 hover:underline"
              >
                {t("fleet.dashboard.viewAll")}
              </Link>
            </div>
            {expiringDocs.length === 0 ? (
              <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                {t("fleet.dashboard.allDocumentsValid")}
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-zinc-100">
                {expiringDocs.slice(0, 8).map((doc, idx) => {
                  const days = daysLeftOf(doc);
                  const status = statusOf(days);
                  return (
                    <div key={doc.id ?? idx} className="flex items-center justify-between gap-3 py-2 text-sm">
                      <div>
                        <p className="font-medium text-zinc-800">{doc.vehicleDisplayName || doc.vehicleNo || "—"}</p>
                        <p className="text-zinc-500">{typeLabel(doc.documentType)}</p>
                      </div>
                      <Badge variant={DOCUMENT_STATUS_VARIANT[status]} title={t("fleet.documents.columns.daysLeft")}>
                        {days ?? "—"}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
