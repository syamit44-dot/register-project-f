import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "./Icon";
import { useLanguage } from "../i18n.jsx";
import siamLogo from "../assets/images/siam-water-flame-logo.png";
import engFlag from "../assets/icon/ENG.png";
import thaFlag from "../assets/icon/THA.png";
import chaFlag from "../assets/icon/CHA.png";

// เมนูฝั่งซ้าย — ค่าเริ่มต้นมีแค่ Home
// เมนูเสริม (เช่น Register บนหน้า CustomerForm, Detail บนหน้า FarmDetail) ไม่ได้อยู่ในลิสต์นี้ตรงๆ
// เพราะขึ้นเฉพาะบางหน้า — แต่ละหน้าส่งเข้ามาเองผ่าน prop `extraNavItem` ของ SidebarNav แทน
export const NAV_ITEMS = [{ key: "home", label: "Home", icon: "home", to: "/home" }];

// ชุดตัวเลือกภาษาเดียวกับหน้า Landing เป๊ะๆ (รูปธง + โค้ด 3 ตัวอักษร)
const LANG_OPTIONS = [
  { code: "ENG", lang: "en", image: engFlag },
  { code: "THA", lang: "th", image: thaFlag },
  { code: "CHN", lang: "zh", image: chaFlag },
];

/* กล่องสไตล์รวมกลาง (keyframes + utility classes) ใช้ร่วมกันทุกหน้าที่ import AppShell
   เพื่อไม่ให้ animation ของแต่ละหน้าหลุดสไตล์กัน */
export function AppShellStyles() {
  return (
    <style>{`
      @keyframes appPageEnter {
        from { opacity: 0; transform: translate3d(0, 14px, 0); }
        to { opacity: 1; transform: translate3d(0, 0, 0); }
      }
      @keyframes appContentEnter {
        from { opacity: 0; transform: translate3d(0, 12px, 0); }
        to { opacity: 1; transform: translate3d(0, 0, 0); }
      }
      @keyframes appCardEnter {
        from { opacity: 0; transform: translateY(14px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .app-hero-enter { animation: appPageEnter 520ms cubic-bezier(0.22, 1, 0.36, 1) both; }
      .app-stats-enter { animation: appContentEnter 460ms cubic-bezier(0.22, 1, 0.36, 1) 120ms both; }
      .app-list-enter { animation: appContentEnter 460ms cubic-bezier(0.22, 1, 0.36, 1) 200ms both; }
      .app-card-enter { animation: appCardEnter 480ms cubic-bezier(0.22, 1, 0.36, 1) both; }
      .app-nav-item { transition: background 220ms ease, color 220ms ease, transform 220ms cubic-bezier(0.22,1,0.36,1); }
      .app-nav-item:hover { transform: translateX(2px); }
      .app-soft-card {
        transition: transform 240ms cubic-bezier(0.22,1,0.36,1), box-shadow 240ms ease, border-color 240ms ease;
      }
      .sidebar-collapse-transition {
        --sidebar-background: #042C53;
        background-color: var(--sidebar-background);
        transition: width 280ms cubic-bezier(0.16, 1, 0.3, 1);
      }
      .toggle-collapse-btn::before {
        content: "";
        position: absolute;
        inset: 0 0 0 auto;
        width: 11px;
        background: linear-gradient(90deg, var(--sidebar-background), #12416D);
        clip-path: path("M0 0 C0 13 11 12 11 27 V93 C11 108 0 107 0 120 Z");
        pointer-events: none;
      }
    `}</style>
  );
}

function SidebarContent({ active, onNavigate, onSignOutClick, extra, collapsed, extraNavItem }) {
  const navigate = useNavigate();
  // เติมเมนูเสริมต่อจาก Home เฉพาะตอนที่หน้านั้นส่ง extraNavItem เข้ามา (เช่น Register, Detail)
  const navItems = extraNavItem ? [...NAV_ITEMS, extraNavItem] : NAV_ITEMS;

  function go(item) {
    // ถ้ากดเมนูที่ active อยู่แล้วซ้ำ ไม่ต้อง navigate ใหม่ — กันไม่ให้หน้าที่พึ่ง state ตอน navigate มา (เช่น FarmDetail) โดน reset state
    if (item.key !== active) navigate(item.to);
    onNavigate?.();
  }

  return (
    <div className="flex h-full flex-col">
      <div className={collapsed ? "pb-2 pt-6" : "px-5 pb-5 pt-6"}>
        {!collapsed && (
          <div className="rounded-2xl bg-white p-3">
            <img src={siamLogo} alt="Siam Water Flame" className="h-auto w-full object-contain" />
          </div>
        )}
      </div>

      <nav className="mt-1 space-y-1.5 px-3">
        {navItems.map((item) => {
          const isActive = item.key === active;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => go(item)}
              title={collapsed ? item.label : undefined}
              className={`app-nav-item relative flex w-full items-center overflow-hidden rounded-xl py-2.5 text-left text-[14px] font-medium ${
                collapsed ? "justify-center px-0" : "gap-3 px-3"
              } ${isActive ? "bg-[#0C4A82] text-white shadow-[0_6px_16px_rgba(0,0,0,0.18)]" : "text-white/70 hover:bg-white/5 hover:text-white"}`}
            >
              {isActive && !collapsed && <span className="absolute inset-y-2 left-0 w-[3px] rounded-r-full bg-[#7DD3AA]" />}
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition duration-200 ${
                  isActive ? "bg-[#185FA5] text-white" : "bg-white/10 text-white/70"
                }`}
              >
                <Icon name={item.icon} style={{ fontSize: 16 }} />
              </span>
              {!collapsed && <span className={isActive ? "font-semibold" : ""}>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* พื้นที่เสริม — เนื้อหาเฉพาะหน้า (เช่น ค้นหา/กรอง ของหน้า My Farms) ต่อท้ายเมนูหลัก ซ่อนตอนพับ */}
      {extra && !collapsed && <div className="mt-6 flex-1 overflow-y-auto px-4 pb-4">{extra}</div>}
      {(!extra || collapsed) && <div className="flex-1" />}

      <div className={`flex flex-col gap-1.5 ${collapsed ? "px-2 pb-6" : "px-3 pb-6"}`}>
        <LanguageSwitcher dark collapsed={collapsed} />
        <button
          type="button"
          onClick={() => {
            navigate("/account");
            onNavigate?.();
          }}
          title={collapsed ? "Account" : undefined}
          className={`flex w-full items-center rounded-xl py-2.5 text-left text-[14px] font-medium transition duration-200 ${
            collapsed ? "justify-center px-0" : "gap-3 px-3"
          } ${active === "account" ? "bg-[#0C4A82] text-white" : "text-white/70 hover:bg-white/5 hover:text-white"}`}
        >
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition duration-200 ${
              active === "account" ? "bg-[#185FA5] text-white" : "bg-white/10"
            }`}
          >
            <Icon name="user" style={{ fontSize: 16 }} />
          </span>
          {!collapsed && <span className={active === "account" ? "font-semibold" : ""}>Account</span>}
        </button>
        <button
          type="button"
          onClick={onSignOutClick}
          title={collapsed ? "Sign Out" : undefined}
          className={`flex w-full items-center rounded-xl py-2.5 text-left text-[14px] font-medium text-[#F2A79B] transition duration-200 hover:bg-white/5 ${
            collapsed ? "justify-center px-0" : "gap-3 px-3"
          }`}
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
            <Icon name="logout" style={{ fontSize: 16 }} />
          </span>
          {!collapsed && "Sign Out"}
        </button>
      </div>
    </div>
  );
}

const SIDEBAR_COLLAPSE_KEY = "sidebar_collapsed";

export function SidebarNav({ active = "home", mobileOpen, onClose, onSignOutClick, extra, width = "w-64", extraNavItem }) {
  // สถานะพับ/ขยายเก็บใน localStorage ให้จำไว้ข้ามหน้า/ข้ามการเปิดเว็บใหม่ — ใช้เฉพาะฝั่งเดสก์ท็อป
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSE_KEY) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSE_KEY, collapsed ? "1" : "0");
    } catch {
      // ignore (e.g. private browsing)
    }
  }, [collapsed]);

  return (
    <>
      {/* Desktop persistent sidebar */}
      <aside
        className={`sidebar-collapse-transition relative hidden shrink-0 overflow-visible md:flex md:flex-col ${
          collapsed ? "w-20" : width
        }`}
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-[#185FA5]/20 blur-3xl" />
        </div>
        <SidebarContent active={active} onSignOutClick={onSignOutClick} extra={extra} collapsed={collapsed} extraNavItem={extraNavItem} />

        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand menu" : "Collapse menu"}
          title={collapsed ? "Expand menu" : "Collapse menu"}
          className="toggle-collapse-btn absolute -right-2.5 top-1/2 z-20 flex h-[120px] w-7 -translate-y-1/2 items-center justify-end rounded-r-lg text-white/80 transition-colors hover:text-white focus-visible:text-white focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-white"
        >
          <Icon
            name="chevron-down"
            className={`relative -mr-px ${collapsed ? "-rotate-90" : "rotate-90"}`}
            style={{ fontSize: 12, strokeWidth: 2.5 }}
          />
        </button>
      </aside>

      {/* Mobile drawer — เปิดเต็มเสมอ ไม่มีโหมดพับ */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
          <div className={`relative flex h-full ${width} flex-col overflow-hidden bg-[#042C53] shadow-xl`}>
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/5 blur-3xl" />
            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white"
              aria-label="Close menu"
            >
              <Icon name="x" style={{ fontSize: 16 }} />
            </button>
            <SidebarContent active={active} onNavigate={onClose} onSignOutClick={onSignOutClick} extra={extra} collapsed={false} extraNavItem={extraNavItem} />
          </div>
        </div>
      )}
    </>
  );
}

export function LanguageSwitcher({ dark = false, collapsed = false }) {
  const { lang, setLang } = useLanguage();
  const [open, setOpen] = useState(false);
  // อ้างอิงจาก lang (source of truth จาก context/localStorage) โดยตรง แทนการเก็บ state ภาษาซ้ำซ้อน
  // เดิมมี useState แยกต่างหากที่ initialize ผิดพลาด (ไม่รองรับค่า "zh" ตอนโหลดจาก localStorage)
  // ทำให้ธงที่แสดงไม่ตรงกับภาษาที่ใช้งานจริงได้ในบางกรณี
  const current = LANG_OPTIONS.find((o) => o.lang === lang) ?? LANG_OPTIONS[1];

  if (dark) {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="listbox"
          aria-expanded={open}
          title={collapsed ? current.code : undefined}
          className={`flex w-full items-center rounded-xl py-2.5 text-left text-[14px] font-medium text-white/70 transition duration-200 hover:bg-white/5 hover:text-white ${
            collapsed ? "justify-center px-0" : "justify-between gap-3 px-3"
          }`}
        >
          <span className={`flex items-center ${collapsed ? "" : "gap-3"}`}>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
              <img src={current.image} alt={current.code} className="h-4 w-4 rounded-full object-cover" />
            </span>
            {!collapsed && <span>{current.code}</span>}
          </span>
          {!collapsed && <span className={`text-[10px] transition-transform duration-200 ${open ? "rotate-180" : ""}`}>▾</span>}
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div
              className={`absolute z-20 overflow-hidden rounded-xl border border-white/10 bg-[#0A3A69] p-1.5 shadow-[0_16px_32px_rgba(0,0,0,0.35)] ${
                collapsed ? "left-full top-0 ml-2 w-44" : "left-0 top-full mt-1 w-full"
              }`}
            >
              {LANG_OPTIONS.map((o) => (
                <button
                  key={o.code}
                  type="button"
                  onClick={() => {
                    setLang(o.lang);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold transition-all duration-150 ${
                    lang === o.lang ? "bg-[#185FA5] text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <img src={o.image} alt={o.code} className="h-5 w-5 rounded-full object-cover" />
                  <span className="flex-1">{o.code}</span>
                  {lang === o.lang && <span className="text-sm">✓</span>}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`language-trigger flex min-h-[44px] min-w-[132px] items-center justify-between gap-3 border bg-white px-4 py-2 text-[14px] font-semibold text-slate-700 shadow-[0_10px_26px_rgba(15,23,42,0.14)] transition-all duration-200 ${
          open ? "rounded-t-xl rounded-b-none border-slate-300 shadow-none" : "rounded-xl border-slate-300 hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-[0_14px_32px_rgba(15,23,42,0.18)]"
        }`}
      >
        <span className="flex items-center gap-2">
          <img src={current.image} alt={current.code} className="h-6 w-6 rounded-full object-cover" />
          <span>{current.code}</span>
        </span>
        <span className={`text-[11px] transition-transform duration-200 ${open ? "rotate-180" : ""}`}>▾</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="language-menu absolute right-0 top-full z-20 w-full overflow-hidden rounded-b-xl border border-t-0 border-slate-300 bg-white p-1.5 shadow-[0_14px_30px_rgba(15,23,42,0.14)]">
            {LANG_OPTIONS.map((o) => (
              <button
                key={o.code}
                type="button"
                onClick={() => {
                  setLang(o.lang);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-semibold transition-all duration-150 ${
                  lang === o.lang ? "bg-blue-700 text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <img src={o.image} alt={o.code} className="h-5 w-5 rounded-full object-cover" />
                <span className="flex-1">{o.code}</span>
                {lang === o.lang && <span className="text-sm">✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function SignOutModal({ open, onCancel, onConfirm }) {
  const { t } = useLanguage();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="w-full max-w-[360px] rounded-2xl bg-white p-6 shadow-xl">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <Icon name="logout" style={{ fontSize: 22 }} />
        </div>
        <h3 className="text-center text-[16px] font-semibold text-slate-900">{t("confirmSignOut")}</h3>
        <p className="mt-1.5 text-center text-[13.5px] text-slate-500">{t("confirmSignOutMessage")}</p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-slate-200 py-2.5 text-[13.5px] font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-red-600 py-2.5 text-[13.5px] font-semibold text-white transition hover:bg-red-700"
          >
            {t("signOut")}
          </button>
        </div>
      </div>
    </div>
  );
}
