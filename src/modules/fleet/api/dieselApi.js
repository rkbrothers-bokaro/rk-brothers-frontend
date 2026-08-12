import axiosInstance from "../../../core/api/axiosInstance";

export function createReceipt(data) {
  return axiosInstance.post("/fleet/diesel/receipts", data);
}

export function getReceipts(vehicleId, month, year) {
  return axiosInstance.get("/fleet/diesel/receipts", { params: { vehicleId, month, year } });
}

export function deleteReceipt(id) {
  return axiosInstance.delete(`/fleet/diesel/receipts/${id}`);
}

export function getDieselRegister(month, year, vehicleId) {
  return axiosInstance.get("/fleet/diesel/register", { params: { month, year, vehicleId } });
}

export function getFuelAnomalies() {
  return axiosInstance.get("/fleet/diesel/anomalies");
}
