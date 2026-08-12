import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, X } from "lucide-react";
import { useToast } from "../../../core/hooks/useToast";
import Modal from "../../../core/components/Modal";
import Input from "../../../core/components/Input";
import Select from "../../../core/components/Select";
import DatePicker from "../../../core/components/DatePicker";
import FileUpload from "../../../core/components/FileUpload";
import Button from "../../../core/components/Button";
import { getJcbOpeningHrs, createJcbLog, updateJcbLog } from "../api/dailyLogApi";

function todayStr() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function buildInitialFormState(initialData) {
  if (!initialData) {
    return {
      date: todayStr(),
      vehicleId: "",
      workOrderId: "",
      operatorId: "",
      openingHrs: "",
      closingHrs: "",
      shifts: [{ startTime: "", closeTime: "" }],
      dieselFilled: "",
      dieselMeter: "",
      running: "",
      materialType: "",
      quantity: "",
      unit: "",
      workDescription: "",
      receivingSlip: null,
    };
  }
  return {
    date: initialData.date || todayStr(),
    vehicleId: initialData.vehicleId || "",
    workOrderId: initialData.workOrderId || "",
    operatorId: initialData.operatorId || "",
    openingHrs: initialData.openingHrs ?? "",
    closingHrs: initialData.closingHrs ?? "",
    shifts:
      Array.isArray(initialData.shifts) && initialData.shifts.length > 0
        ? initialData.shifts.map((s) => ({ startTime: s.startTime || "", closeTime: s.closeTime || "" }))
        : [{ startTime: "", closeTime: "" }],
    dieselFilled: initialData.dieselFilled ?? "",
    dieselMeter: initialData.dieselMeter ?? "",
    running: initialData.running ?? "",
    materialType: initialData.materialType || "",
    quantity: initialData.quantity ?? "",
    unit: initialData.unit || "",
    workDescription: initialData.workDescription || "",
    receivingSlipUrl: initialData.receivingSlipUrl || initialData.receivingSlip || "",
    receivingSlip: null,
  };
}

function computeHours(open, close) {
  const o = Number(open);
  const c = Number(close);
  if (open === "" || close === "" || Number.isNaN(o) || Number.isNaN(c) || c < o) return null;
  return Math.round((c - o) * 100) / 100;
}

function computeShiftHours(startTime, closeTime) {
  if (!startTime || !closeTime) return null;
  const [sh, sm] = startTime.split(":").map(Number);
  const [ch, cm] = closeTime.split(":").map(Number);
  if ([sh, sm, ch, cm].some((n) => Number.isNaN(n))) return null;
  let minutes = ch * 60 + cm - (sh * 60 + sm);
  if (minutes < 0) minutes += 24 * 60;
  return Math.round((minutes / 60) * 100) / 100;
}

function fuelAvgColorClass(avg) {
  if (avg === null) return "text-zinc-400";
  if (avg <= 6) return "text-green-600";
  if (avg <= 8) return "text-amber-600";
  return "text-red-600";
}

function SectionTitle({ children }) {
  return <h3 className="text-sm font-semibold text-zinc-900">{children}</h3>;
}

export default function JcbDailyLogForm({ mode, initialData, vehicles, workOrders, operators, onClose, onSaved }) {
  const { t } = useTranslation();
  const toast = useToast();
  const isReadOnly = mode === "view";
  const isEdit = mode === "edit";

  const [formData, setFormData] = useState(() => buildInitialFormState(initialData));
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [openingHrsSource, setOpeningHrsSource] = useState(null);

  const skipNextOpeningFetch = useRef(mode !== "create");

  const vehicleOptions = useMemo(
    () => vehicles.map((v) => ({ value: v.id, label: v.displayName || v.vehicleNo })),
    [vehicles],
  );
  const workOrderOptions = useMemo(() => workOrders.map((w) => ({ value: w.id, label: w.woNumber })), [workOrders]);
  const operatorOptions = useMemo(() => operators.map((op) => ({ value: op.id, label: op.name })), [operators]);

  const materialTypeOptions = useMemo(
    () => [
      { value: "g_slag", label: t("fleet.dailyLog.materialTypes.gSlag") },
      { value: "hss", label: t("fleet.dailyLog.materialTypes.hss") },
      { value: "pellet", label: t("fleet.dailyLog.materialTypes.pellet") },
      { value: "other", label: t("fleet.dailyLog.materialTypes.other") },
    ],
    [t],
  );

  const unitOptions = useMemo(
    () => [
      { value: "mt", label: t("fleet.dailyLog.units.mt") },
      { value: "cbm", label: t("fleet.dailyLog.units.cbm") },
      { value: "nos", label: t("fleet.dailyLog.units.nos") },
    ],
    [t],
  );

  useEffect(() => {
    if (isReadOnly) return;
    if (!formData.vehicleId || !formData.date) return;

    if (skipNextOpeningFetch.current) {
      skipNextOpeningFetch.current = false;
      return;
    }

    let cancelled = false;
    getJcbOpeningHrs(formData.vehicleId, formData.date)
      .then(({ data }) => {
        if (cancelled) return;
        const body = data && data.data !== undefined ? data.data : data;
        const value = body && typeof body === "object" ? (body.openingHrs ?? body.value ?? null) : body;
        if (value === null || value === undefined) {
          setOpeningHrsSource("first");
          setFormData((f) => ({ ...f, openingHrs: "" }));
        } else {
          setOpeningHrsSource("auto");
          setFormData((f) => ({ ...f, openingHrs: value }));
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.vehicleId, formData.date]);

  const totalHrs = computeHours(formData.openingHrs, formData.closingHrs);
  const fuelAvg =
    totalHrs && formData.dieselFilled !== "" && !Number.isNaN(Number(formData.dieselFilled))
      ? Math.round((Number(formData.dieselFilled) / totalHrs) * 100) / 100
      : null;

  function updateField(field, value) {
    setFormData((f) => ({ ...f, [field]: value }));
  }

  function updateShiftRow(index, field, value) {
    setFormData((f) => ({
      ...f,
      shifts: f.shifts.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    }));
  }

  function addShiftRow() {
    setFormData((f) => ({ ...f, shifts: [...f.shifts, { startTime: "", closeTime: "" }] }));
  }

  function removeShiftRow(index) {
    setFormData((f) => ({ ...f, shifts: f.shifts.filter((_, i) => i !== index) }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (isReadOnly) return;

    const nextErrors = {};
    if (!formData.date) nextErrors.date = t("common.required");
    if (!formData.vehicleId) nextErrors.vehicleId = t("common.required");
    if (!formData.workOrderId) nextErrors.workOrderId = t("common.required");
    if (!formData.operatorId) nextErrors.operatorId = t("common.required");
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSaving(true);
    try {
      const payload = {
        date: formData.date,
        vehicleId: formData.vehicleId,
        workOrderId: formData.workOrderId,
        operatorId: formData.operatorId,
        openingHrs: formData.openingHrs === "" ? null : Number(formData.openingHrs),
        closingHrs: formData.closingHrs === "" ? null : Number(formData.closingHrs),
        shifts: formData.shifts.filter((row) => row.startTime || row.closeTime),
        dieselFilled: formData.dieselFilled === "" ? null : Number(formData.dieselFilled),
        dieselMeter: formData.dieselMeter === "" ? null : Number(formData.dieselMeter),
        running: formData.running === "" ? null : Number(formData.running),
        materialType: formData.materialType || null,
        quantity: formData.quantity === "" ? null : Number(formData.quantity),
        unit: formData.unit || null,
        workDescription: formData.workDescription,
        receivingSlip: formData.receivingSlip instanceof File ? formData.receivingSlip : undefined,
      };

      if (isEdit && initialData) {
        await updateJcbLog(initialData.id, payload);
      } else {
        await createJcbLog(payload);
      }
      toast.success(t("common.saveSuccess"));
      onSaved?.();
    } catch {
      // global error toast already shown by axios interceptor
    } finally {
      setIsSaving(false);
    }
  }

  const title = isEdit
    ? t("fleet.dailyLog.form.editJcbTitle")
    : isReadOnly
      ? t("fleet.dailyLog.form.viewJcbTitle")
      : t("fleet.dailyLog.form.addJcbTitle");

  return (
    <Modal title={title} onClose={onClose} size="lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <SectionTitle>{t("fleet.dailyLog.form.basicInfo")}</SectionTitle>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DatePicker
              label={t("fleet.dailyLog.form.date")}
              value={formData.date}
              max={todayStr()}
              onChange={(e) => updateField("date", e.target.value)}
              error={errors.date}
              disabled={isSaving || isReadOnly}
            />
            <Select
              label={t("fleet.dailyLog.form.vehicle")}
              options={vehicleOptions}
              value={formData.vehicleId}
              onChange={(e) => updateField("vehicleId", e.target.value)}
              error={errors.vehicleId}
              disabled={isSaving || isReadOnly}
            />
            <Select
              label={t("fleet.dailyLog.form.workOrder")}
              options={workOrderOptions}
              value={formData.workOrderId}
              onChange={(e) => updateField("workOrderId", e.target.value)}
              error={errors.workOrderId}
              disabled={isSaving || isReadOnly}
            />
            <Select
              label={t("fleet.dailyLog.form.operator")}
              options={operatorOptions}
              value={formData.operatorId}
              onChange={(e) => updateField("operatorId", e.target.value)}
              error={errors.operatorId}
              disabled={isSaving || isReadOnly}
            />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <SectionTitle>{t("fleet.dailyLog.form.meterHours")}</SectionTitle>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <Input
                label={t("fleet.dailyLog.form.openingHrs")}
                type="number"
                step="0.01"
                value={formData.openingHrs}
                onChange={(e) => updateField("openingHrs", e.target.value)}
                disabled={isSaving || isReadOnly}
              />
              {openingHrsSource === "auto" && (
                <p className="text-xs text-blue-600">{t("fleet.dailyLog.form.autoFilledYesterday")}</p>
              )}
              {openingHrsSource === "first" && (
                <p className="text-xs text-zinc-500">{t("fleet.dailyLog.form.firstEntryVehicle")}</p>
              )}
            </div>
            <Input
              label={t("fleet.dailyLog.form.closingHrs")}
              type="number"
              step="0.01"
              value={formData.closingHrs}
              onChange={(e) => updateField("closingHrs", e.target.value)}
              disabled={isSaving || isReadOnly}
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-zinc-700">{t("fleet.dailyLog.form.totalHrs")}</span>
            <div className="rounded-md bg-zinc-900 px-4 py-3 text-center font-mono text-2xl tracking-wider text-amber-400">
              {totalHrs !== null ? totalHrs.toFixed(2) : "—"}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <SectionTitle>{t("fleet.dailyLog.form.shiftTimes")}</SectionTitle>
            {!isReadOnly && (
              <Button type="button" variant="secondary" size="sm" onClick={addShiftRow} disabled={isSaving}>
                <Plus className="h-4 w-4" />
                {t("fleet.dailyLog.form.addShift")}
              </Button>
            )}
          </div>
          <div className="flex flex-col gap-3">
            {formData.shifts.map((row, index) => {
              const shiftHours = computeShiftHours(row.startTime, row.closeTime);
              return (
                <div key={index} className="grid grid-cols-1 items-end gap-3 sm:grid-cols-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-zinc-700">{t("fleet.dailyLog.form.startTime")}</label>
                    <input
                      type="time"
                      value={row.startTime}
                      onChange={(e) => updateShiftRow(index, "startTime", e.target.value)}
                      disabled={isSaving || isReadOnly}
                      className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-zinc-700">{t("fleet.dailyLog.form.closeTime")}</label>
                    <input
                      type="time"
                      value={row.closeTime}
                      onChange={(e) => updateShiftRow(index, "closeTime", e.target.value)}
                      disabled={isSaving || isReadOnly}
                      className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-zinc-700">{t("fleet.dailyLog.form.totalTime")}</span>
                    <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
                      {shiftHours !== null ? shiftHours.toFixed(2) : "—"}
                    </div>
                  </div>
                  {!isReadOnly && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeShiftRow(index)}
                      disabled={isSaving || formData.shifts.length <= 1}
                      aria-label={t("fleet.dailyLog.form.removeShift")}
                    >
                      <X className="h-4 w-4" />
                      {t("fleet.dailyLog.form.removeShift")}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <SectionTitle>{t("fleet.dailyLog.form.diesel")}</SectionTitle>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input
              label={t("fleet.dailyLog.form.dieselFilled")}
              type="number"
              step="0.01"
              value={formData.dieselFilled}
              onChange={(e) => updateField("dieselFilled", e.target.value)}
              disabled={isSaving || isReadOnly}
            />
            <Input
              label={t("fleet.dailyLog.form.dieselMeter")}
              type="number"
              step="0.01"
              value={formData.dieselMeter}
              onChange={(e) => updateField("dieselMeter", e.target.value)}
              disabled={isSaving || isReadOnly}
            />
            <Input
              label={t("fleet.dailyLog.form.running")}
              type="number"
              step="0.01"
              value={formData.running}
              onChange={(e) => updateField("running", e.target.value)}
              disabled={isSaving || isReadOnly}
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-zinc-700">{t("fleet.dailyLog.form.fuelAvg")}</span>
            <div className={`text-lg font-semibold ${fuelAvgColorClass(fuelAvg)}`}>
              {fuelAvg !== null ? fuelAvg.toFixed(2) : "—"}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <SectionTitle>{t("fleet.dailyLog.form.material")}</SectionTitle>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Select
              label={t("fleet.dailyLog.form.materialType")}
              options={materialTypeOptions}
              value={formData.materialType}
              onChange={(e) => updateField("materialType", e.target.value)}
              disabled={isSaving || isReadOnly}
            />
            <Input
              label={t("fleet.dailyLog.form.quantity")}
              type="number"
              step="0.01"
              value={formData.quantity}
              onChange={(e) => updateField("quantity", e.target.value)}
              disabled={isSaving || isReadOnly}
            />
            <Select
              label={t("fleet.dailyLog.form.unit")}
              options={unitOptions}
              value={formData.unit}
              onChange={(e) => updateField("unit", e.target.value)}
              disabled={isSaving || isReadOnly}
            />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <SectionTitle>{t("fleet.dailyLog.form.workDetails")}</SectionTitle>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-zinc-700">{t("fleet.dailyLog.form.workDescription")}</label>
            <textarea
              rows={3}
              value={formData.workDescription}
              onChange={(e) => updateField("workDescription", e.target.value)}
              disabled={isSaving || isReadOnly}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400"
            />
          </div>
          {isReadOnly ? (
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-zinc-700">{t("fleet.dailyLog.form.receivingSlip")}</span>
              <p className="text-sm text-zinc-500">{formData.receivingSlipUrl || "—"}</p>
            </div>
          ) : (
            <FileUpload
              label={t("fleet.dailyLog.form.receivingSlip")}
              accept="image/*,application/pdf"
              onChange={(file) => updateField("receivingSlip", file)}
            />
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-zinc-200 pt-4">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSaving}>
            {isReadOnly ? t("common.close") : t("common.cancel")}
          </Button>
          {!isReadOnly && (
            <Button type="submit" loading={isSaving}>
              {t("common.save")}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
}
