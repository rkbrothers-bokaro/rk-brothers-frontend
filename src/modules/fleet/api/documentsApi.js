import axiosInstance from "../../../core/api/axiosInstance";

export function uploadDocument(vehicleId, documentType, file) {
  const formData = new FormData();
  formData.append("vehicleId", vehicleId);
  formData.append("documentType", documentType);
  formData.append("file", file);
  return axiosInstance.post("/fleet/documents/upload", formData);
}

export function confirmDocument(id, data) {
  return axiosInstance.put(`/fleet/documents/${id}/confirm`, data);
}

export function getDocumentsByVehicle(vehicleId) {
  return axiosInstance.get("/fleet/documents", { params: vehicleId ? { vehicleId } : {} });
}

export function getExpiringDocuments(days) {
  return axiosInstance.get("/fleet/documents/expiring", { params: { days } });
}

export function deleteDocument(id) {
  return axiosInstance.delete(`/fleet/documents/${id}`);
}

export function getFileUrl(id) {
  return axiosInstance.get(`/fleet/documents/${id}/file`);
}
