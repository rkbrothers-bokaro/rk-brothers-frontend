import re

with open(r"D:\BB Client Projects\rk-brothers\rk-brothers-frontend\src\modules\fleet\pages\DailyLogPage.jsx", "r", encoding="utf-8") as f:
    content = f.read()

# Replace actions column to be at the beginning of the table (or right after date)
# And add receiving slip column
jcb_old = """  const jcbColumns = [
    { key: "date", header: t("fleet.dailyLog.columns.date") },
    { key: "vehicle", header: t("fleet.dailyLog.columns.vehicle"), render: vehicleLabel },
    { key: "operator", header: t("fleet.dailyLog.columns.operator"), render: operatorLabel },
    { key: "workOrder", header: t("fleet.dailyLog.columns.workOrder"), render: workOrderLabel },
    { key: "openingHrs", header: t("fleet.dailyLog.columns.openingHrs"), render: (row) => row.openingHrs ?? "-" },
    { key: "closingHrs", header: t("fleet.dailyLog.columns.closingHrs"), render: (row) => row.closingHrs ?? "-" },
    { key: "totalHrs", header: t("fleet.dailyLog.columns.totalHrs"), render: (row) => row.totalHrs ?? "-" },
    { key: "diesel", header: t("fleet.dailyLog.columns.diesel"), render: (row) => row.dieselFilled ?? "-" },
    { key: "avg", header: t("fleet.dailyLog.columns.avg"), render: (row) => row.fuelAvg ?? "-" },
    { key: "actions", header: t("fleet.dailyLog.columns.actions"), render: renderActions },
  ];"""

jcb_new = """  const jcbColumns = [
    { key: "actions", header: t("fleet.dailyLog.columns.actions"), render: renderActions },
    { key: "date", header: t("fleet.dailyLog.columns.date") },
    { key: "vehicle", header: t("fleet.dailyLog.columns.vehicle"), render: vehicleLabel },
    { key: "operator", header: t("fleet.dailyLog.columns.operator"), render: operatorLabel },
    { key: "workOrder", header: t("fleet.dailyLog.columns.workOrder"), render: workOrderLabel },
    { key: "openingHrs", header: t("fleet.dailyLog.columns.openingHrs"), render: (row) => row.openingHrs ?? "-" },
    { key: "closingHrs", header: t("fleet.dailyLog.columns.closingHrs"), render: (row) => row.closingHrs ?? "-" },
    { key: "totalHrs", header: t("fleet.dailyLog.columns.totalHrs"), render: (row) => row.totalHrs ?? "-" },
    { key: "diesel", header: t("fleet.dailyLog.columns.diesel"), render: (row) => row.dieselLtr ?? "-" },
    { key: "avg", header: t("fleet.dailyLog.columns.avg"), render: (row) => row.avgLtrPerHr ?? "-" },
    { key: "slip", header: "Slip", render: renderSlipAction },
  ];"""

tipper_old = """  const tipperColumns = [
    { key: "date", header: t("fleet.dailyLog.columns.date") },
    { key: "vehicle", header: t("fleet.dailyLog.columns.vehicle"), render: vehicleLabel },
    { key: "driver", header: t("fleet.dailyLog.columns.driver"), render: operatorLabel },
    { key: "workOrder", header: t("fleet.dailyLog.columns.workOrder"), render: workOrderLabel },
    { key: "totalHrs", header: t("fleet.dailyLog.columns.totalHrs"), render: (row) => row.totalHrs ?? "-" },
    { key: "totalKm", header: t("fleet.dailyLog.columns.totalKm"), render: (row) => row.totalKm ?? "-" },
    { key: "diesel", header: t("fleet.dailyLog.columns.diesel"), render: (row) => row.dieselLtr ?? "-" },
    { key: "trips", header: t("fleet.dailyLog.columns.trips"), render: (row) => row.totalTrips ?? "-" },
    { key: "actions", header: t("fleet.dailyLog.columns.actions"), render: renderActions },
  ];"""

tipper_new = """  const tipperColumns = [
    { key: "actions", header: t("fleet.dailyLog.columns.actions"), render: renderActions },
    { key: "date", header: t("fleet.dailyLog.columns.date") },
    { key: "vehicle", header: t("fleet.dailyLog.columns.vehicle"), render: vehicleLabel },
    { key: "driver", header: t("fleet.dailyLog.columns.driver"), render: operatorLabel },
    { key: "workOrder", header: t("fleet.dailyLog.columns.workOrder"), render: workOrderLabel },
    { key: "totalHrs", header: t("fleet.dailyLog.columns.totalHrs"), render: (row) => row.totalHrs ?? "-" },
    { key: "totalKm", header: t("fleet.dailyLog.columns.totalKm"), render: (row) => row.totalKm ?? "-" },
    { key: "diesel", header: t("fleet.dailyLog.columns.diesel"), render: (row) => row.dieselLtr ?? "-" },
    { key: "trips", header: t("fleet.dailyLog.columns.trips"), render: (row) => row.totalTrips ?? "-" },
    { key: "slip", header: "Slip", render: renderSlipAction },
  ];"""

content = content.replace(jcb_old, jcb_new)
content = content.replace(tipper_old, tipper_new)

# Add renderSlipAction function
import_lucide = 'import { Eye, Pencil, Trash2 } from "lucide-react";'
new_import = 'import { Eye, Pencil, Trash2, FileText } from "lucide-react";'
content = content.replace(import_lucide, new_import)

actions_fn = """  function renderActions(row) {"""
new_actions_fn = """  function renderSlipAction(row) {
    if (!row.receivingSlipUrl) return <span className="text-zinc-400">-</span>;
    return (
      <a
        href={row.receivingSlipUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded p-1.5 text-blue-500 hover:bg-blue-50 inline-block"
        title="View Slip"
      >
        <FileText className="h-4 w-4" />
      </a>
    );
  }

  function renderActions(row) {"""

content = content.replace(actions_fn, new_actions_fn)

with open(r"D:\BB Client Projects\rk-brothers\rk-brothers-frontend\src\modules\fleet\pages\DailyLogPage.jsx", "w", encoding="utf-8") as f:
    f.write(content)
