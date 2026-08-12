import { useId, useRef, useState } from "react";
import { UploadCloud, FileText, X } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function FileUpload({
  label,
  error,
  onChange,
  accept = "image/*,application/pdf",
  className = "",
}) {
  const { t } = useTranslation();
  const inputId = useId();
  const inputRef = useRef(null);
  const [fileName, setFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  function handleFiles(fileList) {
    const file = fileList?.[0];
    if (!file) return;
    setFileName(file.name);
    onChange?.(file);
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  function handleRemove(e) {
    e.stopPropagation();
    setFileName("");
    onChange?.(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-zinc-700">
          {label}
        </label>
      )}
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed px-4 py-6 text-center transition-colors ${
          isDragging ? "border-blue-500 bg-blue-50" : "border-zinc-300 bg-zinc-50 hover:bg-zinc-100"
        } ${error ? "border-red-500" : ""} ${className}`}
      >
        {fileName ? (
          <div className="flex items-center gap-2 text-sm text-zinc-700">
            <FileText className="h-5 w-5 text-zinc-500" />
            <span className="max-w-[220px] truncate">{fileName}</span>
            <button
              type="button"
              onClick={handleRemove}
              className="rounded p-0.5 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-600"
              aria-label={t("common.removeFile")}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <>
            <UploadCloud className="h-6 w-6 text-zinc-400" />
            <p className="text-sm text-zinc-500">{t("common.dragDropFile")}</p>
          </>
        )}
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
