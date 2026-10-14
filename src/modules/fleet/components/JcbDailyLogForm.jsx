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
import SearchableSelect from "../../../core/components/SearchableSelect";
import { getJcbOpeningHrs, createJcbLog, updateJcbLog, uploadSlip } from "../api/dailyLogApi";

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
      noWorkDone: false,
      driverAbsent: false,
      openingHrs: "",
      closingHrs: "",
      shifts: [{ startTime: "", closeTime: "" }],
      dieselFilled: "",
      dieselMeter: "",
      running: "",
      materialType: "",
      quantity: "",
      unit: "",
      partyName: "",
      workDescription: "",
      receivingSlip: null,
      receivingSlipUrl: "",
    };
  }
  return {
    date: initialData.date || todayStr(),
    vehicleId: initialData.vehicleId || "",
    workOrderId: initialData.workOrderId || "",
    operatorId: initialData.operatorId || "",
    driverAbsent: Boolean(initialData.driverAbsent),
    noWorkDone: Boolean(initialData.noWorkDone) && !Boolean(initialData.driverAbsent),
    openingHrs: initialData.openingHrs ?? "",
    closingHrs: initialData.closingHrs ?? "",
    shifts:
      Array.isArray(initialData.shifts) && initialData.shifts.length > 0
        ? initialData.shifts.map((s) => ({ startTime: s.startTime || "", closeTime: s.closeTime || "" }))
        : [{ startTime: "", closeTime: "" }],
    dieselFilled: initialData.dieselFilled ?? initialData.dieselLtr ?? "",
    dieselMeter: initialData.dieselMeter ?? initialData.dieselMtr ?? "",
    running: initialData.running ?? initialData.runningLtr ?? "",
    materialType: initialData.materialType || "",
    quantity: initialData.quantity ?? initialData.materialQty ?? "",
    unit: initialData.unit ?? initialData.materialUnit ?? "",
    partyName: initialData.partyName || "",
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

export default function JcbDailyLogForm({ mode, initialData, vehicles, workOrders, operators, onClose, onSaved, canEdit, onEdit }) {
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
    () =>
      vehicles.map((v) => ({
        value: v.id,
        label: v.displayName ? `${v.displayName} (${v.vehicleNo})` : v.vehicleNo,
        sublabel: v.type ? `Type: ${v.type}` : "",
      })),
    [vehicles],
  );
  const workOrderOptions = useMemo(() => workOrders.map((w) => ({ value: w.id, label: w.woNumber })), [workOrders]);
  const operatorOptions = useMemo(() => operators.map((op) => ({ value: op.id, label: op.name })), [operators]);

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
    if (formData.noWorkDone && !formData.driverAbsent) {
      if (!formData.workDescription?.trim()) {
        nextErrors.workDescription = t("fleet.dailyLog.form.reasonRequired") || "Reason why no work done is required";
      }
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSaving(true);
    try {
      let slipUrl = formData.receivingSlipUrl;
      if (formData.receivingSlip instanceof File) {
        try {
          const res = await uploadSlip(formData.receivingSlip);
          slipUrl = res.data.data.url;
        } catch (err) {
          toast.error("Slip upload error: " + (err.response?.data?.message || err.message));
          setIsSaving(false);
          return;
        }
      }

      const isAbsent = Boolean(formData.driverAbsent);
      const isNoWork = isAbsent || Boolean(formData.noWorkDone);
      const payload = {
        date: formData.date,
        vehicleId: formData.vehicleId,
        workOrderId: formData.workOrderId || null,
        operatorId: formData.operatorId || null,
        driverAbsent: isAbsent,
        noWorkDone: isNoWork,
        openingHrs: isNoWork || formData.openingHrs === "" ? null : Number(formData.openingHrs),
        closingHrs: isNoWork || formData.closingHrs === "" ? null : Number(formData.closingHrs),
        shifts: isNoWork ? [] : formData.shifts.filter((row) => row.startTime || row.closeTime),
        dieselLtr: isNoWork || formData.dieselFilled === "" ? null : Number(formData.dieselFilled),
        dieselMtr: isNoWork || formData.dieselMeter === "" ? null : Number(formData.dieselMeter),
        runningLtr: isNoWork || formData.running === "" ? null : Number(formData.running),
        materialType: isNoWork ? null : (formData.materialType || null),
        materialQty: isNoWork || formData.quantity === "" ? null : Number(formData.quantity),
        materialUnit: isNoWork ? null : (formData.unit || null),
        partyName: isNoWork ? null : (formData.partyName?.trim() || null),
        workDescription: isAbsent ? "Driver Absent" : (formData.workDescription || ""),
        receivingSlipUrl: isNoWork ? null : (slipUrl || null),
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
              required
            />
            <SearchableSelect
              label={t("fleet.dailyLog.form.vehicle")}
              options={vehicleOptions}
              value={formData.vehicleId}
              onChange={(e) => updateField("vehicleId", e.target.value)}
              error={errors.vehicleId}
              disabled={isSaving || isReadOnly}
              required
              placeholder={t("fleet.dailyLog.form.vehicle")}
              searchPlaceholder={t("fleet.dailyLog.form.searchVehicle")}
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
            <div className="sm:col-span-2 flex flex-col gap-2">
              <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50/70 p-3">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.noWorkDone}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setFormData((f) => ({
                        ...f,
                        noWorkDone: checked,
                        driverAbsent: checked ? false : f.driverAbsent,
                      }));
                    }}
                    disabled={isSaving || isReadOnly}
                    className="h-4 w-4 rounded border-amber-400 text-amber-600 focus:ring-amber-500 disabled:cursor-not-allowed"
                  />
                  <span className="text-sm font-semibold text-amber-900">
                    {t("fleet.dailyLog.form.noWorkDone") || "No Work Done (काम नहीं हुआ)"}
                  </span>
                </label>
              </div>

              <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50/70 p-3">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.driverAbsent}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setFormData((f) => ({
                        ...f,
                        driverAbsent: checked,
                        noWorkDone: checked ? false : f.noWorkDone,
                      }));
                    }}
                    disabled={isSaving || isReadOnly}
                    className="h-4 w-4 rounded border-rose-400 text-rose-600 focus:ring-rose-500 disabled:cursor-not-allowed"
                  />
                  <span className="text-sm font-semibold text-rose-900">
                    {t("fleet.dailyLog.form.driverAbsent") || "Driver Absent (ड्राइवर अनुपस्थित)"}
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {!formData.noWorkDone && !formData.driverAbsent && (
          <>
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
          </>
        )}

        {!formData.driverAbsent && (
          <div className="flex flex-col gap-4">
            <SectionTitle>
              {formData.noWorkDone
                ? (t("fleet.dailyLog.form.reasonTitle") || "Reason / Description")
                : t("fleet.dailyLog.form.workDetails")}
            </SectionTitle>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-zinc-700">
                {formData.noWorkDone
                  ? `${t("fleet.dailyLog.form.workDescription") || "Work Description"} (Write reason why no work done) *`
                  : t("fleet.dailyLog.form.workDescription")}
              </label>
              <textarea
                rows={3}
                value={formData.workDescription}
                placeholder={formData.noWorkDone ? "Write reason why no work was done (e.g. Breakdown, Operator absent, Site holiday, Maintenance)..." : ""}
                onChange={(e) => updateField("workDescription", e.target.value)}
                disabled={isSaving || isReadOnly}
                className={`w-full rounded-md border px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400 ${
                  errors.workDescription ? "border-red-500" : "border-zinc-300"
                }`}
              />
              {errors.workDescription && <p className="text-xs text-red-600">{errors.workDescription}</p>}
            </div>
            {!formData.noWorkDone && (
              isReadOnly ? (
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
              )
            )}
          </div>
        )}

        {!formData.noWorkDone && !formData.driverAbsent && (
          <>
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
            <Input
              label={t("fleet.dailyLog.form.materialType")}
              placeholder={t("fleet.dailyLog.form.materialType") || "Enter material type"}
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
          <SectionTitle>{t("fleet.dailyLog.form.partyDetails")}</SectionTitle>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label={t("fleet.dailyLog.form.partyName")}
              placeholder={t("fleet.dailyLog.form.partyNamePlaceholder")}
              value={formData.partyName}
              onChange={(e) => updateField("partyName", e.target.value)}
              disabled={isSaving || isReadOnly}
            />
          </div>
        </div>
          </>
        )}

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
