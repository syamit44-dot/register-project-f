import { useLanguage } from "../i18n.jsx";

export default function FarmCatalogNotice({ onRetry }) {
  const { t } = useLanguage();
  return (
    <div className="mb-4 flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink-soft">
      <p role="status">{t("equipmentCatalogError")}</p>
      <button type="button" onClick={onRetry} className="font-semibold text-brand underline">
        {t("equipmentCatalogRetry")}
      </button>
    </div>
  );
}
