import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, useBlocker, useNavigate, useParams } from "react-router-dom";
import { AppShellStyles, LoadingPanel, SidebarNav, SignOutModal } from "../components/AppShell";
import { getAuth } from "../api/auth";
import StepRail from "../components/StepRail";
import Step1CustomerInfo from "../components/Step1CustomerInfo";
import Step2DeviceInfo from "../components/Step2DeviceInfo";
import Step3Users from "../components/Step3Users";
import Step4Confirm from "../components/Step4Confirm";
import Icon from "../components/Icon";
import { createRegistration, fetchEquipmentModels, getRegistration, signOut, updateRegistration } from "../api/client";
import { useLanguage } from "../i18n.jsx";
import { RegistrationInputError, registrationErrorMessage, registrationPayload } from "../utils/registrationPayload";
import { registrationFormData } from "../utils/registrationModels";

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
const RETURN_HOME_SECONDS = 30;

function removeLegacyDraft() {
  const auth = getAuth();
  const account = auth?.token && (auth.email || auth.username);
  const key = `farm-registration-draft:v1:${account ? encodeURIComponent(account) : "guest"}`;
  try {
    const storage = account ? window.localStorage : window.sessionStorage;
    storage.removeItem(key);
  } catch {
    // Storage can be unavailable.
  }
}

function registrationDraftKey(farmId, isAdmin) {
  const auth = getAuth();
  const account = auth?.token ? auth.email || auth.username : null;
  const form = farmId ? `${isAdmin ? "admin" : "customer"}:${farmId}` : "new";
  return `farm-registration-draft:v2:${encodeURIComponent(JSON.stringify([account, form]))}`;
}

function readDraft(key) {
  try {
    const draft = JSON.parse(window.sessionStorage.getItem(key));
    if (draft && Array.isArray(draft.data?.houses) && Array.isArray(draft.data.app_users)
      && Number.isInteger(draft.step) && draft.step >= 0 && draft.step <= 3) {
      return draft;
    }
  } catch {
    // Start from the server or the empty form if browser storage cannot be read.
  }
  return null;
}

function storeDraft(key, draft) {
  try {
    if (draft) window.sessionStorage.setItem(key, JSON.stringify(draft));
    else window.sessionStorage.removeItem(key);
  } catch {
    // Continue editing in memory when browser storage is unavailable.
  }
}

function LeaveDraftDialog({ blocker, onDiscard }) {
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
        <button type="button" onClick={() => {
          onDiscard();
          blocker.proceed();
        }} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white">
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

export function FarmEditPage({ isAdmin = false }) {
  const { farmId } = useParams();
  return <FarmEditLoader key={`${isAdmin ? "admin" : "customer"}-${farmId}`} farmId={farmId} isAdmin={isAdmin} />;
}

function FarmEditLoader({ farmId, isAdmin }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [registration, setRegistration] = useState(null);
  const [error, setError] = useState("");
  const returnTo = isAdmin ? "/admin" : "/home";

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const record = await getRegistration(farmId, isAdmin, controller.signal);
        if (record.farm.status === "APPROVE") {
          if (!controller.signal.aborted) setError("farmEditApproved");
          return;
        }
        const catalog = await fetchEquipmentModels(controller.signal);
        if (!controller.signal.aborted) {
          setRegistration({ data: registrationFormData(record, catalog), isDealer: record.farm.user?.account_type === "dealer" });
        }
      } catch {
        if (!controller.signal.aborted) setError("farmEditLoadError");
      }
    }
    load();
    return () => controller.abort();
  }, [farmId, isAdmin]);

  if (!registration) {
    return (
      <>
        <AppShellStyles />
        <div className="flex h-screen overflow-hidden bg-gradient-to-b from-[#eef3f9] to-[#e6edf6]">
          <SidebarNav
            active="home"
            homeTo={returnTo}
            width="w-80"
            mobileOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            onSignOutClick={() => {
              setSidebarOpen(false);
              setSignOutOpen(true);
            }}
          />
          <main className="min-w-0 flex-1 overflow-y-auto">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label={t("openMenu")}
              className="fixed left-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-600 shadow-md md:hidden"
            >
              <Icon name="menu" style={{ fontSize: 18 }} />
            </button>
            <div className="mx-auto w-full max-w-[1200px] px-6 pb-6 pt-16 sm:pb-8 sm:pt-8">
              {error ? (
                <div className="rounded-lg border border-slate-200 bg-white p-10 text-center text-sm text-ink-soft">
                  <p role="status">{t(error)}</p>
                  <Link className="mt-2 inline-block text-brand underline" to={returnTo}>{t("back")}</Link>
                </div>
              ) : (
                <LoadingPanel />
              )}
            </div>
          </main>
          <SignOutModal
            open={signOutOpen}
            onCancel={() => setSignOutOpen(false)}
            onConfirm={async () => {
              await signOut();
              navigate("/", { replace: true });
            }}
          />
        </div>
      </>
    );
  }
  return <CustomerForm initialValues={registration.data} isDealer={registration.isDealer} isAdmin={isAdmin} />;
}

export default function CustomerForm({ initialValues = initialData, isDealer = getAuth()?.account_type === "dealer", isAdmin = false }) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const editing = Boolean(initialValues.id);
  const returnTo = isAdmin ? "/admin" : "/home";
  const [draftKey] = useState(() => registrationDraftKey(initialValues.id, isAdmin));
  const [restoredDraft] = useState(() => readDraft(draftKey));
  const [current, setCurrent] = useState(restoredDraft?.step ?? 0);
  const [data, setData] = useState(restoredDraft?.data ?? initialValues);
  const [editor, setEditor] = useState(restoredDraft?.editor ?? null);
  const [showValidation, setShowValidation] = useState(false);
  const scrollRef = useRef(null);
  const validation = useMemo(() => {
    try {
      return { payload: registrationPayload(data, t, isDealer, editing ? initialValues : null) };
    } catch (error) {
      if (!(error instanceof RegistrationInputError)) throw error;
      return { error };
    }
  }, [data, editing, initialValues, isDealer, t]);
  const [submitting, setSubmitting] = useState(false);
  const [editConflict, setEditConflict] = useState(
    () => editing && Boolean(restoredDraft) && restoredDraft.data.date_edit !== initialValues.date_edit,
  );
  const [submitError, setSubmitError] = useState(null);
  const submitErrorMessage = submitError?.translationKey
    ? t(submitError.translationKey)
    : submitError ? registrationErrorMessage(submitError.cause, t) : "";
  const [done, setDone] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(RETURN_HOME_SECONDS);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [signOutConfirmOpen, setSignOutConfirmOpen] = useState(false);
  const allowLeave = useRef(false);
  const activeData = { ...data, houses: data.houses.slice(0, Number(data.house_count)) };
  const hasDraft = !done && (editor?.dirty || JSON.stringify(activeData) !== JSON.stringify(initialValues));
  const blocker = useBlocker(({ currentLocation, nextLocation }) => (
    Boolean(hasDraft) && !allowLeave.current
    && currentLocation.pathname !== nextLocation.pathname
  ));

  useEffect(removeLegacyDraft, []);

  useLayoutEffect(() => {
    if (allowLeave.current) return;
    storeDraft(draftKey, hasDraft ? { data, editor, step: current } : null);
  }, [current, data, draftKey, editor, hasDraft]);

  useEffect(() => {
    function discardOnAccountChange() {
      allowLeave.current = true;
      storeDraft(draftKey, null);
    }
    window.addEventListener("auth:changed", discardOnAccountChange);
    return () => window.removeEventListener("auth:changed", discardOnAccountChange);
  }, [draftKey]);

  useEffect(() => {
    if (!done) return;
    const deadline = Date.now() + RETURN_HOME_SECONDS * 1000;
    const countdown = window.setInterval(() => {
      const remaining = Math.ceil((deadline - Date.now()) / 1000);
      if (remaining <= 0) {
        window.clearInterval(countdown);
        navigate("/home", { replace: true });
        return;
      }
      setSecondsRemaining(remaining);
    }, 1000);
    return () => window.clearInterval(countdown);
  }, [done, navigate]);

  useEffect(() => {
    if (!hasDraft) return;
    function beforeUnload(event) {
      if (allowLeave.current) return;
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

  function discardDraft() {
    allowLeave.current = true;
    storeDraft(draftKey, null);
  }

  async function handleSignOut() {
    discardDraft();
    await signOut();
    navigate("/", { replace: true });
  }

  async function handleSubmit() {
    if (editConflict) return;
    setSubmitError(null);
    if (validation.error) {
      setShowValidation(true);
      setCurrent(validation.error.step);
      scrollRef.current?.scrollTo({ top: 0 });
      return;
    }
    if (!editing && !data.pdpa_consent) {
      setSubmitError({ translationKey: "pdpaConsentRequired" });
      return;
    }

    setSubmitting(true);
    try {
      const { payload } = validation;
      if (editing) {
        await updateRegistration(payload, isAdmin);
        if (allowLeave.current) return;
        discardDraft();
        navigate(returnTo, { replace: true });
      } else {
        await createRegistration(payload);
        if (allowLeave.current) return;
        discardDraft();
        setDone(true);
      }
    } catch (err) {
      if (editing && err.response?.status === 409 && err.response.data?.code === "farm_edit_conflict") {
        setEditConflict(true);
      } else {
        setSubmitError({ cause: err });
      }
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
          extraNavItem={{ key: "register", labelKey: "newRegister", icon: "clipboard-text", to: "/customer" }}
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

          <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
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
                    <Link to="/home" replace className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark">
                      <Icon name="home" style={{ fontSize: 15 }} />
                      {t("registrationBackToHome")}
                    </Link>
                    <p className="mt-3 text-[13px] text-ink-soft tabular-nums">
                      {t("registrationHomeCountdown", { seconds: secondsRemaining })}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="editorial-content mx-auto max-w-[1160px] px-5 pb-24 pt-16 sm:px-10 lg:px-14">
                <div className="editorial-form min-w-0">
                  <div className="editorial-header px-5 py-6 sm:px-8 sm:py-7">
                    <h1 className="mb-6 text-[30px] font-bold tracking-[-0.03em] text-white sm:text-[40px]">
                      {t(editing ? "farmEditTitle" : "newRegistrationTitle")}
                    </h1>
                    {editing && <Link className="mb-4 inline-block text-sm font-semibold text-white underline" to={returnTo}>{t("cancel")}</Link>}
                    <div className="editorial-step-nav">
                      <StepRail current={current} completedSteps={validation.error?.step ?? 3} onGoTo={setCurrent} />
                    </div>
                  </div>

                  {showValidation && validation.error?.step === current && (
                    <p role="alert" className="mx-7 mt-4 rounded-lg bg-alert-tint px-4 py-3 text-sm text-alert sm:mx-9">
                      {validation.error.message}
                    </p>
                  )}

                  <div className={`${current === 0 ? "block" : "hidden"}`}>
                    <Step1CustomerInfo data={data} onChange={setData} editor={editor?.type === "dealer" ? editor : null} onEditorChange={setEditor} />
                    <StepFooter onNext={next} nextLabel={t("next")} />
                  </div>

                  <div className={`${current === 1 ? "block" : "hidden"}`}>
                    <Step2DeviceInfo active={current === 1} data={data} onChange={setData} editor={editor?.type === "equipment" ? editor : null} onEditorChange={setEditor} />
                    <StepFooter onBack={back} onNext={next} nextLabel={t("next")} />
                  </div>

                  <div className={`${current === 2 ? "block" : "hidden"}`}>
                    <Step3Users data={data} onChange={setData} isDealer={isDealer} allowModelChange={editing} />
                    <StepFooter onBack={back} onNext={next} nextLabel={t("next")} />
                  </div>

                  <div className={`${current === 3 ? "block" : "hidden"}`}>
                    <Step4Confirm data={data} onChange={setData} onGoTo={setCurrent} />
                    {editConflict && (
                      <div className="mx-7 mb-4 rounded-lg bg-alert-tint px-4 py-3 text-sm text-alert sm:mx-9">
                        <p role="alert">{t("farmEditConflict")}</p>
                        <Link to="." target="_blank" rel="noopener" className="mt-2 inline-block font-semibold underline">
                          {t("farmEditOpenLatest")}
                        </Link>
                      </div>
                    )}
                    <StepFooter
                      onBack={back}
                      onNext={handleSubmit}
                      nextLabel={submitting ? t("submitting") : t(editing ? "save" : "submit")}
                      nextIcon="check"
                      nextDisabled={submitting || editConflict || (editing && !hasDraft)}
                      error={submitErrorMessage}
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
        {blocker.state === "blocked" && <LeaveDraftDialog blocker={blocker} onDiscard={discardDraft} />}
      </div>
    </>
  );
}
