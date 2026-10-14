import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Download, MessageCircle } from "lucide-react";
import PageHeader from "../../../core/components/PageHeader";
import Select from "../../../core/components/Select";
import SearchableSelect from "../../../core/components/SearchableSelect";
import Input from "../../../core/components/Input";
import Badge from "../../../core/components/Badge";
import Button from "../../../core/components/Button";
import { workOrdersApi, vehiclesApi, unwrapList } from "../masters/api";
import { unwrapEnvelope } from "../../../core/api/unwrapEnvelope";
import { getBillingPeriods, getBill, downloadBillPdf } from "../api/billingApi";
import { numberToIndianWords } from "../utils/numberToWords";

const now = new Date();
const CURRENT_MONTH = now.getMonth() + 1;
const CURRENT_YEAR = now.getFullYear();

const VEHICLE_TYPE_LABEL_KEYS = {
  jcb_backhoe: "masters.vehicles.types.jcbBackhoe",
  poclain_excavator: "masters.vehicles.types.poclainExcavator",
  tipper_hyva: "masters.vehicles.types.tipperHyva",
  other: "masters.vehicles.types.other",
};

const BILLING_BASIS_LABEL_KEYS = {
  hour: "masters.billingBasisOptions.hour",
  trip: "masters.billingBasisOptions.trip",
  km: "masters.billingBasisOptions.km",
  rail_line: "masters.billingBasisOptions.railLine",
  railline: "masters.billingBasisOptions.railLine",
};

const UNIT_LABEL_KEYS = {
  hour: "fleet.billing.units.hrs",
  trip: "fleet.billing.units.trips",
  km: "fleet.billing.units.km",
  rail_line: "fleet.billing.units.railLine",
  railline: "fleet.billing.units.railLine",
};

const RATE_SUFFIX_KEYS = {
  hour: "fleet.billing.units.perHour",
  trip: "fleet.billing.units.perTrip",
  km: "fleet.billing.units.perKm",
  rail_line: "fleet.billing.units.perRailLine",
  railline: "fleet.billing.units.perRailLine",
};

export default function BillingPage() {
  const { t, i18n } = useTranslation();

  const [periods, setPeriods] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [vehiclesList, setVehiclesList] = useState([]);

  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [partyName, setPartyName] = useState("");
  const [siteLocation, setSiteLocation] = useState("");
  const [filters, setFilters] = useState({ month: CURRENT_MONTH, year: CURRENT_YEAR });

  const [bill, setBill] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    getBillingPeriods()
      .then(({ data }) => setPeriods(unwrapList(data).items))
      .catch(() => setPeriods([]));

    workOrdersApi
      .listAll()
      .then(({ data }) => setWorkOrders(unwrapList(data).items))
      .catch(() => setWorkOrders([]));

    vehiclesApi
      .listAll()
      .then(({ data }) => setVehiclesList(unwrapList(data).items))
      .catch(() => setVehiclesList([]));
  }, []);

  useEffect(() => {
    setBill(null);
  }, [selectedWorkOrderId, selectedVehicleId, filters.month, filters.year]);

  const selectedWorkOrder = useMemo(() => {
    if (!selectedWorkOrderId) return null;
    const fromMaster = workOrders.find((w) => String(w.id) === String(selectedWorkOrderId));
    if (fromMaster) return fromMaster;
    const fromPeriod = periods.find((p) => String(p.workOrderId) === String(selectedWorkOrderId));
    return fromPeriod || null;
  }, [workOrders, periods, selectedWorkOrderId]);

  function handleWorkOrderChange(woId) {
    setSelectedWorkOrderId(woId);
    if (!woId) {
      setPartyName("");
      setSiteLocation("");
      return;
    }
    const wo =
      workOrders.find((w) => String(w.id) === String(woId)) ||
      periods.find((p) => String(p.workOrderId) === String(woId));
    if (wo) {
      setPartyName(wo.partyName || "");
      setSiteLocation(wo.siteLocation || "");
    } else {
      setPartyName("");
      setSiteLocation("");
    }
  }

  const workOrderOptions = useMemo(() => {
    const map = new Map();
    workOrders.forEach((w) => {
      map.set(String(w.id), {
        value: String(w.id),
        label: `${w.woNumber}${w.partyName ? ` — ${w.partyName}` : ""}`,
      });
    });
    periods.forEach((p) => {
      const key = String(p.workOrderId);
      if (!map.has(key)) {
        map.set(key, {
          value: key,
          label: `${p.woNumber}${p.partyName ? ` — ${p.partyName}` : ""}`,
        });
      }
    });
    return Array.from(map.values());
  }, [workOrders, periods]);

  const vehicleOptions = useMemo(
    () => [
      { value: "", label: t("fleet.billing.allVehicles") || "All Vehicles" },
      ...vehiclesList.map((v) => ({
        value: String(v.id),
        label: v.displayName ? `${v.displayName} (${v.vehicleNo})` : v.vehicleNo,
        sublabel: v.type ? `Type: ${v.type}` : "",
      })),
    ],
    [vehiclesList, t],
  );

  const monthOptions = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => i + 1).map((m) => ({
        value: m,
        label: t(`fleet.diesel.months.${m}`),
      })),
    [t],
  );

  const yearOptions = useMemo(
    () => [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map((y) => ({ value: y, label: String(y) })),
    [],
  );

  function typeLabel(type) {
    const key = VEHICLE_TYPE_LABEL_KEYS[type];
    return key ? t(key) : type || "—";
  }

  function billingBasisLabel(basis) {
    const key = BILLING_BASIS_LABEL_KEYS[basis?.toLowerCase()];
    return key ? t(key) : basis || "—";
  }

  function unitLabel(basis) {
    const key = UNIT_LABEL_KEYS[basis?.toLowerCase()];
    return key ? t(key) : basis || "";
  }

  function formatRate(basis, rate) {
    if (rate === undefined || rate === null) return "—";
    const suffixKey = RATE_SUFFIX_KEYS[basis?.toLowerCase()];
    const suffix = suffixKey ? t(suffixKey) : "";
    return `₹${Number(rate).toLocaleString("en-IN")}${suffix}`;
  }

  function qtyLabel(row) {
    const basis = row.unit || selectedWorkOrder?.billingBasis;
    const qty = row.quantity ?? row.qty ?? 0;
    return `${qty} ${unitLabel(basis)}`.trim();
  }

  async function handleGenerate() {
    if (!selectedWorkOrderId) return;
    setIsGenerating(true);
    try {
      const { data } = await getBill(
        selectedWorkOrderId,
        filters.month,
        filters.year,
        selectedVehicleId || undefined,
        partyName || undefined,
        siteLocation || undefined,
      );
      setBill(unwrapEnvelope(data));
    } catch {
      setBill(null);
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleDownloadPdf() {
    if (!selectedWorkOrderId) return;
    setIsDownloading(true);
    try {
      const response = await downloadBillPdf(
        selectedWorkOrderId,
        filters.month,
        filters.year,
        selectedVehicleId || undefined,
        partyName || undefined,
        siteLocation || undefined,
      );
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const safeWoNumber = (selectedWorkOrder?.woNumber || bill?.woNumber || "WO").replace(/[\\/]/g, "-");
      link.href = url;
      link.download = `Bill_${safeWoNumber}_${filters.month}_${filters.year}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      // global error toast already shown by axios interceptor
    } finally {
      setIsDownloading(false);
    }
  }

  function handleWhatsAppShare() {
    if (!bill) return;
    const message = [
      t("fleet.billing.companyName"),
      t("fleet.billing.billTitle"),
      `${t("fleet.billing.party")}: ${bill.partyName || partyName || selectedWorkOrder?.partyName || "—"}`,
      `${t("fleet.billing.workOrder")}: ${bill.woNumber || selectedWorkOrder?.woNumber || "—"}`,
      `${t("fleet.billing.site")}: ${bill.siteLocation || siteLocation || selectedWorkOrder?.siteLocation || "—"}`,
      `${t("fleet.billing.period")}: ${monthLabel} ${filters.year}`,
      `${t("fleet.billing.total")}: ₹${totalAmount.toLocaleString("en-IN")}`,
    ].join("\n");
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  const lineItems = Array.isArray(bill?.lineItems)
    ? bill.lineItems
    : Array.isArray(bill?.vehicles)
      ? bill.vehicles
      : Array.isArray(bill?.items)
        ? bill.items
        : [];

  const totalAmount = Number(bill?.totalAmount ?? bill?.total ?? 0);
  const monthLabel = t(`fleet.diesel.months.${filters.month}`);
  const amountWordsText =
    bill?.amountInWords ||
    `${t("fleet.billing.rupees")} ${numberToIndianWords(totalAmount, i18n.language)} ${t("fleet.billing.only")}`;

  return (
    <div>
      <PageHeader title={t("fleet.billing.title")} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-5 lg:col-span-1">
          <Select
            label={t("fleet.billing.workOrder")}
            options={workOrderOptions}
            value={selectedWorkOrderId}
            onChange={(e) => handleWorkOrderChange(e.target.value)}
            placeholder={t("fleet.dailyLog.filters.allWorkOrders") || "Select Work Order"}
          />

          <SearchableSelect
            label={t("fleet.billing.selectVehicle") || "Select Vehicle"}
            options={vehicleOptions}
            value={selectedVehicleId}
            onChange={(e) => setSelectedVehicleId(e.target.value)}
            placeholder={t("fleet.billing.allVehicles") || "All Vehicles"}
            searchPlaceholder={t("fleet.dailyLog.form.searchVehicle") || "Search vehicle..."}
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label={t("fleet.billing.month")}
              options={monthOptions}
              value={filters.month}
              onChange={(e) => setFilters((f) => ({ ...f, month: Number(e.target.value) }))}
            />
            <Select
              label={t("fleet.billing.year")}
              options={yearOptions}
              value={filters.year}
              onChange={(e) => setFilters((f) => ({ ...f, year: Number(e.target.value) }))}
            />
          </div>

          <Input
            label={t("fleet.billing.partyName")}
            value={partyName}
            onChange={(e) => setPartyName(e.target.value)}
            placeholder={t("fleet.billing.partyNamePlaceholder") || "Enter party name"}
          />

          <Input
            label={t("fleet.billing.siteLocation")}
            value={siteLocation}
            onChange={(e) => setSiteLocation(e.target.value)}
            placeholder={t("fleet.billing.siteLocationPlaceholder") || "Enter site location"}
          />

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-zinc-700">{t("fleet.billing.billingBasis")}</span>
              <div className="flex h-9 items-center rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-700">
                {selectedWorkOrder ? (
                  <Badge variant="zinc">{billingBasisLabel(selectedWorkOrder.billingBasis)}</Badge>
                ) : (
                  <span className="text-zinc-400">—</span>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-zinc-700">{t("fleet.billing.rate")}</span>
              <div className="flex h-9 items-center rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm font-medium text-zinc-700">
                {selectedWorkOrder ? formatRate(selectedWorkOrder.billingBasis, selectedWorkOrder.rate) : "—"}
              </div>
            </div>
          </div>

          <Button className="mt-2" onClick={handleGenerate} loading={isGenerating} disabled={!selectedWorkOrderId}>
            {isGenerating ? t("fleet.billing.generating") : t("fleet.billing.generateBill")}
          </Button>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-5 lg:col-span-2">
          {!bill ? (
            <div className="flex h-full min-h-[200px] items-center justify-center text-center text-sm text-zinc-500">
              {t("fleet.billing.previewPlaceholder")}
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="text-center">
                <p className="text-xl font-bold text-zinc-900">{t("fleet.billing.companyName")}</p>
                <p className="text-sm font-medium tracking-wide text-zinc-600">{t("fleet.billing.billTitle")}</p>
                <div className="mt-4 grid grid-cols-1 gap-1 text-left text-sm text-zinc-700 sm:grid-cols-2">
                  <p>
                    <span className="font-medium">{t("fleet.billing.party")}:</span>{" "}
                    {bill.partyName || partyName || selectedWorkOrder?.partyName || "—"}
                  </p>
                  <p>
                    <span className="font-medium">{t("fleet.billing.workOrder")}:</span>{" "}
                    {bill.woNumber || selectedWorkOrder?.woNumber || "—"}
                  </p>
                  <p>
                    <span className="font-medium">{t("fleet.billing.site")}:</span>{" "}
                    {bill.siteLocation || siteLocation || selectedWorkOrder?.siteLocation || "—"}
                  </p>
                  <p>
                    <span className="font-medium">{t("fleet.billing.period")}:</span> {monthLabel} {filters.year}
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-max text-left text-sm">
                  <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                    <tr>
                      <th className="px-3 py-2 font-medium">{t("fleet.billing.columns.sno")}</th>
                      <th className="px-3 py-2 font-medium">{t("fleet.billing.columns.vehicle")}</th>
                      <th className="px-3 py-2 font-medium">{t("fleet.billing.columns.type")}</th>
                      <th className="px-3 py-2 font-medium">{t("fleet.billing.columns.qty")}</th>
                      <th className="px-3 py-2 font-medium">{t("fleet.billing.columns.unit")}</th>
                      <th className="px-3 py-2 font-medium">{t("fleet.billing.columns.rate")}</th>
                      <th className="px-3 py-2 text-right font-medium">{t("fleet.billing.columns.amount")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {lineItems.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-3 py-6 text-center text-zinc-500">
                          {t("fleet.billing.noBillData")}
                        </td>
                      </tr>
                    ) : (
                      lineItems.map((row, idx) => (
                        <tr key={row.vehicleId ?? idx}>
                          <td className="px-3 py-2">{idx + 1}</td>
                          <td className="px-3 py-2 font-medium text-zinc-900">
                            {row.vehicleDisplayName || row.vehicleNo || "—"}
                          </td>
                          <td className="px-3 py-2">{typeLabel(row.vehicleType || row.type)}</td>
                          <td className="px-3 py-2">{qtyLabel(row)}</td>
                          <td className="px-3 py-2">{unitLabel(row.unit || selectedWorkOrder?.billingBasis)}</td>
                          <td className="px-3 py-2">₹{Number(row.rate ?? 0).toLocaleString("en-IN")}</td>
                          <td className="px-3 py-2 text-right font-medium text-zinc-900">
                            ₹{Number(row.amount ?? 0).toLocaleString("en-IN")}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-zinc-300">
                      <td colSpan={6} className="px-3 py-3 text-right text-base font-bold text-zinc-900">
                        {t("fleet.billing.total")}
                      </td>
                      <td className="px-3 py-3 text-right text-lg font-bold text-zinc-900">
                        ₹{totalAmount.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <p className="text-sm italic text-zinc-600">{amountWordsText}</p>

              <div className="flex flex-wrap gap-3 border-t border-zinc-200 pt-4">
                <Button onClick={handleDownloadPdf} loading={isDownloading} variant="secondary">
                  <Download className="h-4 w-4" />
                  {isDownloading ? t("fleet.billing.downloading") : t("fleet.billing.downloadPdf")}
                </Button>
                <Button onClick={handleWhatsAppShare} variant="secondary">
                  <MessageCircle className="h-4 w-4" />
                  {t("fleet.billing.shareWhatsApp")}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
