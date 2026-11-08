import { useMemo, useState } from "react";
import Icon from "./Icon";
import SearchableSelect from "./SearchableSelect";
import { getSelectedControllerModels } from "../utils/registrationModels";
import { APP_USERNAME_MAX_LENGTH, isValidAppUsername, sanitizeAppUsername } from "../utils/registrationPayload";
import { useLanguage } from "../i18n.jsx";

const USER_LIMIT = 5;

export default function Step3Users({ data, onChange }) {
  const { t } = useLanguage();
  const [showUserTypeInfo, setShowUserTypeInfo] = useState(false);
  const [showUsernameHelp, setShowUsernameHelp] = useState(false);
  // เก็บสถานะ ย่อ/ขยาย ของแต่ละกลุ่มด้วย key ของกลุ่ม — ค่าเริ่มต้นคือ "ขยาย" ทุกกลุ่ม
  // (ไม่ต้องระบุใน state ก็ถือว่าขยายอยู่ ยกเว้นจะถูกเพิ่มลง collapsedGroups)
  const [collapsedGroups, setCollapsedGroups] = useState(() => new Set());

  const selectedModels = useMemo(() => getSelectedControllerModels(data.houses), [data.houses]);

  // จัดกลุ่ม app_users ตาม device_model — คนที่ไม่มี device_model หรือ device_model
  // ไม่ตรงกับรุ่นที่เลือกไว้ในตอนนี้ (เช่น ลบรุ่นออกจาก Step 2 ไปแล้ว) จะตกไปกลุ่ม "ทั่วไป"
  const groups = useMemo(() => {
    const modelGroups = Array.from(selectedModels, ([key, label]) => ({
      key,
      label,
      users: data.app_users
        .map((u, index) => ({ ...u, index }))
        .filter((u) => u.device_model === key),
    }));

    const unassigned = data.app_users
      .map((u, index) => ({ ...u, index }))
      .filter((u) => !selectedModels.has(u.device_model));

    return [
      ...modelGroups,
      { key: "__unassigned__", label: t("unassignedGroup"), users: unassigned },
    ];
  }, [data.app_users, selectedModels, t]);

  // Keep orphaned users visible so they can be removed after a controller is changed.
  const visibleGroups = useMemo(
    () =>
      groups.filter(
          (group) => group.key !== "__unassigned__" || group.users.length > 0
      ),
    [groups]
  );

  const allCollapsed =
    visibleGroups.length > 0 && visibleGroups.every((g) => collapsedGroups.has(g.key));

  function toggleGroup(key) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleAllGroups() {
    if (allCollapsed) {
      setCollapsedGroups(new Set());
    } else {
      setCollapsedGroups(new Set(visibleGroups.map((g) => g.key)));
    }
  }

  function addUser(groupKey) {
    const countInGroup = data.app_users.filter((u) => u.device_model === groupKey).length;
    if (countInGroup >= USER_LIMIT) return;

    // เพิ่ม user ใหม่แล้วขยายกลุ่มนั้นให้เห็นแถวที่เพิ่งเพิ่มทันที
    setCollapsedGroups((prev) => {
      if (!prev.has(groupKey)) return prev;
      const next = new Set(prev);
      next.delete(groupKey);
      return next;
    });

    onChange({
      ...data,
      app_users: [
        ...data.app_users,
        {
          username: "",
          email: "",
          user_type: "normal",
          device_model: groupKey,
        },
      ],
    });
  }

  function removeUser(index) {
    onChange({ ...data, app_users: data.app_users.filter((_, i) => i !== index) });
  }

  function setUserField(index, field, value) {
    const app_users = data.app_users.map((u, i) => (i === index ? { ...u, [field]: value } : u));
    onChange({ ...data, app_users });
  }

  return (
    <>
      <div className="form-step-header flex items-center gap-3 border-b border-line px-7 py-6 sm:px-9">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand text-white">
          <Icon name="user" style={{ fontSize: 18 }} />
        </div>
        <div>
          <p className="mb-0.5 font-mono text-[11px] uppercase tracking-[0.06em] text-ink-soft">{t("part03")}</p>
          <h2 className="text-[18px] font-bold text-ink sm:text-[20px]">{t("appUsers")}</h2>
        </div>
        <button
          type="button"
          onClick={() => setShowUsernameHelp((shown) => !shown)}
          aria-label={t("appUsernameHelpTitle")}
          aria-expanded={showUsernameHelp}
          aria-controls="app-username-help"
          className="ml-auto inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line-strong bg-white text-sm font-bold text-brand-dark hover:bg-brand-tint"
        >
          ?
        </button>
      </div>
      <div className="form-step-body px-7 py-8 sm:px-9 sm:py-9">
        {showUsernameHelp && (
          <div id="app-username-help" className="mb-4 rounded-xl border border-brand-tint bg-brand-tint px-4 py-3 text-sm leading-5 text-ink">
            <p className="mb-1 font-semibold">{t("appUsernameHelpTitle")}</p>
            <p>{t("registrationAppUsernameInvalid")}</p>
          </div>
        )}
          <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <p className="text-[13px] font-bold uppercase tracking-[0.05em] text-ink-soft">
              {t("userTypeShort")}
            </p>
            <button
              type="button"
              onClick={() => setShowUserTypeInfo((prev) => !prev)}
              className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-line-strong bg-white text-ink-soft transition hover:border-brand-dark hover:text-brand-dark"
              aria-label={t("viewUserTypeInfoAria")}
            >
              <Icon name="info-circle" style={{ fontSize: 14 }} />
            </button>
          </div>
          {visibleGroups.length > 1 && (
            <button
              type="button"
              onClick={toggleAllGroups}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-line-strong bg-white px-3 py-1.5 text-[12px] font-medium text-ink-soft transition hover:border-brand-dark hover:text-brand-dark"
            >
              {allCollapsed ? t("expandAll") : t("collapseAll")}
            </button>
          )}
        </div>
        {showUserTypeInfo && (
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-brand-tint bg-brand-tint px-3.5 py-2.5 text-sm leading-5 text-ink">
            <Icon name="info-circle" style={{ fontSize: 13 }} className="mt-0.5 shrink-0 text-brand" />
            <span>{t("userTypeInfo")}</span>
          </div>
        )}

        <div className="mt-4 space-y-4">
          {visibleGroups.length === 0 ? (
            // ยังไม่ได้เลือกรุ่นเครื่องใน Step 2 เลย — ไม่ต้องโชว์ฟอร์มกรอกผู้ใช้
            // ให้เตือนไปกรอกข้อมูลรุ่นเครื่องก่อนแทน
            <div className="flex items-center gap-2.5 rounded-xl border border-dashed border-amber-tint bg-amber-tint px-4 py-4 text-[13.5px] text-amber">
              <Icon name="info-circle" style={{ fontSize: 15 }} />
              {t("selectDeviceModelFirst")}
            </div>
          ) : (
            visibleGroups.map((group) => {
              const isCollapsed = collapsedGroups.has(group.key);
              const groupReachedLimit = group.users.length >= USER_LIMIT;

              return (
                <div key={group.key} className="user-group-panel rounded-xl border border-slate-200 bg-white shadow-[0_2px_8px_rgba(22,35,61,0.035)]">
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.key)}
                    className="flex w-full items-center gap-2.5 p-4 text-left sm:px-5"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-tint text-brand-dark">
                      <Icon name="user" style={{ fontSize: 14 }} />
                    </span>
                    <p className="text-[13.5px] font-bold uppercase tracking-[0.04em] text-ink">
                      {group.label}
                    </p>
                    <span className="rounded-full bg-mist px-2 py-0.5 text-[12px] font-semibold text-ink-soft">
                      {group.users.length}
                    </span>
                    <Icon
                      name="chevron-down"
                      style={{ fontSize: 13 }}
                      className={`ml-auto text-ink-soft transition-transform duration-200 ${isCollapsed ? "" : "rotate-180"}`}
                    />
                  </button>

                  {!isCollapsed && (
                    <div className="border-t border-line p-4 pt-4 sm:px-5">
                      <div className="space-y-2">
                        {group.users.map((u) => (
                          <div
                            className="grid gap-3 rounded-xl border border-line bg-mist/50 p-3.5 md:grid-cols-[1fr_1fr_1fr_auto]"
                            key={u.index}
                          >
                            <div>
                              <label className="mb-1 block text-[12px] font-semibold text-ink-soft">
                                {t("Username")}
                              </label>
                              <input
                                className="mono h-10 w-full rounded-xl border border-line-strong bg-white px-3 text-sm text-ink shadow-sm outline-none transition hover:border-brand/50 focus:border-brand focus:ring-4 focus:ring-brand-tint"
                                placeholder="name@farm"
                                aria-label={t("Username")}
                                aria-invalid={Boolean(u.username) && !isValidAppUsername(u.username)}
                                pattern="[a-z0-9]+@[a-z0-9]+"
                                maxLength={APP_USERNAME_MAX_LENGTH}
                                autoCapitalize="none"
                                spellCheck={false}
                                value={u.username}
                                onChange={(e) => setUserField(u.index, "username", sanitizeAppUsername(e.target.value))}
                              />
                            </div>
                            <div>
                              <SearchableSelect
                                label={t("UserType")}
                                compact
                                value={u.user_type}
                                options={[
                                  { value: "normal", label: t("userTypeNormal") },
                                  { value: "super", label: t("userTypeSuper") },
                                ]}
                                onChange={({ value }) => setUserField(u.index, "user_type", value)}
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-[12px] font-semibold text-ink-soft">
                                {t("Email")}
                              </label>
                              <input
                                type="email"
                                className="mono h-10 w-full rounded-xl border border-line-strong bg-white px-3 text-sm text-ink shadow-sm outline-none transition hover:border-brand/50 focus:border-brand focus:ring-4 focus:ring-brand-tint"
                                placeholder="user@example.com"
                                value={u.email}
                                onChange={(e) => setUserField(u.index, "email", e.target.value)}
                              />
                            </div>
                            <div className="flex flex-col justify-start">
                              <label className="mb-1 block text-[12px] uppercase text-transparent select-none">
                                {t("delete")}
                              </label>
                              <button
                                type="button"
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line-strong bg-white text-alert transition hover:border-alert hover:bg-alert-tint"
                                onClick={() => removeUser(u.index)}
                              >
                                <Icon name="trash" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {group.key !== "__unassigned__" && (
                        <button
                          type="button"
                          disabled={groupReachedLimit}
                          className={`mt-3 inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm transition ${groupReachedLimit
                            ? "cursor-not-allowed border-line-strong bg-line text-ink-soft"
                            : "border-line-strong bg-white text-ink hover:border-brand-dark hover:bg-brand-tint"
                            }`}
                          onClick={() => addUser(group.key)}
                        >
                          <Icon name="plus" />
                          {t("addUserFor", { model: group.label })}
                        </button>
                      )}
                      {groupReachedLimit && (
                        <p className="mt-2 flex items-center gap-1.5 text-[12px] text-alert">
                          <Icon name="info-circle" />
                          {t("userLimitWarning")}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
