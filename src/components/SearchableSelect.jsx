import { useEffect, useId, useState } from "react";
import Icon from "./Icon";
import { useLanguage } from "../i18n.jsx";

export default function SearchableSelect({ label, required, value, options, onChange, placeholder, disabled, valueLabel, compact = false, error, searchable = true }) {
  const { t } = useLanguage();
  const inputId = useId();
  const listId = `${inputId}-list`;
  const errorId = `${inputId}-error`;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(null);
  const [highlight, setHighlight] = useState(-1);
  const [hoveredOption, setHoveredOption] = useState(null);
  const selected = options.find((option) => option.value === value);
  const selectedLabel = selected?.label ?? valueLabel ?? "";
  const search = (query ?? "").trim().toLowerCase();
  const matches = options.filter(({ label, keywords }) => (
    label.toLowerCase().includes(search) || keywords?.toLowerCase().includes(search)
  ));
  const describedOption = hoveredOption ?? matches[highlight];

  useEffect(() => {
    if (open && highlight >= 0) {
      document.getElementById(`${listId}-${highlight}`)?.scrollIntoView({ block: "nearest" });
    }
  }, [open, highlight, listId]);

  function choose(option) {
    onChange(option);
    setHoveredOption(null);
    setOpen(false);
  }

  function handleKeyDown(event) {
    if (event.key === "Escape" && open) {
      event.preventDefault();
      event.stopPropagation();
      setHoveredOption(null);
      setOpen(false);
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setHoveredOption(null);
      if (!open) {
        setQuery(null);
        setOpen(true);
        setHighlight(event.key === "ArrowDown" ? 0 : options.length - 1);
      } else if (matches.length) {
        const next = event.key === "ArrowDown" ? highlight + 1 : highlight < 0 ? matches.length - 1 : highlight - 1;
        setHighlight((next + matches.length) % matches.length);
      }
    } else if (!searchable && !open && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      setOpen(true);
      setHighlight(options.findIndex((option) => option.value === value));
    } else if (open && (event.key === "Enter" || (!searchable && event.key === " "))) {
      event.preventDefault();
      const option = matches[highlight] ?? matches[0];
      if (option) choose(option);
    }
  }

  return (
    <div className="min-w-0">
      {label && (
        <label htmlFor={inputId} className={compact ? "mb-1 block text-[12px] font-semibold text-ink-soft" : "mb-1.5 block"}>
          <span className={compact ? undefined : "text-[13px] font-semibold text-ink"}>
            {label}{required && <span className="ml-0.5 text-alert">*</span>}
          </span>
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          type="text"
          role="combobox"
          aria-label={label || placeholder}
          aria-expanded={open}
          aria-autocomplete={searchable ? "list" : "none"}
          aria-controls={open ? listId : undefined}
          aria-activedescendant={open && matches[highlight] ? `${listId}-${highlight}` : undefined}
          aria-required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          autoComplete="off"
          disabled={disabled}
          readOnly={!searchable}
          value={open ? query ?? selectedLabel : selectedLabel}
          placeholder={placeholder}
          onFocus={(event) => {
            setQuery(null);
            setHighlight(-1);
            setOpen(true);
            if (searchable) event.currentTarget.select();
          }}
          onClick={(event) => {
            if (!open) {
              setQuery(null);
              setHighlight(-1);
              setOpen(true);
              if (searchable) event.currentTarget.select();
            }
          }}
          onBlur={() => {
            setHoveredOption(null);
            setOpen(false);
          }}
          onKeyDown={handleKeyDown}
          onChange={(event) => {
            setQuery(event.target.value);
            setHighlight(-1);
            setOpen(true);
          }}
          className={`w-full rounded-xl border bg-white py-2 pr-9 text-ink shadow-sm outline-none transition focus:ring-4 disabled:bg-mist disabled:text-ink-soft ${searchable ? "" : "cursor-pointer"} ${
            error ? "border-alert focus:ring-alert-tint" : "border-line-strong hover:border-brand/50 focus:border-brand focus:ring-brand-tint"
          } ${
            compact ? "h-10 pl-3 text-sm" : "h-11 pl-3.5 text-[13.5px]"
          }`}
        />
        <Icon name="chevron-down" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft" style={{ fontSize: 14 }} />
        {open && (
          <div className="absolute z-20 mt-1.5 w-full rounded-xl border border-line-strong bg-white shadow-lg">
            <ul id={listId} role="listbox" aria-label={label || placeholder} className="max-h-48 overflow-auto rounded-xl py-1">
              {matches.map((option, index) => (
                <li
                  key={option.value}
                  id={`${listId}-${index}`}
                  role="option"
                  aria-description={option.description}
                  aria-selected={option.value === value}
                  onPointerEnter={option.description ? () => setHoveredOption(option) : undefined}
                  onPointerLeave={option.description ? () => setHoveredOption(null) : undefined}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => choose(option)}
                  className={`flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-sm text-ink hover:bg-brand-tint ${index === highlight ? "bg-brand-tint" : ""}`}
                >
                  {option.label}
                  {option.description && (
                    <span aria-hidden="true" className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-line-strong bg-white text-xs font-bold text-brand-dark">!</span>
                  )}
                </li>
              ))}
              {matches.length === 0 && <li className="px-3 py-2 text-sm text-ink-soft">{t("dropdownNoResults")}</li>}
            </ul>
            {describedOption?.description && (
              <p aria-hidden="true" className="rounded-b-xl border-t border-line bg-brand-tint px-3 py-2 text-xs leading-5 text-ink">
                <span className="block font-semibold">{describedOption.label}</span>
                {describedOption.description}
              </p>
            )}
          </div>
        )}
      </div>
      {error && <p id={errorId} className="mt-1.5 text-[13px] font-medium text-alert">{error}</p>}
    </div>
  );
}
