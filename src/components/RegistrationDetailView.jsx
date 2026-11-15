import StatusBadge from "./StatusBadge";
import { useLanguage } from "../i18n.jsx";

const PLATFORM_LABEL = { smartlink: "SmartLink", tempview: "TempView / FarmNet", silonic: "Silonic-Xi" };

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
// titleClassName: ปรับขนาด/น้ำหนักตัวอักษรของหัวข้อการ์ดได้ต่อการเรียกใช้แต่ละครั้ง
// ไม่ส่งมา = ใช้ขนาดเดิม (text-[15px] font-semibold)
function SectionCard({ title, titleClassName = "text-xl font-semibold text-ink", children, className = "" }) {
  return (
    <div className={`mb-6 rounded-control border border-line bg-white p-6 shadow-[0_1px_3px_rgba(15,23,42,0.05)] ${className}`}>
      <h3 className={`mb-5 ${titleClassName}`}>{title}</h3>
      {children}
    </div>
  );
}

function SubLabel({ children, className = "" }) {
  return (
    <div className={`mb-3 text-sm font-semibold uppercase tracking-[0.05em] text-ink-soft ${className}`}>
      {children}
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <div className="mb-1 flex min-h-[2.25rem] items-end text-sm uppercase tracking-[0.05em] text-ink-soft sm:whitespace-nowrap">{label}</div>
      <div className="break-words font-medium text-ink">{value || "-"}</div>
    </div>
  );
}

export default function RegistrationDetailView({ data }) {
  const { t } = useLanguage();
  const F = (label, key) => <Field label={label} value={data[key]} />;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[25px] font-semibold">{data.farm_name}</h2>
          <p className="text-sm text-ink-soft">{data.farm_short}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-brand-tint px-2.5 py-1 text-[11.5px] font-medium text-ink">
            {PLATFORM_LABEL[data.platform] || data.platform}
          </span>
          <StatusBadge status={data.status} />
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 rounded-control border border-line bg-mist/60 p-4 text-sm sm:grid-cols-3">
        <Field label={t("registrationDate")} value={formatDate(data.created_at)} />
        <Field label={t("lastUpdated")} value={formatDate(data.updated_at)} />
        {data.id && <Field label={t("registrationId")} value={data.id} />}
      </div>

      <SectionCard title={t("farmInfoAddressTitle")}>
        <div className="grid grid-cols-2 gap-x-4 gap-y-5 text-base sm:grid-cols-[1.7fr_1fr_1fr]">
          {F(t("farmNameCompany"), "farm_name")}
          {F(t("companyName"), "farm_short")}
          {F(t("numberOfHouses"), "house_count")}
        </div>

        <div className="my-5 border-t border-mist" />

        <div className="rounded-control bg-mist px-4 py-3.5 text-sm leading-6 text-ink">
          {data.address}, {data.subdistrict} {data.district}
          <br />
          {data.province} {data.postal_code}, {data.country}
          <span className="ml-1">, {t("timezone")} {data.timezone || "-"}</span>
        </div>
      </SectionCard>

      <SectionCard title={t("contactPerson")}>
        <div className="grid gap-x-4 gap-y-5 text-base sm:grid-cols-3">
          {F(t("contactName"), "contact_name")}
          {F(t("phoneNumber"), "contact_phone")}
          {F(t("email"), "contact_email")}
        </div>
      </SectionCard>

      <SectionCard title={t("deviceInformation")}>
        <div className="grid grid-cols-2 gap-x-4 gap-y-5 text-base sm:grid-cols-3">
          {F(t("deviceModel"), "device_model")}
          {F(t("numberOfHouses"), "house_count")}
        </div>

        <div className="my-5 border-t border-mist" />

        <SubLabel className="text-sm normal-case tracking-normal text-ink">{t("houseDetailsTitle")}</SubLabel>
        <div className="space-y-2">
          {(data.houses || []).map((house) => (
            <div key={house.id} className="rounded-control border border-line bg-mist px-4 py-3 text-base">
              <h4 className="font-semibold text-ink">{house.name}</h4>
              <ul className="mt-2 divide-y divide-line">
                {house.equipment.map((item) => (
                  <li key={item.id} className="grid grid-cols-2 gap-x-4 gap-y-1 py-2 text-sm sm:grid-cols-4">
                    <span className="col-span-2 min-w-0 break-words font-medium text-ink sm:col-span-1">{item.model}</span>
                    <span className="text-ink-soft">{PLATFORM_LABEL[item.platform] || item.platform || t("notSpecified")}</span>
                    <dl className="min-w-0">
                      <dt className="text-xs text-ink-soft">{t("serialNumber")}</dt>
                      <dd className="break-words font-mono text-ink">{item.serialNumber || "-"}</dd>
                    </dl>
                    {item.platform === "smartlink" && item.smartlinkSerial && (
                      <dl className="min-w-0">
                        <dt className="text-xs text-ink-soft">{t("smartlinkSnLabel")}</dt>
                        <dd className="break-words font-mono text-ink">{item.smartlinkSerial}</dd>
                      </dl>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {(!data.houses || data.houses.length === 0) && (
            <p className="text-sm text-ink-soft">{t("noHouseData")}</p>
          )}
        </div>
      </SectionCard>

      <SectionCard title={t("appUsers")}>
        <div className="space-y-2">
          {(data.app_users ?? []).map((u) => (
            <div key={u.id || u.username} className="flex items-center justify-between gap-3 rounded-control border border-line bg-mist px-4 py-2.5 text-sm">
              <span className="font-medium text-ink">{u.username}</span>
              <span className="inline-flex w-[92px] shrink-0 items-center justify-center rounded-full border border-line-strong bg-white px-2 py-0.5 text-[11.5px] text-ink-soft">
                {u.user_type === "super" ? t("userTypeSuper") : t("userTypeNormal")}
              </span>
            </div>
          ))}
          {(data.app_users ?? []).length === 0 && (
            <p className="text-sm text-ink-soft">{t("noAppUsers")}</p>
          )}
        </div>
      </SectionCard>

      <SectionCard title={t("otherSectionTitle")} className="mb-2">
        <div className="mb-4 text-sm">
          <div className="mb-1 text-sm uppercase tracking-[0.05em] text-ink-soft">{t("note")}</div>
          <div className="font-medium text-ink">{data.note || "-"}</div>
        </div>
        {typeof data.pdpa_consent === "boolean" && (
          <div className="mt-4 flex items-center gap-2 rounded-control bg-mist px-4 py-2.5 text-sm">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: data.pdpa_consent ? "#16a34a" : "#94a3b8" }}
            />
            <span className="text-ink">
              {data.pdpa_consent ? t("pdpaAccepted") : t("pdpaNotAccepted")}
            </span>
          </div>
        )}
      </SectionCard>
    </>
  );
}
