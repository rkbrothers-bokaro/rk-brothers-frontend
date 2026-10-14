import axiosInstance from "../../../core/api/axiosInstance";

export function getBillingPeriods() {
  return axiosInstance.get("/fleet/billing/periods");
}

export function getBill(workOrderId, month, year, vehicleId, partyName, siteLocation) {
  return axiosInstance.get("/fleet/billing", {
    params: {
      workOrderId,
      month,
      year,
      vehicleId: vehicleId || undefined,
      partyName: partyName || undefined,
      siteLocation: siteLocation || undefined,
    },
  });
}

export function downloadBillPdf(workOrderId, month, year, vehicleId, partyName, siteLocation) {
  return axiosInstance.get("/fleet/billing/pdf", {
    params: {
      workOrderId,
      month,
      year,
      vehicleId: vehicleId || undefined,
      partyName: partyName || undefined,
      siteLocation: siteLocation || undefined,
    },
    responseType: "blob",
  });
}
