import { useState } from "react";
import Icon from "./Icon";
import { useLanguage } from "../i18n.jsx";

const inputClass =
  "h-11 w-full rounded-xl border border-line-strong bg-white px-3.5 text-[13.5px] text-ink shadow-sm outline-none transition placeholder:text-ink-soft/60 hover:border-brand/50 focus:border-brand focus:ring-4 focus:ring-brand-tint";
const labelClass = "text-[13px] font-semibold text-ink";

function Field({ label, hint, className = "", children }) {
  return (
    <label className={`block ${className}`}>
      <span className={labelClass}>
        {label}
        {hint && <span className="ml-1.5 text-xs font-normal text-ink-soft">{hint}</span>}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

const EMPTY_DRAFT = {
  dealer_contact_phone: "",
  dealer_contact_line: "",
  dealer_contact_email: "",
  dealer_contact_other_label: "",
  dealer_contact_other_value: "",
};

export function dealerContactDraft(data) {
  return Object.fromEntries(Object.keys(EMPTY_DRAFT).map((key) => [key, data[key] ?? ""]));
}

// ป๊อปอัพกรอกช่องทางติดต่อ dealer — เปิดจากปุ่มใน Step1CustomerInfo
// กฎ: ต้องกรอกอย่างน้อย 1 ใน 4 ช่องทาง (phone / line / email / other) ถึงจะบันทึกได้
// Phone ใช้ format ต่อ dial prefix ท้ายแบบเดียวกับช่อง contact_phone หลัก (ผ่าน props.dialPrefix)
export default function DealerContactModal({ draft, onDraftChange, onSave, onClose, dialPrefix }) {
  const { t } = useLanguage();
  const [error, setError] = useState("");

  const set = (key) => (event) => onDraftChange({ ...draft, [key]: event.target.value });

  const localDraftPhone =
    dialPrefix && draft.dealer_contact_phone.startsWith(dialPrefix)
      ? draft.dealer_contact_phone.slice(dialPrefix.length).trim()
      : draft.dealer_contact_phone;

  const handlePhoneChange = (e) => {
    const raw = e.target.value;
    const combined = dialPrefix ? `${dialPrefix} ${raw}`.trim() : raw;
    onDraftChange({ ...draft, dealer_contact_phone: combined });
  };

  const hasAnyChannel = Boolean(
    draft.dealer_contact_phone.trim() ||
      draft.dealer_contact_line.trim() ||
      draft.dealer_contact_email.trim() ||
      draft.dealer_contact_other_value.trim()
  );

  const handleSave = () => {
    if (!hasAnyChannel) {
      setError(t("dealerContactRequiredError"));
      return;
    }
    onSave(draft);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-ink/45 p-6">
      <div
        className="flex w-full max-w-lg flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
        style={{ maxHeight: "85vh" }}
      >
        <div className="flex items-center justify-between rounded-t-xl border-b border-line-strong bg-brand px-7 py-5">
          <h3 className="text-xl font-bold text-white sm:text-2xl">{t("dealerContact")}</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/90 transition hover:bg-white/15 hover:text-white"
            aria-label={t("close")}
          >
            <Icon name="x" style={{ fontSize: 20 }} />
          </button>
        </div>

        <div className="overscroll-contain space-y-5 overflow-y-auto px-7 py-7">
          <p className="text-[12.5px] leading-5 text-ink-soft">{t("dealerContactHint")}</p>

          <Field label={t("phoneNumber")}>
            <div className="flex gap-2">
              {dialPrefix && (
                <span className="flex h-11 shrink-0 items-center rounded-xl border border-line-strong bg-mist px-3 text-[13.5px] font-medium text-ink">
                  {dialPrefix}
                </span>
              )}
              <input className={inputClass} value={localDraftPhone} onChange={handlePhoneChange} />
            </div>
          </Field>

          <Field label={t("lineId")}>
            <input
              className={inputClass}
              value={draft.dealer_contact_line}
              onChange={set("dealer_contact_line")}
              placeholder="LINE ID"
            />
          </Field>

          <Field label={t("email")}>
            <input
              className={inputClass}
              type="email"
              value={draft.dealer_contact_email}
              onChange={set("dealer_contact_email")}
              placeholder="name@dealer.com"
            />
          </Field>

          <Field label={t("otherChannel")}>
            <div className="flex h-11 w-full overflow-hidden rounded-xl border border-line-strong bg-white shadow-sm transition focus-within:border-brand focus-within:ring-4 focus-within:ring-brand-tint">
              <input
                className="h-full min-w-0 flex-[1_1_0%] bg-transparent px-3.5 text-[13.5px] text-ink outline-none placeholder:text-ink-soft/60"
                value={draft.dealer_contact_other_label}
                onChange={set("dealer_contact_other_label")}
                placeholder={t("otherChannelType")}
              />
              <span className="my-2 w-px shrink-0 bg-line-strong" />
              <input
                className="h-full min-w-0 flex-[2_1_0%] bg-transparent px-3.5 text-[13.5px] text-ink outline-none placeholder:text-ink-soft/60"
                value={draft.dealer_contact_other_value}
                onChange={set("dealer_contact_other_value")}
                placeholder={t("otherChannelValue")}
              />
            </div>
          </Field>

          {error && (
            <div className="flex items-start gap-2 rounded-control border border-alert-tint bg-alert-tint px-3.5 py-2.5 text-[12.5px] leading-5 text-alert">
              <Icon name="info-circle" style={{ fontSize: 14 }} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="flex flex-shrink-0 justify-end gap-2 rounded-b-xl border-t border-line-strong px-7 py-5">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-xl border border-line-strong bg-white px-4 text-[13px] font-medium text-ink transition hover:bg-mist"
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="h-10 rounded-xl border border-brand bg-brand px-5 text-[13px] font-semibold text-white shadow-sm transition hover:bg-brand-dark"
          >
            {t("save")}
          </button>
        </div>
      </div>
    </div>
  );
}
