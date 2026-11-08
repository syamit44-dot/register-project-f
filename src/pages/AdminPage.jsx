import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../components/Icon";
import RegistrationModal from "../components/RegistrationModal";
import { SignOutModal } from "../components/AppShell";
import { clearAuth } from "../api/auth";
import { registrationsMockData } from "../data/registrationsMockData";
import { useLanguage } from "../i18n.jsx";

// ⚠️ ยังใช้ข้อมูลจำลอง (mock) อยู่ — ยังไม่ได้เชื่อมกับ backend จริง (listRegistrations/getRegistration/
// pushRegistration/deleteRegistration ใน api/client.js) พอ backend พร้อมค่อยเปลี่ยนมาดึงจาก API แทน

const PLATFORM_LABEL = { smartlink: "SmartLink", tempviewFarmnet: "TempView / FarmNet", silonic: "Silonic-Xi" };

// ตัวเลือกใน dropdown filter — ใช้ค่า platform ตามที่มีจริงในข้อมูล (mock data บางแถวเก็บเป็นข้อความเต็ม
// "Tempview / Farmnet" ไม่ใช่ key แบบ "tempviewFarmnet") จึงอ้างอิงค่าตรงนี้แทนเพื่อให้ filter ตรงกับข้อมูลจริง
const STATUS_OPTIONS = [
  { key: "pending", labelKey: "statusPending" },
  { key: "approved", labelKey: "statusApproved" },
  { key: "rejected", labelKey: "statusRejected" },
];
const PLATFORM_OPTIONS = [
  { key: "smartlink", label: "SmartLink" },
  { key: "Tempview / Farmnet", label: "Tempview / Farmnet" },
  { key: "silonic", label: "Silonic-Xi" },
];

// โทนดำเป็นสีเน้น (header, avatar, ปุ่มที่เลือกอยู่) ส่วนพื้นผิวหลักเป็นสีขาวล้วน
const STATUS_TONE = {
  approved: { dot: "#1f8a5c", tint: "#e4f6ee", labelKey: "statusApproved" },
  pushed: { dot: "#1f8a5c", tint: "#e4f6ee", labelKey: "statusApproved" },
  pending: { dot: "#b5820a", tint: "#fbf2de", labelKey: "statusPending" },
  rejected: { dot: "#b23a2e", tint: "#fbeae8", labelKey: "statusRejected" },
};

function statusTone(status) {
  return STATUS_TONE[status] || STATUS_TONE.pending;
}

function StatusPill({ status, t }) {
  const tone = statusTone(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold"
      style={{ background: tone.tint, color: tone.dot }}
    >
      <span className="h-[6px] w-[6px] shrink-0 rounded-full" style={{ background: tone.dot }} />
      {t(tone.labelKey)}
    </span>
  );
}

function registeredUserLabel(row) {
  const users = row.app_users || [];
  if (users.length === 0) return "-";
  if (users.length === 1) return users[0].username;
  return `${users[0].username} +${users.length - 1}`;
}

function formatDate(value) {
  if (!value) return "--";
  // ข้อมูล mock เก็บเป็น "DD/MM/YYYY" อยู่แล้ว — parse ตรงๆ ไม่ผ่าน new Date()
  // เพื่อกันปัญหา new Date() ตีความ "10/05/2026" เป็นเดือน 10 วัน 05 (แบบสากล) ผิดจากที่ตั้งใจ
  const parts = String(value).split("/");
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

// ตัวเลขย่อยในแถวฟาร์ม (Houses / Devices / Users)
function RowMetric({ value, label }) {
  return (
    <div className="text-center">
      <div className="text-[17px] font-bold leading-none text-[#0d0f12]">{value}</div>
      <div className="mt-1.5 text-[10.5px] font-medium uppercase tracking-[0.07em] text-slate-400">{label}</div>
    </div>
  );
}

// แถวฟาร์มหนึ่งรายการ — เต็มความกว้าง หนึ่งฟาร์มต่อหนึ่งบรรทัด พื้นขาว
function FarmRow({ row, index, t, deleteMode, selected, onToggleSelect, onReview }) {
  const deviceCount = (row.houses || []).reduce((s, h) => s + (h.accessories?.length || 0), 0);
  const userCount = (row.app_users || []).length;

  return (
    <div
      className={`admin-row group relative overflow-hidden rounded-2xl border bg-white ${
        selected ? "border-[#0d0f12]/30 bg-slate-50" : "border-slate-200"
      }`}
    >
      {/* เส้นสถานะบางๆ ด้านซ้าย — กวาดตาหาสถานะได้เร็วโดยไม่ต้องอ่าน */}
      <span className="absolute inset-y-0 left-0 w-[3px]" style={{ background: statusTone(row.status).dot }} />

      <div className="flex flex-col gap-4 py-4 pl-5 pr-4 sm:pl-6 lg:flex-row lg:items-center lg:gap-5">
        {deleteMode && (
          <label className="flex shrink-0 cursor-pointer items-center lg:pr-1">
            <input
              type="checkbox"
              checked={selected}
              onChange={onToggleSelect}
              className="h-4 w-4 cursor-pointer rounded border-slate-300 text-[#0d0f12] focus:ring-slate-400"
            />
          </label>
        )}

        {/* ตัวตนฟาร์ม */}
        <div className="flex min-w-0 flex-1 items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#1a1e24] to-[#0d0f12] text-[13px] font-bold text-white shadow-[0_4px_10px_rgba(13,15,18,0.25)]">
            {row.farm_short}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-[11px] text-slate-400">{String(index + 1).padStart(2, "0")}</span>
              <h3 className="truncate text-[15.5px] font-bold text-[#0d0f12]">{row.farm_name}</h3>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12px] text-slate-500">
              <span className="inline-flex items-center gap-1">
                <Icon name="home" style={{ fontSize: 11 }} />
                {row.province}, {row.country}
              </span>
              <span className="text-slate-200">|</span>
              <span className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600">
                {PLATFORM_LABEL[row.platform] || row.platform}
              </span>
              <span className="truncate text-slate-400">{row.device_model}</span>
            </div>
          </div>
        </div>

        {/* ผู้ติดต่อ + ผู้ใช้ที่ลงทะเบียน */}
        <div className="min-w-0 shrink-0 border-slate-100 lg:w-[190px] lg:border-l lg:pl-6">
          <div className="truncate text-[12.5px] text-slate-700">{row.contact_name}</div>
          <div className="truncate text-[11.5px] text-slate-400">{row.contact_phone}</div>
          <div className="mt-1 truncate text-[11px] text-slate-400">{registeredUserLabel(row)}</div>
        </div>

        {/* ตัวเลขสรุป — Users ขึ้นก่อน ตามด้วย Houses, Devices */}
        <div className="grid shrink-0 grid-cols-3 gap-6 border-slate-100 lg:border-l lg:pl-6 xl:gap-8">
          <RowMetric value={userCount} label="Users" />
          <RowMetric value={row.house_count_actual} label="Houses" />
          <RowMetric value={deviceCount} label="Devices" />
        </div>

        {/* วันที่ */}
        <div className="shrink-0 border-slate-100 lg:w-[132px] lg:border-l lg:pl-6">
          <div className="text-[11px] uppercase tracking-[0.06em] text-slate-400">{t("registrationDate")}</div>
          <div className="text-[12.5px] text-slate-600">{formatDate(row.created_at)}</div>
          <div className="mt-1 text-[11px] uppercase tracking-[0.06em] text-slate-400">{t("lastUpdated")}</div>
          <div className="text-[12.5px] text-slate-600">{formatDate(row.updated_at)}</div>
        </div>

        {/* สถานะ + ปุ่มตรวจสอบ */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-slate-100 lg:w-[172px] lg:justify-end lg:border-l lg:pl-6">
          <StatusPill status={row.status} t={t} />
          <button
            type="button"
            onClick={onReview}
            className="admin-review-btn flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500"
            aria-label="Review"
          >
            <Icon name="eye" style={{ fontSize: 15 }} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [rows, setRows] = useState(registrationsMockData);
  const [search, setSearch] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
  const [detailId, setDetailId] = useState(null);
  const [selectedDeleteIds, setSelectedDeleteIds] = useState([]);
  const [deleteMode, setDeleteMode] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [signOutConfirmOpen, setSignOutConfirmOpen] = useState(false);

  const counts = useMemo(() => {
    const c = { all: rows.length, pending: 0, approved: 0, rejected: 0 };
    rows.forEach((r) => {
      const s = r.status === "pushed" ? "approved" : r.status;
      if (c[s] !== undefined) c[s] += 1;
    });
    return c;
  }, [rows]);

  // แจ้งเตือน "ลูกค้าแก้ไขข้อมูล" — mock: แถวที่ updated_at ใหม่กว่า created_at
  // และยังเป็นสถานะ pending (ลูกค้าแก้ไขแล้วแต่แอดมินยังไม่ได้ตรวจ/อนุมัติซ้ำ)
  // TODO: พอ backend พร้อม ให้เปลี่ยนไปใช้ field จริง เช่น has_pending_changes แทน heuristic นี้
  const editNotifications = useMemo(() => {
    return rows
      .filter((r) => {
        if (r.status !== "pending") return false;
        if (!r.updated_at || !r.created_at) return false;
        return new Date(r.updated_at).getTime() > new Date(r.created_at).getTime();
      })
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }, [rows]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const matchesSearch = !q || `${r.farm_name} ${r.farm_short}`.toLowerCase().includes(q);
      const s = r.status === "pushed" ? "approved" : r.status;
      const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(s);
      const matchesPlatform = selectedPlatforms.length === 0 || selectedPlatforms.includes(r.platform);
      return matchesSearch && matchesStatus && matchesPlatform;
    });
  }, [rows, search, selectedStatuses, selectedPlatforms]);

  const activeFilterCount = selectedStatuses.length + selectedPlatforms.length;

  function toggleStatusFilter(key) {
    setSelectedStatuses((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  }

  function togglePlatformFilter(key) {
    setSelectedPlatforms((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  }

  function clearFilters() {
    setSelectedStatuses([]);
    setSelectedPlatforms([]);
  }

  const detail = rows.find((r) => r.id === detailId) || null;

  function openReview(id) {
    setDetailId(id);
    setNotifMenuOpen(false);
  }

  function closeReview() {
    setDetailId(null);
  }

  function updateStatus(id, status) {
    const today = new Date().toISOString().slice(0, 10);
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status, updated_at: today } : r)));
    setDetailId(null);
  }

  function handleApprove(id) {
    updateStatus(id, "approved");
  }

  function handleReject(id) {
    updateStatus(id, "rejected");
  }

  function toggleDeleteSelection(id) {
    setSelectedDeleteIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  }

  function handleDeleteSelected() {
    if (selectedDeleteIds.length === 0) return;
    setConfirmDeleteOpen(true);
  }

  function confirmDeleteSelected() {
    setRows((prev) => prev.filter((r) => !selectedDeleteIds.includes(r.id)));
    setSelectedDeleteIds([]);
    setDeleteMode(false);
    setConfirmDeleteOpen(false);
  }

  function handleSignOut() {
    clearAuth();
    navigate("/");
  }

  // บันทึกการแก้ไขข้อมูล (ชั่วคราว) จาก modal — เก็บแค่ใน state ของหน้านี้ ยังไม่ได้เชื่อมกับ backend จริง
  function handleSaveEdit(id, updates) {
    const today = new Date().toISOString().slice(0, 10);
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates, updated_at: today } : r)));
  }

  return (
    <>
      <style>{`
        .admin-stat { transition: transform 220ms cubic-bezier(0.16,1,0.3,1), background-color 220ms ease, border-color 220ms ease, box-shadow 220ms ease; }
        .admin-stat:hover { transform: translateY(-2px); }
        .admin-row { transition: transform 220ms cubic-bezier(0.16,1,0.3,1), border-color 220ms ease, box-shadow 220ms ease; }
        .admin-row:hover { transform: translateY(-2px); border-color: #cbd5e1; box-shadow: 0 16px 34px rgba(15,23,42,0.10); }
        .admin-review-btn { transition: background-color 180ms ease, color 180ms ease, border-color 180ms ease, transform 180ms ease; }
        .admin-review-btn:hover { background-color: #0d0f12; border-color: #0d0f12; color: #ffffff; transform: translateY(-1px); }
        .admin-ctl { transition: background-color 170ms ease, border-color 170ms ease, box-shadow 170ms ease, color 170ms ease; }
        .admin-search { transition: background-color 170ms ease, border-color 170ms ease, box-shadow 170ms ease; }
        .admin-search:focus-within { border-color: #0d0f12; box-shadow: 0 0 0 4px rgba(13,15,18,0.08); }
        .admin-scroll { scrollbar-width: thin; scrollbar-color: #cbd5e1 transparent; }
        .admin-scroll::-webkit-scrollbar { width: 8px; height: 8px; }
        .admin-scroll::-webkit-scrollbar-track { background: transparent; }
        .admin-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 999px; }
        .admin-scroll::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        .admin-fade { animation: adminFadeIn 340ms cubic-bezier(0.16,1,0.3,1) both; }
        @keyframes adminFadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div className="flex h-screen flex-col overflow-hidden bg-gradient-to-b from-[#f4f6f8] to-[#eceff3]">
        {/* แถบบน — สีดำ ใช้เป็นสีเน้นจุดเดียวของหน้า ส่วนที่เหลือทั้งหมดเป็นสีขาว */}
        <header className="relative z-30 shrink-0 overflow-hidden bg-[#0d0f12]">
          <div
            className="pointer-events-none absolute inset-0 opacity-70"
            style={{ background: "radial-gradient(560px 140px at 12% 0%, rgba(255,255,255,0.08), transparent 70%)" }}
          />
          <div
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{ background: "radial-gradient(420px 160px at 88% 100%, rgba(255,255,255,0.05), transparent 70%)" }}
          />
          <div className="mx-auto flex w-full max-w-[1500px] items-center gap-3 px-5 py-4 sm:px-8">
            <h1 className="text-[26px] font-black italic tracking-[0.02em] text-white sm:text-[30px]">ADMIN</h1>

            <div className="ml-auto flex shrink-0 items-center gap-2">
              {/* แจ้งเตือน: ลูกค้าแก้ไขข้อมูล */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setNotifMenuOpen((open) => !open)}
                  className="admin-ctl relative flex h-[38px] w-[38px] items-center justify-center rounded-xl border border-white/15 bg-white/[0.08] text-white/85 hover:bg-white/[0.14]"
                  aria-label="Notification for data edits"
                >
                  <Icon name="bell" style={{ fontSize: 16 }} />
                  {editNotifications.length > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-white px-1 text-[10.5px] font-bold leading-none text-[#0d0f12] ring-2 ring-[#0d0f12]">
                      {editNotifications.length > 9 ? "9+" : editNotifications.length}
                    </span>
                  )}
                </button>

                {notifMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setNotifMenuOpen(false)} />
                    <div className="absolute right-0 z-20 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-[0_24px_60px_rgba(15,23,42,0.24)]">
                      <div className="flex items-center justify-between px-3 py-2 text-[12px] font-bold uppercase tracking-[0.08em] text-slate-500">
                        <span>{t("notifTitle")}</span>
                        <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-500">
                          {editNotifications.length}
                        </span>
                      </div>
                      <div className="admin-scroll max-h-80 overflow-y-auto">
                        {editNotifications.length === 0 ? (
                          <div className="px-3 py-6 text-center text-[13px] text-slate-400">{t("notifNone")}</div>
                        ) : (
                          editNotifications.map((r) => (
                            <button
                              key={r.id}
                              type="button"
                              onClick={() => openReview(r.id)}
                              className="flex w-full flex-col items-start gap-0.5 rounded-xl px-3 py-2.5 text-left transition hover:bg-slate-100"
                            >
                              <span className="text-[13.5px] font-semibold text-[#0d0f12]">{r.farm_name}</span>
                              <span className="text-[11.5px] text-slate-500">
                                {r.farm_short} &middot; {t("editedOn", { date: formatDate(r.updated_at) })}
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSignOutConfirmOpen(true)}
                className="admin-ctl flex h-[38px] w-[38px] items-center justify-center rounded-xl border border-white/15 bg-white/[0.08] text-white/85 hover:bg-white/[0.14]"
                aria-label={t("signOut")}
              >
                <Icon name="logout" style={{ fontSize: 16 }} />
              </button>
            </div>
          </div>
        </header>

        {/* เนื้อหา — ส่วนบน (ค้นหา/กรอง/จำนวน) ตรึงอยู่กับที่ เลื่อนได้เฉพาะรายการฟาร์มด้านล่างเท่านั้น */}
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="admin-fade mx-auto w-full max-w-[1500px] shrink-0 px-5 pt-6 sm:px-8">
            {/* แถบเครื่องมือ — ค้นหา + ไอคอนกรอง (เลือกได้หลายตัวเลือกพร้อมกัน) + ไอคอนลบ */}
            <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_1px_3px_rgba(15,23,42,0.06)] sm:flex-row sm:items-center">
              <div className="admin-search flex min-w-0 flex-1 items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5">
                <Icon name="search" style={{ fontSize: 15 }} className="shrink-0 text-slate-400" />
                <input
                  className="w-full min-w-0 border-none bg-transparent text-[13.5px] font-medium text-[#0d0f12] outline-none placeholder:text-slate-400"
                  placeholder={t("searchPlaceholder")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="shrink-0 text-slate-400 transition hover:text-[#0d0f12]"
                    aria-label="Clear search"
                  >
                    <Icon name="x" style={{ fontSize: 14 }} />
                  </button>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {/* ไอคอนกรอง — อยู่ต่อจากช่องค้นหา กดแล้วเปิดหน้าต่างติกได้หลายช่องพร้อมกัน */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setFilterMenuOpen((open) => !open)}
                    className={`admin-ctl relative flex h-[42px] w-[42px] items-center justify-center rounded-xl border ${
                      activeFilterCount > 0
                        ? "border-[#0d0f12] bg-[#0d0f12] text-white"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white"
                    }`}
                    aria-label="Filter"
                  >
                    <Icon name="filter" style={{ fontSize: 16 }} />
                    {activeFilterCount > 0 && (
                      <span className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#b23a2e] px-1 text-[10.5px] font-bold leading-none text-white ring-2 ring-white">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>

                  {filterMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setFilterMenuOpen(false)} />
                      <div className="absolute right-0 z-20 mt-2 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white p-3.5 shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
                        <div className="flex items-center justify-between">
                          <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-slate-500">
                            Filter
                          </span>
                          {activeFilterCount > 0 && (
                            <button
                              type="button"
                              onClick={clearFilters}
                              className="text-[12px] font-semibold text-[#b23a2e] hover:underline"
                            >
                              {t("clearFilters")}
                            </button>
                          )}
                        </div>

                        <div className="mt-2.5 border-t border-slate-100 pt-2.5">
                          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">
                            {t("colStatus")}
                          </p>
                          {STATUS_OPTIONS.map((opt) => (
                            <label
                              key={opt.key}
                              className="flex cursor-pointer items-center justify-between gap-2 rounded-lg px-1.5 py-1.5 text-[13px] font-medium text-slate-700 hover:bg-slate-50"
                            >
                              <span className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={selectedStatuses.includes(opt.key)}
                                  onChange={() => toggleStatusFilter(opt.key)}
                                  className="h-4 w-4 rounded border-slate-300 text-[#0d0f12] focus:ring-slate-400"
                                />
                                {t(opt.labelKey)}
                              </span>
                              <span className="text-[11.5px] text-slate-400">{counts[opt.key] ?? 0}</span>
                            </label>
                          ))}
                        </div>

                        <div className="mt-2.5 border-t border-slate-100 pt-2.5">
                          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">
                            {t("colType")}
                          </p>
                          {PLATFORM_OPTIONS.map((opt) => (
                            <label
                              key={opt.key}
                              className="flex cursor-pointer items-center gap-2 rounded-lg px-1.5 py-1.5 text-[13px] font-medium text-slate-700 hover:bg-slate-50"
                            >
                              <input
                                type="checkbox"
                                checked={selectedPlatforms.includes(opt.key)}
                                onChange={() => togglePlatformFilter(opt.key)}
                                className="h-4 w-4 rounded border-slate-300 text-[#0d0f12] focus:ring-slate-400"
                              />
                              {opt.label}
                            </label>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* ไอคอนลบ — กดเพื่อเข้าโหมดเลือกลบ, กดซ้ำเพื่อยกเลิก */}
                <button
                  type="button"
                  className={`admin-ctl flex h-[42px] w-[42px] items-center justify-center rounded-xl border ${
                    deleteMode
                      ? "border-[#0d0f12] bg-[#0d0f12] text-white"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white"
                  }`}
                  onClick={() => {
                    setDeleteMode((prev) => !prev);
                    setSelectedDeleteIds([]);
                  }}
                  aria-label={deleteMode ? t("cancelDeleteSelection") : t("deleteData")}
                >
                  <Icon name={deleteMode ? "x" : "trash"} style={{ fontSize: 16 }} />
                </button>
                {deleteMode && (
                  <button
                    type="button"
                    className="relative flex h-[42px] w-[42px] items-center justify-center rounded-xl bg-[#b23a2e] text-white shadow-[0_8px_20px_rgba(178,58,46,0.28)] transition hover:bg-[#98301f] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                    disabled={selectedDeleteIds.length === 0}
                    onClick={handleDeleteSelected}
                    aria-label={t("deleteSelected", { count: selectedDeleteIds.length })}
                  >
                    <Icon name="trash" style={{ fontSize: 16 }} />
                    {selectedDeleteIds.length > 0 && (
                      <span className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-white px-1 text-[10.5px] font-bold leading-none text-[#b23a2e] ring-2 ring-[#b23a2e]">
                        {selectedDeleteIds.length}
                      </span>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* หัวรายการ — จำนวนรายการหลังกรอง */}
            <div className="mb-3 flex items-baseline gap-2.5">
              <h2 className="text-[12px] font-bold uppercase tracking-[0.1em] text-slate-500">{t("colFarm")}</h2>
              <span className="text-[12px] text-slate-400">
                {filteredRows.length} / {rows.length}
              </span>
            </div>
          </div>

          {/* รายการฟาร์ม — เฉพาะส่วนนี้เท่านั้นที่เลื่อนได้ */}
          <div className="admin-scroll min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-[1500px] px-5 pb-6 sm:px-8">
              {filteredRows.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                    <Icon name="search" style={{ fontSize: 19 }} />
                  </div>
                  <p className="text-[13.5px] font-semibold text-slate-600">{t("noItems")}</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3 pb-4">
                  {filteredRows.map((r, i) => (
                    <FarmRow
                      key={r.id}
                      row={r}
                      index={i}
                      t={t}
                      deleteMode={deleteMode}
                      selected={selectedDeleteIds.includes(r.id)}
                      onToggleSelect={() => toggleDeleteSelection(r.id)}
                      onReview={() => openReview(r.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {confirmDeleteOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0d0f12]/60 px-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_28px_70px_rgba(13,15,18,0.35)]">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fbeae8] text-[#b23a2e]">
              <Icon name="trash" style={{ fontSize: 22 }} />
            </div>
            <h3 className="text-center text-[17px] font-bold text-[#0d0f12]">{t("confirmDeleteTitle")}</h3>
            <p className="mt-1.5 text-center text-[13.5px] text-slate-500">
              {t("confirmDeleteHint", { count: selectedDeleteIds.length })}
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-[13.5px] font-semibold text-slate-700 transition hover:bg-slate-50"
                onClick={() => setConfirmDeleteOpen(false)}
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                className="flex-1 rounded-xl bg-[#b23a2e] py-2.5 text-[13.5px] font-semibold text-white transition hover:bg-[#98301f]"
                onClick={confirmDeleteSelected}
              >
                {t("deleteNow")}
              </button>
            </div>
          </div>
        </div>
      )}

      <SignOutModal
        open={signOutConfirmOpen}
        onCancel={() => setSignOutConfirmOpen(false)}
        onConfirm={handleSignOut}
      />

      <RegistrationModal
        registration={detail}
        onClose={closeReview}
        onApprove={handleApprove}
        onReject={handleReject}
        onSave={handleSaveEdit}
      />
    </>
  );
}