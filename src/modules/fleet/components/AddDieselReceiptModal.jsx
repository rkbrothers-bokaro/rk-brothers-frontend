import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "../../../core/hooks/useToast";
import Modal from "../../../core/components/Modal";
import Input from "../../../core/components/Input";
import Select from "../../../core/components/Select";
import DatePicker from "../../../core/components/DatePicker";
import Button from "../../../core/components/Button";
import { createReceipt } from "../api/dieselApi";

function todayStr() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function AddDieselReceiptModal({ vehicles, onClose, onSaved }) {
  const { t } = useTranslation();
  const toast = useToast();

  const [formData, setFormData] = useState({
    date: todayStr(),
    vehicleId: "",
    litres: "",
    receivedFrom: "",
    invoiceNo: "",
  });
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const vehicleOptions = useMemo(
    () => vehicles.map((v) => ({ value: v.id, label: v.displayName || v.vehicleNo })),
    [vehicles],
  );

  function updateField(field, value) {
    setFormData((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const nextErrors = {};
    if (!formData.date) nextErrors.date = t("common.required");
    if (!formData.vehicleId) nextErrors.vehicleId = t("common.required");
    if (!formData.litres) nextErrors.litres = t("common.required");
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSaving(true);
    try {
      await createReceipt({
        date: formData.date,
        vehicleId: formData.vehicleId,
        litres: Number(formData.litres),
        receivedFrom: formData.receivedFrom.trim(),
        invoiceNo: formData.invoiceNo.trim(),
      });
      toast.success(t("common.saveSuccess"));
      onSaved?.();
    } catch {
      // global error toast already shown by axios interceptor
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal title={t("fleet.diesel.form.addTitle")} onClose={onClose} size="md">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <DatePicker
          label={t("fleet.diesel.form.date")}
          value={formData.date}
          max={todayStr()}
          onChange={(e) => updateField("date", e.target.value)}
          error={errors.date}
          disabled={isSaving}
        />
        <Select
          label={t("fleet.diesel.form.vehicle")}
          options={vehicleOptions}
          value={formData.vehicleId}
          onChange={(e) => updateField("vehicleId", e.target.value)}
          error={errors.vehicleId}
          disabled={isSaving}
        />
        <Input
          label={t("fleet.diesel.form.litres")}
          type="number"
          step="0.01"
          placeholder={t("fleet.diesel.form.litresPlaceholder")}
          value={formData.litres}
          onChange={(e) => updateField("litres", e.target.value)}
          error={errors.litres}
          disabled={isSaving}
        />
        <Input
          label={t("fleet.diesel.form.receivedFrom")}
          placeholder={t("fleet.diesel.form.receivedFromPlaceholder")}
          value={formData.receivedFrom}
          onChange={(e) => updateField("receivedFrom", e.target.value)}
          disabled={isSaving}
        />
        <Input
          label={t("fleet.diesel.form.invoiceNo")}
          placeholder={t("fleet.diesel.form.invoiceNoPlaceholder")}
          value={formData.invoiceNo}
          onChange={(e) => updateField("invoiceNo", e.target.value)}
          disabled={isSaving}
        />

        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSaving}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" loading={isSaving}>
            {t("common.save")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
