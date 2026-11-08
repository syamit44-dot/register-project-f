import { useEffect, useState } from "react";
import Icon from "./Icon";
import RegistrationDetailView from "./RegistrationDetailView";
import { useLanguage } from "../i18n.jsx";

// Popup "ดูเพิ่มเติม" ใช้ร่วมกันทั้งฝั่ง Admin (AdminPage.jsx) และฝั่งลูกค้า (Home.jsx)
// ใช้ RegistrationDetailView ตัวเดียวกันทั้งสองฝั่ง เพื่อให้เห็นข้อมูล/ดีไซน์ตรงกัน
// - canModerate=true (ค่าเริ่มต้น, ฝั่ง admin) แสดงปุ่ม Reject/Approve เพิ่มจาก Edit
// - canModerate=false (ฝั่งลูกค้า) ไม่มีปุ่ม Reject/Approve แต่ยัง Edit + Save ได้ตามปกติ
// - useHouseCountActual=true (ฝั่ง admin) ใช้ house_count_actual (จำนวนที่อนุมัติจริง) แยกจาก house_count ที่ลูกค้ากรอก
//   ฝั่งลูกค้าไม่มีแนวคิดนี้ ให้ส่ง useHouseCountActual=false เพื่อแก้ไข house_count ตรงๆ
// - title: ข้อความหัวโมดัล ไม่ส่งมา = ใช้ t("modalTitle") (ข้อความฝั่ง admin) เป็นค่าเริ่มต้น
// ยังเป็นการแก้ไขแบบ mock ทั้งหมด (เก็บแค่ใน state ของหน้าที่เรียกใช้ ยังไม่ได้บันทึกลง backend จริง)

export default function RegistrationModal({
  registration,
  onClose,
  onApprove,
  onReject,
  onSave,
  canModerate = true,
  useHouseCountActual = true,
  title,
}) {
  const { t } = useLanguage();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null);

  // house_count_actual เป็นแนวคิดฝั่ง admin เท่านั้น (จำนวนโรงเรือนจริงที่อนุมัติ อาจไม่เท่ากับที่ลูกค้ากรอกมา)
  // ฝั่งลูกค้า (useHouseCountActual=false) ใช้ house_count ตรงๆ ไม่ต้องแม็ปฟิลด์
  const getHouseCount = (r) => (useHouseCountActual ? r.house_count_actual ?? r.house_count : r.house_count);

  useEffect(() => {
    setEditing(false);
    if (registration) {
      setDraft({ ...registration, house_count: getHouseCount(registration) });
    } else {
      setDraft(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registration]);

  if (!registration || !draft) return null;
  const r = registration;
  const viewData = { ...r, house_count: getHouseCount(r) };

  function handleFieldChange(key, value) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function handleAppUserTypeChange(index, value) {
    setDraft((prev) => {
      const app_users = [...(prev.app_users || [])];
      app_users[index] = { ...app_users[index], user_type: value };
      return { ...prev, app_users };
    });
  }

  function handleStartEdit() {
    setDraft({ ...r, house_count: getHouseCount(r) });
    setEditing(true);
  }

  function handleCancelEdit() {
    setDraft({ ...r, house_count: getHouseCount(r) });
    setEditing(false);
  }

  function handleSave() {
    const { house_count, ...rest } = draft;
    const houseCountNum = house_count !== "" && house_count !== undefined ? Number(house_count) : getHouseCount(r);
    const patch = useHouseCountActual ? { ...rest, house_count_actual: houseCountNum } : { ...rest, house_count: houseCountNum };
    onSave(r.id, patch);
    setEditing(false);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/45 px-4 py-8"
      onClick={(e) => e.target === e.currentTarget && !editing && onClose()}
    >
      <div className="flex max-h-[90vh] w-full max-w-[960px] flex-col overflow-hidden rounded-control bg-white shadow-[0_20px_50px_rgba(19,42,38,0.25)]">
        <div className="flex items-center justify-between rounded-t-control bg-brand-dark px-6 py-4">
          <h3 className="flex items-center gap-2 text-base font-semibold text-white">
            <Icon name="clipboard-text" />
            {title ?? t("modalTitle")}
          </h3>
        </div>

        <div className="max-h-[75vh] overflow-y-auto px-6 py-6">
          {editing && (
            <div className="mb-5 flex items-start gap-2 rounded-control border border-amber-tint bg-amber-tint px-3.5 py-2.5 text-[12.5px] text-amber">
              <Icon name="info-circle" style={{ fontSize: 14 }} />
              <span>{t("editingNotice")}</span>
            </div>
          )}
          <RegistrationDetailView
            data={viewData}
            editable={editing}
            draft={draft}
            onFieldChange={handleFieldChange}
            onAppUserTypeChange={handleAppUserTypeChange}
          />
        </div>

        <div className="flex items-center justify-between border-t border-line-strong px-6 py-4">
          {editing ? (
            <>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-control border border-line-strong bg-white px-4 py-2 text-sm font-medium text-ink transition hover:border-brand-dark hover:bg-brand-tint"
                onClick={handleCancelEdit}
              >
                <Icon name="x" />
                {t("cancel")}
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-control bg-brand-dark px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
                onClick={handleSave}
              >
                <Icon name="circle-check" />
                {t("saveTemp")}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-control border border-line-strong bg-white px-4 py-2 text-sm font-medium text-ink transition hover:border-brand-dark hover:bg-brand-tint"
                onClick={onClose}
              >
                <Icon name="x" />
                {t("cancel")}
              </button>
              <div className="flex gap-2.5">
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-control border border-line-strong bg-white px-4 py-2 text-sm font-medium text-ink transition hover:border-brand-dark hover:bg-brand-tint hover:text-ink"
                  onClick={handleStartEdit}
                >
                  <Icon name="edit" style={{ fontSize: 14 }} />
                  {t("edit")}
                </button>
                {canModerate && (
                  <>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-control border border-alert-tint bg-white px-4 py-2 text-sm font-medium text-alert transition hover:bg-alert-tint"
                      onClick={() => onReject(r.id)}
                    >
                      <Icon name="x" />
                      {t("reject")}
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-control bg-brand-dark px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
                      onClick={() => onApprove(r.id)}
                    >
                      <Icon name="circle-check" />
                      {t("approve")}
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}