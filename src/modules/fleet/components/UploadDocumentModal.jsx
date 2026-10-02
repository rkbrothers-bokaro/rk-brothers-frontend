import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, Info } from "lucide-react";
import { useToast } from "../../../core/hooks/useToast";
import { unwrapEnvelope } from "../../../core/api/unwrapEnvelope";
import Modal from "../../../core/components/Modal";
import Input from "../../../core/components/Input";
import Select from "../../../core/components/Select";
import DatePicker from "../../../core/components/DatePicker";
import FileUpload from "../../../core/components/FileUpload";
import Badge from "../../../core/components/Badge";
import Button from "../../../core/components/Button";
import { uploadDocument, confirmDocument, deleteDocument } from "../api/documentsApi";
import { DOCUMENT_TYPE_KEY_MAP } from "../utils/documentStatus";

const CONFIDENCE_VARIANT = { high: "green", medium: "amber", low: "red" };

export default function UploadDocumentModal({ vehicles, preselectedVehicleId, resumeDocument, onClose, onSaved }) {
  const { t } = useTranslation();
  const toast = useToast();

  const [step, setStep] = useState(resumeDocument ? 2 : 1);
  const [vehicleId, setVehicleId] = useState(preselectedVehicleId || resumeDocument?.vehicleId || "");
  const [documentType, setDocumentType] = useState(resumeDocument?.documentType || "");
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const [uploadedDoc, setUploadedDoc] = useState(resumeDocument || null);
  const [reviewData, setReviewData] = useState({
    documentType: resumeDocument?.documentType || "",
    documentNo: resumeDocument?.documentNo || "",
    issuedDate: resumeDocument?.issuedDate || "",
    expiryDate: resumeDocument?.expiryDate || "",
  });

  const vehicleOptions = useMemo(
    () => vehicles.map((v) => ({ value: v.id, label: v.displayName || v.vehicleNo })),
    [vehicles],
  );

  const documentTypeOptions = useMemo(
    () => Object.entries(DOCUMENT_TYPE_KEY_MAP).map(([value, key]) => ({ value, label: t(key) })),
    [t],
  );

  const vehicleNoDisplay =
    uploadedDoc?.vehicleNo || vehicles.find((v) => v.id === (uploadedDoc?.vehicleId || vehicleId))?.displayName || "—";

  const hasNoAiData =
    !uploadedDoc?.documentNo && !uploadedDoc?.issuedDate && !uploadedDoc?.expiryDate && !uploadedDoc?.confidence;

  const needsReview =
    !hasNoAiData &&
    (uploadedDoc?.confidence === "low" || !uploadedDoc?.documentNo || !uploadedDoc?.issuedDate || !uploadedDoc?.expiryDate);

  async function handleUpload(e) {
    e.preventDefault();
    const nextErrors = {};
    if (!vehicleId) nextErrors.vehicleId = t("common.required");
    if (!documentType) nextErrors.documentType = t("common.required");
    if (!file) nextErrors.file = t("common.required");
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsUploading(true);
    try {
      const { data } = await uploadDocument(vehicleId, documentType, file);
      const doc = unwrapEnvelope(data);
      setUploadedDoc(doc);
      setReviewData({
        documentType: doc.documentType || documentType,
        documentNo: doc.documentNo || "",
        issuedDate: doc.issuedDate || "",
        expiryDate: doc.expiryDate || "",
      });
      setStep(2);
    } catch {
      // global error toast already shown by axios interceptor
    } finally {
      setIsUploading(false);
    }
  }

  async function handleConfirm(e) {
    e.preventDefault();
    if (!uploadedDoc) return;
    setIsConfirming(true);
    try {
      await confirmDocument(uploadedDoc.id, reviewData);
      toast.success(t("common.saveSuccess"));
      onSaved?.();
    } catch {
      // global error toast already shown by axios interceptor
    } finally {
      setIsConfirming(false);
    }
  }

  async function handleCancel() {
    if (!uploadedDoc) {
      onClose();
      return;
    }
    setIsCancelling(true);
    try {
      await deleteDocument(uploadedDoc.id);
      onSaved?.();
    } catch {
      // global error toast already shown by axios interceptor
    } finally {
      setIsCancelling(false);
    }
  }

  return (
    <Modal
      title={step === 1 ? t("fleet.documents.upload.step1Title") : t("fleet.documents.upload.step2Title")}
      onClose={step === 1 ? onClose : handleCancel}
      size="md"
    >
      {step === 1 ? (
        <form onSubmit={handleUpload} className="flex flex-col gap-4">
          <Select
            label={t("fleet.documents.upload.vehicle")}
            options={vehicleOptions}
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
            error={errors.vehicleId}
            disabled={isUploading}
          />
          <Select
            label={t("fleet.documents.upload.documentType")}
            options={documentTypeOptions}
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            error={errors.documentType}
            disabled={isUploading}
          />
          <FileUpload
            label={t("fleet.documents.upload.documentType")}
            accept="image/*,application/pdf"
            onChange={setFile}
            error={errors.file}
          />

          <div className="mt-2 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isUploading}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" loading={isUploading}>
              {isUploading ? t("fleet.documents.upload.uploading") : t("fleet.documents.upload.uploadButton")}
            </Button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleConfirm} className="flex flex-col gap-4">
          {hasNoAiData ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{t("fleet.documents.upload.noAi")}</span>
              </div>
              {uploadedDoc?.originalFileName && (
                <p className="text-xs font-medium text-blue-600">
                  File: {uploadedDoc.originalFileName}
                </p>
              )}
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-1">
                <p className="text-sm text-zinc-600">{t("fleet.documents.upload.aiParsed")}</p>
                {uploadedDoc?.originalFileName && (
                  <p className="text-xs font-medium text-blue-600">
                    File: {uploadedDoc.originalFileName}
                  </p>
                )}
              </div>
              {needsReview && (
                <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{t("fleet.documents.upload.reviewing")}</span>
                </div>
              )}
            </>
          )}

          <Select
            label={t("fleet.documents.upload.documentType")}
            options={documentTypeOptions}
            value={reviewData.documentType}
            onChange={(e) => setReviewData((f) => ({ ...f, documentType: e.target.value }))}
            disabled={isConfirming}
          />
          <Input
            label={t("fleet.documents.upload.docNo")}
            value={reviewData.documentNo}
            onChange={(e) => setReviewData((f) => ({ ...f, documentNo: e.target.value }))}
            disabled={isConfirming}
          />
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-zinc-700">{t("fleet.documents.upload.vehicleNo")}</span>
            <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
              {vehicleNoDisplay}
            </div>
          </div>
          <DatePicker
            label={t("fleet.documents.upload.issuedDate")}
            value={reviewData.issuedDate}
            onChange={(e) => setReviewData((f) => ({ ...f, issuedDate: e.target.value }))}
            disabled={isConfirming}
          />
          <div className="rounded-md border border-amber-300 bg-amber-50 p-3">
            <DatePicker
              label={t("fleet.documents.upload.expiryDate")}
              value={reviewData.expiryDate}
              onChange={(e) => setReviewData((f) => ({ ...f, expiryDate: e.target.value }))}
              disabled={isConfirming}
            />
          </div>

          {uploadedDoc?.confidence && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-zinc-700">{t("fleet.documents.upload.confidence")}:</span>
              <Badge variant={CONFIDENCE_VARIANT[uploadedDoc.confidence] || "zinc"}>
                {t(`fleet.documents.upload.confidence${uploadedDoc.confidence.charAt(0).toUpperCase()}${uploadedDoc.confidence.slice(1)}`)}
              </Badge>
            </div>
          )}

          <div className="mt-2 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={handleCancel} loading={isCancelling}>
              {t("fleet.documents.upload.cancel")}
            </Button>
            <Button type="submit" loading={isConfirming}>
              {t("fleet.documents.upload.confirm")}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
