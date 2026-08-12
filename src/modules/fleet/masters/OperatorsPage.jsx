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
import { operatorsApi, unwrapList } from "./api";

const PAGE_SIZE = 10;

const EMPTY_FORM = {
  name: "",
  phone: "",
  licenceNo: "",
  licenceExpiry: "",
  category: "operator",
};

function licenceBadgeInfo(expiry, t, language) {
  if (!expiry) return { variant: "zinc", label: "—" };
  const expiryDate = new Date(expiry);
  const diffDays = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
  const formatted = expiryDate.toLocaleDateString(language === "hi" ? "hi-IN" : "en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  if (diffDays < 0) return { variant: "red", label: formatted, title: t("masters.operators.licenceStatus.expired") };
  if (diffDays <= 30) return { variant: "amber", label: formatted, title: t("masters.operators.licenceStatus.expiringSoon") };
  return { variant: "green", label: formatted, title: t("masters.operators.licenceStatus.valid") };
}

export default function OperatorsPage() {
  const { t, i18n } = useTranslation();
  const { isAdmin } = useAuth();
  const toast = useToast();

  const [operators, setOperators] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const categoryOptions = useMemo(
    () => [
      { value: "operator", label: t("masters.operators.category.operator") },
      { value: "driver", label: t("masters.operators.category.driver") },
    ],
    [t],
  );

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(handle);
  }, [search]);

  const fetchOperators = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await operatorsApi.list({ search: debouncedSearch, page, pageSize: PAGE_SIZE });
      const { items, total: totalCount } = unwrapList(data);
      setOperators(items);
      setTotal(totalCount);
    } catch {
      setOperators([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, page]);

  useEffect(() => {
    fetchOperators();
  }, [fetchOperators]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function categoryLabel(value) {
    return categoryOptions.find((opt) => opt.value === value)?.label || value || "—";
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
      name: item.name || "",
      phone: item.phone || "",
      licenceNo: item.licenceNo || "",
      licenceExpiry: item.licenceExpiry || "",
      category: item.category || "operator",
    });
    setFormErrors({});
    setIsModalOpen(true);
  }

  async function handleDeactivate(item) {
    if (!window.confirm(t("common.deactivateConfirm"))) return;
    try {
      await operatorsApi.deactivate(item.id);
      toast.success(t("common.deactivateSuccess"));
      fetchOperators();
    } catch {
      // global error toast already shown by axios interceptor
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    const nextErrors = {};
    if (!formData.name.trim()) nextErrors.name = t("common.required");
    if (!formData.phone.trim()) nextErrors.phone = t("common.required");
    setFormErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        licenceNo: formData.licenceNo.trim(),
        licenceExpiry: formData.licenceExpiry || null,
        category: formData.category,
      };
      if (editingItem) {
        await operatorsApi.update(editingItem.id, payload);
      } else {
        await operatorsApi.create(payload);
      }
      toast.success(t("common.saveSuccess"));
      setIsModalOpen(false);
      fetchOperators();
    } catch {
      // global error toast already shown by axios interceptor
    } finally {
      setIsSaving(false);
    }
  }

  const columns = [
    { key: "name", header: t("masters.operators.columns.name") },
    { key: "phone", header: t("masters.operators.columns.phone") },
    { key: "licenceNo", header: t("masters.operators.columns.licenceNo"), render: (row) => row.licenceNo || "—" },
    { key: "category", header: t("masters.operators.columns.category"), render: (row) => categoryLabel(row.category) },
    {
      key: "licenceExpiry",
      header: t("masters.operators.columns.licenceExpiry"),
      render: (row) => {
        const info = licenceBadgeInfo(row.licenceExpiry, t, i18n.language);
        return (
          <Badge variant={info.variant} title={info.title}>
            {info.label}
          </Badge>
        );
      },
    },
    {
      key: "actions",
      header: t("masters.operators.columns.actions"),
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
        title={t("masters.operators.title")}
        subtitle={t("masters.operators.subtitle")}
        action={isAdmin && <Button onClick={openAddModal}>{t("masters.operators.addButton")}</Button>}
      />

      <div className="mb-4 max-w-sm">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder={t("masters.operators.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Table columns={columns} data={operators} loading={isLoading} />

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
          title={editingItem ? t("masters.operators.form.editTitle") : t("masters.operators.form.addTitle")}
          onClose={() => setIsModalOpen(false)}
          size="md"
        >
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <Input
              label={t("masters.operators.form.name")}
              placeholder={t("masters.operators.form.namePlaceholder")}
              value={formData.name}
              onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
              error={formErrors.name}
              disabled={isSaving}
            />
            <Input
              label={t("masters.operators.form.phone")}
              type="tel"
              placeholder={t("masters.operators.form.phonePlaceholder")}
              value={formData.phone}
              onChange={(e) => setFormData((f) => ({ ...f, phone: e.target.value }))}
              error={formErrors.phone}
              disabled={isSaving}
            />
            <Input
              label={t("masters.operators.form.licenceNo")}
              placeholder={t("masters.operators.form.licenceNoPlaceholder")}
              value={formData.licenceNo}
              onChange={(e) => setFormData((f) => ({ ...f, licenceNo: e.target.value }))}
              disabled={isSaving}
            />
            <DatePicker
              label={t("masters.operators.form.licenceExpiry")}
              value={formData.licenceExpiry}
              onChange={(e) => setFormData((f) => ({ ...f, licenceExpiry: e.target.value }))}
              disabled={isSaving}
            />
            <Select
              label={t("masters.operators.form.category")}
              options={categoryOptions}
              value={formData.category}
              onChange={(e) => setFormData((f) => ({ ...f, category: e.target.value }))}
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
