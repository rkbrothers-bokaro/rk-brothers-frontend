import re

with open(r"D:\BB Client Projects\rk-brothers\rk-brothers-frontend\src\modules\fleet\components\JcbDailyLogForm.jsx", "r", encoding="utf-8") as f:
    content = f.read()

payload_old = """      const payload = {
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
        workDescription: formData.workDescription || null,
      };"""

payload_new = """      const payload = {
        date: formData.date,
        vehicleId: formData.vehicleId,
        workOrderId: formData.workOrderId,
        operatorId: formData.operatorId,
        openingHrs: formData.openingHrs === "" ? null : Number(formData.openingHrs),
        closingHrs: formData.closingHrs === "" ? null : Number(formData.closingHrs),
        shifts: formData.shifts.filter((row) => row.startTime || row.closeTime),
        dieselLtr: formData.dieselFilled === "" ? null : Number(formData.dieselFilled),
        dieselMtr: formData.dieselMeter === "" ? null : Number(formData.dieselMeter),
        runningLtr: formData.running === "" ? null : Number(formData.running),
        materialType: formData.materialType || null,
        materialQty: formData.quantity === "" ? null : Number(formData.quantity),
        materialUnit: formData.unit || null,
        workDescription: formData.workDescription || null,
      };"""

content = content.replace(payload_old, payload_new)

with open(r"D:\BB Client Projects\rk-brothers\rk-brothers-frontend\src\modules\fleet\components\JcbDailyLogForm.jsx", "w", encoding="utf-8") as f:
    f.write(content)
