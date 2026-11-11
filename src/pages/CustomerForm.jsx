import { useEffect, useRef, useState } from "react";
import { useBlocker, useNavigate } from "react-router-dom";
import { AppShellStyles, SidebarNav, SignOutModal } from "../components/AppShell";
import { clearAuth, getAuth } from "../api/auth";
import StepRail from "../components/StepRail";
import Step1CustomerInfo from "../components/Step1CustomerInfo";
import Step2DeviceInfo from "../components/Step2DeviceInfo";
import Step3Users from "../components/Step3Users";
import Step4Confirm from "../components/Step4Confirm";
import Icon from "../components/Icon";
import { createRegistration } from "../api/client";
import { useLanguage } from "../i18n.jsx";
import { registrationErrorMessage, registrationPayload } from "../utils/registrationPayload";

const initialData = {
  farm_name: "",
  company_name: "",
  farm_short: "",
  house_count: 1,
  address: "",
  subdistrict: "",
  district: "",
  province: "",
  country: "",
  postal_code: "",
  timezone: "",
  contact_name: "",
  contact_phone: "",
  contact_email: "",
  dealer_name: "",
  dealer_contact_phone: "",
  dealer_contact_line: "",
  dealer_contact_email: "",
  dealer_contact_other_label: "",
  dealer_contact_other_value: "",
  platform: "",
  device_model: "",
  houses: [{ name: "House 1", serial_number: "" }],
  app_users: [],
  note: "",
  pdpa_consent: false,
};
const emptyDraftData = JSON.stringify(initialData);

function removeLegacyDraft() {
  const auth = getAuth();
  const account = auth?.token && (auth.email || auth.username);
  const key = `farm-registration-draft:v1:${account ? encodeURIComponent(account) : "guest"}`;
  try {
    const storage = account ? window.localStorage : window.sessionStorage;
    storage.removeItem(key);
  } catch {
    // Storage can be unavailable. The new form only uses React state.
  }
}

function LeaveDraftDialog({ blocker }) {
  const { t } = useLanguage();
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="leave-draft-title"
      aria-describedby="leave-draft-message"
      onCancel={(event) => {
        event.preventDefault();
        blocker.reset();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl border border-line bg-white p-6 text-ink shadow-xl backdrop:bg-ink/45"
    >
      <h2 id="leave-draft-title" className="text-lg font-bold">{t("leaveRegistrationTitle")}</h2>
      <p id="leave-draft-message" className="mt-2 text-sm text-ink-soft">
        {t("leaveRegistrationDiscard")}
      </p>
      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <button type="button" onClick={() => blocker.reset()} className="rounded-lg border border-line-strong px-4 py-2 text-sm font-semibold">
          {t("stayOnRegistration")}
        </button>
        <button type="button" onClick={() => blocker.proceed()} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white">
          {t("leaveRegistration")}
        </button>
      </div>
    </dialog>
  );
}

// แถบปุ่มท้ายแต่ละสเต็ป — รวมไว้ที่เดียวแทนที่จะก็อปปี้ 4 รอบ เพื่อให้หน้าตา/สเปซซิ่งตรงกันทุกสเต็ป
function StepFooter({ onBack, onNext, nextLabel, nextIcon = "arrow-right", nextDisabled = false, error }) {
  const { t } = useLanguage();
  return (
    <div className="border-t border-line bg-mist/40 px-7 py-5 sm:px-9">
      {error && (
        <div className="mb-3 flex items-start gap-2 rounded-control border border-alert-tint bg-alert-tint px-3.5 py-2.5 text-[12.5px] leading-5 text-alert">
          <Icon name="info-circle" style={{ fontSize: 14 }} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      <div className="flex items-center justify-between gap-3">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 rounded-control px-3 py-2 text-sm font-semibold text-ink-soft transition hover:bg-white hover:text-ink"
          >
            <Icon name="arrow-left" style={{ fontSize: 13 }} />
            <span>{t("back")}</span>
          </button>
        ) : (
          <span />
        )}
        {onNext && (
          <button
            type="button"
            onClick={onNext}
            disabled={nextDisabled}
            className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-55"
          >
            {nextLabel}
            <Icon name={nextIcon} style={{ fontSize: 14 }} />
          </button>
        )}
      </div>
    </div>
  );
}

export default function CustomerForm() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [current, setCurrent] = useState(0);
  const [data, setData] = useState(initialData);
  const [editor, setEditor] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [signOutConfirmOpen, setSignOutConfirmOpen] = useState(false);
  const leavingViaSignOut = useRef(false);
  const hasDraft = !done && (editor?.dirty || JSON.stringify(data) !== emptyDraftData);
  const blocker = useBlocker(({ currentLocation, nextLocation }) => (
    Boolean(hasDraft) && !leavingViaSignOut.current
    && currentLocation.pathname !== nextLocation.pathname
  ));

  useEffect(removeLegacyDraft, []);

  useEffect(() => {
    if (!hasDraft) return;
    function beforeUnload(event) {
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [hasDraft]);

  function next() {
    if (current < 3) setCurrent(current + 1);
  }
  function back() {
    if (current > 0) setCurrent(current - 1);
  }

  function handleSignOut() {
    leavingViaSignOut.current = true;
    clearAuth();
    navigate("/");
  }

  async function handleSubmit() {
    setError("");
    if (!data.pdpa_consent) {
      setError(t("pdpaConsentRequired"));
      return;
    }

    setSubmitting(true);
    try {
      await createRegistration(registrationPayload(data, t, getAuth()?.account_type === "dealer"));
      setDone(true);
    } catch (err) {
      setError(registrationErrorMessage(err, t));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <AppShellStyles />
      <div className="editorial-page flex h-screen overflow-hidden">
        <SidebarNav
          active="register"
          extraNavItem={{ key: "register", label: "Register", icon: "clipboard-text", to: "/customer" }}
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
            className="fixed left-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-600 shadow-[0_6px_18px_rgba(15,23,42,0.18)] md:hidden"
            aria-label={t("openMenu")}
          >
            <Icon name="menu" style={{ fontSize: 18 }} />
          </button>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {done ? (
              <div className="grid grid-cols-1 px-6 pb-20 pt-16 sm:pt-12">
                <div className="mx-auto w-full max-w-[600px] overflow-hidden rounded-xl border border-slate-200 bg-white">
                  <div className="px-8 py-14 text-center">
                    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-good-tint text-good">
                      <Icon name="circle-check" style={{ fontSize: 32 }} />
                    </div>
                    <h2 className="mb-2 font-['Space_Grotesk'] text-[22px] font-semibold text-ink">
                      {t("success")}
                    </h2>
                    <p className="text-[13.5px] leading-6 text-ink-soft">
                      {t("submissionSuccessMessage", { farm: data.farm_name })}
                    </p>
                    <p className="mt-2 text-[13.5px] leading-6 text-ink-soft">
                      {t("submissionSuccessTimeframe")}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="editorial-content mx-auto max-w-[1160px] px-5 pb-24 pt-16 sm:px-10 lg:px-14">
                <div className="editorial-form min-w-0">
                  <div className="editorial-header px-5 py-6 sm:px-8 sm:py-7">
                    <h1 className="mb-6 text-[30px] font-bold tracking-[-0.03em] text-white sm:text-[40px]">
                      {t("newRegistrationTitle")}
                    </h1>
                    <div className="editorial-step-nav">
                      <StepRail current={current} onGoTo={setCurrent} />
                    </div>
                  </div>

                  <div className={`${current === 0 ? "block" : "hidden"}`}>
                    <Step1CustomerInfo data={data} onChange={setData} editor={editor?.type === "dealer" ? editor : null} onEditorChange={setEditor} />
                    <StepFooter onNext={next} nextLabel={t("next")} />
                  </div>

                  <div className={`${current === 1 ? "block" : "hidden"}`}>
                    <Step2DeviceInfo active={current === 1} data={data} onChange={setData} editor={editor?.type === "equipment" ? editor : null} onEditorChange={setEditor} />
                    <StepFooter onBack={back} onNext={next} nextLabel={t("next")} />
                  </div>

                  <div className={`${current === 2 ? "block" : "hidden"}`}>
                    <Step3Users data={data} onChange={setData} isDealer={getAuth()?.account_type === "dealer"} />
                    <StepFooter onBack={back} onNext={next} nextLabel={t("next")} />
                  </div>

                  <div className={`${current === 3 ? "block" : "hidden"}`}>
                    <Step4Confirm data={data} onChange={setData} onGoTo={setCurrent} />
                    <StepFooter
                      onBack={back}
                      onNext={handleSubmit}
                      nextLabel={submitting ? t("submitting") : t("submit")}
                      nextIcon="check"
                      nextDisabled={submitting}
                      error={error}
                    />
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
        {blocker.state === "blocked" && <LeaveDraftDialog blocker={blocker} />}
      </div>
    </>
  );
}
