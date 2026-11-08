import { useNavigate } from "react-router-dom";
import Icon from "./Icon";
import { useLanguage } from "../i18n.jsx";

const NAV_ITEMS = [
  { key: "home", labelKey: "myFarms", to: "/home", icon: "barn" },
  { key: "account", labelKey: "myAccount", to: "/account", icon: "user" },
];

function SidebarContent({ active, onNavigate }) {
  const navigate = useNavigate();
  const { t } = useLanguage();

  function go(to) {
    navigate(to);
    onNavigate?.();
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="topbar-mark">R</div>
        <span className="font-['Space_Grotesk'] text-[16px] font-semibold text-ink">Register</span>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => go(item.to)}
            className={`flex w-full items-center gap-3 rounded-control px-3 py-2.5 text-left text-sm font-medium transition ${
              active === item.key
                ? "bg-brand-tint text-brand-dark"
                : "text-ink-soft hover:bg-mist hover:text-ink"
            }`}
          >
            <Icon name={item.icon} style={{ fontSize: 18 }} />
            {t(item.labelKey)}
          </button>
        ))}
      </nav>

      <div className="border-t border-line px-3 py-4">
        <button
          type="button"
          onClick={() => go("/")}
          className="flex w-full items-center gap-3 rounded-control px-3 py-2.5 text-left text-sm font-medium text-ink-soft transition hover:bg-alert-tint hover:text-alert"
        >
          <Icon name="logout" style={{ fontSize: 18 }} />
          {t("signOut")}
        </button>
      </div>
    </div>
  );
}

export default function Sidebar({ active, mobileOpen = false, onClose }) {
  const { t } = useLanguage();
  return (
    <>
      {/* Desktop persistent rail */}
      <aside className="hidden md:flex md:w-60 md:flex-shrink-0 md:flex-col md:border-r md:border-line md:bg-white">
        <SidebarContent active={active} />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[999] md:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={onClose} />
          <div className="relative flex h-full w-64 flex-col bg-white shadow-xl">
            <button
              type="button"
              onClick={onClose}
              className="icon-btn absolute right-3 top-3"
              aria-label={t("closeMenu")}
            >
              <Icon name="x" style={{ fontSize: 18 }} />
            </button>
            <SidebarContent active={active} onNavigate={onClose} />
          </div>
        </div>
      )}
    </>
  );
}