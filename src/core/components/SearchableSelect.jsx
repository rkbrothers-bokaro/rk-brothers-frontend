import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, Search, X, Check } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function SearchableSelect({
  label,
  options = [],
  value,
  onChange,
  error,
  disabled = false,
  required = false,
  placeholder,
  searchPlaceholder,
  className = "",
  id,
}) {
  const { t } = useTranslation();
  const generatedId = useId();
  const selectId = id || generatedId;

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setSearchTerm("");
    }
  }, [isOpen]);

  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  const filteredOptions = options.filter((opt) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const matchLabel = opt.label?.toLowerCase().includes(term);
    const matchSub = opt.sublabel?.toLowerCase().includes(term);
    return matchLabel || matchSub;
  });

  function handleSelect(val) {
    if (onChange) {
      onChange({ target: { value: val } });
    }
    setIsOpen(false);
  }

  function handleClear(e) {
    e.stopPropagation();
    if (onChange) {
      onChange({ target: { value: "" } });
    }
  }

  return (
    <div className="flex flex-col gap-1" ref={containerRef}>
      {label && (
        <label id={`${selectId}-label`} className="text-sm font-medium text-zinc-700">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          id={selectId}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          disabled={disabled}
          onClick={() => !disabled && setIsOpen((prev) => !prev)}
          className={`flex w-full items-center justify-between rounded-md border bg-white px-3 py-2 text-left text-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400 ${
            error ? "border-red-500" : "border-zinc-300"
          } ${className}`}
        >
          <span className={`truncate ${selectedOption ? "text-zinc-900 font-medium" : "text-zinc-400"}`}>
            {selectedOption ? selectedOption.label : (placeholder || t("common.selectOption"))}
          </span>
          <div className="flex items-center gap-1.5 ml-2 text-zinc-400">
            {selectedOption && !disabled && (
              <span
                role="button"
                tabIndex={0}
                onClick={handleClear}
                className="rounded p-0.5 hover:bg-zinc-100 hover:text-zinc-600"
                title="Clear"
              >
                <X className="h-3.5 w-3.5" />
              </span>
            )}
            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
          </div>
        </button>

        {isOpen && (
          <div className="absolute left-0 top-full z-50 mt-1 max-h-72 w-full rounded-md border border-zinc-200 bg-white py-1 shadow-lg">
            <div className="sticky top-0 z-10 border-b border-zinc-100 bg-white px-2 py-1.5">
              <div className="relative flex items-center">
                <Search className="pointer-events-none absolute left-2.5 h-4 w-4 text-zinc-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={searchPlaceholder || t("fleet.dailyLog.form.searchVehicle") || "Type to search vehicle..."}
                  className="w-full rounded-md border border-zinc-200 py-1.5 pl-8 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setIsOpen(false);
                    if (e.key === "Enter" && filteredOptions.length > 0) {
                      e.preventDefault();
                      handleSelect(filteredOptions[0].value);
                    }
                  }}
                />
              </div>
            </div>

            <ul role="listbox" className="max-h-56 overflow-y-auto py-1">
              {filteredOptions.length === 0 ? (
                <li className="px-3 py-3 text-center text-sm text-zinc-500">
                  {t("common.noResults") || "No options found"}
                </li>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = String(opt.value) === String(value);
                  return (
                    <li
                      key={opt.value}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelect(opt.value)}
                      className={`flex cursor-pointer items-center justify-between px-3 py-2 text-sm transition hover:bg-blue-50 ${
                        isSelected ? "bg-blue-50/70 font-semibold text-blue-700" : "text-zinc-800"
                      }`}
                    >
                      <div className="flex flex-col">
                        <span>{opt.label}</span>
                        {opt.sublabel && (
                          <span className="text-xs text-zinc-400 font-normal">{opt.sublabel}</span>
                        )}
                      </div>
                      {isSelected && <Check className="h-4 w-4 text-blue-600 shrink-0" />}
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        )}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
