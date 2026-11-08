import { useEffect, useState } from "react";
import Icon from "./Icon";
import SearchableSelect from "./SearchableSelect";
import countryData from "../data/countryData";
import DealerContactModal from "./DealerContactModal";
import { useLanguage } from "../i18n.jsx";

const HOUSE_COUNT_OPTIONS = Array.from({ length: 90 }, (_, i) => ({ value: i + 1, label: String(i + 1) }));

// สไตล์กลางของ input/select/label ในหน้านี้ — รวมไว้ที่เดียวเพื่อให้หน้าตาสม่ำเสมอ อ่านง่าย และแก้ทีเดียวได้ทั้งฟอร์ม
const inputClass =
  "h-11 w-full rounded-xl border border-line-strong bg-white px-3.5 text-[13.5px] text-ink shadow-sm outline-none transition placeholder:text-ink-soft/60 hover:border-brand/50 focus:border-brand focus:ring-4 focus:ring-brand-tint";
const labelClass = "text-[13px] font-semibold text-ink";

function Field({ label, required, hint, className = "", children }) {
  return (
    <label className={`block ${className}`}>
      <span className={labelClass}>
        {label}
        {required && <span className="ml-0.5 text-alert">*</span>}
        {hint && <span className="ml-1.5 text-xs font-normal text-ink-soft">{hint}</span>}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function SectionHeading({ icon, title }) {
  return (
    <div className="form-section-heading mb-6 mt-10 flex items-center gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-tint text-brand-dark">
        <Icon name={icon} style={{ fontSize: 15 }} />
      </span>
      <p className="text-[12.5px] font-bold uppercase tracking-[0.06em] text-ink-soft">{title}</p>
    </div>
  );
}

export default function Step1CustomerInfo({ data, onChange }) {
  const { t } = useLanguage();
  const set = (key) => (e) => onChange({ ...data, [key]: e.target.value });

  const [countryQuery, setCountryQuery] = useState(data.country || "");
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [timezoneQuery, setTimezoneQuery] = useState(data.timezone || "");
  const [isTimezoneOpen, setIsTimezoneOpen] = useState(false);
  const [timezoneOptions, setTimezoneOptions] = useState([]);
  const [showDealerModal, setShowDealerModal] = useState(false);

  useEffect(() => {
    setCountryQuery(data.country || "");
  }, [data.country]);

  useEffect(() => {
    setTimezoneQuery(data.timezone || "");
  }, [data.timezone]);

  const filteredCountries = countryData
    .filter((country) => {
      const query = countryQuery.trim().toLowerCase();
      if (!query) return true;

      const name = country.name.toLowerCase();
      const alpha3 = country.alpha3.toLowerCase();
      const code = country.code.toLowerCase();

      return (
        name.startsWith(query) ||
        alpha3.startsWith(query) ||
        code.startsWith(query)
      );
    })
    .slice(0, 100);

  const filteredTimezones = timezoneOptions
    .filter((tz) => {
      const query = timezoneQuery.trim().toLowerCase();
      if (!query) return true;
      return tz.toLowerCase().includes(query);
    })
    .slice(0, 100);

  const getDialPrefix = (countryName) => {
    const country = countryData.find((c) => c.name === countryName);
    return country?.dialCode ? `+${country.dialCode}` : "";
  };

  const stripDialPrefix = (phone, prefix) => {
    if (!phone) return "";
    if (prefix && phone.startsWith(prefix)) {
      return phone.slice(prefix.length).trim();
    }
    return phone;
  };

  const currentDialPrefix = getDialPrefix(data.country);
  const localPhone = stripDialPrefix(data.contact_phone, currentDialPrefix);

  // มีช่องทางติดต่อ dealer อย่างน้อย 1 ช่องทางแล้วหรือยัง (phone / line / email / other)
  const hasDealerContact = Boolean(
    data.dealer_contact_phone || data.dealer_contact_line || data.dealer_contact_email || data.dealer_contact_other_value
  );

  const handleCountrySelect = (countryName) => {
    const newPrefix = getDialPrefix(countryName);
    const existingLocalPhone = stripDialPrefix(data.contact_phone, currentDialPrefix);
    const newPhone = newPrefix
      ? `${newPrefix} ${existingLocalPhone}`.trim()
      : existingLocalPhone;

    onChange({ ...data, country: countryName, contact_phone: newPhone });
    setCountryQuery(countryName);
    setIsCountryOpen(false);
  };

  const handleCountryInputChange = (e) => {
    setCountryQuery(e.target.value);
    setIsCountryOpen(true);
  };

  const handleCountryInputKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (filteredCountries.length > 0) {
        handleCountrySelect(filteredCountries[0].name);
      }
    }
  };

  const handleTimezoneInputChange = (e) => {
    const value = e.target.value;
    setTimezoneQuery(value);
    onChange({ ...data, timezone: value });
    setIsTimezoneOpen(true);
  };

  const handleTimezoneInputKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (filteredTimezones.length > 0) {
        handleTimezoneSelect(filteredTimezones[0]);
      }
    }
  };

  const handleTimezoneSelect = (tz) => {
    onChange({ ...data, timezone: tz });
    setTimezoneQuery(tz);
    setIsTimezoneOpen(false);
  };

  const handlePhoneChange = (e) => {
    const raw = e.target.value;
    const combined = currentDialPrefix ? `${currentDialPrefix} ${raw}`.trim() : raw;
    onChange({ ...data, contact_phone: combined });
  };
  useEffect(() => {
    const timezones = Intl.supportedValuesOf("timeZone");
    setTimezoneOptions(timezones);
  }, []);

  return (
    <>
      <div className="form-step-header flex items-center gap-3 border-b border-line px-7 py-6 sm:px-9">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand text-white">
          <Icon name="building-warehouse" style={{ fontSize: 18 }} />
        </div>
        <div>
          <p className="mb-0.5 font-mono text-[11px] uppercase tracking-[0.06em] text-ink-soft">{t("part01")}</p>
          <h2 className="text-[18px] font-bold text-ink sm:text-[20px]">{t("farmInformation")}</h2>
        </div>
      </div>
      <div className="form-step-body px-7 py-8 sm:px-9 sm:py-9">
        <SectionHeading icon="barn" title={t("farmInformation")} />
        <div className="grid gap-x-6 gap-y-6 md:grid-cols-2">
          <Field label={t("farmNameCompany")} required className="md:col-span-2">
            <input
              className={inputClass}
              placeholder="SWF farm"
              value={data.farm_name}
              onChange={set("farm_name")}
              required
            />
          </Field>
          <Field label={t("companyName")} required>
            <input
              className={inputClass}
              placeholder="Siam Water Flame Co.,Ltd"
              value={data.farm_short}
              onChange={set("farm_short")}
            />
          </Field>
          <SearchableSelect
            label={t("numberOfHouses")}
            required
            value={Number(data.house_count)}
            options={HOUSE_COUNT_OPTIONS}
            onChange={({ value }) => onChange({ ...data, house_count: value })}
          />
        </div>

        <SectionHeading icon="building-store" title={t("address")} />
        <div className="grid gap-x-6 gap-y-6 md:grid-cols-2">
          <Field label={t("address")} required className="md:col-span-2">
            <input
              className={inputClass}
              placeholder=" 123 Main Street"
              value={data.address}
              onChange={set("address")}
            />
          </Field>
          <Field label={t("subdistrict")} required>
            <input className={inputClass} value={data.subdistrict} onChange={set("subdistrict")} />
          </Field>
          <Field label={t("district")} required>
            <input className={inputClass} value={data.district} onChange={set("district")} />
          </Field>
          <Field label={t("province")} required>
            <input className={inputClass} value={data.province} onChange={set("province")} />
          </Field>
          <Field label={t("country")} required>
            <div className="relative">
              <input
                className={inputClass}
                value={countryQuery}
                onChange={handleCountryInputChange}
                onKeyDown={handleCountryInputKeyDown}
                onFocus={() => setIsCountryOpen(true)}
                onBlur={() => setTimeout(() => setIsCountryOpen(false), 120)}
              />
              {isCountryOpen && filteredCountries.length > 0 && (
                <ul className="absolute z-10 mt-1.5 max-h-48 w-full overflow-auto rounded-xl border border-line-strong bg-white py-1 shadow-lg">
                  {filteredCountries.map((country) => (
                    <li key={country.code}>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-ink hover:bg-brand-tint"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleCountrySelect(country.name)}
                      >
                        <span>{country.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Field>
          <Field label={t("postalCode")} required>
            <input className={inputClass} value={data.postal_code} onChange={set("postal_code")} />
          </Field>
          <Field label={t("timezone")} required>
            <div className="relative">
              <input
                className={inputClass}
                value={timezoneQuery}
                onChange={handleTimezoneInputChange}
                onKeyDown={handleTimezoneInputKeyDown}
                onFocus={() => setIsTimezoneOpen(true)}
                onBlur={() => setTimeout(() => setIsTimezoneOpen(false), 120)}
              />
              {isTimezoneOpen && filteredTimezones.length > 0 && (
                <ul className="absolute z-10 mt-1.5 max-h-48 w-full overflow-auto rounded-xl border border-line-strong bg-white py-1 shadow-lg">
                  {filteredTimezones.map((tz) => (
                    <li key={tz}>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-ink hover:bg-brand-tint"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleTimezoneSelect(tz)}
                      >
                        <span>{tz}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Field>
        </div>

        <SectionHeading icon="phone" title={t("contactTitle")} />
        <div className="grid gap-x-6 gap-y-6 md:grid-cols-2">
          <Field label={t("contactName")} required>
            <input className={inputClass} value={data.contact_name} onChange={set("contact_name")} />
          </Field>
          <Field label={t("phoneNumber")} required>
            <div className="flex gap-2">
              {currentDialPrefix && (
                <span className="flex h-11 shrink-0 items-center rounded-xl border border-line-strong bg-mist px-3 text-[13.5px] font-medium text-ink">
                  {currentDialPrefix}
                </span>
              )}
              <input className={inputClass} placeholder="" value={localPhone} onChange={handlePhoneChange} />
            </div>
          </Field>
          <Field label={t("email")} required hint={t("emailHint")} className="md:col-span-2">
            <input
              className={inputClass}
              type="email"
              placeholder="name@farm.com"
              value={data.contact_email}
              onChange={set("contact_email")}
            />
          </Field>
          <div className="grid grid-cols-4 gap-3 md:col-span-2">
            <Field label={t("dealerName")} required className="col-span-3">
              <input className={inputClass} value={data.dealer_name ?? ""} onChange={set("dealer_name")} />
            </Field>
            <div className="col-span-1 flex flex-col">
              <span className={labelClass}>
                {t("dealerContact")}
                <span className="ml-0.5 text-alert">*</span>
              </span>
              <div className="mt-1.5 flex-1">
                <button
                  type="button"
                  onClick={() => setShowDealerModal(true)}
                  className={`flex h-full min-h-11 w-full flex-row items-center justify-center gap-2 whitespace-nowrap rounded-xl border px-2 text-[15px] font-semibold leading-none transition ${
                    hasDealerContact
                      ? "border-good bg-good-tint text-good"
                      : "border-line-strong bg-white text-ink-soft hover:border-brand/50 hover:text-brand-dark"
                  }`}
                >
                  <Icon name={hasDealerContact ? "circle-check" : "message-circle"} style={{ fontSize: 19 }} className="shrink-0" />
                  <span className="truncate leading-none">
                    {hasDealerContact ? t("dealerContactConfigured") : t("dealerContact")}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DealerContactModal
        open={showDealerModal}
        data={data}
        onChange={onChange}
        onClose={() => setShowDealerModal(false)}
        dialPrefix={currentDialPrefix}
      />
    </>
  );
}
