import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShellStyles, SidebarNav, SignOutModal } from "../components/AppShell";
import { IconSprite } from "../components/IconSprite";
import Icon from "../components/Icon";
import { getAuth, clearAuth } from "../api/auth";
import { useLanguage } from "../i18n.jsx";

function maskEmail(email) {
  if (!email || !email.includes("@")) return email || "-";
  const [local, domain] = email.split("@");
  const visible = local.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(local.length - 2, 3))}@${domain}`;
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-[12px] tracking-[0.03em] text-ink-soft">{label}</p>
      <p className="mt-0.5 truncate text-[13.5px] text-ink">{value || "-"}</p>
    </div>
  );
}

export default function AccountPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [auth] = useState(getAuth());
  const [signOutConfirmOpen, setSignOutConfirmOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function handleSignOut() {
    clearAuth();
    navigate("/");
  }

  const fullName = [auth?.first_name, auth?.last_name].filter(Boolean).join(" ") || "-";
  const avatarInitial = (auth?.first_name || auth?.username || "?").trim().charAt(0).toUpperCase();

  return (
    <>
      <AppShellStyles />
      <div className="flex h-screen overflow-hidden bg-gradient-to-b from-[#eef3f9] to-[#e6edf6]">
        <IconSprite />

        <SidebarNav
          active="account"
          width="w-80"
          mobileOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onSignOutClick={() => {
            setSidebarOpen(false);
            setSignOutConfirmOpen(true);
          }}
        />

        <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
          {/* ปุ่มเปิดเมนู — แสดงเฉพาะจอมือถือ (เดสก์ท็อปใช้แถบเมนูซ้ายที่แสดงตลอดอยู่แล้ว) */}
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="fixed left-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink-soft shadow-[0_6px_18px_rgba(15,23,42,0.18)] md:hidden"
            aria-label="Open menu"
          >
            <Icon name="menu" style={{ fontSize: 18 }} />
          </button>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto flex min-h-full w-full max-w-[820px] flex-col px-6 pb-16 pt-16 sm:pt-10">
              <div className="m-auto w-full">
                <button
                  type="button"
                  onClick={() => navigate("/home")}
                  className="mb-5 flex items-center gap-1.5 rounded-xl px-1 py-1.5 text-[13.5px] font-semibold text-ink-soft transition duration-200 hover:-translate-x-0.5 hover:text-brand-dark"
                >
                  <Icon name="arrow-left" style={{ fontSize: 15 }} />
                  {t("back")}
                </button>

                <div className="mb-7">
                  <h2 className="text-[26px] font-bold tracking-[-0.02em] text-ink">{t("accountTitle")}</h2>
                  <p className="mt-1 text-[13.5px] text-ink-soft">{t("accountSubtitle")}</p>
                </div>

                <div className="app-card-enter app-soft-card overflow-hidden rounded-2xl border border-line bg-white hover:border-[#c9dcee] hover:shadow-[0_16px_32px_rgba(15,23,42,0.06)]">
                  <div className="flex items-center gap-4 border-b border-line bg-gradient-to-br from-[#0C447C] via-[#0A3A69] to-[#042C53] px-6 py-6 sm:px-8">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/15 text-xl font-bold text-white ring-2 ring-white/30">
                      {avatarInitial}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[16px] font-semibold text-white">{fullName}</p>
                      <p className="truncate text-[12.5px] text-white/70">{maskEmail(auth?.username)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-x-6 gap-y-5 p-6 sm:grid-cols-3 sm:p-8">
                    <Field label={t("firstNameLabel")} value={auth?.first_name} />
                    <Field label={t("lastNameLabel")} value={auth?.last_name} />
                    <Field label={t("emailLabel")} value={maskEmail(auth?.username)} />
                  </div>
                </div>
              </div>
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