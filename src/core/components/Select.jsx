import { forwardRef, useId } from "react";
import { ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";

const Select = forwardRef(function Select(
  { label, options = [], error, disabled = false, placeholder, placeholderSelectable = false, className = "", id, ...rest },
  ref,
) {
  const { t } = useTranslation();
  const generatedId = useId();
  const selectId = id || generatedId;

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-zinc-700">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          disabled={disabled}
          aria-invalid={!!error}
          className={`w-full appearance-none rounded-md border bg-white px-3 py-2 pr-8 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400 ${
            error ? "border-red-500" : "border-zinc-300"
          } ${className}`}
          {...rest}
        >
          <option value="" disabled={!placeholderSelectable}>
            {placeholder || t("common.selectOption")}
          </option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
});

export default Select;
