import axiosInstance from "../../../core/api/axiosInstance";

export function getUsers() {
  return axiosInstance.get("/admin/users");
}

export function createUser(data) {
  return axiosInstance.post("/admin/users", data);
}

export function updateUser(id, data) {
  return axiosInstance.put(`/admin/users/${id}`, data);
}

export function resetPassword(id, password) {
  return axiosInstance.put(`/admin/users/${id}/reset-password`, { password });
}
