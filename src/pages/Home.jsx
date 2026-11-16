import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Icon from "../components/Icon";
import RegistrationModal from "../components/RegistrationModal";
import FarmCatalogNotice from "../components/FarmCatalogNotice";
import { useFarmSummaries } from "../hooks/useFarmSummaries";
import { fetchUserFarms, updateFarmIcon } from "../api/client";
import { isAuthenticated, clearAuth } from "../api/auth";
import { IconSprite } from "../components/IconSprite";
import { AppShellStyles, LoadingPanel, SidebarNav, SignOutModal } from "../components/AppShell";
import { useLanguage } from "../i18n.jsx";
import countryData from "../data/countryData";

const PLATFORM_LABEL = { smartlink: "SmartLink", tempview: "TempView / FarmNet", silonic: "Silonic-Xi" };
const COUNTRY_CODES = new Map(countryData.map(({ name, code }) => [name, code]));

const FARM_ICONS = [
  { id: 0, name: "barn", label: "farmIconBarn" },
  { id: 1, name: "egg", label: "farmIconEgg" },
  { id: 2, name: "leaf", label: "farmIconLeaf" },
  { id: 3, name: "home", label: "farmIconHouse" },
  { id: 4, name: "building-warehouse", label: "farmIconWarehouse" },
  { id: 5, name: "temperature", label: "farmIconTemperature" },
  { id: 6, name: "building-store", label: "farmIconStore" },
  { id: 7, name: "router", label: "farmIconController" },
];
const CUSTOM_FARM_ICON_ID = 8;
const FARM_ICON_TEXT_PATTERN = /^[A-Za-z0-9]{1,3}$/;

const STATUS_TONE = {
  approved: { tint: "#e4f6ee", solid: "#1f8a5c", label: "statusApproved" },
  edited: { tint: "#e6f1fb", solid: "#185fa5", label: "statusEdited" },
  pending: { tint: "#fbf2de", solid: "#b5820a", label: "statusPending" },
  rejected: { tint: "#fbeae8", solid: "#b23a2e", label: "statusRejected" },
};
const STATUS_FILTER_OPTIONS = ["all", "approved", "pending", "edited", "rejected"];

// การ์ดสถิติของโหมด Dashboard — สรุปตัวเลขรวมทั้งระบบ 4 กล่อง
function DashboardStatCard({ icon, label, value, accent, tint }) {
  return (
    <div className="dash-stat-card relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4">
      <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: accent }} />
      <div className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: tint, color: accent }}>
        <Icon name={icon} style={{ fontSize: 16 }} />
      </div>
      <div className="text-[22px] font-bold leading-none text-[#16233D]">{value}</div>
      <div className="mt-1 text-[11px] font-medium text-slate-500">{label}</div>
    </div>
  );
}

// การ์ดฟาร์มของโหมด Dashboard — สรุปข้อมูลฟาร์มแบบกระชับแต่ครบ อ่านง่ายเป็นระบบเดียวกับการ์ดหลัก
function DashboardFarmCard({ farm, countryName, onOpenFarm, onOpenIconPicker }) {
  const { t } = useLanguage();
  const status = farm.status === "pushed" ? "approved" : farm.status;
  const tone = STATUS_TONE[status] || STATUS_TONE.pending;
  const icon = FARM_ICONS.find(({ id }) => id === farm.icon_id) ?? FARM_ICONS[0];
  const deviceCount = (farm.houses || []).reduce((s, h) => s + h.equipment.length, 0);
  const userCount = (farm.app_users || []).length;

  return (
    <div onClick={() => onOpenFarm(farm)} className="dash-card cursor-pointer rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <button
          type="button"
          aria-label={t("changeFarmIcon")}
          aria-haspopup="dialog"
          title={t("changeFarmIcon")}
          onClick={(event) => {
            event.stopPropagation();
            onOpenIconPicker(farm);
          }}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#E6F1FB] text-[#185FA5] transition-colors hover:bg-[#D6E8F8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#185FA5]"
        >
          {farm.icon_id === CUSTOM_FARM_ICON_ID && farm.icon_text ? (
            <span className="font-mono text-sm font-bold">{farm.icon_text}</span>
          ) : (
            <Icon name={icon.name} style={{ fontSize: 23 }} />
          )}
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate text-[14.5px] font-bold leading-tight text-[#16233D]">{farm.farm_name}</h3>
            <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: tone.tint, color: tone.solid }}>
              {t(tone.label)}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11.5px] text-slate-500">
            <Icon name="home" style={{ fontSize: 10 }} className="shrink-0 text-[#185FA5]" />
            <span className="truncate">
              {[farm.province, countryName].filter(Boolean).join(", ")}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3">
        <span className="rounded-full bg-[#E6F1FB] px-2 py-0.5 text-[10.5px] font-semibold text-[#0C447C]">
          {PLATFORM_LABEL[farm.platform] || farm.platform}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-1 border-t border-slate-100 pt-3 text-center">
        <div>
          <div className="text-[15px] font-bold leading-none text-[#16233D]">{farm.house_count}</div>
          <div className="mt-1 text-[10px] text-slate-500">{t("homeHouses")}</div>
        </div>
        <div>
          <div className="text-[15px] font-bold leading-none text-[#16233D]">{deviceCount}</div>
          <div className="mt-1 text-[10px] text-slate-500">{t("homeDevices")}</div>
        </div>
        <div>
          <div className="text-[15px] font-bold leading-none text-[#16233D]">{userCount}</div>
          <div className="mt-1 text-[10px] text-slate-500">{t("homeUsers")}</div>
        </div>
      </div>

      <div className="mt-3 truncate border-t border-slate-100 pt-3 text-[11.5px] text-slate-600">
        {farm.contact_name} &middot; {farm.contact_phone}
      </div>
    </div>
  );
}

function FarmIconPicker({ farm, onClose, onSaved }) {
  const { t } = useLanguage();
  const dialogRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const [customText, setCustomText] = useState(farm.icon_text ?? "");
  const validCustomText = FARM_ICON_TEXT_PATTERN.test(customText);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  async function pickIcon(iconId, iconText = "") {
    setSaving(true);
    setError(false);
    try {
      const savedIcon = await updateFarmIcon(farm.id, iconId, iconText);
      onSaved(farm.id, savedIcon);
      onClose();
    } catch {
      setError(true);
      setSaving(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="farm-icon-picker-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!saving) onClose();
      }}
      className="m-auto w-[min(29rem,calc(100%-2rem))] rounded-xl border border-slate-200 bg-white p-5 text-slate-900 shadow-xl backdrop:bg-slate-900/40"
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 id="farm-icon-picker-title" className="text-base font-semibold">{t("changeFarmIcon")}</h2>
          <p className="truncate text-sm text-slate-500">{farm.farm_name}</p>
        </div>
        <button type="button" onClick={onClose} disabled={saving} aria-label={t("close")} className="rounded-md p-1 text-slate-500 hover:bg-slate-100">
          <Icon name="x" style={{ fontSize: 18 }} />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2 min-[420px]:grid-cols-4">
        {FARM_ICONS.map(({ id, name, label }) => (
          <button
            key={id}
            type="button"
            aria-pressed={id === (farm.icon_id ?? 0)}
            disabled={saving}
            onClick={() => pickIcon(id)}
            className="flex min-w-0 flex-col items-center gap-2 rounded-lg border border-slate-200 px-1 py-3 text-sm text-[#185FA5] hover:bg-[#E6F1FB] aria-pressed:border-[#185FA5] aria-pressed:bg-[#E6F1FB] disabled:opacity-60"
          >
            <Icon name={name} style={{ fontSize: 24 }} />
            {t(label)}
          </button>
        ))}
      </div>
      <form
        className="mt-4 border-t border-slate-200 pt-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (validCustomText && !saving) pickIcon(CUSTOM_FARM_ICON_ID, customText);
        }}
      >
        <label htmlFor="farm-icon-text" className="text-sm font-semibold">{t("farmIconCustom")}</label>
        <div className="mt-2 flex items-center gap-2">
          <input
            id="farm-icon-text"
            type="text"
            value={customText}
            onChange={(event) => setCustomText(event.target.value)}
            maxLength={3}
            autoCapitalize="none"
            autoComplete="off"
            spellCheck={false}
            disabled={saving}
            placeholder="Ab1"
            aria-describedby="farm-icon-text-help"
            aria-invalid={customText !== "" && !validCustomText}
            className="h-10 w-20 rounded-lg border border-slate-300 px-2 text-center font-mono text-sm outline-none focus:border-brand aria-invalid:border-alert"
          />
          <button type="submit" disabled={saving || !validCustomText} className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50">
            {t("save")}
          </button>
        </div>
        <p id="farm-icon-text-help" className={`mt-1.5 text-xs ${customText !== "" && !validCustomText ? "text-alert" : "text-slate-500"}`}>
          {t("farmIconCustomHelp")}
        </p>
      </form>
      {error && <p role="alert" className="mt-3 text-sm text-red-700">{t("farmIconSaveError")}</p>}
    </dialog>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const openRegistrationIfEmpty = state?.openRegistrationIfEmpty === true;
  const { lang, t } = useLanguage();
  const countryNames = useMemo(() => new Intl.DisplayNames([lang], { type: "region" }), [lang]);
  const [records, setRecords] = useState([]);
  const { farms, catalogError, retryCatalog } = useFarmSummaries(records);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [signOutConfirmOpen, setSignOutConfirmOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [detailId, setDetailId] = useState(null);
  const detailFarm = farms.find((farm) => farm.id === detailId);
  const [iconFarm, setIconFarm] = useState(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/");
      return;
    }
    let active = true;
    fetchUserFarms()
      .then((data) => {
        if (!active) return;
        if (openRegistrationIfEmpty && data.length === 0) {
          navigate("/customer", { replace: true });
        } else {
          setRecords(data);
        }
      })
      .catch(() => { if (active) setLoadError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [navigate, openRegistrationIfEmpty]);

  function handleSignOut() {
    clearAuth();
    navigate("/");
  }

  const filteredFarms = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return farms.filter((farm) => {
      const matchesStatus = statusFilter === "all" || farm.status === statusFilter;
      if (!matchesStatus) return false;
      if (!term) return true;
      return [farm.farm_name, farm.device_model, farm.contact_name]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(term));
    });
  }, [farms, searchTerm, statusFilter]);

  const count = filteredFarms.length;

  // เปิดดู/แก้ไขรายละเอียดฟาร์มแบบป็อปอัพ — ใช้ RegistrationModal ตัวเดียวกับฝั่ง Admin
  // (canModerate=false: ไม่มีปุ่ม Reject/Approve แต่ยังกด Edit + Save ได้ตามปกติ)
  function handleOpenFarm(farm) {
    setDetailId(farm.id);
  }

  function handleIconSaved(farmId, { icon_id, icon_text }) {
    setRecords((prev) => prev.map((record) => (
      record.farm.id === farmId ? { ...record, farm: { ...record.farm, icon_id, icon_text } } : record
    )));
  }

  // สถิติรวมทั้งระบบ — ใช้แสดงในการ์ดสรุปของโหมด Dashboard เท่านั้น
  const totalHouses = farms.reduce((sum, f) => sum + (Number(f.house_count) || 0), 0);
  const totalDevices = farms.reduce(
    (sum, f) => sum + (f.houses || []).reduce((s, h) => s + h.equipment.length, 0),
    0
  );
  const totalUsers = farms.reduce((sum, f) => sum + (f.app_users?.length || 0), 0);

  // ตัวเลือกกรองสถานะ — แปลงจาก native <select> เดิม (ทำให้หน้าตา dropdown ไปตามธีมของแต่ละ browser
  // ไม่ตรงกับดีไซน์ระบบ) มาเป็น dropdown ที่คุมหน้าตาเองแบบเดียวกับตัวเลือกภาษา
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const statusLabel = (status) => t(STATUS_TONE[status]?.label ?? "homeAllStatuses");

  // เนื้อหาเสริมของแถบเมนูซ้าย — ค้นหา กรองสถานะ และลงทะเบียนฟาร์ม
  const sidebarExtra = !loading && farms.length > 0 && (
    <div className="flex flex-col gap-2.5 pt-2">
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
          <Icon name="search" style={{ fontSize: 14 }} />
        </span>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={t("homeSearchFarms")}
          aria-label={t("homeSearchFarms")}
          className="sidebar-input w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-9 pr-3 text-[13px] text-white placeholder:text-white/40"
        />
      </div>

      {/* dropdown กรองสถานะ — หน้าตาชุดเดียวกับตัวเลือกภาษา และความกว้าง panel เท่ากับปุ่มตัวเอง (w-full) */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setStatusMenuOpen((open) => !open)}
          aria-haspopup="listbox"
          aria-expanded={statusMenuOpen}
          className="sidebar-input flex w-full items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-left text-[13px] font-medium text-white"
        >
          <span className="truncate">{statusLabel(statusFilter)}</span>
          <span className={`shrink-0 text-[10px] transition-transform duration-200 ${statusMenuOpen ? "rotate-180" : ""}`}>
            ▾
          </span>
        </button>
        {statusMenuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setStatusMenuOpen(false)} />
            <div className="absolute left-0 top-full z-20 mt-1 w-full overflow-hidden rounded-xl border border-white/10 bg-[#0A3A69] p-1.5 shadow-[0_16px_32px_rgba(0,0,0,0.35)]">
              {STATUS_FILTER_OPTIONS.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => {
                    setStatusFilter(status);
                    setStatusMenuOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold transition-all duration-150 ${
                    statusFilter === status ? "bg-[#185FA5] text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span className="flex-1 truncate">{statusLabel(status)}</span>
                  {statusFilter === status && <span className="text-sm">✓</span>}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <button
        type="button"
        onClick={() => navigate("/customer")}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-white px-4 py-2.5 text-[13px] font-semibold text-[#0C447C] transition duration-150 hover:bg-slate-100"
      >
        <Icon name="plus" style={{ fontSize: 13 }} />
        {t("newRegister")}
      </button>
    </div>
  );

  return (
    <>
      <AppShellStyles />
      <style>{`
        .sidebar-input { transition: background-color 150ms ease, box-shadow 150ms ease, border-color 150ms ease; }
        .sidebar-input:focus { outline: none; background: rgba(255,255,255,0.1) !important; border-color: rgba(255,255,255,0.25) !important; box-shadow: 0 0 0 3px rgba(255,255,255,0.08); }
        .dash-stat-card { transition: transform 200ms cubic-bezier(0.16,1,0.3,1), box-shadow 200ms ease, border-color 200ms ease; }
        .dash-stat-card:hover { transform: translateY(-2px); box-shadow: 0 14px 26px rgba(15,23,42,0.09); border-color: #b9d3ea; }
        .dash-card { transition: transform 200ms cubic-bezier(0.16,1,0.3,1), box-shadow 200ms ease, border-color 200ms ease; }
        .dash-card:hover { transform: translateY(-2px); border-color: #b9d3ea; box-shadow: 0 14px 26px rgba(15,23,42,0.09); }
        .dashboard-enter { animation: dashboardEnter 320ms cubic-bezier(0.16,1,0.3,1) both; }
        @keyframes dashboardEnter { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .dash-scroll { scrollbar-width: thin; scrollbar-color: #c7d6e5 transparent; }
        .dash-scroll::-webkit-scrollbar { width: 6px; }
        .dash-scroll::-webkit-scrollbar-track { background: transparent; }
        .dash-scroll::-webkit-scrollbar-thumb { background: #c7d6e5; border-radius: 999px; }
        .dash-scroll::-webkit-scrollbar-thumb:hover { background: #9db8d3; }
      `}</style>

      <div className="flex h-screen overflow-hidden bg-gradient-to-b from-[#eef3f9] to-[#e6edf6]">
        <IconSprite />

        <SidebarNav
          active="home"
          width="w-80"
          extra={sidebarExtra}
          mobileOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onSignOutClick={() => {
            setSidebarOpen(false);
            setSignOutConfirmOpen(true);
          }}
        />

        <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
          {/* ปุ่มเปิดเมนู — แสดงเฉพาะจอมือถือ (เดสก์ท็อปใช้แถบเมนูซ้ายที่แสดงตลอดอยู่แล้ว ไม่มีแท็บบนอีกต่อไป) */}
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="fixed left-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-600 shadow-[0_6px_18px_rgba(15,23,42,0.18)] md:hidden"
            aria-label={t("openMenu")}
          >
            <Icon name="menu" style={{ fontSize: 18 }} />
          </button>

          <div className="mx-auto flex min-h-0 w-full max-w-[1200px] flex-1 flex-col overflow-hidden px-6 pb-6 pt-16 sm:pb-8 sm:pt-8">
            {catalogError && <FarmCatalogNotice onRetry={retryCatalog} />}
            {loading ? (
              <LoadingPanel />
            ) : loadError ? (
              <p role="alert" className="rounded-lg border border-red-200 bg-white p-6 text-center text-sm text-red-700">
                {t("farmListLoadError")}
              </p>
            ) : farms.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
                <p className="text-sm font-medium text-slate-600">{t("homeNoFarms")}</p>
                <p className="mt-1 text-[12.5px] text-slate-500">{t("homeNoFarmsHint")}</p>
                <button
                  type="button"
                  onClick={() => navigate("/customer")}
                  className="mt-4 rounded-lg bg-[#185FA5] px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-[#0C447C]"
                >
                  {t("newRegister")}
                </button>
              </div>
            ) : count === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
                <p className="text-sm font-medium text-slate-600">{t("homeNoMatches")}</p>
                <p className="mt-1 text-[12.5px] text-slate-500">{t("homeNoMatchesHint")}</p>
              </div>
            ) : (
              <div className="dashboard-enter flex min-h-0 flex-1 flex-col">
                {/* Overview — สรุปตัวเลขรวม อยู่นิ่งด้านบนเสมอ */}
                <div className="mb-5 shrink-0">
                  <h2 className="mb-3 text-[12px] font-bold uppercase tracking-[0.08em] text-slate-500">{t("homeOverview")}</h2>
                  <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
                    <DashboardStatCard icon="building-warehouse" label={t("homeTotalFarms")} value={farms.length} accent="#185FA5" tint="#E6F1FB" />
                    <DashboardStatCard icon="barn" label={t("homeTotalHouses")} value={totalHouses} accent="#0f8a7e" tint="#e6f7f5" />
                    <DashboardStatCard icon="router" label={t("homeTotalDevices")} value={totalDevices} accent="#7c5cd6" tint="#f1eefb" />
                    <DashboardStatCard icon="shield-check" label={t("homeTotalUsers")} value={totalUsers} accent="#b5820a" tint="#fbf2de" />
                  </div>
                </div>

                {/* หัวข้อรายการฟาร์ม — อยู่นิ่งเช่นกัน มีแค่โซนการ์ดด้านล่างที่เลื่อนได้ */}
                <div className="mb-3 flex shrink-0 items-center justify-between">
                  <h2 className="text-[12px] font-bold uppercase tracking-[0.08em] text-slate-500">{t("homeFarms")}</h2>
                  <span className="text-[12px] text-slate-500">{t("homeFarmCount", { count })}</span>
                </div>

                {/* โซนการ์ดฟาร์ม — เลื่อนได้เฉพาะส่วนนี้ ไม่กระทบส่วนอื่นของหน้า และไม่กระทบขนาดการ์ด */}
                <div className="dash-scroll min-h-0 flex-1 overflow-y-auto pb-1 pr-1">
                  <div className="grid grid-cols-1 gap-4 pb-4 sm:grid-cols-2">
                    {filteredFarms.map((farm) => {
                      const code = COUNTRY_CODES.get(farm.country);
                      return (
                        <DashboardFarmCard
                          key={farm.id}
                          farm={farm}
                          countryName={code ? countryNames.of(code) : farm.country}
                          onOpenFarm={handleOpenFarm}
                          onOpenIconPicker={setIconFarm}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <SignOutModal
          open={signOutConfirmOpen}
          onCancel={() => setSignOutConfirmOpen(false)}
          onConfirm={handleSignOut}
        />

        {iconFarm && (
          <FarmIconPicker farm={iconFarm} onClose={() => setIconFarm(null)} onSaved={handleIconSaved} />
        )}

        <RegistrationModal
          registration={detailFarm}
          onClose={() => setDetailId(null)}
          onEdit={(id) => navigate(`/customer/edit/${id}`)}
          canModerate={false}
          title={t("farmDetailModalTitle")}
        />
      </div>
    </>
  );
}
