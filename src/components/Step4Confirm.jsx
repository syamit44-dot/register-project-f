import { useEffect, useMemo, useRef, useState } from "react";
import Icon from "./Icon";
import modelData from "../data/modelData";
import { getSelectedControllerModels } from "../utils/registrationModels";
import { useLanguage } from "../i18n.jsx";

const USER_TYPE_KEYS = { normal: "userTypeNormal", super: "userTypeSuper" };

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
  return deviceModels.map((dm) => dm.model_name ?? modelData[dm.model]?.name ?? dm.model).join(", ");
}

function summarizeEggModels(eggModels) {
  if (!eggModels || eggModels.length === 0) return "";
  return eggModels.map((dm) => dm.model_name ?? dm.model).join(", ");
}

function summarizeSilonic(silonicModels) {
  if (!silonicModels || silonicModels.length === 0) return "";
  return silonicModels.map((dm) => dm.model_name ?? dm.model).join(", ");
}

function summarizeAlarms(alarms) {
  if (!alarms || alarms.length === 0) return "";
  return alarms.map((a) => a.model_name ?? ALARM_OPTIONS.find((o) => o.key === a.key)?.label ?? a.key).join(", ");
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

function groupUsersByModel(appUsers, selectedModels) {
  return Array.from(selectedModels, ([key, label]) => ({
    key,
    label,
    users: appUsers.filter((u) => u.device_model === key),
  }));
}

function InfoRow({ label, value, fallback, optional = false, className = "" }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <dt className="text-xs font-medium text-ink-soft">{label}</dt>
      <dd className="mt-1 break-words text-sm text-ink">
        {value || <span className={optional ? "text-ink-soft" : "text-alert"}>{fallback}</span>}
      </dd>
    </div>
  );
}

function SummarySection({ icon, title, hint, onEdit, children }) {
  const { t } = useLanguage();
  return (
    <section>
      <div className="mb-5 flex items-center gap-3 border-b border-line pb-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-tint text-brand-dark">
          <Icon name={icon} style={{ fontSize: 15 }} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-[12.5px] font-bold uppercase tracking-[0.06em] text-brand-dark">{title}</h3>
          {hint && <p className="mt-0.5 text-xs text-ink-soft">{hint}</p>}
        </div>
        <button
          type="button"
          onClick={onEdit}
          aria-label={`${t("edit")} ${title}`}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-line-strong bg-white px-3 text-[12.5px] font-semibold text-brand transition hover:border-brand hover:bg-brand-tint focus-visible:outline-brand"
        >
          <Icon name="edit" style={{ fontSize: 12 }} />
          {t("edit")}
        </button>
      </div>
      {children}
    </section>
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
  const selectedModels = useMemo(() => getSelectedControllerModels(houses), [houses]);
  const userGroups = useMemo(
    () => groupUsersByModel(appUsers, selectedModels),
    [appUsers, selectedModels]
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
        <p className="mb-8 text-[13.5px] leading-6 text-ink-soft">{t("reviewHint")}</p>

        <div className="space-y-8">
          <SummarySection icon="barn" title={t("farmSummary")} onEdit={() => onGoTo?.(0)}>
            <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
              <InfoRow label={t("farmNameCompany")} value={data.farm_name} fallback={t("notProvided")} />
              <InfoRow label={t("companyName")} value={data.farm_short} fallback={t("notProvided")} />
              <InfoRow label={t("numberOfHouses")} value={`${data.house_count} ${t("house")}${Number(data.house_count) > 1 ? "s" : ""}`} fallback={t("notProvided")} />
              <InfoRow label={t("timezone")} value={data.timezone} fallback={t("notProvided")} />
              <InfoRow label={t("address")} value={fullAddress} fallback={t("notProvided")} />
              <InfoRow label={t("invitationKey")} value={data.invitation_key} fallback={t("notSpecified")} optional />
            </dl>
            <dl className="mt-5 grid gap-x-6 gap-y-4 border-t border-line pt-5 sm:grid-cols-2 lg:grid-cols-3">
              <InfoRow label={t("contactName")} value={data.contact_name} fallback={t("notProvided")} />
              <InfoRow label={t("phoneNumber")} value={data.contact_phone} fallback={t("notProvided")} />
              <InfoRow label={t("email")} value={data.contact_email} fallback={t("notProvided")} />
              <InfoRow label={t("dealerName")} value={data.dealer_name} fallback={t("notProvided")} />
              <InfoRow label={t("dealerContact")} value={dealerContactParts.join(" · ")} fallback={t("notProvided")} className="lg:col-span-2" />
            </dl>
          </SummarySection>

          <SummarySection icon="device" title={t("deviceSummary")} onEdit={() => onGoTo?.(1)}>
            <ul className="divide-y divide-line">
              {houses.map((h, i) => {
                const fields = [
                  { label: t("deviceModel"), value: h.model_enabled ? summarizeModels(h.device_models) : "" },
                  { label: t("alarmController"), value: h.alarm_enabled ? summarizeAlarms(h.alarms) : "", optional: true },
                  { label: t("communicationSilonic"), value: h.silonic_enabled ? summarizeSilonic(h.silonic_models) : "", optional: true },
                  { label: t("egg"), value: h.egg_enabled ? summarizeEggModels(h.egg_models) : "", optional: true },
                  {
                    label: t("communication"),
                    value: summarizeCommunication(
                      mergeCommunications(
                        h.device_communication,
                        h.alarm_communication,
                        h.silonic_communication,
                        h.egg_communication,
                        h.communication
                      ),
                      t
                    ),
                  },
                ];
                return (
                  <li key={i} className="py-4 first:pt-0 last:pb-0">
                    <h4 className="flex items-center gap-2.5 break-words text-sm font-bold text-ink">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand text-xs text-white" aria-hidden="true">
                        {i + 1}
                      </span>
                      <span className="min-w-0">{h.name}</span>
                    </h4>
                    <dl className="mt-3 grid grid-cols-2 gap-x-5 gap-y-3 sm:grid-cols-3 xl:grid-cols-5">
                      {fields.map(({ label, value, optional }) => (
                        <InfoRow key={label} label={label} value={value} fallback={t(optional ? "notSpecified" : "notProvided")} optional={optional} />
                      ))}
                    </dl>
                  </li>
                );
              })}
            </ul>
            {houses.length === 0 && <p className="text-sm text-ink-soft">{t("noHouseData")}</p>}
          </SummarySection>

          <SummarySection icon="user" title={t("appUsersSummary")} hint={t("appUsersSummaryHint", { count: appUsers.length })} onEdit={() => onGoTo?.(2)}>
            <div className="divide-y divide-line">
              {userGroups.map((group) => (
                <div key={group.key} className="py-4 first:pt-0 last:pb-0">
                  <h4 className="flex items-center gap-2 text-sm font-bold text-ink">
                    {group.label}
                    <span className="pill pill-brand">{group.users.length}</span>
                  </h4>
                  {group.users.length > 0 ? (
                    <ul className="mt-2 space-y-2">
                      {group.users.map((u, i) => (
                        <li key={i} className="grid items-start gap-1 text-sm sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:gap-x-4">
                          <span className="break-words font-mono text-ink">
                            {u.username || <span className="font-sans text-alert">{t("notProvided")}</span>}
                          </span>
                          <span className="break-words text-ink-soft">
                            {u.email || <span className="text-alert">{t("notProvided")}</span>}
                          </span>
                          <span className="pill pill-neutral justify-self-start">{USER_TYPE_KEYS[u.user_type] ? t(USER_TYPE_KEYS[u.user_type]) : u.user_type}</span>
                        </li>
                      ))}
                    </ul>
                  ) : <p className="mt-2 text-sm text-ink-soft">{t("noUsersInGroup")}</p>}
                </div>
              ))}
            </div>
            {userGroups.length === 0 && <p className="text-sm text-ink-soft">{t("noUsersInGroup")}</p>}
          </SummarySection>
        </div>

        <label className="mt-8 block border-t border-line pt-5 text-[13.5px] font-semibold text-ink">
          {t("note")}
          <textarea
            className="mt-1.5 min-h-[84px] w-full resize-none rounded-xl border border-line-strong bg-white px-3.5 py-2.5 text-[13.5px] font-normal text-ink shadow-sm outline-none transition hover:border-brand/50 focus:border-brand focus:ring-4 focus:ring-brand-tint"
            rows="3"
            placeholder={t("notePlaceholder")}
            value={data.note}
            onChange={(e) => onChange({ ...data, note: e.target.value })}
          />
        </label>
        <label className="mt-4 flex items-start gap-2.5 text-[13.5px] text-ink-soft">
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
