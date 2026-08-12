import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pencil, Trash2, Search } from "lucide-react";
import { useAuth } from "../../../core/hooks/useAuth";
import { useToast } from "../../../core/hooks/useToast";
import PageHeader from "../../../core/components/PageHeader";
import Input from "../../../core/components/Input";
import Select from "../../../core/components/Select";
import DatePicker from "../../../core/components/DatePicker";
import Table from "../../../core/components/Table";
import Modal from "../../../core/components/Modal";
import Badge from "../../../core/components/Badge";
import Button from "../../../core/components/Button";
import { workOrdersApi, partiesApi, unwrapList } from "./api";

const PAGE_SIZE = 10;

const EMPTY_FORM = {
  woNumber: "",
  partyId: "",
  description: "",
  site: "",
  billingBasis: "",
  rate: "",
  unit: "",
  startDate: "",
  endDate: "",
  status: "active",
};

export default function WorkOrdersPage() {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const toast = useToast();

  const [workOrders, setWorkOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [parties, setParties] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

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
      { value: "active", label: t("common.active") },
      { value: "inactive", label: t("common.inactive") },
    ],
    [t],
  );

  const partyOptions = useMemo(() => parties.map((p) => ({ value: p.id, label: p.name })), [parties]);

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(handle);
  }, [search]);

  const fetchWorkOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await workOrdersApi.list({ search: debouncedSearch, page, pageSize: PAGE_SIZE });
      const { items, total: totalCount } = unwrapList(data);
      setWorkOrders(items);
      setTotal(totalCount);
    } catch {
      setWorkOrders([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, page]);

  useEffect(() => {
    fetchWorkOrders();
  }, [fetchWorkOrders]);

  useEffect(() => {
    partiesApi
      .listAll()
      .then(({ data }) => setParties(unwrapList(data).items))
      .catch(() => setParties([]));
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function billingBasisLabel(value) {
    return billingBasisOptions.find((opt) => opt.value === value)?.label || value || "—";
  }

  function partyLabel(row) {
    return row.partyName || parties.find((p) => p.id === row.partyId)?.name || "—";
  }

  function formatRate(rate) {
    if (rate === null || rate === undefined || rate === "") return "—";
    return `₹${Number(rate).toLocaleString("en-IN")}`;
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
      woNumber: item.woNumber || "",
      partyId: item.partyId || "",
      description: item.description || "",
      site: item.site || "",
      billingBasis: item.billingBasis || "",
      rate: item.rate ?? "",
      unit: item.unit || "",
      startDate: item.startDate || "",
      endDate: item.endDate || "",
      status: item.status || "active",
    });
    setFormErrors({});
    setIsModalOpen(true);
  }

  async function handleDeactivate(item) {
    if (!window.confirm(t("common.deactivateConfirm"))) return;
    try {
      await workOrdersApi.deactivate(item.id);
      toast.success(t("common.deactivateSuccess"));
      fetchWorkOrders();
    } catch {
      // global error toast already shown by axios interceptor
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    const nextErrors = {};
    if (!formData.woNumber.trim()) nextErrors.woNumber = t("common.required");
    if (!formData.partyId) nextErrors.partyId = t("common.required");
    if (!formData.billingBasis) nextErrors.billingBasis = t("common.required");
    setFormErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSaving(true);
    try {
      const payload = {
        woNumber: formData.woNumber.trim(),
        partyId: formData.partyId,
        description: formData.description.trim(),
        site: formData.site.trim(),
        billingBasis: formData.billingBasis,
        rate: formData.rate === "" ? null : Number(formData.rate),
        unit: formData.unit.trim(),
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
        status: formData.status,
      };
      if (editingItem) {
        await workOrdersApi.update(editingItem.id, payload);
      } else {
        await workOrdersApi.create(payload);
      }
      toast.success(t("common.saveSuccess"));
      setIsModalOpen(false);
      fetchWorkOrders();
    } catch {
      // global error toast already shown by axios interceptor
    } finally {
      setIsSaving(false);
    }
  }

  const columns = [
    { key: "woNumber", header: t("masters.workOrders.columns.woNumber") },
    { key: "party", header: t("masters.workOrders.columns.party"), render: (row) => partyLabel(row) },
    { key: "description", header: t("masters.workOrders.columns.description"), render: (row) => row.description || "—" },
    { key: "site", header: t("masters.workOrders.columns.site"), render: (row) => row.site || "—" },
    { key: "billingBasis", header: t("masters.workOrders.columns.billingBasis"), render: (row) => billingBasisLabel(row.billingBasis) },
    { key: "rate", header: t("masters.workOrders.columns.rate"), render: (row) => formatRate(row.rate) },
    {
      key: "status",
      header: t("masters.workOrders.columns.status"),
      render: (row) => (
        <Badge variant={row.status === "active" ? "green" : "zinc"}>
          {row.status === "active" ? t("common.active") : t("common.inactive")}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: t("masters.workOrders.columns.actions"),
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
        title={t("masters.workOrders.title")}
        subtitle={t("masters.workOrders.subtitle")}
        action={isAdmin && <Button onClick={openAddModal}>{t("masters.workOrders.addButton")}</Button>}
      />

      <div className="mb-4 max-w-sm">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder={t("masters.workOrders.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Table columns={columns} data={workOrders} loading={isLoading} />

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

      {isModalOpen && (
        <Modal
          title={editingItem ? t("masters.workOrders.form.editTitle") : t("masters.workOrders.form.addTitle")}
          onClose={() => setIsModalOpen(false)}
          size="lg"
        >
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label={t("masters.workOrders.form.woNumber")}
                placeholder={t("masters.workOrders.form.woNumberPlaceholder")}
                value={formData.woNumber}
                onChange={(e) => setFormData((f) => ({ ...f, woNumber: e.target.value }))}
                error={formErrors.woNumber}
                disabled={isSaving}
              />
              <Select
                label={t("masters.workOrders.form.party")}
                options={partyOptions}
                value={formData.partyId}
                onChange={(e) => setFormData((f) => ({ ...f, partyId: e.target.value }))}
                error={formErrors.partyId}
                disabled={isSaving}
              />
            </div>

            <Input
              label={t("masters.workOrders.form.description")}
              placeholder={t("masters.workOrders.form.descriptionPlaceholder")}
              value={formData.description}
              onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
              disabled={isSaving}
            />
            <Input
              label={t("masters.workOrders.form.site")}
              placeholder={t("masters.workOrders.form.sitePlaceholder")}
              value={formData.site}
              onChange={(e) => setFormData((f) => ({ ...f, site: e.target.value }))}
              disabled={isSaving}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                label={t("masters.workOrders.form.billingBasis")}
                options={billingBasisOptions}
                value={formData.billingBasis}
                onChange={(e) => setFormData((f) => ({ ...f, billingBasis: e.target.value }))}
                error={formErrors.billingBasis}
                disabled={isSaving}
              />

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-zinc-700">{t("masters.workOrders.form.rate")}</label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder={t("masters.workOrders.form.ratePlaceholder")}
                    value={formData.rate}
                    onChange={(e) => setFormData((f) => ({ ...f, rate: e.target.value }))}
                    disabled={isSaving}
                    className="w-full rounded-md border border-zinc-300 py-2 pl-7 pr-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label={t("masters.workOrders.form.unit")}
                placeholder={t("masters.workOrders.form.unitPlaceholder")}
                value={formData.unit}
                onChange={(e) => setFormData((f) => ({ ...f, unit: e.target.value }))}
                disabled={isSaving}
              />
              <Select
                label={t("masters.workOrders.form.status")}
                options={statusOptions}
                value={formData.status}
                onChange={(e) => setFormData((f) => ({ ...f, status: e.target.value }))}
                disabled={isSaving}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DatePicker
                label={t("masters.workOrders.form.startDate")}
                value={formData.startDate}
                onChange={(e) => setFormData((f) => ({ ...f, startDate: e.target.value }))}
                disabled={isSaving}
              />
              <DatePicker
                label={t("masters.workOrders.form.endDate")}
                value={formData.endDate}
                onChange={(e) => setFormData((f) => ({ ...f, endDate: e.target.value }))}
                disabled={isSaving}
              />
            </div>

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
