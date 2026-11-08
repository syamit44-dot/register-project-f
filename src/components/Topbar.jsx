import Icon from "./Icon";
import { useLanguage } from "../i18n.jsx";

export default function Topbar({ tag, tagClass = "rounded-full bg-brand-dark px-2.5 py-1 text-[11px] tracking-[0.04em] text-white", onMenuClick }) {
  const { t } = useLanguage();
  return (
    <div className="flex items-center gap-3 border-b border-line-strong bg-white px-5 py-5 sm:px-10">
      {onMenuClick && (
        <button
          type="button"
          onClick={onMenuClick}
          className="icon-btn -ml-1.5 md:hidden"
          aria-label={t("openMenu")}
        >
          <Icon name="menu" style={{ fontSize: 20 }} />
        </button>
      )}
      <div className="font-['Space_Grotesk'] text-[19px] font-semibold tracking-[0.2px]">Register</div>
      <div className="ml-auto flex items-center gap-2 text-[13px] text-ink-soft">
        <span className={tagClass}>{tag}</span>
      </div>
    </div>
  );
}