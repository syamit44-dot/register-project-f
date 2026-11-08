import { useEffect, useId, useState } from "react";
import Icon from "./Icon";
import { useLanguage } from "../i18n.jsx";

export default function SearchableSelect({ label, required, value, options, onChange, placeholder, disabled, valueLabel }) {
  const { t } = useLanguage();
  const inputId = useId();
  const listId = `${inputId}-list`;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(null);
  const [highlight, setHighlight] = useState(-1);
  const selected = options.find((option) => option.value === value);
  const selectedLabel = selected?.label ?? valueLabel ?? "";
  const search = (query ?? "").trim().toLowerCase();
  const matches = options.filter(({ label, keywords }) => (
    label.toLowerCase().includes(search) || keywords?.toLowerCase().includes(search)
  ));

  useEffect(() => {
    if (open && highlight >= 0) {
      document.getElementById(`${listId}-${highlight}`)?.scrollIntoView({ block: "nearest" });
    }
  }, [open, highlight, listId]);

  function choose(option) {
    onChange(option);
    setOpen(false);
  }

  function handleKeyDown(event) {
    if (event.key === "Escape" && open) {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        setQuery(null);
        setOpen(true);
        setHighlight(event.key === "ArrowDown" ? 0 : options.length - 1);
      } else if (matches.length) {
        const next = event.key === "ArrowDown" ? highlight + 1 : highlight < 0 ? matches.length - 1 : highlight - 1;
        setHighlight((next + matches.length) % matches.length);
      }
    } else if (event.key === "Enter" && open) {
      event.preventDefault();
      const option = matches[highlight] ?? matches[0];
      if (option) choose(option);
    }
  }

  return (
    <div className="min-w-0">
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-[13px] font-semibold text-ink">
          {label}{required && <span className="ml-0.5 text-alert">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          type="text"
          role="combobox"
          aria-label={label || placeholder}
          aria-expanded={open}
          aria-autocomplete="list"
          aria-controls={open ? listId : undefined}
          aria-activedescendant={open && matches[highlight] ? `${listId}-${highlight}` : undefined}
          aria-required={required}
          autoComplete="off"
          disabled={disabled}
          value={open ? query ?? selectedLabel : selectedLabel}
          placeholder={placeholder}
          onFocus={(event) => {
            setQuery(null);
            setHighlight(-1);
            setOpen(true);
            event.currentTarget.select();
          }}
          onClick={(event) => {
            if (!open) {
              setQuery(null);
              setHighlight(-1);
              setOpen(true);
              event.currentTarget.select();
            }
          }}
          onBlur={() => setOpen(false)}
          onKeyDown={handleKeyDown}
          onChange={(event) => {
            setQuery(event.target.value);
            setHighlight(-1);
            setOpen(true);
          }}
          className="h-11 w-full rounded-xl border border-line-strong bg-white py-2 pl-3.5 pr-9 text-[13.5px] text-ink shadow-sm outline-none transition hover:border-brand/50 focus:border-brand focus:ring-4 focus:ring-brand-tint disabled:bg-mist disabled:text-ink-soft"
        />
        <Icon name="chevron-down" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft" style={{ fontSize: 14 }} />
        {open && (
          <ul id={listId} role="listbox" aria-label={label || placeholder} className="absolute z-20 mt-1.5 max-h-48 w-full overflow-auto rounded-xl border border-line-strong bg-white py-1 shadow-lg">
            {matches.map((option, index) => (
              <li
                key={option.value}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={option.value === value}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(option)}
                className={`cursor-pointer px-3 py-2 text-sm text-ink hover:bg-brand-tint ${index === highlight ? "bg-brand-tint" : ""}`}
              >
                {option.label}
              </li>
            ))}
            {matches.length === 0 && <li className="px-3 py-2 text-sm text-ink-soft">{t("dropdownNoResults")}</li>}
          </ul>
        )}
      </div>
    </div>
  );
}
