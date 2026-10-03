import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "../../../core/hooks/useAuth";
import { useToast } from "../../../core/hooks/useToast";
import PageHeader from "../../../core/components/PageHeader";
import Select from "../../../core/components/Select";
import DatePicker from "../../../core/components/DatePicker";
import Table from "../../../core/components/Table";
import Button from "../../../core/components/Button";
import { vehiclesApi, operatorsApi, workOrdersApi, unwrapList } from "../masters/api";
import { getJcbLogs, deleteJcbLog, getTipperLogs, deleteTipperLog } from "../api/dailyLogApi";
import JcbDailyLogForm from "../components/JcbDailyLogForm";
import TipperDailyLogForm from "../components/TipperDailyLogForm";

const PAGE_SIZE = 10;
const EMPTY_FILTERS = { startDate: "", endDate: "", vehicleId: "", workOrderId: "", operatorId: "" };

export default function DailyLogPage() {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState("jcb");

  const [vehicles, setVehicles] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [operators, setOperators] = useState([]);

  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);

  const [entries, setEntries] = useState([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [modalMode, setModalMode] = useState(null);
  const [activeEntry, setActiveEntry] = useState(null);

  useEffect(() => {
    vehiclesApi
      .listAll()
      .then(({ data }) => setVehicles(unwrapList(data).items))
      .catch(() => setVehicles([]));
    workOrdersApi
      .listAll()
      .then(({ data }) => setWorkOrders(unwrapList(data).items))
      .catch(() => setWorkOrders([]));
    operatorsApi
      .listAll()
      .then(({ data }) => setOperators(unwrapList(data).items))
      .catch(() => setOperators([]));
  }, []);

  const jcbVehicles = useMemo(
    () => vehicles.filter((v) => v.type === "jcb_backhoe" || v.type === "poclain_excavator"),
    [vehicles],
  );
  const tipperVehicles = useMemo(() => vehicles.filter((v) => v.type === "tipper_hyva"), [vehicles]);
  const jcbOperators = useMemo(() => operators.filter((op) => op.category !== "driver"), [operators]);
  const tipperDrivers = useMemo(() => operators.filter((op) => op.category === "driver"), [operators]);

  const activeVehicles = activeTab === "jcb" ? jcbVehicles : tipperVehicles;
  const activeOperators = activeTab === "jcb" ? jcbOperators : tipperDrivers;

  const fetchEntries = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        vehicleId: appliedFilters.vehicleId || undefined,
        workOrderId: appliedFilters.workOrderId || undefined,
        operatorId: isAdmin ? appliedFilters.operatorId || undefined : undefined,
        startDate: appliedFilters.startDate || undefined,
        endDate: appliedFilters.endDate || undefined,
        page: page > 0 ? page - 1 : 0,
        size: PAGE_SIZE,
      };
      const { data } = activeTab === "jcb" ? await getJcbLogs(params) : await getTipperLogs(params);
      const { items, total: totalCount } = unwrapList(data);
      setEntries(items);
      setTotal(totalCount);
    } catch {
      setEntries([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, appliedFilters, isAdmin, page]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  function handleTabChange(tab) {
    setActiveTab(tab);
    setFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setPage(1);
  }

  function handleApplyFilters() {
    setAppliedFilters(filters);
    setPage(1);
  }

  function handleResetFilters() {
    setFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setPage(1);
  }

  function openAddModal() {
    setActiveEntry(null);
    setModalMode("create");
  }

  function openViewModal(entry) {
    setActiveEntry(entry);
    setModalMode("view");
  }

  function openEditModal(entry) {
    setActiveEntry(entry);
    setModalMode("edit");
  }

  function closeModal() {
    setModalMode(null);
    setActiveEntry(null);
  }

  function handleSaved() {
    closeModal();
    fetchEntries();
  }

  async function handleDelete(entry) {
    if (!window.confirm(t("fleet.dailyLog.deleteConfirm"))) return;
    try {
      if (activeTab === "jcb") {
        await deleteJcbLog(entry.id);
      } else {
        await deleteTipperLog(entry.id);
      }
      toast.success(t("common.deactivateSuccess"));
      fetchEntries();
    } catch {
      // global error toast already shown by axios interceptor
    }
  }

  function vehicleLabel(row) {
    return row.vehicleDisplayName || row.vehicleNo || vehicles.find((v) => v.id === row.vehicleId)?.displayName || "—";
  }

  function workOrderLabel(row) {
    return row.workOrderNumber || workOrders.find((w) => w.id === row.workOrderId)?.woNumber || "—";
  }

  function operatorLabel(row) {
    const id = row.operatorId || row.driverId;
    return row.operatorName || row.driverName || operators.find((op) => op.id === id)?.name || "—";
  }

  function renderActions(row) {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => openViewModal(row)}
          aria-label={t("common.view")}
          className="rounded p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-blue-600"
        >
          <Eye className="h-4 w-4" />
        </button>
        {isAdmin && (
          <>
            <button
              type="button"
              onClick={() => openEditModal(row)}
              aria-label={t("common.edit")}
              className="rounded p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-blue-600"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => handleDelete(row)}
              aria-label={t("common.delete")}
              className="rounded p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const jcbColumns = [
    { key: "date", header: t("fleet.dailyLog.columns.date") },
    { key: "vehicle", header: t("fleet.dailyLog.columns.vehicle"), render: vehicleLabel },
    { key: "operator", header: t("fleet.dailyLog.columns.operator"), render: operatorLabel },
    { key: "workOrder", header: t("fleet.dailyLog.columns.workOrder"), render: workOrderLabel },
    { key: "openingHrs", header: t("fleet.dailyLog.columns.openingHrs"), render: (row) => row.openingHrs ?? "—" },
    { key: "closingHrs", header: t("fleet.dailyLog.columns.closingHrs"), render: (row) => row.closingHrs ?? "—" },
    { key: "totalHrs", header: t("fleet.dailyLog.columns.totalHrs"), render: (row) => row.totalHrs ?? "—" },
    { key: "diesel", header: t("fleet.dailyLog.columns.diesel"), render: (row) => row.dieselFilled ?? "—" },
    { key: "avg", header: t("fleet.dailyLog.columns.avg"), render: (row) => row.fuelAvg ?? "—" },
    { key: "actions", header: t("fleet.dailyLog.columns.actions"), render: renderActions },
  ];

  const tipperColumns = [
    { key: "date", header: t("fleet.dailyLog.columns.date") },
    { key: "vehicle", header: t("fleet.dailyLog.columns.vehicle"), render: vehicleLabel },
    { key: "driver", header: t("fleet.dailyLog.columns.driver"), render: operatorLabel },
    { key: "workOrder", header: t("fleet.dailyLog.columns.workOrder"), render: workOrderLabel },
    { key: "totalHrs", header: t("fleet.dailyLog.columns.totalHrs"), render: (row) => row.totalHrs ?? "—" },
    { key: "totalKm", header: t("fleet.dailyLog.columns.totalKm"), render: (row) => row.totalKm ?? "—" },
    { key: "diesel", header: t("fleet.dailyLog.columns.diesel"), render: (row) => row.dieselLtr ?? "—" },
    { key: "trips", header: t("fleet.dailyLog.columns.trips"), render: (row) => row.totalTrips ?? "—" },
    { key: "actions", header: t("fleet.dailyLog.columns.actions"), render: renderActions },
  ];

  const vehicleOptions = activeVehicles.map((v) => ({ value: v.id, label: v.displayName || v.vehicleNo }));
  const workOrderOptions = workOrders.map((w) => ({ value: w.id, label: w.woNumber }));
  const operatorOptions = activeOperators.map((op) => ({ value: op.id, label: op.name }));

  return (
    <div>
      <PageHeader
        title={t("fleet.dailyLog.title")}
        subtitle={t("fleet.dailyLog.subtitle")}
        action={<Button onClick={openAddModal}>{t("fleet.dailyLog.addEntry")}</Button>}
      />

      <div className="mb-4 flex gap-2 border-b border-zinc-200">
        <button
          type="button"
          onClick={() => handleTabChange("jcb")}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === "jcb" ? "border-b-2 border-blue-600 text-blue-700" : "text-zinc-500 hover:text-zinc-700"
          }`}
        >
          {t("fleet.dailyLog.jcbTab")}
        </button>
        <button
          type="button"
          onClick={() => handleTabChange("tipper")}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === "tipper" ? "border-b-2 border-blue-600 text-blue-700" : "text-zinc-500 hover:text-zinc-700"
          }`}
        >
          {t("fleet.dailyLog.tipperTab")}
        </button>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 rounded-lg border border-zinc-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-5">
        <DatePicker
          label={t("fleet.dailyLog.filters.dateFrom")}
          value={filters.startDate}
          onChange={(e) => setFilters((f) => ({ ...f, startDate: e.target.value }))}
        />
        <DatePicker
          label={t("fleet.dailyLog.filters.dateTo")}
          value={filters.endDate}
          onChange={(e) => setFilters((f) => ({ ...f, endDate: e.target.value }))}
        />
        <Select
          label={t("fleet.dailyLog.filters.vehicle")}
          placeholder={t("fleet.dailyLog.filters.allVehicles")}
          placeholderSelectable
          options={vehicleOptions}
          value={filters.vehicleId}
          onChange={(e) => setFilters((f) => ({ ...f, vehicleId: e.target.value }))}
        />
        <Select
          label={t("fleet.dailyLog.filters.workOrder")}
          placeholder={t("fleet.dailyLog.filters.allWorkOrders")}
          placeholderSelectable
          options={workOrderOptions}
          value={filters.workOrderId}
          onChange={(e) => setFilters((f) => ({ ...f, workOrderId: e.target.value }))}
        />
        {isAdmin && (
          <Select
            label={t("fleet.dailyLog.filters.operator")}
            placeholder={t("fleet.dailyLog.filters.allOperators")}
            placeholderSelectable
            options={operatorOptions}
            value={filters.operatorId}
            onChange={(e) => setFilters((f) => ({ ...f, operatorId: e.target.value }))}
          />
        )}
        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-1">
          <Button onClick={handleApplyFilters}>{t("fleet.dailyLog.filters.apply")}</Button>
          <Button variant="secondary" onClick={handleResetFilters}>
            {t("fleet.dailyLog.filters.reset")}
          </Button>
        </div>
      </div>

      <Table
        columns={activeTab === "jcb" ? jcbColumns : tipperColumns}
        data={entries}
        loading={isLoading}
        emptyMessage={t("fleet.dailyLog.noEntries")}
      />

      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-zinc-500">{t("common.pageInfo", { page, totalPages })}</p>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            {t("common.previous")}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            {t("common.next")}
          </Button>
        </div>
      </div>

      {modalMode && activeTab === "jcb" && (
        <JcbDailyLogForm
          mode={modalMode}
          initialData={activeEntry}
          vehicles={jcbVehicles}
          workOrders={workOrders}
          operators={jcbOperators}
          onClose={closeModal}
          onSaved={handleSaved}
        />
      )}

      {modalMode && activeTab === "tipper" && (
        <TipperDailyLogForm
          mode={modalMode}
          initialData={activeEntry}
          vehicles={tipperVehicles}
          workOrders={workOrders}
          operators={tipperDrivers}
          onClose={closeModal}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
