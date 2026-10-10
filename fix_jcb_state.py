import re

with open(r"D:\BB Client Projects\rk-brothers\rk-brothers-frontend\src\modules\fleet\components\JcbDailyLogForm.jsx", "r", encoding="utf-8") as f:
    content = f.read()

old_state = """    return {
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
    };"""

new_state = """    return {
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
      dieselFilled: initialData.dieselLtr ?? "",
      dieselMeter: initialData.dieselMtr ?? "",
      running: initialData.runningLtr ?? "",
      materialType: initialData.materialType || "",
      quantity: initialData.materialQty ?? "",
      unit: initialData.materialUnit || "",
      workDescription: initialData.workDescription || "",
      receivingSlipUrl: initialData.receivingSlipUrl || "",
      receivingSlip: null,
    };"""

content = content.replace(old_state, new_state)

with open(r"D:\BB Client Projects\rk-brothers\rk-brothers-frontend\src\modules\fleet\components\JcbDailyLogForm.jsx", "w", encoding="utf-8") as f:
    f.write(content)
