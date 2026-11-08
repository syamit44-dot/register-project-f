import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../components/Icon";
import StatusBadge from "../components/StatusBadge";
import RegistrationModal from "../components/RegistrationModal";
import { fetchAllFarmsMock } from "../api/client";
import { isAuthenticated, clearAuth } from "../api/auth";
import { IconSprite } from "../components/IconSprite";
import { AppShellStyles, SidebarNav, SignOutModal } from "../components/AppShell";
import { useLanguage } from "../i18n.jsx";

const PLATFORM_LABEL = { smartlink: "SmartLink", tempview: "TempView / FarmNet", silonic: "Silonic-Xi" };

const STATUS_TONE = {
  approved: { tint: "#e4f6ee", solid: "#1f8a5c", label: "Approved" },
  pushed: { tint: "#e4f6ee", solid: "#1f8a5c", label: "Approved" },
  pending: { tint: "#fbf2de", solid: "#b5820a", label: "Pending" },
  rejected: { tint: "#fbeae8", solid: "#b23a2e", label: "Rejected" },
};

const STACK_OFFSET_X = 350;

function cardStyle(distance) {
  const abs = Math.abs(distance);
  if (abs > 2) return { display: "none" };
  const scale = 1 - abs * 0.11;
  const opacity = abs === 0 ? 1 : abs === 1 ? 0.72 : 0.42;
  return {
    transform: `translate(calc(-50% + ${distance * STACK_OFFSET_X}px), 0) scale(${scale})`,
    opacity,
    zIndex: 30 - abs,
  };
}

// ระยะห่างแบบวงกลม — ให้ใบแรกกับใบสุดท้ายอยู่ "ติดกัน" ในทางสายตา เลื่อนวนได้ไม่รู้จบทั้งสองทิศทาง
function circularDistance(index, center, count) {
  let d = index - center;
  if (d > count / 2) d -= count;
  if (d < -count / 2) d += count;
  return d;
}

function StackCard({ farm, distance, onSelect, onOpenFarm }) {
  const isCenter = distance === 0;
  const deviceCount = (farm.houses || []).reduce((s, h) => s + (h.accessories?.length || 0), 0);
  const userCount = (farm.app_users || []).length;

  return (
    <div
      className="stack-card absolute left-1/2 top-0 w-[380px] overflow-hidden rounded-xl border border-[#dfe5eb] bg-white sm:w-[480px]"
      style={{ ...cardStyle(distance), boxShadow: isCenter ? "0 32px 62px rgba(15,35,61,0.22)" : "0 16px 32px rgba(15,35,61,0.12)" }}
      onClick={() => (isCenter ? onOpenFarm(farm) : onSelect())}
    >
      <div className="relative flex h-[190px] items-center justify-center overflow-hidden bg-gradient-to-br from-[#185FA5] to-[#0C447C] sm:h-[225px]">
        <span className="select-none text-[80px] font-black leading-none text-white/15 sm:text-[96px]">{farm.farm_short}</span>
      </div>

      <div className="p-7 sm:p-9">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate text-[23px] font-bold leading-tight text-[#16233D] sm:text-[26px]">{farm.farm_name}</h3>
          <div className="shrink-0">
            <StatusBadge status={farm.status} />
          </div>
        </div>
        <div className="mt-1.5 flex items-center gap-1.5 text-[13px] text-slate-600">
          <Icon name="home" style={{ fontSize: 12 }} className="shrink-0 text-[#185FA5]" />
          <span className="truncate">
            {farm.province}, {farm.country}
          </span>
        </div>

        <div className="mt-4 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-slate-400">Contact</div>
        <p className="mt-0.5 truncate text-[13.5px] text-slate-600">
          {farm.contact_name} &middot; {farm.contact_phone}
        </p>

        <div className="mt-6 grid grid-cols-3 gap-1 border-t border-slate-100 pt-6">
          <div className="text-center">
            <div className="text-[24px] font-bold leading-none text-[#16233D]">{farm.house_count}</div>
            <div className="mt-1.5 text-[11.5px] text-slate-500">Houses</div>
          </div>
          <div className="text-center">
            <div className="text-[24px] font-bold leading-none text-[#16233D]">{deviceCount}</div>
            <div className="mt-1.5 text-[11.5px] text-slate-500">Devices</div>
          </div>
          <div className="text-center">
            <div className="text-[24px] font-bold leading-none text-[#16233D]">{userCount}</div>
            <div className="mt-1.5 text-[11.5px] text-slate-500">Users</div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-6">
          <div>
            <div className="text-[11px] text-slate-500">Platform</div>
            <div className="text-[16px] font-bold text-[#0C447C]">{PLATFORM_LABEL[farm.platform] || farm.platform}</div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenFarm(farm);
            }}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-[#185FA5] text-white transition duration-200 hover:bg-[#0C447C]"
            aria-label="View details"
          >
            <Icon name="arrow-right" style={{ fontSize: 19 }} />
          </button>
        </div>
      </div>
    </div>
  );
}

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
function DashboardFarmCard({ farm, onOpenFarm }) {
  const tone = STATUS_TONE[farm.status] || STATUS_TONE.pending;
  const deviceCount = (farm.houses || []).reduce((s, h) => s + (h.accessories?.length || 0), 0);
  const userCount = (farm.app_users || []).length;

  return (
    <div onClick={() => onOpenFarm(farm)} className="dash-card cursor-pointer rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#185FA5] to-[#0C447C] text-[13px] font-bold text-white">
          {farm.farm_short}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate text-[14.5px] font-bold leading-tight text-[#16233D]">{farm.farm_name}</h3>
            <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: tone.tint, color: tone.solid }}>
              {tone.label}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11.5px] text-slate-500">
            <Icon name="home" style={{ fontSize: 10 }} className="shrink-0 text-[#185FA5]" />
            <span className="truncate">
              {farm.province}, {farm.country}
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
          <div className="mt-1 text-[10px] text-slate-500">Houses</div>
        </div>
        <div>
          <div className="text-[15px] font-bold leading-none text-[#16233D]">{deviceCount}</div>
          <div className="mt-1 text-[10px] text-slate-500">Devices</div>
        </div>
        <div>
          <div className="text-[15px] font-bold leading-none text-[#16233D]">{userCount}</div>
          <div className="mt-1 text-[10px] text-slate-500">Users</div>
        </div>
      </div>

      <div className="mt-3 truncate border-t border-slate-100 pt-3 text-[11.5px] text-slate-600">
        {farm.contact_name} &middot; {farm.contact_phone}
      </div>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [signOutConfirmOpen, setSignOutConfirmOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [mode, setMode] = useState("cards");
  const [center, setCenter] = useState(0);
  const [detailFarm, setDetailFarm] = useState(null);
  const touchStartX = useRef(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/");
      return;
    }
    // ตัวอย่าง: หน้านี้ยิง "API" ตอนโหลดหน้า (ตอนนี้เป็น mock ยังไม่ได้เชื่อมต่อกับ backend จริง)
    // ใช้ข้อมูลชุดเดียวกับหน้า Admin (fetchAllFarmsMock) เพื่อให้ลูกค้าเห็นข้อมูลฟาร์มครบทุกรายการ
    fetchAllFarmsMock().then((data) => {
      setFarms(data);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  useEffect(() => {
    setCenter(0);
  }, [filteredFarms.length]);

  const count = filteredFarms.length;
  const goPrev = useCallback(() => setCenter((c) => (count === 0 ? 0 : (c - 1 + count) % count)), [count]);
  const goNext = useCallback(() => setCenter((c) => (count === 0 ? 0 : (c + 1) % count)), [count]);

  useEffect(() => {
    if (mode !== "cards" || count <= 1) return;
    function onKeyDown(e) {
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mode, count, goNext, goPrev]);

  function onTouchStart(e) {
    touchStartX.current = e.touches[0].clientX;
  }
  function onTouchEnd(e) {
    if (touchStartX.current == null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(deltaX) < 48) return;
    if (deltaX < 0) goNext();
    else goPrev();
  }

  // เปิดดู/แก้ไขรายละเอียดฟาร์มแบบป็อปอัพ — ใช้ RegistrationModal ตัวเดียวกับฝั่ง Admin
  // (canModerate=false: ไม่มีปุ่ม Reject/Approve แต่ยังกด Edit + Save ได้ตามปกติ)
  function handleOpenFarm(farm) {
    setDetailFarm(farm);
  }

  // บันทึกการแก้ไขฟาร์ม (mock — เก็บแค่ใน state หน้านี้ ยังไม่ได้บันทึกลง backend จริง)
  function handleSaveFarmDetail(id, updates) {
    const today = new Date().toISOString().slice(0, 10);
    setFarms((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates, updated_at: today } : f)));
    setDetailFarm((prev) => (prev && prev.id === id ? { ...prev, ...updates, updated_at: today } : prev));
  }

  // สถิติรวมทั้งระบบ — ใช้แสดงในการ์ดสรุปของโหมด Dashboard เท่านั้น
  const totalHouses = farms.reduce((sum, f) => sum + (Number(f.house_count) || 0), 0);
  const totalDevices = farms.reduce(
    (sum, f) => sum + (f.houses || []).reduce((s, h) => s + (h.accessories?.length || 0), 0),
    0
  );
  const totalUsers = farms.reduce((sum, f) => sum + (f.app_users?.length || 0), 0);

  // ตัวเลือกกรองสถานะ — แปลงจาก native <select> เดิม (ทำให้หน้าตา dropdown ไปตามธีมของแต่ละ browser
  // ไม่ตรงกับดีไซน์ระบบ) มาเป็น dropdown ที่คุมหน้าตาเองแบบเดียวกับตัวเลือกภาษา
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const STATUS_FILTER_OPTIONS = [
    { key: "all", label: "All statuses" },
    { key: "approved", label: "Approved" },
    { key: "pending", label: "Pending" },
    { key: "rejected", label: "Rejected" },
  ];
  const currentStatusOption =
    STATUS_FILTER_OPTIONS.find((o) => o.key === statusFilter) ?? STATUS_FILTER_OPTIONS[0];

  // เนื้อหาเสริมของแถบเมนูซ้าย — เหลือเฉพาะค้นหา/กรองสถานะ ใช้ร่วมกันทั้งสองโหมด
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
          placeholder="Search farms..."
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
          <span className="truncate">{currentStatusOption.label}</span>
          <span className={`shrink-0 text-[10px] transition-transform duration-200 ${statusMenuOpen ? "rotate-180" : ""}`}>
            ▾
          </span>
        </button>
        {statusMenuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setStatusMenuOpen(false)} />
            <div className="absolute left-0 top-full z-20 mt-1 w-full overflow-hidden rounded-xl border border-white/10 bg-[#0A3A69] p-1.5 shadow-[0_16px_32px_rgba(0,0,0,0.35)]">
              {STATUS_FILTER_OPTIONS.map((o) => (
                <button
                  key={o.key}
                  type="button"
                  onClick={() => {
                    setStatusFilter(o.key);
                    setStatusMenuOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold transition-all duration-150 ${
                    statusFilter === o.key ? "bg-[#185FA5] text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span className="flex-1 truncate">{o.label}</span>
                  {statusFilter === o.key && <span className="text-sm">✓</span>}
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
        Register Farm
      </button>
    </div>
  );

  return (
    <>
      <AppShellStyles />
      <style>{`
        .stack-card {
          cursor: pointer;
          transition: transform 560ms cubic-bezier(0.16, 1, 0.3, 1), opacity 560ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 400ms ease;
        }
        .stack-viewport {
          -webkit-mask-image: linear-gradient(to right, transparent 0%, black 18%, black 82%, transparent 100%);
          mask-image: linear-gradient(to right, transparent 0%, black 18%, black 82%, transparent 100%);
        }
        .stack-nav-btn { transition: transform 220ms cubic-bezier(0.16,1,0.3,1), background-color 220ms ease, box-shadow 220ms ease; }
        .stack-nav-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(15,23,42,0.14); }
        .stack-dot { transition: width 320ms cubic-bezier(0.16,1,0.3,1), background-color 320ms ease; }
        .sidebar-input { transition: background-color 150ms ease, box-shadow 150ms ease, border-color 150ms ease; }
        .sidebar-input:focus { outline: none; background: rgba(255,255,255,0.1) !important; border-color: rgba(255,255,255,0.25) !important; box-shadow: 0 0 0 3px rgba(255,255,255,0.08); }
        .mode-tab { transition: background-color 200ms ease, color 200ms ease; }
        .dash-stat-card { transition: transform 200ms cubic-bezier(0.16,1,0.3,1), box-shadow 200ms ease, border-color 200ms ease; }
        .dash-stat-card:hover { transform: translateY(-2px); box-shadow: 0 14px 26px rgba(15,23,42,0.09); border-color: #b9d3ea; }
        .dash-card { transition: transform 200ms cubic-bezier(0.16,1,0.3,1), box-shadow 200ms ease, border-color 200ms ease; }
        .dash-card:hover { transform: translateY(-2px); border-color: #b9d3ea; box-shadow: 0 14px 26px rgba(15,23,42,0.09); }
        .mode-fade { animation: modeFadeIn 320ms cubic-bezier(0.16,1,0.3,1) both; }
        @keyframes modeFadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
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
            aria-label="Open menu"
          >
            <Icon name="menu" style={{ fontSize: 18 }} />
          </button>

          {/* พื้นที่เนื้อหา — จำกัดความสูงเท่าหน้าจอ ไม่มีการเลื่อนที่ระดับนี้ โหมด Cards ไม่เลื่อน ส่วนโหมด Dashboard จะเลื่อนเฉพาะโซนการ์ดฟาร์มด้านล่างของมันเองเท่านั้น */}
          <div className="mx-auto flex min-h-0 w-full max-w-[1200px] flex-1 flex-col overflow-hidden px-6 pb-6 pt-16 sm:pb-8 sm:pt-8">
            {loading ? (
              <div className="rounded-lg border border-slate-200 bg-white p-10 text-center text-[13.5px] text-slate-500">
                Loading data...
              </div>
            ) : farms.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
                <p className="text-sm font-medium text-slate-600">No farms registered yet</p>
                <p className="mt-1 text-[12.5px] text-slate-500">Get started by adding your first farm's information</p>
                <button
                  type="button"
                  onClick={() => navigate("/customer")}
                  className="mt-4 rounded-lg bg-[#185FA5] px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-[#0C447C]"
                >
                  Register New Farm
                </button>
              </div>
            ) : (
              <div className="flex min-h-0 flex-1 flex-col">
                {/* สวิตช์ Cards / Dashboard — จัดกึ่งกลาง */}
                <div className="mb-6 flex shrink-0 justify-center">
                  <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
                    <button
                      type="button"
                      onClick={() => setMode("cards")}
                      className={`mode-tab rounded-md px-5 py-2 text-[13px] font-semibold ${
                        mode === "cards" ? "bg-[#185FA5] text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      Cards
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode("dashboard")}
                      className={`mode-tab rounded-md px-5 py-2 text-[13px] font-semibold ${
                        mode === "dashboard" ? "bg-[#185FA5] text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      Dashboard
                    </button>
                  </div>
                </div>

                {count === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
                    <p className="text-sm font-medium text-slate-600">No farms match your search</p>
                    <p className="mt-1 text-[12.5px] text-slate-500">Try a different keyword or status filter</p>
                  </div>
                ) : mode === "cards" ? (
                  <div key="cards" className="mode-fade" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
                    <div className="stack-viewport relative mx-auto h-[660px] max-w-full overflow-hidden sm:h-[720px]">
                      {filteredFarms.map((farm, i) => (
                        <StackCard
                          key={farm.id}
                          farm={farm}
                          distance={circularDistance(i, center, count)}
                          onSelect={() => setCenter(i)}
                          onOpenFarm={handleOpenFarm}
                        />
                      ))}
                    </div>

                    {count > 1 && (
                      <div className="mt-5 flex items-center justify-center gap-4">
                        <button
                          type="button"
                          onClick={goPrev}
                          aria-label="Previous farm"
                          className="stack-nav-btn flex h-10 w-10 items-center justify-center rounded-full border border-[#dfe5eb] bg-white text-[#185FA5]"
                        >
                          <Icon name="arrow-left" style={{ fontSize: 15 }} />
                        </button>
                        <div className="flex items-center gap-1.5">
                          {filteredFarms.map((_, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setCenter(i)}
                              aria-label={`Go to farm ${i + 1}`}
                              className={`stack-dot h-1.5 rounded-full ${
                                i === center ? "w-6 bg-[#185FA5]" : "w-1.5 bg-[#c7d6e5] hover:bg-[#9db8d3]"
                              }`}
                            />
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={goNext}
                          aria-label="Next farm"
                          className="stack-nav-btn flex h-10 w-10 items-center justify-center rounded-full border border-[#dfe5eb] bg-white text-[#185FA5]"
                        >
                          <Icon name="arrow-right" style={{ fontSize: 15 }} />
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div key="dashboard" className="mode-fade flex min-h-0 flex-1 flex-col">
                    {/* Overview — สรุปตัวเลขรวม อยู่นิ่งด้านบนเสมอ */}
                    <div className="mb-5 shrink-0">
                      <h2 className="mb-3 text-[12px] font-bold uppercase tracking-[0.08em] text-slate-500">Overview</h2>
                      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
                        <DashboardStatCard icon="building-warehouse" label="Total Farms" value={farms.length} accent="#185FA5" tint="#E6F1FB" />
                        <DashboardStatCard icon="barn" label="Total Houses" value={totalHouses} accent="#0f8a7e" tint="#e6f7f5" />
                        <DashboardStatCard icon="router" label="Total Devices" value={totalDevices} accent="#7c5cd6" tint="#f1eefb" />
                        <DashboardStatCard icon="shield-check" label="Total Users" value={totalUsers} accent="#b5820a" tint="#fbf2de" />
                      </div>
                    </div>

                    {/* หัวข้อรายการฟาร์ม — อยู่นิ่งเช่นกัน มีแค่โซนการ์ดด้านล่างที่เลื่อนได้ */}
                    <div className="mb-3 flex shrink-0 items-center justify-between">
                      <h2 className="text-[12px] font-bold uppercase tracking-[0.08em] text-slate-500">Farms</h2>
                      <span className="text-[12px] text-slate-500">{count} total</span>
                    </div>

                    {/* โซนการ์ดฟาร์ม — เลื่อนได้เฉพาะส่วนนี้ ไม่กระทบส่วนอื่นของหน้า และไม่กระทบขนาดการ์ด */}
                    <div className="dash-scroll min-h-0 flex-1 overflow-y-auto pb-1 pr-1">
                      <div className="grid grid-cols-1 gap-4 pb-4 sm:grid-cols-2">
                        {filteredFarms.map((farm) => (
                          <DashboardFarmCard key={farm.id} farm={farm} onOpenFarm={handleOpenFarm} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <SignOutModal
          open={signOutConfirmOpen}
          onCancel={() => setSignOutConfirmOpen(false)}
          onConfirm={handleSignOut}
        />

        <RegistrationModal
          registration={detailFarm}
          onClose={() => setDetailFarm(null)}
          onSave={handleSaveFarmDetail}
          canModerate={false}
          useHouseCountActual={false}
          title={t("farmDetailModalTitle")}
        />
      </div>
    </>
  );
}