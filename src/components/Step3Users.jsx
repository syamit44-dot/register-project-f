import { useMemo, useState } from "react";
import Icon from "./Icon";
import SearchableSelect from "./SearchableSelect";
import { getSelectedAppModels } from "../utils/registrationModels";
import { APP_USERNAME_MAX_LENGTH, MAIN_APP_USERS_PER_MODEL, appUserCounts, isValidAppUsername, sanitizeAppUsername } from "../utils/registrationPayload";
import { useLanguage } from "../i18n.jsx";

const UNASSIGNED = "__unassigned__";

export default function Step3Users({ data, onChange, isDealer, allowModelChange = false }) {
  const { t } = useLanguage();
  const [showUserInfo, setShowUserInfo] = useState(false);
  // เก็บสถานะ ย่อ/ขยาย ของแต่ละกลุ่มด้วย key ของกลุ่ม — ค่าเริ่มต้นคือ "ขยาย" ทุกกลุ่ม
  // (ไม่ต้องระบุใน state ก็ถือว่าขยายอยู่ ยกเว้นจะถูกเพิ่มลง collapsedGroups)
  const [collapsedGroups, setCollapsedGroups] = useState(() => new Set());

  const selectedModels = useMemo(() => getSelectedAppModels(data.houses), [data.houses]);

  const visibleGroups = useMemo(() => {
    const groups = new Map(Array.from(selectedModels, ([key, label]) => [key, { key, label, users: [] }]));
    const unassigned = { key: UNASSIGNED, label: t("unassignedGroup"), users: [] };
    data.app_users.forEach((user, index) => {
      const group = groups.get(user.device_model) ?? unassigned;
      group.users.push({ ...user, index });
    });
    return [...groups.values(), ...(unassigned.users.length ? [unassigned] : [])];
  }, [data.app_users, selectedModels, t]);

  function modelOptions(user) {
    return visibleGroups
      .filter((group) => {
        if (group.key === UNASSIGNED) return false;
        if (group.key === user.device_model) return true;
        const counts = appUserCounts(group.users);
        if (user.is_dealer) return isDealer && counts.distributors === 0;
        return counts.main < MAIN_APP_USERS_PER_MODEL && (user.user_type !== "super" || counts.superusers === 0);
      })
      .map(({ key, label }) => ({ value: key, label }));
  }

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

  function addUser(group, isDealerUser) {
    const counts = appUserCounts(group.users);
    if (isDealerUser ? !isDealer || counts.distributors > 0 : counts.main >= MAIN_APP_USERS_PER_MODEL) return;
    const groupKey = group.key;

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
          is_dealer: isDealerUser,
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
      </div>
      <div className="form-step-body px-7 py-8 sm:px-9 sm:py-9">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <p className="text-[13px] font-bold uppercase tracking-[0.05em] text-ink-soft">
              {t("userTypeShort")}
            </p>
            <button
              type="button"
              onClick={() => setShowUserInfo((shown) => !shown)}
              className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-line-strong bg-white text-ink-soft transition hover:border-brand-dark hover:text-brand-dark"
              aria-label={t("viewAppUserInfo")}
              aria-expanded={showUserInfo}
              aria-controls="app-user-info"
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
        {showUserInfo && (
          <div id="app-user-info" className="mt-3 flex items-start gap-2 rounded-xl border border-brand-tint bg-brand-tint px-3.5 py-2.5 text-sm leading-5 text-ink">
            <Icon name="info-circle" style={{ fontSize: 13 }} className="mt-0.5 shrink-0 text-brand" />
            <div className="space-y-3">
              <div>
                <p className="font-semibold">{t("appUsernameHelpTitle")}</p>
                <p>{t("registrationAppUsernameInvalid")}</p>
              </div>
              <div>
                <p className="font-semibold">{t("UserType")}</p>
                <p>{t("userTypeInfo")}</p>
              </div>
            </div>
          </div>
        )}

        {isDealer && <p className="mt-3 text-sm text-ink-soft">{t("dealerAppUserLimit")}</p>}
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
              const counts = appUserCounts(group.users);
              const assigned = group.key !== UNASSIGNED;

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
                      {assigned && <p className="mb-3 text-sm text-ink-soft">{t("appUserLimits", { count: counts.main })}</p>}
                      {assigned && counts.main > MAIN_APP_USERS_PER_MODEL && <p role="alert" className="mb-2 text-sm text-alert">{t("userLimitWarning")}</p>}
                      {assigned && counts.superusers > 1 && <p role="alert" className="mb-2 text-sm text-alert">{t("appSuperuserLimit")}</p>}
                      <div className="space-y-2">
                        {group.users.map((u) => {
                          const invalidUsername = Boolean(u.username) && u.username !== u.original_username && !isValidAppUsername(u.username);
                          const canSelectSuper = u.is_dealer || u.user_type === "super" || counts.superusers === 0;
                          const usernameErrorId = `app-username-error-${u.index}`;
                          return (
                            <div
                              className="grid gap-3 rounded-xl border border-line bg-mist/50 p-3.5 md:grid-cols-[1fr_1fr_1fr_auto]"
                              key={u.index}
                            >
                              {u.is_dealer && (
                                <div className="md:col-span-full">
                                  <span className="pill pill-brand">{t("dealerAppUser")}</span>
                                </div>
                              )}
                              {(allowModelChange || !assigned) && (
                                <div className="md:col-span-full">
                                  <SearchableSelect
                                    label={t("deviceModel")}
                                    compact
                                    value={u.device_model}
                                    options={modelOptions(u)}
                                    onChange={({ value }) => setUserField(u.index, "device_model", value)}
                                  />
                                </div>
                              )}
                              <div>
                                <label className="mb-1 block text-[12px] font-semibold text-ink-soft">
                                  {t("Username")}
                                </label>
                                <input
                                  className={`mono h-10 w-full rounded-xl border bg-white px-3 text-sm text-ink shadow-sm outline-none transition focus:ring-4 ${
                                    invalidUsername
                                      ? "!border-alert focus:ring-alert-tint"
                                      : "border-line-strong hover:border-brand/50 focus:border-brand focus:ring-brand-tint"
                                  }`}
                                  placeholder="name@farm"
                                  aria-label={t("Username")}
                                  aria-invalid={invalidUsername}
                                  aria-describedby={invalidUsername ? usernameErrorId : undefined}
                                  pattern="[a-z0-9]+@[a-z0-9]+"
                                  maxLength={APP_USERNAME_MAX_LENGTH}
                                  autoCapitalize="none"
                                  spellCheck={false}
                                  value={u.username}
                                  onChange={(e) => setUserField(u.index, "username", sanitizeAppUsername(e.target.value))}
                                />
                                {invalidUsername && (
                                  <p id={usernameErrorId} className="mt-1 text-[12px] text-alert">
                                    {t("appUsernameFormatWarning")}
                                  </p>
                                )}
                              </div>
                              <div>
                                <SearchableSelect
                                  label={t("UserType")}
                                  compact
                                  value={u.user_type}
                                  options={[
                                    { value: "normal", label: t("userTypeNormal") },
                                    ...(canSelectSuper ? [{ value: "super", label: t("userTypeSuper") }] : []),
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
                          );
                        })}
                      </div>

                      {assigned && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={counts.main >= MAIN_APP_USERS_PER_MODEL}
                            className="inline-flex items-center gap-2 rounded-xl border border-line-strong bg-white px-4 py-2 text-sm text-ink transition enabled:hover:border-brand-dark enabled:hover:bg-brand-tint disabled:cursor-not-allowed disabled:bg-line disabled:text-ink-soft"
                            onClick={() => addUser(group, false)}
                          >
                            <Icon name="plus" />
                            {t("addUserFor", { model: group.label })}
                          </button>
                          {isDealer && counts.distributors === 0 && (
                            <button
                              type="button"
                              className="inline-flex items-center gap-2 rounded-xl border border-line-strong bg-white px-4 py-2 text-sm text-ink transition hover:border-brand-dark hover:bg-brand-tint"
                              onClick={() => addUser(group, true)}
                            >
                              <Icon name="plus" />
                              {t("addDealerAppUser")}
                            </button>
                          )}
                        </div>
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
