import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Icon from "../components/Icon";
import { IconSprite } from "../components/IconSprite";
import { fetchHomeSummaryMock } from "../api/client";
import { isAuthenticated, clearAuth } from "../api/auth";
import { useLanguage } from "../i18n.jsx";
import { AppShellStyles, SidebarNav, SignOutModal } from "../components/AppShell";

function formatDate(value) {
  if (!value) return "--";
  // ข้อมูล mock เก็บเป็น "DD/MM/YYYY" อยู่แล้ว — parse ตรงๆ ไม่ผ่าน new Date()
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

function SectionCard({ icon, title, children, delay = 0 }) {
  return (
    <div
      className="app-card-enter app-soft-card overflow-hidden rounded-2xl border border-line bg-white hover:border-[#c9dcee] hover:shadow-[0_16px_32px_rgba(15,23,42,0.06)]"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-3 border-b border-line px-6 py-4 sm:px-7">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#E6F1FB] text-[#185FA5]">
          <Icon name={icon} style={{ fontSize: 17 }} />
        </div>
        <h3 className="text-[15.5px] font-semibold text-ink">{title}</h3>
      </div>
      <div className="p-6 sm:p-7">{children}</div>
    </div>
  );
}

function Field({ label, value, span, wrap = false }) {
  return (
    <div className={span ? "col-span-2" : ""}>
      <p className="text-[12px] tracking-[0.03em] text-ink-soft">{label}</p>
      <p className={`mt-0.5 text-[13.5px] text-ink ${wrap ? "break-words" : "truncate"}`}>{value || "-"}</p>
    </div>
  );
}

function HouseRow({ house }) {
  return (
    <div className="rounded-xl border border-line bg-mist/60 px-4 py-3.5 transition duration-200 hover:border-[#b9d3ea] hover:bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#185FA5]/10 text-[#185FA5]">
            <Icon name="barn" style={{ fontSize: 15 }} />
          </span>
          <span className="text-[13.5px] font-semibold text-ink">{house.name}</span>
        </div>
        {house.serial_number && (
          <span className="rounded-full bg-white px-2.5 py-1 font-mono text-[11px] text-ink-soft shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
            {house.serial_number}
          </span>
        )}
      </div>
      {house.accessories && house.accessories.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5 pl-[42px]">
          {house.accessories.map((a) => (
            <span key={a} className="rounded-md border border-line bg-white px-2 py-0.5 text-[11px] text-ink-soft">
              {a}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function UserRow({ user, t }) {
  const isSuper = user.user_type === "super";
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-mist/60 px-4 py-3 transition duration-200 hover:border-[#b9d3ea] hover:bg-white">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#185FA5]/10 text-[#185FA5]">
          <Icon name="user" style={{ fontSize: 14 }} />
        </span>
        <span className="truncate text-[13.5px] font-semibold text-ink">{user.username}</span>
      </div>
      <span
        className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
          isSuper ? "bg-[#185FA5] text-white" : "border border-line bg-white text-ink-soft"
        }`}
      >
        {isSuper && <Icon name="shield-check" style={{ fontSize: 11 }} />}
        {isSuper ? t("userTypeSuper") : t("userTypeNormal")}
      </span>
    </div>
  );
}

// หน้ารายละเอียดฟาร์ม — แสดงเป็น "การ์ดเดี่ยว" ต่อฟาร์มหนึ่งรายการ พร้อมปุ่ม/สไลด์ซ้าย-ขวา (แบบ carousel)
// เพื่อไล่ดูฟาร์มอื่นในชุดเดียวกันได้โดยไม่ต้องย้อนกลับไปหน้า My Farms
// รับ farms (รายการทั้งหมด) + index (ตำแหน่งเริ่มต้น) มาจาก Home ผ่าน navigate state
// ถ้าเปิดหน้านี้ตรงๆ (ไม่มี state มา เช่น refresh หน้า) จะ fallback ไปโหลด mock summary เดี่ยวแทน
export default function FarmDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  const initialFarms = location.state?.farms ?? (location.state?.farm ? [location.state.farm] : null);
  const initialIndex = location.state?.index ?? 0;

  const [farms, setFarms] = useState(initialFarms ?? []);
  const [loading, setLoading] = useState(!initialFarms);
  const [index, setIndex] = useState(initialIndex);
  const [direction, setDirection] = useState("next");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [signOutConfirmOpen, setSignOutConfirmOpen] = useState(false);
  const touchStartX = useRef(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/");
      return;
    }
    if (initialFarms) return;
    // เปิดหน้านี้ตรงๆ (ไม่ได้มาจากหน้า Home) — โหลด mock summary เดี่ยวแทน
    fetchHomeSummaryMock().then((data) => {
      setFarms([data]);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const count = farms.length;
  const farm = farms[index];

  const goTo = useCallback(
    (nextIndex, dir) => {
      if (count <= 1) return;
      setDirection(dir);
      setIndex((nextIndex + count) % count);
    },
    [count]
  );

  const goNext = useCallback(() => goTo(index + 1, "next"), [goTo, index]);
  const goPrev = useCallback(() => goTo(index - 1, "prev"), [goTo, index]);

  // คีย์ลัดแป้นพิมพ์: ลูกศรซ้าย/ขวาเลื่อนดูฟาร์มอื่น
  useEffect(() => {
    if (count <= 1) return;
    function onKeyDown(e) {
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [count, goNext, goPrev]);

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

  function handleSignOut() {
    clearAuth();
    navigate("/");
  }

  const houses = useMemo(() => farm?.houses || [], [farm]);
  const appUsers = useMemo(() => farm?.app_users || [], [farm]);

  return (
    <>
      <AppShellStyles />
      <style>{`
        @keyframes farmSlideInRight {
          from { opacity: 0; transform: translate3d(36px, 0, 0); }
          to { opacity: 1; transform: translate3d(0, 0, 0); }
        }
        @keyframes farmSlideInLeft {
          from { opacity: 0; transform: translate3d(-36px, 0, 0); }
          to { opacity: 1; transform: translate3d(0, 0, 0); }
        }
        .farm-slide-next { animation: farmSlideInRight 420ms cubic-bezier(0.22, 1, 0.36, 1) both; }
        .farm-slide-prev { animation: farmSlideInLeft 420ms cubic-bezier(0.22, 1, 0.36, 1) both; }
        .farm-nav-btn { transition: transform 200ms cubic-bezier(0.22,1,0.36,1), background 200ms ease, box-shadow 200ms ease, color 200ms ease; }
        .farm-nav-btn:hover { transform: translateY(-2px); }
        .farm-nav-btn:active { transform: translateY(0) scale(0.96); }
      `}</style>

      <div
        className="flex h-screen overflow-hidden"
        style={{ background: "linear-gradient(180deg, #eef3f9 0%, #e6edf6 100%)" }}
      >
        <IconSprite />

        <SidebarNav
          active="detail"
          extraNavItem={{ key: "detail", label: "Detail", icon: "info-circle", to: "/home/farm" }}
          width="w-80"
          mobileOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onSignOutClick={() => {
            setSidebarOpen(false);
            setSignOutConfirmOpen(true);
          }}
        />

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="flex items-center gap-3 bg-white px-4 py-4 shadow-[0_1px_0_rgba(15,23,42,0.06)] sm:px-10 sm:py-5">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="-ml-1 flex h-9 w-9 items-center justify-center rounded-lg text-ink-soft hover:bg-mist md:hidden"
                aria-label="Open menu"
              >
                <Icon name="menu" style={{ fontSize: 20 }} />
              </button>
              <button
                type="button"
                onClick={() => navigate("/home")}
                className="flex items-center gap-1.5 rounded-xl px-2 py-1.5 text-[13.5px] font-semibold text-ink-soft transition duration-200 hover:-translate-x-0.5 hover:text-[#185FA5]"
              >
                <Icon name="arrow-left" style={{ fontSize: 15 }} />
                {t("back")}
              </button>
            </div>

            <div className="mx-auto max-w-[820px] px-6 py-8 sm:py-10">
            {loading && (
              <div className="rounded-2xl border border-line bg-white p-10 text-center text-[13.5px] text-ink-soft">
                {t("loading")}
              </div>
            )}

            {!loading && farm && (
              <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
                {/* Hero + carousel controls */}
                <div className="app-hero-enter relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-[#0C447C] via-[#0A3A69] to-[#042C53] p-6 sm:p-8">
                  <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
                  <div className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-[#7DD3AA]/10 blur-3xl" />

                  <div key={index} className={`relative farm-slide-${direction}`}>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="max-w-[520px]">
                        <h1 className="text-[24px] font-bold leading-tight text-white sm:text-[28px]">{farm.farm_name}</h1>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2 border-t border-white/10 pt-5 text-[12.5px] text-white/60">
                      <span>{t("registrationDate")}: <span className="font-semibold text-white">{formatDate(farm.created_at)}</span></span>
                      <span>{t("lastUpdated")}: <span className="font-semibold text-white">{formatDate(farm.updated_at)}</span></span>
                      {farm.id && <span>{t("registrationId")}: <span className="font-semibold text-white">{farm.id}</span></span>}
                    </div>
                  </div>
                </div>

                {/* Detail sections */}
                <div key={`${index}-sections`} className={`flex flex-col gap-5 farm-slide-${direction}`}>
                  <SectionCard icon="home" title={t("farmInfoAddressTitle")} delay={0}>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4">
                      <Field label={t("farmNameCompany")} value={farm.farm_name} />
                      <Field label={t("companyName")} value={farm.farm_short} />
                      <Field label={t("numberOfHouses")} value={farm.house_count} />
                    </div>
                    <div className="my-5 border-t border-dashed border-line" />
                    <div className="rounded-xl bg-mist px-4 py-3.5 text-[13.5px] leading-6 text-ink">
                      {farm.address}, {farm.subdistrict} {farm.district}
                      <br />
                      {farm.province} {farm.postal_code}, {farm.country}
                      <span className="ml-1">&middot; {t("timezone")} {farm.timezone || "-"}</span>
                    </div>
                  </SectionCard>

                  <SectionCard icon="user" title={t("contactPerson")} delay={60}>
                    <div className="grid gap-x-4 gap-y-5 sm:grid-cols-3">
                      <Field label={t("contactName")} value={farm.contact_name} />
                      <Field label={t("phoneNumber")} value={farm.contact_phone} />
                      <Field label={t("email")} value={farm.contact_email} wrap />
                    </div>
                  </SectionCard>

                  <SectionCard icon="router" title={t("deviceInformation")} delay={120}>
                    <div className="mb-5 grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3">
                      <Field label={t("deviceModel")} value={farm.device_model} />
                      <Field label={t("numberOfHouses")} value={farm.house_count} />
                    </div>
                    {farm.platform === "tempview" && (
                      <p className="mb-4 text-[11.5px] text-ink-soft">{t("tempViewNoSnHint")}</p>
                    )}
                    <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-soft">
                      {t("houseDetailsTitle")}
                    </div>
                    <div className="space-y-2">
                      {houses.map((house) => (
                        <HouseRow key={house.id || house.serial_number || house.name} house={house} />
                      ))}
                      {houses.length === 0 && <p className="text-[13px] text-ink-soft">{t("noHouseData")}</p>}
                    </div>
                  </SectionCard>

                  <SectionCard icon="shield-check" title={t("appUsers")} delay={180}>
                    <div className="space-y-2">
                      {appUsers.map((u) => (
                        <UserRow key={u.id || u.username} user={u} t={t} />
                      ))}
                      {appUsers.length === 0 && <p className="text-[13px] text-ink-soft">{t("noAppUsers")}</p>}
                    </div>
                  </SectionCard>

                  <SectionCard icon="info-circle" title={t("otherSectionTitle")} delay={240}>
                    <div className="mb-4">
                      <p className="text-[12px] tracking-[0.03em] text-ink-soft">{t("note")}</p>
                      <p className="mt-0.5 text-[13.5px] text-ink">{farm.note || "-"}</p>
                    </div>
                    <div className="flex items-center gap-2.5 rounded-xl bg-mist px-4 py-3">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: farm.pdpa_consent ? "#16a34a" : "#94a3b8" }}
                      />
                      <span className="text-[13px] text-ink">
                        {farm.pdpa_consent ? t("pdpaAccepted") : t("pdpaNotAccepted")}
                      </span>
                    </div>
                  </SectionCard>

                  <p className="pb-2 text-center text-[11.5px] text-ink-soft">* {t("mockNotice")}</p>
                </div>
              </div>
            )}
            </div>
          </div>
        </div>

        <SignOutModal
          open={signOutConfirmOpen}
          onCancel={() => setSignOutConfirmOpen(false)}
          onConfirm={handleSignOut}
        />
      </div>
    </>
  );
}   