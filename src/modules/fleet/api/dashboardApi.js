import axiosInstance from "../../../core/api/axiosInstance";

export function getDashboardSummary() {
  return axiosInstance.get("/fleet/dashboard/summary");
}
