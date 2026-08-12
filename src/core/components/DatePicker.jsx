import { forwardRef, useId } from "react";
import { useTranslation } from "react-i18next";

const DatePicker = forwardRef(function DatePicker(
  { label, error, disabled = false, className = "", id, value, ...rest },
  ref,
) {
  const { i18n } = useTranslation();
  const generatedId = useId();
  const inputId = id || generatedId;

  const formattedValue = value
    ? new Date(value).toLocaleDateString(i18n.language === "hi" ? "hi-IN" : "en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-zinc-700">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        type="date"
        value={value}
        disabled={disabled}
        aria-invalid={!!error}
        className={`w-full rounded-md border px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400 ${
          error ? "border-red-500" : "border-zinc-300"
        } ${className}`}
        {...rest}
      />
      {formattedValue && <p className="text-xs text-zinc-500">{formattedValue}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
});

export default DatePicker;
