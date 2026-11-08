import { useEffect, useMemo, useRef, useState } from "react";
import Icon from "./Icon";
import modelData from "../data/modelData";
import { useLanguage } from "../i18n.jsx";

const USER_TYPE_LABEL = { normal: "User", super: "Super user" };

// ตรงกับ COMMUNICATION_OPTIONS ใน Step2DeviceInfo — เหลือแค่ TempView / SmartLink
// (silonic / farmnet ไม่ใช่ตัวเลือกการเชื่อมต่อแล้ว แต่เป็นหมวดอุปกรณ์ของตัวเอง)
const COMMUNICATION_OPTIONS = [
  { key: "tempview", labelKey: "communicationTempView" },
  { key: "smartlink", labelKey: "communicationSmartLink" },
];
const ALARM_OPTIONS = [
  { key: "alarm04", label: "Alarm 04" },
  { key: "alarm05", label: "Alarm 05" },
];

function summarizeModels(deviceModels) {
  if (!deviceModels || deviceModels.length === 0) return "";
  return deviceModels.map((dm) => modelData[dm.model]?.name ?? dm.model).join(", ");
}

function summarizeEggModels(eggModels) {
  if (!eggModels || eggModels.length === 0) return "";
  return eggModels.map((dm) => modelData[dm.model]?.name ?? dm.model).join(", ");
}

function summarizeSilonic(silonicModels) {
  if (!silonicModels || silonicModels.length === 0) return "";
  return silonicModels.map((dm) => modelData[dm.model]?.name ?? dm.model).join(", ");
}

function summarizeAlarms(alarms) {
  if (!alarms || alarms.length === 0) return "";
  return alarms.map((a) => ALARM_OPTIONS.find((o) => o.key === a.key)?.label ?? a.key).join(", ");
}

function summarizeCommunication(communication, t) {
  const labels = COMMUNICATION_OPTIONS.filter((o) => communication?.[o.key]).map((o) => t(o.labelKey));
  return labels.length ? labels.join(", ") : "";
}

// รวมช่องทางติดต่อ dealer ที่กรอกไว้ (phone / line / email / other) เป็น list ข้อความสำหรับหน้าสรุป
function summarizeDealerContact(data, t) {
  const parts = [];
  if (data.dealer_contact_phone) parts.push(`${t("phoneNumber")}: ${data.dealer_contact_phone}`);
  if (data.dealer_contact_line) parts.push(`${t("lineId")}: ${data.dealer_contact_line}`);
  if (data.dealer_contact_email) parts.push(`${t("email")}: ${data.dealer_contact_email}`);
  if (data.dealer_contact_other_value) {
    parts.push(`${data.dealer_contact_other_label || t("otherChannel")}: ${data.dealer_contact_other_value}`);
  }
  return parts;
}

function mergeCommunications(...comms) {
  const merged = { tempview: false, smartlink: false };
  comms.forEach((c) => {
    Object.keys(merged).forEach((k) => {
      if (c?.[k]) merged[k] = true;
    });
  });
  return merged;
}

function getSelectedModelKeys(houses) {
  const keys = [];
  (houses ?? []).forEach((h) => {
    if (!h?.model_enabled) return;
    (h.device_models ?? []).forEach((dm) => {
      if (dm?.model && !keys.includes(dm.model)) keys.push(dm.model);
    });
  });
  return keys;
}

function groupUsersByModel(appUsers, selectedModelKeys) {
  return selectedModelKeys.map((key) => ({
    key,
    label: modelData[key]?.name ?? key,
    users: appUsers.filter((u) => u.device_model === key),
  }));
}

function InfoRow({ label, value, fallback }) {
  return (
    <div className="py-1.5">
      <p className="text-[12px] tracking-[0.03em] text-ink-soft">{label}</p>
      <p className="mt-0.5 text-[13.5px] text-ink">
        {value ? value : <span className="text-[13.5px] text-alert">{fallback}</span>}
      </p>
    </div>
  );
}

function SummarySection({ title, hint, onEdit, children }) {
  const { t } = useLanguage();
  return (
    <div className="summary-section overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_2px_8px_rgba(22,35,61,0.035)]">
      <div className="flex items-center gap-3 border-b border-line bg-[#f4f8fc] px-5 py-3.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-tint text-brand-dark">
          <Icon name="clipboard-text" style={{ fontSize: 15 }} />
        </div>
        <div className="flex-1">
          <p className="text-[13.5px] font-bold text-ink">{title}</p>
          {hint && <p className="text-[12px] text-ink-soft">{hint}</p>}
        </div>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12.5px] font-semibold text-brand transition hover:bg-brand-tint"
          >
            {t("edit")}
            <Icon name="arrow-right" style={{ fontSize: 11 }} />
          </button>
        )}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function PdpaConsentModal({ onAccept, onClose }) {
  const { t } = useLanguage();
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const scrollContainerRef = useRef(null);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const isBottom = scrollTop + clientHeight >= scrollHeight - 2;
    setHasScrolledToBottom(isBottom);
  };

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) {
      if (el.scrollHeight <= el.clientHeight) {
        setHasScrolledToBottom(true);
      }
    }
  }, []);

  const PDPA_CONSENT_PARAGRAPHS = [
    t("pdpaConsentParagraph1"),
    t("pdpaConsentParagraph2"),
    t("pdpaConsentParagraph3"),
    t("pdpaConsentParagraph4"),
    t("pdpaConsentParagraph5"),
    t("pdpaConsentParagraph6"),
    t("pdpaConsentParagraph7"),
    t("pdpaConsentParagraph8"),
    t("pdpaConsentParagraph9"),
  ];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-ink/45 p-6">
      <div className="flex w-full max-w-lg flex-col overflow-hidden rounded-xl bg-white shadow-2xl" style={{ maxHeight: "85vh" }}>
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h3 className="text-lg font-bold text-ink">
            {t("pdpaConsentTitle")}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-soft transition hover:bg-mist hover:text-alert"
            aria-label={t("close") || "Close"}
          >
            <Icon name="x" style={{ fontSize: 18 }} />
          </button>
        </div>

        {/* เพิ่ม overscroll-contain เพื่อกัน Scroll ลามไปหน้าหลัง */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="overscroll-contain overflow-y-auto px-6 py-4"
        >
          {PDPA_CONSENT_PARAGRAPHS.map((p, i) => (
            <p key={i} className="mb-3 text-sm leading-6 text-ink last:mb-0">
              {p}
            </p>
          ))}
        </div>

        <div className="flex flex-col gap-2 border-t border-line px-6 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-line-strong px-4 py-2 text-sm font-semibold text-ink-soft transition hover:bg-mist"
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            onClick={onAccept}
            disabled={!hasScrolledToBottom}
            className={`rounded-xl px-4 py-2 text-sm font-semibold text-white transition ${hasScrolledToBottom
                ? "bg-brand hover:bg-brand-dark cursor-pointer"
                : "cursor-not-allowed bg-line-strong"
              }`}
          >
            {t("pdpaAccept")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Step4Confirm({ data, onChange, onGoTo }) {
  const { t } = useLanguage();
  const [showPdpaModal, setShowPdpaModal] = useState(false);

  const fullAddress = [data.address, data.subdistrict, data.district, data.province, data.postal_code, data.country]
    .filter(Boolean)
    .join(" ");

  const dealerContactParts = summarizeDealerContact(data, t);
  const houses = data.houses ?? [];
  const appUsers = data.app_users ?? [];
  const selectedModelKeys = useMemo(() => getSelectedModelKeys(houses), [houses]);
  const userGroups = useMemo(
    () => groupUsersByModel(appUsers, selectedModelKeys),
    [appUsers, selectedModelKeys]
  );

  const handlePdpaCheckboxChange = (e) => {
    if (e.target.checked) {
      setShowPdpaModal(true);
    } else {
      onChange({ ...data, pdpa_consent: false });
    }
  };

  const handlePdpaAccept = () => {
    onChange({ ...data, pdpa_consent: true });
    setShowPdpaModal(false);
  };

  return (
    <>
      <div className="form-step-header flex items-center gap-3 border-b border-line px-7 py-6 sm:px-9">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand text-white">
          <Icon name="shield-check" style={{ fontSize: 18 }} />
        </div>
        <div>
          <p className="mb-0.5 font-mono text-[11px] uppercase tracking-[0.06em] text-ink-soft">{t("part04")}</p>
          <h2 className="text-[18px] font-bold text-ink sm:text-[20px]">{t("confirmInformation")}</h2>
        </div>
      </div>
      <div className="form-step-body px-7 py-8 sm:px-9 sm:py-9">
        <p className="mb-4 text-[13.5px] text-ink-soft">
          {t("reviewHint")}
        </p>

        <div className="space-y-5">
          {/* ---------- ข้อมูลฟาร์ม ---------- */}
          <SummarySection title={t("farmSummary")} hint={t("farmSummaryHint")} onEdit={() => onGoTo?.(0)}>
            <div className="grid gap-x-4 gap-y-1 sm:grid-cols-2">
              <InfoRow label={t("farmNameCompany")} value={data.farm_name} fallback={t("notProvided")} />
              <InfoRow label={t("companyName")} value={data.farm_short} fallback={t("notProvided")} />
              <InfoRow label={t("numberOfHouses")} value={`${data.house_count} ${t("house")}${Number(data.house_count) > 1 ? "s" : ""}`} fallback={t("notProvided")} />
              <InfoRow label={t("timezone")} value={data.timezone} fallback={t("notProvided")} />
              <InfoRow label={t("address")} value={fullAddress} fallback={t("notProvided")} />
              <div className="py-1.5">
                <p className="text-[12px] tracking-[0.03em] text-ink-soft">{t("invitationKey")}</p>
                <p className="mt-0.5 text-[13.5px] text-ink">
                  {data.invitation_key || <span className="text-[13.5px] text-ink-soft">{t("notSpecified")}</span>}
                </p>
              </div>
            </div>
            <div className="mt-3 border-t border-line pt-3">
              <div className="grid gap-x-4 gap-y-1 sm:grid-cols-3">
                <InfoRow label={t("contactName")} value={data.contact_name} fallback={t("notProvided")} />
                <InfoRow label={t("phoneNumber")} value={data.contact_phone} fallback={t("notProvided")} />
                <InfoRow label={t("email")} value={data.contact_email} fallback={t("notProvided")} />
                <div className="py-1.5">
                  <p className="text-[12px] tracking-[0.03em] text-ink-soft">{t("dealerName")}</p>
                  <p className="mt-0.5 text-[13.5px] text-ink">
                    {data.dealer_name || <span className="text-[13.5px] text-alert">{t("notProvided")}</span>}
                  </p>
                </div>
                <div className="py-1.5 sm:col-span-2">
                  <p className="text-[12px] tracking-[0.03em] text-ink-soft">{t("dealerContact")}</p>
                  <p className="mt-0.5 text-[13.5px] text-ink">
                    {dealerContactParts.length > 0 ? (
                      dealerContactParts.join(" · ")
                    ) : (
                      <span className="text-[13.5px] text-alert">{t("notProvided")}</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </SummarySection>

          {/* ---------- ข้อมูลเครื่อง (ต่อ House — ตรงกับ Step2DeviceInfo) ---------- */}
          <SummarySection title={t("deviceSummaryShort")} hint={t("deviceSummaryHint")} onEdit={() => onGoTo?.(1)}>
            <div className="space-y-3">
              {houses.map((h, i) => {
                const fields = [
                  { label: t("deviceModel"), text: h.model_enabled ? summarizeModels(h.device_models) : "", missing: true },
                  { label: t("alarmController"), text: h.alarm_enabled ? summarizeAlarms(h.alarms) : "", missing: false },
                  { label: t("communicationSilonic"), text: h.silonic_enabled ? summarizeSilonic(h.silonic_models) : "", missing: false },
                  { label: t("egg"), text: h.egg_enabled ? summarizeEggModels(h.egg_models) : "", missing: false },
                  {
                    label: t("communication"),
                    text: summarizeCommunication(
                      mergeCommunications(
                        h.device_communication,
                        h.alarm_communication,
                        h.silonic_communication,
                        h.egg_communication,
                        h.communication
                      ),
                      t
                    ),
                    missing: true,
                  },
                ];
                return (
                  <div key={i} className="rounded-xl border border-line bg-white p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand text-[13px] font-bold text-white">
                        {i + 1}
                      </div>
                      <p className="text-[14px] font-bold text-ink">{h.name}</p>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5 border-t border-line pt-3 sm:grid-cols-3">
                      {fields.map((f) => (
                        <div key={f.label} className="min-w-0">
                          <p className="text-[10.5px] font-semibold uppercase tracking-[0.05em] text-ink-soft">{f.label}</p>
                          <p className="mt-0.5 truncate text-[13px] text-ink">
                            {f.text || (
                              <span className={`pill ${f.missing ? "pill-missing" : "pill-neutral"}`}>
                                {f.missing ? t("notProvided") : t("notSpecified")}
                              </span>
                            )}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {houses.length === 0 && (
                <div className="rounded-xl border border-dashed border-line-strong bg-mist/60 p-8 text-center text-[13.5px] text-ink-soft">
                  {t("noHouseData")}
                </div>
              )}
            </div>
          </SummarySection>

          {/* ---------- ผู้ใช้งานแอป (แยกตามรุ่นเครื่อง — ตรงกับการจัดกลุ่มใน Step3Users) ---------- */}
          <SummarySection title={t("appUsersSummaryShort")} hint={t("appUsersSummaryHint", { count: appUsers.length })} onEdit={() => onGoTo?.(2)}>
            <div className="space-y-3">
              {userGroups.map((group) => (
                <div key={group.key} className="overflow-hidden rounded-xl border border-line bg-white">
                  <div className="flex items-center gap-2 border-b border-line bg-mist px-4 py-2.5">
                    <Icon name="user" style={{ fontSize: 13 }} className="text-brand" />
                    <p className="text-[13px] font-semibold text-ink">{group.label}</p>
                    <span className="pill pill-brand">{group.users.length}</span>
                  </div>
                  <div className="divide-y divide-line">
                    {group.users.map((u, i) => (
                      <div key={i} className="flex flex-wrap items-center gap-x-6 gap-y-1.5 px-4 py-3">
                        <div className="flex min-w-[150px] flex-1 items-center gap-1.5 font-mono text-[13px] text-ink">
                          <Icon name="user" style={{ fontSize: 11 }} className="shrink-0 text-ink-soft" />
                          {u.username || <span className="pill pill-missing">{t("notProvided")}</span>}
                        </div>
                        <div className="min-w-[160px] flex-1 truncate text-[13px] text-ink-soft">
                          {u.email || <span className="pill pill-missing">{t("notProvided")}</span>}
                        </div>
                        <span className="pill pill-neutral shrink-0">{USER_TYPE_LABEL[u.user_type] ?? u.user_type}</span>
                      </div>
                    ))}
                    {group.users.length === 0 && (
                      <div className="px-4 py-6 text-center text-[13px] text-ink-soft">{t("noUsersInGroup")}</div>
                    )}
                  </div>
                </div>
              ))}
              {userGroups.length === 0 && (
                <p className="px-3 py-6 text-center text-ink-soft">{t("noUsersInGroup")}</p>
              )}
            </div>
          </SummarySection>
        </div>

        {/* ---------- หมายเหตุ + PDPA (ของเดิม) ---------- */}
        <label className="mt-5 block border-t border-line pt-5 text-[13.5px] font-semibold text-ink">
          {t("note")}
          <textarea
            className="mt-1.5 min-h-[84px] w-full resize-none rounded-xl border border-line-strong bg-white px-3.5 py-2.5 text-[13.5px] font-normal text-ink shadow-sm outline-none transition hover:border-brand/50 focus:border-brand focus:ring-4 focus:ring-brand-tint"
            rows="3"
            placeholder={t("notePlaceholder")}
            value={data.note}
            onChange={(e) => onChange({ ...data, note: e.target.value })}
          />
        </label>
        <label className="mt-5 flex items-start gap-2.5 border-t border-line pt-4 text-[13.5px] text-ink-soft">
          <input
            className="mt-0.5 h-4 w-4 accent-brand-dark"
            type="checkbox"
            checked={data.pdpa_consent}
            onChange={handlePdpaCheckboxChange}
          />
          {t("pdpaConsent")}
        </label>
      </div>
      {showPdpaModal && (
        <PdpaConsentModal onAccept={handlePdpaAccept} onClose={() => setShowPdpaModal(false)} />
      )}
    </>
  );
}
