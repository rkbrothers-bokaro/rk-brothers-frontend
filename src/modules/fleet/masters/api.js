import axiosInstance from "../../../core/api/axiosInstance";

function buildListParams({ search, page, pageSize }) {
  return {
    search: search || undefined,
    page,
    pageSize,
  };
}

// Backend wraps every payload as { success, data }, and paginated endpoints
// return a Spring Data Page ({ content, totalElements, ... }) as that data.
// This unwraps the envelope (falling back to an unwrapped body) and
// normalizes both that shape and a plain { items, total } shape.
export function unwrapList(responseBody) {
  const body = responseBody && responseBody.data !== undefined ? responseBody.data : responseBody;

  if (Array.isArray(body)) {
    return { items: body, total: body.length };
  }

  const items = body?.items ?? body?.content ?? body?.data ?? [];
  const normalizedItems = Array.isArray(items) ? items : [];
  return { items: normalizedItems, total: body?.total ?? body?.totalElements ?? normalizedItems.length };
}

export const vehiclesApi = {
  list: (params) => axiosInstance.get("/masters/vehicles", { params: buildListParams(params) }),
  listAll: () => axiosInstance.get("/masters/vehicles", { params: { pageSize: 1000 } }),
  create: (payload) => axiosInstance.post("/masters/vehicles", payload),
  update: (id, payload) => axiosInstance.put(`/masters/vehicles/${id}`, payload),
  deactivate: (id) => axiosInstance.patch(`/masters/vehicles/${id}/deactivate`),
};

export const operatorsApi = {
  list: (params) => axiosInstance.get("/masters/operators", { params: buildListParams(params) }),
  listAll: () => axiosInstance.get("/masters/operators", { params: { pageSize: 1000 } }),
  create: (payload) => axiosInstance.post("/masters/operators", payload),
  update: (id, payload) => axiosInstance.put(`/masters/operators/${id}`, payload),
  deactivate: (id) => axiosInstance.patch(`/masters/operators/${id}/deactivate`),
};

export const partiesApi = {
  list: (params) => axiosInstance.get("/masters/parties", { params: buildListParams(params) }),
  listAll: () => axiosInstance.get("/masters/parties", { params: { pageSize: 1000 } }),
  create: (payload) => axiosInstance.post("/masters/parties", payload),
  update: (id, payload) => axiosInstance.put(`/masters/parties/${id}`, payload),
  deactivate: (id) => axiosInstance.patch(`/masters/parties/${id}/deactivate`),
};

export const workOrdersApi = {
  list: (params) => axiosInstance.get("/masters/work-orders", { params: buildListParams(params) }),
  listAll: () => axiosInstance.get("/masters/work-orders", { params: { pageSize: 1000 } }),
  create: (payload) => axiosInstance.post("/masters/work-orders", payload),
  update: (id, payload) => axiosInstance.put(`/masters/work-orders/${id}`, payload),
  deactivate: (id) => axiosInstance.patch(`/masters/work-orders/${id}/deactivate`),
};
