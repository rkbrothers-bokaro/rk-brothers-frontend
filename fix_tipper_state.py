import re

with open(r"D:\BB Client Projects\rk-brothers\rk-brothers-frontend\src\modules\fleet\components\TipperDailyLogForm.jsx", "r", encoding="utf-8") as f:
    content = f.read()

old_state = """    return {
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
    };"""

new_state = """    return {
      date: initialData.date || todayStr(),
      vehicleId: initialData.vehicleId || "",
      workOrderId: initialData.workOrderId || "",
      driverId: initialData.driverId || initialData.operatorId || "",
      meterRows:
        Array.isArray(initialData.hrEntries) && initialData.hrEntries.length > 0
          ? initialData.hrEntries.map((r) => ({ openingHrs: r.openingHrs ?? "", closingHrs: r.closingHrs ?? "" }))
          : [{ openingHrs: "", closingHrs: "" }],
      openingKm: initialData.openingKm ?? "",
      closingKm: initialData.closingKm ?? "",
      dieselLtr: initialData.dieselLtr ?? "",
      dieselHrs: initialData.dieselHrs ?? "",
      dieselKm: initialData.dieselKm ?? "",
      runKm: initialData.runKm ?? "",
      trips:
        Array.isArray(initialData.tripEntries) && initialData.tripEntries.length > 0
          ? initialData.tripEntries.map((r) => ({
              fromLocation: r.fromLocation || "",
              toLocation: r.toLocation || "",
              tripCount: r.tripCount ?? r.trips ?? "",
            }))
          : [{ fromLocation: "", toLocation: "", tripCount: "" }],
      workDescription: initialData.workDescription || "",
      receivingSlipUrl: initialData.receivingSlipUrl || "",
      receivingSlip: null,
    };"""

content = content.replace(old_state, new_state)

with open(r"D:\BB Client Projects\rk-brothers\rk-brothers-frontend\src\modules\fleet\components\TipperDailyLogForm.jsx", "w", encoding="utf-8") as f:
    f.write(content)
