import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "../../../core/hooks/useAuth";
import PageHeader from "../../../core/components/PageHeader";
import Select from "../../../core/components/Select";
import Table from "../../../core/components/Table";
import Button from "../../../core/components/Button";
import { vehiclesApi, unwrapList } from "../masters/api";
import { getDieselRegister, getFuelAnomalies } from "../api/dieselApi";
import AddDieselReceiptModal from "../components/AddDieselReceiptModal";

const now = new Date();
const CURRENT_MONTH = now.getMonth() + 1;
const CURRENT_YEAR = now.getFullYear();

export default function DieselControlPage() {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();

  const [vehicles, setVehicles] = useState([]);
  const [filters, setFilters] = useState({ month: CURRENT_MONTH, year: CURRENT_YEAR, vehicleId: "" });
  const [appliedFilters, setAppliedFilters] = useState({ month: CURRENT_MONTH, year: CURRENT_YEAR, vehicleId: "" });

  const [register, setRegister] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [anomalies, setAnomalies] = useState([]);
  const [isAnomalyExpanded, setIsAnomalyExpanded] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const monthOptions = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => i + 1).map((m) => ({
        value: m,
        label: t(`fleet.diesel.months.${m}`),
      })),
    [t],
  );

  const yearOptions = useMemo(
    () => [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map((y) => ({ value: y, label: String(y) })),
    [],
  );

  const vehicleOptions = useMemo(
    () => vehicles.map((v) => ({ value: v.id, label: v.displayName || v.vehicleNo })),
    [vehicles],
  );

  useEffect(() => {
    if (!isAdmin) return;
    vehiclesApi
      .listAll()
      .then(({ data }) => setVehicles(unwrapList(data).items))
      .catch(() => setVehicles([]));
  }, [isAdmin]);

  const fetchRegister = useCallback(async () => {
    if (!isAdmin) return;
    setIsLoading(true);
    try {
      const { data } = await getDieselRegister(
        appliedFilters.month,
        appliedFilters.year,
        appliedFilters.vehicleId || undefined,
      );
      setRegister(unwrapList(data).items);
    } catch {
      setRegister([]);
    } finally {
      setIsLoading(false);
    }
  }, [appliedFilters, isAdmin]);

  useEffect(() => {
    fetchRegister();
  }, [fetchRegister]);

  const fetchAnomalies = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const { data } = await getFuelAnomalies();
      setAnomalies(unwrapList(data).items);
    } catch {
      setAnomalies([]);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchAnomalies();
  }, [fetchAnomalies]);

  if (!isAdmin) {
    return <Navigate to="/fleet/daily-log" replace />;
  }

  const anomalyVehicleIds = new Set(anomalies.map((a) => a.vehicleId));

  function vehicleLabel(vehicleId) {
    return vehicles.find((v) => v.id === vehicleId)?.displayName || "—";
  }

  function isTipperRow(row) {
    const type = row.vehicleType || vehicles.find((v) => v.id === row.vehicleId)?.type;
    return type === "tipper_hyva";
  }

  function avgColorClass(row) {
    const flagged = row.isAnomaly ?? row.spiked ?? anomalyVehicleIds.has(row.vehicleId);
    return flagged ? "font-semibold text-red-600" : "text-green-600";
  }

  const visibleRows = register.filter((row) => {
    const received = Number(row.received) || 0;
    const issue = Number(row.hsdIssue) || 0;
    return received > 0 || issue > 0;
  });

  const columns = [
    { key: "date", header: t("fleet.diesel.columns.date") },
    {
      key: "equipment",
      header: t("fleet.diesel.columns.equipment"),
      render: (row) => row.equipmentNo || row.vehicleDisplayName || vehicleLabel(row.vehicleId),
    },
    { key: "openingBal", header: t("fleet.diesel.columns.openingBal"), render: (row) => row.openingBal ?? "—" },
    {
      key: "received",
      header: t("fleet.diesel.columns.received"),
      render: (row) => (Number(row.received) > 0 ? <span className="text-green-600">+{row.received}</span> : "—"),
    },
    { key: "totalStock", header: t("fleet.diesel.columns.totalStock"), render: (row) => row.totalStock ?? "—" },
    {
      key: "hsdIssue",
      header: t("fleet.diesel.columns.hsdIssue"),
      render: (row) => (Number(row.hsdIssue) > 0 ? <span className="text-red-600">-{row.hsdIssue}</span> : "—"),
    },
    { key: "closingBal", header: t("fleet.diesel.columns.closingBal"), render: (row) => row.closingBal ?? "—" },
    {
      key: "progressive",
      header: t("fleet.diesel.columns.progressive"),
      render: (row) => <span className="font-bold">{row.progressiveTotal ?? "—"}</span>,
    },
    {
      key: "km",
      header: t("fleet.diesel.columns.km"),
      render: (row) => (isTipperRow(row) ? (row.km ?? "—") : "—"),
    },
    {
      key: "avg",
      header: t("fleet.diesel.columns.avg"),
      render: (row) => <span className={avgColorClass(row)}>{row.avg ?? "—"}</span>,
    },
  ];

  return (
    <div>
      <PageHeader title={t("fleet.diesel.title")} subtitle={t("fleet.diesel.subtitle")} />

      {anomalies.length > 0 && (
        <div className="mb-4 rounded-lg border border-red-300 bg-red-50">
          <button
            type="button"
            onClick={() => setIsAnomalyExpanded((v) => !v)}
            className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
          >
            <span className="flex items-center gap-2 text-sm font-medium text-red-800">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              {t("fleet.diesel.anomalyBanner", { count: anomalies.length })}
            </span>
            <span className="flex shrink-0 items-center gap-1 text-sm font-medium text-red-700">
              {isAnomalyExpanded ? t("fleet.diesel.anomalyHideDetails") : t("fleet.diesel.anomalyViewDetails")}
              {isAnomalyExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </span>
          </button>
          {isAnomalyExpanded && (
            <div className="overflow-x-auto border-t border-red-200 px-4 py-3">
              <table className="w-full min-w-max text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-red-700">
                  <tr>
                    <th className="px-3 py-2 font-medium">{t("fleet.diesel.anomalyColumns.vehicle")}</th>
                    <th className="px-3 py-2 font-medium">{t("fleet.diesel.anomalyColumns.todayAvg")}</th>
                    <th className="px-3 py-2 font-medium">{t("fleet.diesel.anomalyColumns.normalAvg")}</th>
                    <th className="px-3 py-2 font-medium">{t("fleet.diesel.anomalyColumns.spike")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-red-100">
                  {anomalies.map((a, idx) => (
                    <tr key={a.vehicleId ?? idx} className="bg-red-100/60">
                      <td className="px-3 py-2 font-medium text-red-800">
                        {a.vehicleDisplayName || a.vehicleNo || vehicleLabel(a.vehicleId)}
                      </td>
                      <td className="px-3 py-2 text-red-800">{a.todayAvg ?? "—"}</td>
                      <td className="px-3 py-2 text-red-800">{a.normalAvg ?? "—"}</td>
                      <td className="px-3 py-2 text-red-800">
                        {a.spikePercent ?? a.spike ?? "—"}
                        {a.spikePercent !== undefined || a.spike !== undefined ? "%" : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="mb-4 grid grid-cols-1 gap-3 rounded-lg border border-zinc-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
        <Select
          label={t("fleet.diesel.month")}
          options={monthOptions}
          value={filters.month}
          onChange={(e) => setFilters((f) => ({ ...f, month: Number(e.target.value) }))}
        />
        <Select
          label={t("fleet.diesel.year")}
          options={yearOptions}
          value={filters.year}
          onChange={(e) => setFilters((f) => ({ ...f, year: Number(e.target.value) }))}
        />
        <Select
          label={t("fleet.diesel.form.vehicle")}
          placeholder={t("fleet.diesel.allVehicles")}
          placeholderSelectable
          options={vehicleOptions}
          value={filters.vehicleId}
          onChange={(e) => setFilters((f) => ({ ...f, vehicleId: e.target.value }))}
        />
        <div className="flex items-end">
          <Button onClick={() => setAppliedFilters(filters)}>{t("fleet.diesel.apply")}</Button>
        </div>
      </div>

      <Table columns={columns} data={visibleRows} loading={isLoading} emptyMessage={t("fleet.diesel.noData")} />

      <div className="mt-6 flex justify-end">
        <Button onClick={() => setIsModalOpen(true)}>{t("fleet.diesel.addReceipt")}</Button>
      </div>

      {isModalOpen && (
        <AddDieselReceiptModal
          vehicles={vehicles}
          onClose={() => setIsModalOpen(false)}
          onSaved={() => {
            setIsModalOpen(false);
            fetchRegister();
            fetchAnomalies();
          }}
        />
      )}
    </div>
  );
}
