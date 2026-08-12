import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pencil, Trash2, Search } from "lucide-react";
import { useAuth } from "../../../core/hooks/useAuth";
import { useToast } from "../../../core/hooks/useToast";
import PageHeader from "../../../core/components/PageHeader";
import Input from "../../../core/components/Input";
import Select from "../../../core/components/Select";
import Table from "../../../core/components/Table";
import Modal from "../../../core/components/Modal";
import Badge from "../../../core/components/Badge";
import Button from "../../../core/components/Button";
import { vehiclesApi, operatorsApi, unwrapList } from "./api";

const PAGE_SIZE = 10;

const EMPTY_FORM = {
  vehicleNo: "",
  displayName: "",
  type: "",
  billingBasis: "",
  assignedOperatorId: "",
  status: "idle",
};

const STATUS_BADGE_VARIANT = {
  working: "green",
  idle: "amber",
  breakdown: "red",
};

export default function VehiclesPage() {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const toast = useToast();

  const [vehicles, setVehicles] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [operators, setOperators] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const typeOptions = useMemo(
    () => [
      { value: "jcb_backhoe", label: t("masters.vehicles.types.jcbBackhoe") },
      { value: "poclain_excavator", label: t("masters.vehicles.types.poclainExcavator") },
      { value: "tipper_hyva", label: t("masters.vehicles.types.tipperHyva") },
      { value: "other", label: t("masters.vehicles.types.other") },
    ],
    [t],
  );

  const billingBasisOptions = useMemo(
    () => [
      { value: "hour", label: t("masters.billingBasisOptions.hour") },
      { value: "trip", label: t("masters.billingBasisOptions.trip") },
      { value: "km", label: t("masters.billingBasisOptions.km") },
      { value: "rail_line", label: t("masters.billingBasisOptions.railLine") },
    ],
    [t],
  );

  const statusOptions = useMemo(
    () => [
      { value: "working", label: t("masters.vehicles.status.working") },
      { value: "idle", label: t("masters.vehicles.status.idle") },
      { value: "breakdown", label: t("masters.vehicles.status.breakdown") },
    ],
    [t],
  );

  const operatorOptions = useMemo(
    () => operators.map((op) => ({ value: op.id, label: op.name })),
    [operators],
  );

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(handle);
  }, [search]);

  const fetchVehicles = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await vehiclesApi.list({ search: debouncedSearch, page, pageSize: PAGE_SIZE });
      const { items, total: totalCount } = unwrapList(data);
      setVehicles(items);
      setTotal(totalCount);
    } catch {
      setVehicles([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, page]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  useEffect(() => {
    operatorsApi
      .listAll()
      .then(({ data }) => setOperators(unwrapList(data).items))
      .catch(() => setOperators([]));
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function typeLabel(value) {
    return typeOptions.find((opt) => opt.value === value)?.label || value || "—";
  }

  function billingBasisLabel(value) {
    return billingBasisOptions.find((opt) => opt.value === value)?.label || value || "—";
  }

  function statusLabel(value) {
    return statusOptions.find((opt) => opt.value === value)?.label || value || "—";
  }

  function operatorLabel(row) {
    return row.assignedOperatorName || operators.find((op) => op.id === row.assignedOperatorId)?.name || "—";
  }

  function openAddModal() {
    setEditingItem(null);
    setFormData(EMPTY_FORM);
    setFormErrors({});
    setIsModalOpen(true);
  }

  function openEditModal(item) {
    setEditingItem(item);
    setFormData({
      vehicleNo: item.vehicleNo || "",
      displayName: item.displayName || "",
      type: item.type || "",
      billingBasis: item.billingBasis || "",
      assignedOperatorId: item.assignedOperatorId || "",
      status: item.status || "idle",
    });
    setFormErrors({});
    setIsModalOpen(true);
  }

  async function handleDeactivate(item) {
    if (!window.confirm(t("common.deactivateConfirm"))) return;
    try {
      await vehiclesApi.deactivate(item.id);
      toast.success(t("common.deactivateSuccess"));
      fetchVehicles();
    } catch {
      // global error toast already shown by axios interceptor
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    const nextErrors = {};
    if (!formData.vehicleNo.trim()) nextErrors.vehicleNo = t("common.required");
    if (!formData.type) nextErrors.type = t("common.required");
    if (!formData.billingBasis) nextErrors.billingBasis = t("common.required");
    setFormErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSaving(true);
    try {
      const payload = {
        vehicleNo: formData.vehicleNo.trim(),
        displayName: formData.displayName.trim(),
        type: formData.type,
        billingBasis: formData.billingBasis,
        assignedOperatorId: formData.assignedOperatorId || null,
        status: formData.status,
      };
      if (editingItem) {
        await vehiclesApi.update(editingItem.id, payload);
      } else {
        await vehiclesApi.create(payload);
      }
      toast.success(t("common.saveSuccess"));
      setIsModalOpen(false);
      fetchVehicles();
    } catch {
      // global error toast already shown by axios interceptor
    } finally {
      setIsSaving(false);
    }
  }

  const columns = [
    { key: "vehicleNo", header: t("masters.vehicles.columns.vehicleNo") },
    { key: "displayName", header: t("masters.vehicles.columns.displayName"), render: (row) => row.displayName || "—" },
    { key: "type", header: t("masters.vehicles.columns.type"), render: (row) => typeLabel(row.type) },
    { key: "billingBasis", header: t("masters.vehicles.columns.billingBasis"), render: (row) => billingBasisLabel(row.billingBasis) },
    { key: "assignedOperator", header: t("masters.vehicles.columns.assignedOperator"), render: (row) => operatorLabel(row) },
    {
      key: "status",
      header: t("masters.vehicles.columns.status"),
      render: (row) => <Badge variant={STATUS_BADGE_VARIANT[row.status] || "zinc"}>{statusLabel(row.status)}</Badge>,
    },
    {
      key: "actions",
      header: t("masters.vehicles.columns.actions"),
      render: (row) =>
        isAdmin && (
          <div className="flex items-center gap-2">
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
              onClick={() => handleDeactivate(row)}
              aria-label={t("common.deactivate")}
              className="rounded p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t("masters.vehicles.title")}
        subtitle={t("masters.vehicles.subtitle")}
        action={
          isAdmin && (
            <Button onClick={openAddModal}>{t("masters.vehicles.addButton")}</Button>
          )
        }
      />

      <div className="mb-4 max-w-sm">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder={t("masters.vehicles.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Table columns={columns} data={vehicles} loading={isLoading} />

      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-zinc-500">{t("common.pageInfo", { page, totalPages })}</p>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
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

      {isModalOpen && (
        <Modal
          title={editingItem ? t("masters.vehicles.form.editTitle") : t("masters.vehicles.form.addTitle")}
          onClose={() => setIsModalOpen(false)}
          size="md"
        >
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <Input
              label={t("masters.vehicles.form.vehicleNo")}
              placeholder={t("masters.vehicles.form.vehicleNoPlaceholder")}
              value={formData.vehicleNo}
              onChange={(e) => setFormData((f) => ({ ...f, vehicleNo: e.target.value }))}
              error={formErrors.vehicleNo}
              disabled={isSaving}
            />
            <Input
              label={t("masters.vehicles.form.displayName")}
              placeholder={t("masters.vehicles.form.displayNamePlaceholder")}
              value={formData.displayName}
              onChange={(e) => setFormData((f) => ({ ...f, displayName: e.target.value }))}
              disabled={isSaving}
            />
            <Select
              label={t("masters.vehicles.form.type")}
              options={typeOptions}
              value={formData.type}
              onChange={(e) => setFormData((f) => ({ ...f, type: e.target.value }))}
              error={formErrors.type}
              disabled={isSaving}
            />
            <Select
              label={t("masters.vehicles.form.billingBasis")}
              options={billingBasisOptions}
              value={formData.billingBasis}
              onChange={(e) => setFormData((f) => ({ ...f, billingBasis: e.target.value }))}
              error={formErrors.billingBasis}
              disabled={isSaving}
            />
            <Select
              label={t("masters.vehicles.form.assignedOperator")}
              options={operatorOptions}
              value={formData.assignedOperatorId}
              onChange={(e) => setFormData((f) => ({ ...f, assignedOperatorId: e.target.value }))}
              disabled={isSaving}
            />
            <Select
              label={t("masters.vehicles.form.status")}
              options={statusOptions}
              value={formData.status}
              onChange={(e) => setFormData((f) => ({ ...f, status: e.target.value }))}
              disabled={isSaving}
            />

            <div className="mt-2 flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} disabled={isSaving}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" loading={isSaving}>
                {t("common.save")}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
