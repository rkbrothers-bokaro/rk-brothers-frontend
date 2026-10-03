import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Trash2, Eye } from "lucide-react";
import { useAuth } from "../../../core/hooks/useAuth";
import { useToast } from "../../../core/hooks/useToast";
import PageHeader from "../../../core/components/PageHeader";
import Select from "../../../core/components/Select";
import Table from "../../../core/components/Table";
import Badge from "../../../core/components/Badge";
import Button from "../../../core/components/Button";
import { vehiclesApi, unwrapList } from "../masters/api";
import { getDocumentsByVehicle, getExpiringDocuments, deleteDocument, getFileUrl } from "../api/documentsApi";
import UploadDocumentModal from "../components/UploadDocumentModal";
import { daysLeftOf, statusOf, DOCUMENT_STATUS_VARIANT, DOCUMENT_TYPE_KEY_MAP } from "../utils/documentStatus";

export default function DocumentsPage() {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const toast = useToast();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState(location.state?.initialTab === "expiring" ? "expiring" : "vehicle");

  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");

  const [documents, setDocuments] = useState([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);

  const [expiringDocs, setExpiringDocs] = useState([]);
  const [isLoadingExpiring, setIsLoadingExpiring] = useState(true);

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [resumeDoc, setResumeDoc] = useState(null);

  useEffect(() => {
    vehiclesApi
      .listAll()
      .then(({ data }) => setVehicles(unwrapList(data).items))
      .catch(() => setVehicles([]));
  }, []);

  const fetchDocuments = useCallback(async () => {
    setIsLoadingDocs(true);
    try {
      const { data } = await getDocumentsByVehicle(selectedVehicleId);
      setDocuments(unwrapList(data).items);
    } catch {
      setDocuments([]);
    } finally {
      setIsLoadingDocs(false);
    }
  }, [selectedVehicleId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const fetchExpiring = useCallback(async () => {
    setIsLoadingExpiring(true);
    try {
      const { data } = await getExpiringDocuments(30);
      const items = [...unwrapList(data).items].sort((a, b) => (daysLeftOf(a) ?? 0) - (daysLeftOf(b) ?? 0));
      setExpiringDocs(items);
    } catch {
      setExpiringDocs([]);
    } finally {
      setIsLoadingExpiring(false);
    }
  }, []);

  useEffect(() => {
    fetchExpiring();
  }, [fetchExpiring]);

  const vehicleOptions = useMemo(
    () => vehicles.map((v) => ({ value: v.id, label: v.displayName || v.vehicleNo })),
    [vehicles],
  );

  const statusLabels = useMemo(
    () => ({
      valid: t("fleet.documents.status.valid"),
      expiringSoon: t("fleet.documents.status.expiringSoon"),
      expired: t("fleet.documents.status.expired"),
      unknown: "—",
    }),
    [t],
  );

  function typeLabel(type) {
    const key = DOCUMENT_TYPE_KEY_MAP[type];
    return key ? t(key) : type || "—";
  }

  function openUploadModal() {
    setResumeDoc(null);
    setIsUploadModalOpen(true);
  }

  function openConfirmModal(doc) {
    setResumeDoc(doc);
    setIsUploadModalOpen(true);
  }

  function closeUploadModal() {
    setIsUploadModalOpen(false);
    setResumeDoc(null);
  }

  function handleModalSaved() {
    closeUploadModal();
    fetchDocuments();
    fetchExpiring();
  }

  async function handleDelete(doc) {
    if (!window.confirm(t("fleet.documents.deleteConfirm"))) return;
    try {
      await deleteDocument(doc.id);
      toast.success(t("common.deactivateSuccess"));
      fetchDocuments();
      fetchExpiring();
    } catch {
      // global error toast already shown by axios interceptor
    }
  }

  async function handleView(doc) {
    try {
      const { data } = await getFileUrl(doc.id);
      if (data && data.data) {
        window.open(data.data, "_blank");
      }
    } catch {
      toast.error(t("common.error"));
    }
  }

  const vehicleColumns = [
    {
      key: "vehicle",
      header: t("fleet.documents.columns.vehicle"),
      render: (row) => row.vehicleDisplayName || row.vehicleNo || "—",
    },
    { 
      key: "type", 
      header: t("fleet.documents.columns.type"), 
      render: (row) => (
        <div className="flex flex-col">
          <span>{typeLabel(row.documentType)}</span>
          {row.originalFileName && (
            <span className="text-xs text-zinc-500">{row.originalFileName}</span>
          )}
        </div>
      )
    },
    { key: "docNo", header: t("fleet.documents.columns.docNo"), render: (row) => row.documentNo || "—" },
    { key: "issued", header: t("fleet.documents.columns.issued"), render: (row) => row.issuedDate || "—" },
    { key: "expiry", header: t("fleet.documents.columns.expiry"), render: (row) => row.expiryDate || "—" },
    {
      key: "daysLeft",
      header: t("fleet.documents.columns.daysLeft"),
      render: (row) => daysLeftOf(row) ?? "—",
    },
    {
      key: "status",
      header: t("fleet.documents.columns.status"),
      render: (row) => {
        const status = statusOf(daysLeftOf(row));
        return <Badge variant={DOCUMENT_STATUS_VARIANT[status]}>{statusLabels[status]}</Badge>;
      },
    },
    {
      key: "actions",
      header: t("fleet.documents.columns.actions"),
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleView(row)}
            aria-label={t("common.view")}
            className="rounded p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-blue-600"
          >
            <Eye className="h-4 w-4" />
          </button>
          {row.confirmed === false && (
            <button
              type="button"
              onClick={() => openConfirmModal(row)}
              aria-label={t("fleet.documents.confirmAction")}
              className="rounded p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-blue-600"
            >
              <CheckCircle2 className="h-4 w-4" />
            </button>
          )}
          {isAdmin && (
            <button
              type="button"
              onClick={() => handleDelete(row)}
              aria-label={t("common.delete")}
              className="rounded p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  const expiringColumns = [
    {
      key: "vehicle",
      header: t("fleet.documents.columns.vehicle"),
      render: (row) => row.vehicleDisplayName || row.vehicleNo || "—",
    },
    { 
      key: "type", 
      header: t("fleet.documents.columns.type"), 
      render: (row) => (
        <div className="flex flex-col">
          <span>{typeLabel(row.documentType)}</span>
          {row.originalFileName && (
            <span className="text-xs text-zinc-500">{row.originalFileName}</span>
          )}
        </div>
      )
    },
    { key: "docNo", header: t("fleet.documents.columns.docNo"), render: (row) => row.documentNo || "—" },
    { key: "expiry", header: t("fleet.documents.columns.expiry"), render: (row) => row.expiryDate || "—" },
    {
      key: "daysLeft",
      header: t("fleet.documents.columns.daysLeft"),
      render: (row) => daysLeftOf(row) ?? "—",
    },
    {
      key: "status",
      header: t("fleet.documents.columns.status"),
      render: (row) => {
        const status = statusOf(daysLeftOf(row));
        return <Badge variant={DOCUMENT_STATUS_VARIANT[status]}>{statusLabels[status]}</Badge>;
      },
    },
    {
      key: "actions",
      header: t("fleet.documents.columns.actions"),
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleView(row)}
            aria-label={t("common.view")}
            className="rounded p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-blue-600"
          >
            <Eye className="h-4 w-4" />
          </button>
          {isAdmin && (
            <button
              type="button"
              onClick={() => handleDelete(row)}
              aria-label={t("common.delete")}
              className="rounded p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t("fleet.documents.title")}
        subtitle={t("fleet.documents.subtitle")}
        action={
          isAdmin ? (
            <Button onClick={openUploadModal}>{t("fleet.documents.uploadDocument")}</Button>
          ) : null
        }
      />

      <div className="mb-4 flex flex-wrap gap-2 border-b border-zinc-200">
        <button
          type="button"
          onClick={() => setActiveTab("vehicle")}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === "vehicle" ? "border-b-2 border-blue-600 text-blue-700" : "text-zinc-500 hover:text-zinc-700"
          }`}
        >
          {t("fleet.documents.vehicleTab")}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("expiring")}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === "expiring" ? "border-b-2 border-blue-600 text-blue-700" : "text-zinc-500 hover:text-zinc-700"
          }`}
        >
          {t("fleet.documents.allExpiring")}
        </button>
      </div>

      {activeTab === "vehicle" ? (
        <div>
          <div className="mb-4 max-w-sm">
            <Select
              label={t("fleet.documents.selectVehicle")}
              placeholder="All Vehicles"
              placeholderSelectable={true}
              options={vehicleOptions}
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
            />
          </div>

          <Table
            columns={vehicleColumns}
            data={documents}
            loading={isLoadingDocs}
            emptyMessage={t("fleet.documents.noDocuments")}
          />
        </div>
      ) : (
        <Table
          columns={expiringColumns}
          data={expiringDocs}
          loading={isLoadingExpiring}
          emptyMessage={t("fleet.documents.noExpiringDocuments")}
        />
      )}

      {isUploadModalOpen && (
        <UploadDocumentModal
          vehicles={vehicles}
          preselectedVehicleId={selectedVehicleId}
          resumeDocument={resumeDoc}
          onClose={closeUploadModal}
          onSaved={handleModalSaved}
        />
      )}
    </div>
  );
}
