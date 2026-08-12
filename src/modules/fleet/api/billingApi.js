import axiosInstance from "../../../core/api/axiosInstance";

export function getBillingPeriods() {
  return axiosInstance.get("/fleet/billing/periods");
}

export function getBill(workOrderId, month, year) {
  return axiosInstance.get("/fleet/billing", { params: { workOrderId, month, year } });
}

export function downloadBillPdf(workOrderId, month, year) {
  return axiosInstance.get("/fleet/billing/pdf", {
    params: { workOrderId, month, year },
    responseType: "blob",
  });
}
