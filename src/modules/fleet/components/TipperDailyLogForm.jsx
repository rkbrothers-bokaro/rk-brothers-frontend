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
import { getTipperOpeningHrs, createTipperLog, updateTipperLog } from "../api/dailyLogApi";

function todayStr() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function computeDiff(open, close) {
  const o = Number(open);
  const c = Number(close);
  if (open === "" || close === "" || Number.isNaN(o) || Number.isNaN(c) || c < o) return null;
  return Math.round((c - o) * 100) / 100;
}

function numOrNull(value) {
  return value === "" || value === undefined ? null : Number(value);
}

function buildInitialFormState(initialData) {
  if (!initialData) {
    return {
      date: todayStr(),
      vehicleId: "",
      workOrderId: "",
      driverId: "",
      meterRows: [{ openingHrs: "", closingHrs: "" }],
      openingKm: "",
      closingKm: "",
      dieselLtr: "",
      dieselHrs: "",
      dieselKm: "",
      runKm: "",
      trips: [{ fromLocation: "", toLocation: "", tripCount: "" }],
      workDescription: "",
      receivingSlip: null,
    };
  }
  return {
    date: initialData.date || todayStr(),
    vehicleId: initialData.vehicleId || "",
    workOrderId: initialData.workOrderId || "",
    driverId: initialData.driverId || initialData.operatorId || "",
    meterRows:
      Array.isArray(initialData.meterRows) && initialData.meterRows.length > 0
        ? initialData.meterRows.map((r) => ({ openingHrs: r.openingHrs ?? "", closingHrs: r.closingHrs ?? "" }))
        : [{ openingHrs: "", closingHrs: "" }],
    openingKm: initialData.openingKm ?? "",
    closingKm: initialData.closingKm ?? "",
    dieselLtr: initialData.dieselLtr ?? "",
    dieselHrs: initialData.dieselHrs ?? "",
    dieselKm: initialData.dieselKm ?? "",
    runKm: initialData.runKm ?? "",
    trips:
      Array.isArray(initialData.trips) && initialData.trips.length > 0
        ? initialData.trips.map((r) => ({
            fromLocation: r.fromLocation || "",
            toLocation: r.toLocation || "",
            tripCount: r.tripCount ?? r.trips ?? "",
          }))
        : [{ fromLocation: "", toLocation: "", tripCount: "" }],
    workDescription: initialData.workDescription || "",
    receivingSlipUrl: initialData.receivingSlipUrl || initialData.receivingSlip || "",
    receivingSlip: null,
  };
}

function SectionTitle({ children }) {
  return <h3 className="text-sm font-semibold text-zinc-900">{children}</h3>;
}

export default function TipperDailyLogForm({ mode, initialData, vehicles, workOrders, operators, onClose, onSaved }) {
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
  const driverOptions = useMemo(() => operators.map((op) => ({ value: op.id, label: op.name })), [operators]);

  useEffect(() => {
    if (isReadOnly) return;
    if (!formData.vehicleId || !formData.date) return;

    if (skipNextOpeningFetch.current) {
      skipNextOpeningFetch.current = false;
      return;
    }

    let cancelled = false;
    getTipperOpeningHrs(formData.vehicleId, formData.date)
      .then(({ data }) => {
        if (cancelled) return;
        const body = data && data.data !== undefined ? data.data : data;
        const value = body && typeof body === "object" ? (body.openingHrs ?? body.value ?? null) : body;
        if (value === null || value === undefined) {
          setOpeningHrsSource("first");
          setFormData((f) => ({
            ...f,
            meterRows: f.meterRows.map((row, i) => (i === 0 ? { ...row, openingHrs: "" } : row)),
          }));
        } else {
          setOpeningHrsSource("auto");
          setFormData((f) => ({
            ...f,
            meterRows: f.meterRows.map((row, i) => (i === 0 ? { ...row, openingHrs: value } : row)),
          }));
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.vehicleId, formData.date]);

  const totalKm = computeDiff(formData.openingKm, formData.closingKm);
  const avgKmLtr =
    totalKm !== null && formData.dieselLtr !== "" && Number(formData.dieselLtr) > 0
      ? Math.round((totalKm / Number(formData.dieselLtr)) * 100) / 100
      : null;
  const totalTrips = formData.trips.reduce((sum, row) => {
    const n = Number(row.tripCount);
    return sum + (Number.isNaN(n) ? 0 : n);
  }, 0);

  function updateField(field, value) {
    setFormData((f) => ({ ...f, [field]: value }));
  }

  function updateMeterRow(index, field, value) {
    setFormData((f) => ({
      ...f,
      meterRows: f.meterRows.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    }));
  }

  function addMeterRow() {
    setFormData((f) => ({ ...f, meterRows: [...f.meterRows, { openingHrs: "", closingHrs: "" }] }));
  }

  function removeMeterRow(index) {
    setFormData((f) => ({ ...f, meterRows: f.meterRows.filter((_, i) => i !== index) }));
  }

  function updateTripRow(index, field, value) {
    setFormData((f) => ({
      ...f,
      trips: f.trips.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    }));
  }

  function addTripRow() {
    setFormData((f) => ({ ...f, trips: [...f.trips, { fromLocation: "", toLocation: "", tripCount: "" }] }));
  }

  function removeTripRow(index) {
    setFormData((f) => ({ ...f, trips: f.trips.filter((_, i) => i !== index) }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (isReadOnly) return;

    const nextErrors = {};
    if (!formData.date) nextErrors.date = t("common.required");
    if (!formData.vehicleId) nextErrors.vehicleId = t("common.required");
    if (!formData.workOrderId) nextErrors.workOrderId = t("common.required");
    if (!formData.driverId) nextErrors.driverId = t("common.required");
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSaving(true);
    try {
      const payload = {
        date: formData.date,
        vehicleId: formData.vehicleId,
        workOrderId: formData.workOrderId,
        driverId: formData.driverId,
        meterRows: formData.meterRows
          .filter((row) => row.openingHrs !== "" || row.closingHrs !== "")
          .map((row) => ({
            openingHrs: row.openingHrs === "" ? null : Number(row.openingHrs),
            closingHrs: row.closingHrs === "" ? null : Number(row.closingHrs),
          })),
        openingKm: numOrNull(formData.openingKm),
        closingKm: numOrNull(formData.closingKm),
        dieselLtr: numOrNull(formData.dieselLtr),
        dieselHrs: numOrNull(formData.dieselHrs),
        dieselKm: numOrNull(formData.dieselKm),
        runKm: numOrNull(formData.runKm),
        trips: formData.trips
          .filter((row) => row.fromLocation || row.toLocation || row.tripCount !== "")
          .map((row) => ({
            fromLocation: row.fromLocation,
            toLocation: row.toLocation,
            tripCount: row.tripCount === "" ? null : Number(row.tripCount),
          })),
        workDescription: formData.workDescription,
        receivingSlip: formData.receivingSlip instanceof File ? formData.receivingSlip : undefined,
      };

      if (isEdit && initialData) {
        await updateTipperLog(initialData.id, payload);
      } else {
        await createTipperLog(payload);
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
    ? t("fleet.dailyLog.form.editTipperTitle")
    : isReadOnly
      ? t("fleet.dailyLog.form.viewTipperTitle")
      : t("fleet.dailyLog.form.addTipperTitle");

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
              label={t("fleet.dailyLog.form.driver")}
              options={driverOptions}
              value={formData.driverId}
              onChange={(e) => updateField("driverId", e.target.value)}
              error={errors.driverId}
              disabled={isSaving || isReadOnly}
            />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <SectionTitle>{t("fleet.dailyLog.form.meterHours")}</SectionTitle>
            {!isReadOnly && (
              <Button type="button" variant="secondary" size="sm" onClick={addMeterRow} disabled={isSaving}>
                <Plus className="h-4 w-4" />
                {t("fleet.dailyLog.form.addShift")}
              </Button>
            )}
          </div>
          <div className="flex flex-col gap-3">
            {formData.meterRows.map((row, index) => {
              const rowHours = computeDiff(row.openingHrs, row.closingHrs);
              return (
                <div key={index} className="grid grid-cols-1 items-end gap-3 sm:grid-cols-4">
                  <div className="flex flex-col gap-1">
                    <Input
                      label={t("fleet.dailyLog.form.openingHrs")}
                      type="number"
                      step="0.01"
                      value={row.openingHrs}
                      onChange={(e) => updateMeterRow(index, "openingHrs", e.target.value)}
                      disabled={isSaving || isReadOnly}
                    />
                    {index === 0 && openingHrsSource === "auto" && (
                      <p className="text-xs text-blue-600">{t("fleet.dailyLog.form.autoFilledYesterday")}</p>
                    )}
                    {index === 0 && openingHrsSource === "first" && (
                      <p className="text-xs text-zinc-500">{t("fleet.dailyLog.form.firstEntryVehicle")}</p>
                    )}
                  </div>
                  <Input
                    label={t("fleet.dailyLog.form.closingHrs")}
                    type="number"
                    step="0.01"
                    value={row.closingHrs}
                    onChange={(e) => updateMeterRow(index, "closingHrs", e.target.value)}
                    disabled={isSaving || isReadOnly}
                  />
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-zinc-700">{t("fleet.dailyLog.form.totalHrs")}</span>
                    <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
                      {rowHours !== null ? rowHours.toFixed(2) : "—"}
                    </div>
                  </div>
                  {!isReadOnly && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMeterRow(index)}
                      disabled={isSaving || formData.meterRows.length <= 1}
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
          <SectionTitle>{t("fleet.dailyLog.form.km")}</SectionTitle>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label={t("fleet.dailyLog.form.openingKm")}
              type="number"
              step="0.01"
              value={formData.openingKm}
              onChange={(e) => updateField("openingKm", e.target.value)}
              disabled={isSaving || isReadOnly}
            />
            <Input
              label={t("fleet.dailyLog.form.closingKm")}
              type="number"
              step="0.01"
              value={formData.closingKm}
              onChange={(e) => updateField("closingKm", e.target.value)}
              disabled={isSaving || isReadOnly}
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-zinc-700">{t("fleet.dailyLog.form.totalKm")}</span>
            <div className="rounded-md bg-zinc-900 px-4 py-3 text-center font-mono text-2xl tracking-wider text-amber-400">
              {totalKm !== null ? totalKm.toFixed(2) : "—"}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <SectionTitle>{t("fleet.dailyLog.form.diesel")}</SectionTitle>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <Input
              label={t("fleet.dailyLog.form.dieselLtr")}
              type="number"
              step="0.01"
              value={formData.dieselLtr}
              onChange={(e) => updateField("dieselLtr", e.target.value)}
              disabled={isSaving || isReadOnly}
            />
            <Input
              label={t("fleet.dailyLog.form.dieselHrs")}
              type="number"
              step="0.01"
              value={formData.dieselHrs}
              onChange={(e) => updateField("dieselHrs", e.target.value)}
              disabled={isSaving || isReadOnly}
            />
            <Input
              label={t("fleet.dailyLog.form.dieselKm")}
              type="number"
              step="0.01"
              value={formData.dieselKm}
              onChange={(e) => updateField("dieselKm", e.target.value)}
              disabled={isSaving || isReadOnly}
            />
            <Input
              label={t("fleet.dailyLog.form.runKm")}
              type="number"
              step="0.01"
              value={formData.runKm}
              onChange={(e) => updateField("runKm", e.target.value)}
              disabled={isSaving || isReadOnly}
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-zinc-700">{t("fleet.dailyLog.form.avgKmLtr")}</span>
            <div className="text-lg font-semibold text-zinc-800">{avgKmLtr !== null ? avgKmLtr.toFixed(2) : "—"}</div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <SectionTitle>{t("fleet.dailyLog.form.trips")}</SectionTitle>
            {!isReadOnly && (
              <Button type="button" variant="secondary" size="sm" onClick={addTripRow} disabled={isSaving}>
                <Plus className="h-4 w-4" />
                {t("fleet.dailyLog.form.addTrip")}
              </Button>
            )}
          </div>
          <div className="flex flex-col gap-3">
            {formData.trips.map((row, index) => (
              <div key={index} className="grid grid-cols-1 items-end gap-3 sm:grid-cols-4">
                <Input
                  label={t("fleet.dailyLog.form.fromLocation")}
                  value={row.fromLocation}
                  onChange={(e) => updateTripRow(index, "fromLocation", e.target.value)}
                  disabled={isSaving || isReadOnly}
                />
                <Input
                  label={t("fleet.dailyLog.form.toLocation")}
                  value={row.toLocation}
                  onChange={(e) => updateTripRow(index, "toLocation", e.target.value)}
                  disabled={isSaving || isReadOnly}
                />
                <Input
                  label={t("fleet.dailyLog.form.tripCount")}
                  type="number"
                  step="1"
                  value={row.tripCount}
                  onChange={(e) => updateTripRow(index, "tripCount", e.target.value)}
                  disabled={isSaving || isReadOnly}
                />
                {!isReadOnly && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTripRow(index)}
                    disabled={isSaving || formData.trips.length <= 1}
                    aria-label={t("fleet.dailyLog.form.removeTrip")}
                  >
                    <X className="h-4 w-4" />
                    {t("fleet.dailyLog.form.removeTrip")}
                  </Button>
                )}
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-zinc-700">{t("fleet.dailyLog.form.totalTrips")}</span>
            <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
              {totalTrips}
            </div>
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
