import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pencil, KeyRound, Trash2 } from "lucide-react";
import { useToast } from "../../../../core/hooks/useToast";
import Table from "../../../../core/components/Table";
import Modal from "../../../../core/components/Modal";
import Input from "../../../../core/components/Input";
import Select from "../../../../core/components/Select";
import Badge from "../../../../core/components/Badge";
import Button from "../../../../core/components/Button";
import { unwrapList } from "../../masters/api";
import { getUsers, createUser, updateUser, resetPassword } from "../../api/adminApi";

const EMPTY_ADD_FORM = { name: "", phone: "", password: "", role: "staff" };
const EMPTY_EDIT_FORM = { name: "", role: "staff", status: "active" };
const STATUS_TO_ENABLED = { active: true, inactive: false };
const EMPTY_PASSWORD_FORM = { newPassword: "", confirmPassword: "" };

export default function UserManagementTab() {
  const { t } = useTranslation();
  const toast = useToast();

  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [modalMode, setModalMode] = useState(null);
  const [activeUser, setActiveUser] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const [addForm, setAddForm] = useState(EMPTY_ADD_FORM);
  const [editForm, setEditForm] = useState(EMPTY_EDIT_FORM);
  const [passwordForm, setPasswordForm] = useState(EMPTY_PASSWORD_FORM);

  const roleOptions = useMemo(
    () => [
      { value: "admin", label: t("common.admin") },
      { value: "staff", label: t("common.staff") },
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

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await getUsers();
      setUsers(unwrapList(data).items);
    } catch {
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  function roleLabel(role) {
    return role === "admin" ? t("common.admin") : t("common.staff");
  }

  function openAddModal() {
    setAddForm(EMPTY_ADD_FORM);
    setErrors({});
    setModalMode("add");
  }

  function openEditModal(user) {
    setActiveUser(user);
    setEditForm({
      name: user.name || "",
      role: user.role || "staff",
      status: user.isActive === false ? "inactive" : "active",
    });
    setErrors({});
    setModalMode("edit");
  }

  function openResetPasswordModal(user) {
    setActiveUser(user);
    setPasswordForm(EMPTY_PASSWORD_FORM);
    setErrors({});
    setModalMode("resetPassword");
  }

  function closeModal() {
    setModalMode(null);
    setActiveUser(null);
  }

  async function handleAddSave(e) {
    e.preventDefault();
    const nextErrors = {};
    if (!addForm.name.trim()) nextErrors.name = t("common.required");
    if (!addForm.phone.trim()) nextErrors.phone = t("common.required");
    if (!addForm.password.trim()) nextErrors.password = t("common.required");
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSaving(true);
    try {
      await createUser({
        name: addForm.name.trim(),
        phone: addForm.phone.trim(),
        password: addForm.password,
        role: addForm.role,
      });
      toast.success(t("common.saveSuccess"));
      closeModal();
      fetchUsers();
    } catch {
      // global error toast already shown by axios interceptor
    } finally {
      setIsSaving(false);
    }
  }

  async function handleEditSave(e) {
    e.preventDefault();
    const nextErrors = {};
    if (!editForm.name.trim()) nextErrors.name = t("common.required");
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSaving(true);
    try {
      await updateUser(activeUser.id, {
        name: editForm.name.trim(),
        role: editForm.role,
        enabled: STATUS_TO_ENABLED[editForm.status],
      });
      toast.success(t("common.saveSuccess"));
      closeModal();
      fetchUsers();
    } catch {
      // global error toast already shown by axios interceptor
    } finally {
      setIsSaving(false);
    }
  }

  async function handleResetPasswordSave(e) {
    e.preventDefault();
    const nextErrors = {};
    if (!passwordForm.newPassword.trim()) nextErrors.newPassword = t("common.required");
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      nextErrors.confirmPassword = t("fleet.admin.passwordMismatch");
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSaving(true);
    try {
      await resetPassword(activeUser.id, passwordForm.newPassword);
      toast.success(t("common.saveSuccess"));
      closeModal();
    } catch {
      // global error toast already shown by axios interceptor
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeactivate(user) {
    if (!window.confirm(t("fleet.admin.deactivateConfirm"))) return;
    try {
      await updateUser(user.id, { name: user.name, role: user.role, enabled: false });
      toast.success(t("common.deactivateSuccess"));
      fetchUsers();
    } catch {
      // global error toast already shown by axios interceptor
    }
  }

  const columns = [
    { key: "name", header: t("fleet.admin.columns.name") },
    { key: "phone", header: t("fleet.admin.columns.phone") },
    { key: "role", header: t("fleet.admin.columns.role"), render: (row) => <Badge variant="zinc">{roleLabel(row.role)}</Badge> },
    {
      key: "status",
      header: t("fleet.admin.columns.status"),
      render: (row) => (
        <Badge variant={row.isActive === false ? "zinc" : "green"}>
          {row.isActive === false ? t("common.inactive") : t("common.active")}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: t("fleet.admin.columns.actions"),
      render: (row) => (
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
            onClick={() => openResetPasswordModal(row)}
            aria-label={t("fleet.admin.resetPassword")}
            className="rounded p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-blue-600"
          >
            <KeyRound className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => handleDeactivate(row)}
            aria-label={t("fleet.admin.deactivateUser")}
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
      <div className="mb-4 flex justify-end">
        <Button onClick={openAddModal}>{t("fleet.admin.addUser")}</Button>
      </div>

      <Table columns={columns} data={users} loading={isLoading} emptyMessage={t("fleet.admin.noUsers")} />

      {modalMode === "add" && (
        <Modal title={t("fleet.admin.addUser")} onClose={closeModal} size="md">
          <form onSubmit={handleAddSave} className="flex flex-col gap-4">
            <Input
              label={t("fleet.admin.form.name")}
              placeholder={t("fleet.admin.form.namePlaceholder")}
              value={addForm.name}
              onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
              error={errors.name}
              disabled={isSaving}
            />
            <Input
              label={t("fleet.admin.form.phone")}
              type="tel"
              placeholder={t("fleet.admin.form.phonePlaceholder")}
              value={addForm.phone}
              onChange={(e) => setAddForm((f) => ({ ...f, phone: e.target.value }))}
              error={errors.phone}
              disabled={isSaving}
            />
            <Input
              label={t("fleet.admin.form.password")}
              type="password"
              placeholder={t("fleet.admin.form.passwordPlaceholder")}
              value={addForm.password}
              onChange={(e) => setAddForm((f) => ({ ...f, password: e.target.value }))}
              error={errors.password}
              disabled={isSaving}
            />
            <Select
              label={t("fleet.admin.form.role")}
              options={roleOptions}
              value={addForm.role}
              onChange={(e) => setAddForm((f) => ({ ...f, role: e.target.value }))}
              disabled={isSaving}
            />

            <div className="mt-2 flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={closeModal} disabled={isSaving}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" loading={isSaving}>
                {t("common.save")}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {modalMode === "edit" && (
        <Modal title={t("fleet.admin.editUser")} onClose={closeModal} size="md">
          <form onSubmit={handleEditSave} className="flex flex-col gap-4">
            <Input
              label={t("fleet.admin.form.name")}
              placeholder={t("fleet.admin.form.namePlaceholder")}
              value={editForm.name}
              onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
              error={errors.name}
              disabled={isSaving}
            />
            <Select
              label={t("fleet.admin.form.role")}
              options={roleOptions}
              value={editForm.role}
              onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}
              disabled={isSaving}
            />
            <Select
              label={t("fleet.admin.form.status")}
              options={statusOptions}
              value={editForm.status}
              onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
              disabled={isSaving}
            />

            <div className="mt-2 flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={closeModal} disabled={isSaving}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" loading={isSaving}>
                {t("common.save")}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {modalMode === "resetPassword" && (
        <Modal title={t("fleet.admin.resetPassword")} onClose={closeModal} size="sm">
          <form onSubmit={handleResetPasswordSave} className="flex flex-col gap-4">
            <Input
              label={t("fleet.admin.form.newPassword")}
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm((f) => ({ ...f, newPassword: e.target.value }))}
              error={errors.newPassword}
              disabled={isSaving}
            />
            <Input
              label={t("fleet.admin.form.confirmPassword")}
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm((f) => ({ ...f, confirmPassword: e.target.value }))}
              error={errors.confirmPassword}
              disabled={isSaving}
            />

            <div className="mt-2 flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={closeModal} disabled={isSaving}>
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
