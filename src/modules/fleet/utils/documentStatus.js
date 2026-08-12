export function daysLeftOf(row) {
  if (row.daysLeft !== undefined && row.daysLeft !== null) return row.daysLeft;
  if (!row.expiryDate) return null;
  return Math.ceil((new Date(row.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
}

export function statusOf(days) {
  if (days === null || days === undefined) return "unknown";
  if (days <= 0) return "expired";
  if (days <= 30) return "expiringSoon";
  return "valid";
}

export const DOCUMENT_STATUS_VARIANT = { valid: "green", expiringSoon: "amber", expired: "red", unknown: "zinc" };

export const DOCUMENT_TYPE_KEY_MAP = {
  insurance: "fleet.documents.types.insurance",
  gate_pass: "fleet.documents.types.gatePass",
  puc_pollution: "fleet.documents.types.pucPollution",
  fitness: "fleet.documents.types.fitness",
  tax: "fleet.documents.types.tax",
  state_permit: "fleet.documents.types.statePermit",
  other: "fleet.documents.types.other",
};
