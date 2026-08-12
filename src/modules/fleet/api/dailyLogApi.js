import axiosInstance from "../../../core/api/axiosInstance";

function buildFormData(payload) {
  const formData = new FormData();
  Object.entries(payload || {}).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") return;
    if (value instanceof File) {
      formData.append(key, value);
    } else if (typeof value === "object") {
      formData.append(key, JSON.stringify(value));
    } else {
      formData.append(key, value);
    }
  });
  return formData;
}

export function getJcbOpeningHrs(vehicleId, date) {
  return axiosInstance.get("/fleet/jcb-log/opening-hrs", { params: { vehicleId, date } });
}

export function createJcbLog(data) {
  return axiosInstance.post("/fleet/jcb-log", buildFormData(data));
}

export function getJcbLogs(filters) {
  return axiosInstance.get("/fleet/jcb-log", { params: filters });
}

export function updateJcbLog(id, data) {
  return axiosInstance.put(`/fleet/jcb-log/${id}`, buildFormData(data));
}

export function deleteJcbLog(id) {
  return axiosInstance.delete(`/fleet/jcb-log/${id}`);
}

export function getTipperOpeningHrs(vehicleId, date) {
  return axiosInstance.get("/fleet/tipper-log/opening-hrs", { params: { vehicleId, date } });
}

export function createTipperLog(data) {
  return axiosInstance.post("/fleet/tipper-log", buildFormData(data));
}

export function getTipperLogs(filters) {
  return axiosInstance.get("/fleet/tipper-log", { params: filters });
}

export function updateTipperLog(id, data) {
  return axiosInstance.put(`/fleet/tipper-log/${id}`, buildFormData(data));
}

export function deleteTipperLog(id) {
  return axiosInstance.delete(`/fleet/tipper-log/${id}`);
}
