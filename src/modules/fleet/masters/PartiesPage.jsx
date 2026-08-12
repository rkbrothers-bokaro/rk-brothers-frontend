import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pencil, Trash2, Search } from "lucide-react";
import { useAuth } from "../../../core/hooks/useAuth";
import { useToast } from "../../../core/hooks/useToast";
import PageHeader from "../../../core/components/PageHeader";
import Input from "../../../core/components/Input";
import Table from "../../../core/components/Table";
import Modal from "../../../core/components/Modal";
import Button from "../../../core/components/Button";
import { partiesApi, unwrapList } from "./api";

const PAGE_SIZE = 10;

const EMPTY_FORM = {
  name: "",
  contactPerson: "",
  phone: "",
  email: "",
};

export default function PartiesPage() {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const toast = useToast();

  const [parties, setParties] = useState([]);
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

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(handle);
  }, [search]);

  const fetchParties = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await partiesApi.list({ search: debouncedSearch, page, pageSize: PAGE_SIZE });
      const { items, total: totalCount } = unwrapList(data);
      setParties(items);
      setTotal(totalCount);
    } catch {
      setParties([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, page]);

  useEffect(() => {
    fetchParties();
  }, [fetchParties]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

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
      contactPerson: item.contactPerson || "",
      phone: item.phone || "",
      email: item.email || "",
    });
    setFormErrors({});
    setIsModalOpen(true);
  }

  async function handleDeactivate(item) {
    if (!window.confirm(t("common.deactivateConfirm"))) return;
    try {
      await partiesApi.deactivate(item.id);
      toast.success(t("common.deactivateSuccess"));
      fetchParties();
    } catch {
      // global error toast already shown by axios interceptor
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    const nextErrors = {};
    if (!formData.name.trim()) nextErrors.name = t("common.required");
    setFormErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        contactPerson: formData.contactPerson.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
      };
      if (editingItem) {
        await partiesApi.update(editingItem.id, payload);
      } else {
        await partiesApi.create(payload);
      }
      toast.success(t("common.saveSuccess"));
      setIsModalOpen(false);
      fetchParties();
    } catch {
      // global error toast already shown by axios interceptor
    } finally {
      setIsSaving(false);
    }
  }

  const columns = [
    { key: "name", header: t("masters.parties.columns.name") },
    { key: "contactPerson", header: t("masters.parties.columns.contactPerson"), render: (row) => row.contactPerson || "—" },
    { key: "phone", header: t("masters.parties.columns.phone"), render: (row) => row.phone || "—" },
    { key: "email", header: t("masters.parties.columns.email"), render: (row) => row.email || "—" },
    {
      key: "actions",
      header: t("masters.parties.columns.actions"),
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
        title={t("masters.parties.title")}
        subtitle={t("masters.parties.subtitle")}
        action={isAdmin && <Button onClick={openAddModal}>{t("masters.parties.addButton")}</Button>}
      />

      <div className="mb-4 max-w-sm">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder={t("masters.parties.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Table columns={columns} data={parties} loading={isLoading} />

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
          title={editingItem ? t("masters.parties.form.editTitle") : t("masters.parties.form.addTitle")}
          onClose={() => setIsModalOpen(false)}
          size="md"
        >
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <Input
              label={t("masters.parties.form.name")}
              placeholder={t("masters.parties.form.namePlaceholder")}
              value={formData.name}
              onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
              error={formErrors.name}
              disabled={isSaving}
            />
            <Input
              label={t("masters.parties.form.contactPerson")}
              placeholder={t("masters.parties.form.contactPersonPlaceholder")}
              value={formData.contactPerson}
              onChange={(e) => setFormData((f) => ({ ...f, contactPerson: e.target.value }))}
              disabled={isSaving}
            />
            <Input
              label={t("masters.parties.form.phone")}
              type="tel"
              placeholder={t("masters.parties.form.phonePlaceholder")}
              value={formData.phone}
              onChange={(e) => setFormData((f) => ({ ...f, phone: e.target.value }))}
              disabled={isSaving}
            />
            <Input
              label={t("masters.parties.form.email")}
              type="email"
              placeholder={t("masters.parties.form.emailPlaceholder")}
              value={formData.email}
              onChange={(e) => setFormData((f) => ({ ...f, email: e.target.value }))}
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
