import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Icon from "./Icon";
import SearchableSelect from "./SearchableSelect";
import { fetchEquipmentModels } from "../api/client";
import modelData from "../data/modelData";
import modelAlarmData from "../data/modelAlarm";
import modelEggCounterData from "../data/modelEggCounter";
import modelWeightScaleData from "../data/modelWeightScale";
import { useLanguage } from "../i18n.jsx";

const COMMUNICATION_OPTIONS = [
  { key: "tempview", no: 1, labelKey: "communicationTempView", descKey: "communicationTempViewDesc" },
  { key: "smartlink", no: 2, labelKey: "communicationSmartLink", descKey: "communicationSmartLinkDesc" },
];

// รายการ Alarm ที่เลือกได้ในป๊อปอัพ
const ALARM_OPTIONS = [
  { key: "alarm04", label: "Alarm 04" },
  { key: "alarm05", label: "Alarm 05" },
];

const LEGACY_EGG_CODES = ["Egg-Ai1", "Egg-C12"];

function findArtwork(artwork, item) {
  if (!item) return undefined;
  const normalize = (value) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
  const candidates = [item.model_name, item.model, item.key].filter(Boolean).map(normalize);
  return Object.entries(artwork).find(([key]) => candidates.includes(normalize(key)))?.[1];
}

function emptyCommunication() {
  return { tempview: false, smartlink: false };
}

function mergeCommunications(...comms) {
  const merged = emptyCommunication();
  comms.forEach((c) => {
    Object.keys(merged).forEach((k) => {
      if (c?.[k]) merged[k] = true;
    });
  });
  return merged;
}

function emptyHouseDetail() {
  return {
    configured: false,
    model_enabled: false,
    device_models: [],
    device_communication: emptyCommunication(),
    smartlink_serial_number: "",
    egg_enabled: false,
    egg_models: [],
    egg_communication: emptyCommunication(),
    alarm_enabled: false,
    alarms: [],
    alarm_communication: emptyCommunication(),
    silonic_enabled: false,
    silonic_communication: emptyCommunication(),
    silonic_models: [],
    silonic_serial_number: "",
  };
}

function normalizeHouse(h) {
  const base = {
    ...h,
    ...emptyHouseDetail(),
    ...h,
  };

  const legacyCommunication = h.communication;
  base.device_communication = { ...emptyCommunication(), ...(legacyCommunication ?? {}), ...(h.device_communication ?? {}) };
  base.alarm_communication = { ...emptyCommunication(), ...(legacyCommunication ?? {}), ...(h.alarm_communication ?? {}) };
  base.egg_communication = { ...emptyCommunication(), ...(legacyCommunication ?? {}), ...(h.egg_communication ?? {}) };
  base.silonic_communication = { ...emptyCommunication(), ...(legacyCommunication ?? {}), ...(h.silonic_communication ?? {}) };
  delete base.communication;

  base.smartlink_serial_number = h.smartlink_serial_number ?? "";

  if ((!base.device_models || base.device_models.length === 0) && h.device_model) {
    base.device_models = [{ model: h.device_model, serial_number: h.model_serial_number ?? "" }];
  }
  if (!Array.isArray(base.device_models)) base.device_models = [];

  if ((!base.egg_models || base.egg_models.length === 0) && h.egg_model) {
    base.egg_models = [{ model: h.egg_model, serial_number: h.egg_serial_number ?? "" }];
  }
  if (!Array.isArray(base.egg_models)) base.egg_models = [];

  if (h.alarms && !Array.isArray(h.alarms)) {
    base.alarms = ALARM_OPTIONS.filter((o) => h.alarms?.[o.key]).map((o) => ({
      key: o.key,
      serial_number: "",
    }));
  } else if (!Array.isArray(base.alarms)) {
    base.alarms = [];
  }

  base.device_models = base.device_models.filter((dm) => dm?.model_id || !LEGACY_EGG_CODES.includes(dm?.model));

  if ((!base.silonic_models || base.silonic_models.length === 0) && Array.isArray(h.silonic)) {
    base.silonic_models = h.silonic.map(s => ({
      model: s.model ?? s.key,
      serial_number: s.serial_number ?? ""
    }));
  }
  if (!Array.isArray(base.silonic_models)) base.silonic_models = [];

  if (!base.configured) {
    base.model_enabled = false;
    base.device_models = [];
    base.egg_enabled = false;
    base.egg_models = [];
    base.alarm_enabled = false;
    base.alarms = [];
    base.device_communication = emptyCommunication();
    base.alarm_communication = emptyCommunication();
    base.egg_communication = emptyCommunication();
    base.silonic_communication = emptyCommunication();
    base.smartlink_serial_number = "";
    base.silonic_enabled = false;
    base.silonic_serial_number = "";
    base.silonic_models = [];
  }

  return base;
}

function copyEquipmentModels(source, target, modelKey) {
  return source.map((item, index) => ({
    [modelKey]: item[modelKey],
    model_id: item.model_id,
    model_name: item.model_name,
    serial_number: target[index]?.[modelKey] === item[modelKey]
      ? target[index]?.serial_number ?? ""
      : "",
  }));
}

function copyHouseSettings(source, target) {
  const silonicModels = source.silonic_enabled ? copyEquipmentModels(source.silonic_models, target.silonic_models, "model") : [];
  const sameSmartlink = source.model_enabled && target.model_enabled
    && source.device_communication.smartlink && target.device_communication.smartlink
    && source.device_models[0]?.model === target.device_models[0]?.model;
  const copied = {
    ...target,
    configured: true,
    model_enabled: source.model_enabled,
    device_models: source.model_enabled ? copyEquipmentModels(source.device_models, target.device_models, "model") : [],
    device_communication: { ...source.device_communication },
    smartlink_serial_number: sameSmartlink ? target.smartlink_serial_number : "",
    egg_enabled: source.egg_enabled,
    egg_models: source.egg_enabled ? copyEquipmentModels(source.egg_models, target.egg_models, "model") : [],
    egg_communication: { ...source.egg_communication },
    alarm_enabled: source.alarm_enabled,
    alarms: source.alarm_enabled ? copyEquipmentModels(source.alarms, target.alarms, "key") : [],
    alarm_communication: { ...source.alarm_communication },
    silonic_enabled: source.silonic_enabled,
    silonic_models: silonicModels,
    silonic_communication: { ...source.silonic_communication },
    silonic_serial_number: silonicModels[0]?.serial_number ?? "",
  };
  // Legacy fields must not repopulate equipment that the copied settings removed.
  delete copied.device_model;
  delete copied.model_serial_number;
  delete copied.egg_model;
  delete copied.egg_serial_number;
  delete copied.silonic;
  return copied;
}

function summarizeCommunication(communication, t) {
  const labels = COMMUNICATION_OPTIONS.filter((o) => communication?.[o.key]).map((o) => t(o.labelKey));
  return labels.length ? labels.join(", ") : "";
}

function communicationBadgeLabels(communication, t) {
  return COMMUNICATION_OPTIONS.filter((o) => communication?.[o.key]).map((o) => t(o.labelKey));
}

function summarizeAlarms(alarms) {
  if (!alarms || alarms.length === 0) return "";
  return alarms
    .map((a) => a.model_name ?? ALARM_OPTIONS.find((o) => o.key === a.key)?.label ?? a.key)
    .join(", ");
}

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

function ModelImagePreview({ image, svgHtml, name }) {
  const { t } = useLanguage();
  if (!image && !svgHtml) {
    return (
      <div className="model-img-placeholder">
        <Icon name="image" style={{ fontSize: 18 }} />
        <span>{t("selectModelToViewImage")}</span>
      </div>
    );
  }
  return (
    <div className="product-image-card visible">
      <div className="pic-header">
        <span className="pic-model-name">{name}</span>
      </div>
      <div className="pic-body">
        {svgHtml ? (
          <div dangerouslySetInnerHTML={{ __html: svgHtml }} />
        ) : (
          <img src={image} alt={name} className="product-svg" />
        )}
      </div>
    </div>
  );
}

export default function Step2DeviceInfo({ active, data, onChange, editor, onEditorChange }) {
  const { t } = useLanguage();
  const editingIndex = editor?.index ?? null;
  const draft = editor?.draft ?? null;
  const selectedModel = draft?.device_models?.[0]?.model || "";
  const selectedEggModels = draft?.egg_models ?? [];
  const selectedAlarms = draft?.alarms ?? [];
  const selectedSilonic = draft?.silonic_models ?? [];
  const copyTargets = editor?.targets ?? [];
  const [showHouseListInfo, setShowHouseListInfo] = useState(false);
  const [equipmentModels, setEquipmentModels] = useState([]);
  const [catalogState, setCatalogState] = useState("loading");

  useEffect(() => {
    if (!active) return;
    let ignore = false;
    setCatalogState("loading");
    fetchEquipmentModels().then((models) => {
      if (ignore) return;
      setEquipmentModels(models);
      setCatalogState("ready");
    }).catch(() => {
      if (!ignore) setCatalogState("error");
    });
    return () => { ignore = true; };
  }, [active]);

  const houses = useMemo(() => (data.houses ?? []).map(normalizeHouse), [data.houses]);
  const isBulkEditing = editingIndex === null && draft !== null;
  const enabledEquipment = draft ? [
    draft.model_enabled ? draft.device_models : null,
    draft.alarm_enabled ? draft.alarms : null,
    draft.silonic_enabled ? draft.silonic_models : null,
    draft.egg_enabled ? draft.egg_models : null,
  ].filter(Boolean) : [];
  const canCopy = copyTargets.length > 0 && enabledEquipment.length > 0 && enabledEquipment.every((models) => models.length > 0);
  const expectedHouseCount = Math.max(1, Number.parseInt(data.house_count, 10) || 1);

  useEffect(() => {
    const currentCount = (data.houses ?? []).length;
    if (currentCount === expectedHouseCount) return;

    const nextHouses = Array.from({ length: expectedHouseCount }, (_, index) => {
      const existing = data.houses?.[index] ?? {};
      return {
        ...existing,
        name: existing.name || `House ${index + 1}`,
      };
    });

    onChange({ ...data, houses: nextHouses });
  }, [data, expectedHouseCount, onChange]);

  function openEditor(index) {
    onEditorChange({
      type: "equipment",
      index,
      draft: index === null ? emptyHouseDetail() : houses[index],
      targets: [],
    });
  }

  function closeEditor() {
    onEditorChange(null);
  }

  function saveEditor() {
    if (!draft || (isBulkEditing && !canCopy)) return;
    const nextHouses = data.houses.map((house, index) => {
      if (isBulkEditing && copyTargets.includes(index)) return copyHouseSettings(draft, houses[index]);
      return index === editingIndex ? { ...draft, configured: true } : house;
    });
    onChange({ ...data, houses: nextHouses });
    closeEditor();
  }

  function updateDraft(patch) {
    setDraft((prev) => ({ ...prev, ...patch }));
  }

  function setDraft(update) {
    onEditorChange((previous) => ({ ...previous, draft: update(previous.draft), dirty: true }));
  }

  function selectDraftCommunication(section, key) {
    setDraft((prev) => {
      const isActive = prev[section][key];
      const next = emptyCommunication();
      if (!isActive) next[key] = true;
      return { ...prev, [section]: next };
    });
  }

  function selectEquipment(field, key, option) {
    setDraft((prev) => ({
      ...prev,
      [field]: option.value ? [{
        [key]: option.value,
        model_id: option.id,
        model_name: option.label,
        serial_number: prev[field][0]?.serial_number ?? "",
      }] : [],
    }));
  }

  function changeEquipmentSerial(field, value) {
    setDraft((prev) => ({
      ...prev,
      [field]: [{ ...prev[field][0], serial_number: value }, ...prev[field].slice(1)],
      ...(field === "silonic_models" ? { silonic_serial_number: value } : {}),
    }));
  }

  function renderModelSelect(category, value, valueLabel, onChange) {
    const options = equipmentModels
      .filter((model) => model.category === category)
      .map(({ id, code, name }) => ({ id, value: code, label: name, keywords: code }));
    const placeholder = catalogState === "loading" ? t("loading") : t("selectModelPlaceholder");
    return (
      <>
        <SearchableSelect
          label={t("selectDeviceModel")}
          required
          placeholder={placeholder}
          value={value}
          valueLabel={valueLabel}
          options={value ? [{ value: "", label: t("selectModelPlaceholder") }, ...options] : options}
          onChange={onChange}
          disabled={catalogState !== "ready" || options.length === 0}
        />
        {catalogState === "error" && <p role="alert" className="mt-1 text-xs text-alert">{t("equipmentCatalogError")}</p>}
        {catalogState === "ready" && options.length === 0 && <p className="mt-1 text-xs text-ink-soft">{t("equipmentCatalogEmpty")}</p>}
      </>
    );
  }

  // Render ตัวเลือกการเชื่อมต่อ (TempView / SmartLink) สำหรับหัวข้อใดหัวข้อหนึ่งโดยเฉพาะ
  function renderCommunicationPicker(section, { showSmartlinkSerial = false } = {}) {
    const communication = draft[section];
    const isOnboard = section === "silonic_communication" || section === "egg_communication";

    return (
      <div className="mt-3">
        <p className="text-sm font-medium text-ink">
          {t("communication")}
        </p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {(() => {
            const opt = COMMUNICATION_OPTIONS.find((o) => o.key === "tempview");
            const active = communication[opt.key];
            return (
              <button
                type="button"
                onClick={() => selectDraftCommunication(section, opt.key)}
                aria-pressed={active}
                className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition ${active
                  ? "border-brand bg-brand text-white shadow-sm"
                  : "border-line-strong bg-white text-ink-soft hover:border-brand hover:bg-brand-tint hover:text-brand-dark"
                  }`}
              >
                {active && <Icon name="check" style={{ fontSize: 12 }} />}
                {t(opt.labelKey)}
              </button>
            );
          })()}

          {(() => {
            const opt = COMMUNICATION_OPTIONS.find((o) => o.key === "smartlink");
            const active = communication[opt.key];
            const label = isOnboard ? `${t("communicationSmartLink")} onboard` : t(opt.labelKey);

            return (
              <button
                type="button"
                onClick={() => selectDraftCommunication(section, opt.key)}
                aria-pressed={active}
                className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition ${active
                  ? "border-brand bg-brand text-white shadow-sm"
                  : "border-line-strong bg-white text-ink-soft hover:border-brand hover:bg-brand-tint hover:text-brand-dark"
                  }`}
              >
                {active && <Icon name="check" style={{ fontSize: 12 }} />}
                {label}
              </button>
            );
          })()}
        </div>

        {showSmartlinkSerial && communication.smartlink && (
          <div className="mt-2.5">
            <label className="block text-[13px] font-semibold text-ink">
              {t("smartlinkSnLabel")}<span className="ml-0.5 text-alert">*</span>
              <input
                type="text"
                className="mt-1.5 h-11 w-full rounded-xl border border-line-strong bg-white px-3.5 text-[13.5px] text-ink shadow-sm outline-none transition hover:border-brand/50 focus:border-brand focus:ring-4 focus:ring-brand-tint"
                placeholder={t("smartlinkSnPlaceholder")}
                value={draft.smartlink_serial_number ?? ""}
                onChange={(e) => updateDraft({ smartlink_serial_number: e.target.value })}
              />
            </label>
          </div>
        )}

        {COMMUNICATION_OPTIONS.filter((opt) => communication[opt.key]).length > 0 && (
          <div className="mt-2.5 space-y-1.5">
            {COMMUNICATION_OPTIONS.filter((opt) => communication[opt.key]).map((opt) => {
              const label = (opt.key === "smartlink" && isOnboard) ? `${t("communicationSmartLink")} onboard` : t(opt.labelKey);

              return (
                <div
                  key={opt.key}
                  className="flex items-start gap-2 rounded-xl border border-brand-tint bg-brand-tint/60 px-3 py-2 text-sm leading-5 text-ink-soft"
                >
                  <Icon name="info-circle" style={{ fontSize: 13 }} className="mt-0.5 shrink-0 text-brand" />
                  <p>
                    <span className="text-base font-medium text-ink">{label}:</span> {t(opt.descKey)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="form-step-header flex items-center gap-3 border-b border-line px-7 py-6 sm:px-9">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand text-white">
          <Icon name="device" style={{ fontSize: 18 }} />
        </div>
        <div>
          <p className="mb-0.5 font-mono text-[11px] uppercase tracking-[0.06em] text-ink-soft">{t("part02")}</p>
          <h2 className="text-[18px] font-bold text-ink sm:text-[20px]">{t("deviceInformation")}</h2>
        </div>
      </div>

      <div className="form-step-body px-7 py-8 sm:px-9 sm:py-9">
        <div className="flex flex-wrap items-center gap-2 border-b border-line pb-3">
          <p className="text-[13px] font-bold uppercase tracking-[0.06em] text-ink-soft">{t("houseList")}</p>
          <button
            type="button"
            onClick={() => setShowHouseListInfo((value) => !value)}
            className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-line-strong bg-white text-[12px] font-semibold text-ink-soft transition hover:border-brand hover:text-brand"
            aria-label={t("descriptionHouseList")}
          >
            <Icon name="info-circle" style={{ fontSize: 14 }} />
          </button>
          {houses.length > 1 && (
            <button
              type="button"
              onClick={() => openEditor(null)}
              className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-brand bg-white px-3 py-2 text-[12px] font-semibold text-brand-dark transition hover:bg-brand-tint"
            >
              <Icon name="copy" style={{ fontSize: 14 }} />
              {t("copyHouseSettings")}
            </button>
          )}
        </div>
        {showHouseListInfo && (
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-brand-tint bg-brand-tint px-3.5 py-2.5 text-[13px] leading-5 text-ink">
            <Icon name="info-circle" style={{ fontSize: 13 }} className="mt-0.5 shrink-0 text-brand" />
            <span>{t("descriptionHouseList")}</span>
          </div>
        )}
        <div className="mt-4 space-y-3">
          {houses.map((h, i) => {
            const fields = [
              {
                key: "model",
                label: t("deviceModel"),
                enabled: h.model_enabled,
                text: summarizeModels(h.device_models),
                badges: communicationBadgeLabels(h.device_communication, t),
              },
              {
                key: "alarm",
                label: t("alarmController"),
                enabled: h.alarm_enabled,
                text: summarizeAlarms(h.alarms),
                badges: communicationBadgeLabels(h.alarm_communication, t),
              },
              {
                key: "silonic",
                label: t("communicationSilonic"),
                enabled: h.silonic_enabled,
                text: summarizeSilonic(h.silonic_models),
                badges: communicationBadgeLabels(h.silonic_communication, t),
              },
              {
                key: "egg",
                label: t("egg"),
                enabled: h.egg_enabled,
                text: summarizeEggModels(h.egg_models),
                badges: communicationBadgeLabels(h.egg_communication, t),
              },
            ];

            return (
              <div key={i} className="house-summary-panel group overflow-hidden rounded-xl border border-line bg-white transition hover:border-line-strong">
                <div className="flex items-center justify-between gap-4 px-6 py-5 sm:px-8">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand text-[13px] font-bold text-white">
                      {i + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-[14px] font-bold text-ink">{h.name}</div>
                      <div className="text-[11px] text-ink-soft">{t("house")}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      openEditor(i);
                    }}
                    className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-brand bg-white px-3 text-[12px] font-semibold text-brand-dark shadow-sm transition hover:bg-brand hover:text-white"
                  >
                    <Icon name="edit" style={{ fontSize: 12 }} />
                    {t("edit")}
                  </button>
                </div>
                <div className="grid gap-x-7 gap-y-4 border-t border-line px-6 py-5 sm:grid-cols-4 sm:px-8">
                  {fields.map((f) => (
                    <div key={f.key} className="min-w-0">
                      <div className="truncate text-[10px] font-semibold uppercase tracking-[0.05em] text-ink-soft">{f.label}</div>
                      <div className="mt-1 truncate text-[12.5px] text-ink">
                        {f.enabled && f.text ? f.text : <span className="text-ink-soft">{t("notSpecified")}</span>}
                      </div>
                      {f.enabled && f.badges.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {f.badges.map((label) => (
                            <span key={label} className="rounded-full bg-brand-tint px-1.5 py-0.5 text-[9.5px] font-semibold text-brand-dark">
                              {label}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {houses.length === 0 && (
            <div className="rounded-xl border border-dashed border-line-strong bg-mist/60 p-10 text-center text-[13.5px] text-ink-soft">
              {t("noHouseData")}
            </div>
          )}
        </div>
      </div>

      {draft &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-ink/45 px-4 py-6">
            <div role="dialog" aria-modal="true" aria-labelledby="house-settings-title" className="flex max-h-[92vh] w-full max-w-5xl flex-col rounded-xl bg-white shadow-2xl">
              <div className="flex flex-shrink-0 items-center justify-between rounded-t-xl border-b border-line-strong bg-brand px-7 py-5">
                <h2 id="house-settings-title" className="text-xl font-bold text-white sm:text-2xl">
                  {isBulkEditing ? t("copyHouseSettings") : houses[editingIndex]?.name}
                </h2>
                <button type="button" onClick={closeEditor} aria-label={t("close")} className="flex h-8 w-8 items-center justify-center rounded-full text-white/90 transition hover:bg-white/15 hover:text-white">
                  <Icon name="x" style={{ fontSize: 20 }} />
                </button>
              </div>

              <div className="space-y-6 overflow-y-auto px-7 py-7">
                {isBulkEditing && (
                  <fieldset className="rounded-xl border border-line bg-white px-5 pb-4 pt-2">
                    <legend className="px-1 text-sm font-semibold text-ink">{t("copyHouseTargets")}</legend>
                    <div className="grid max-h-40 gap-2 overflow-y-auto sm:grid-cols-2 lg:grid-cols-4">
                      {houses.map((house, index) => (
                        <label key={index} className="flex cursor-pointer items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm hover:bg-mist">
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-brand"
                            checked={copyTargets.includes(index)}
                            onChange={(event) => {
                              const checked = event.target.checked;
                              onEditorChange((previous) => ({
                                ...previous,
                                dirty: true,
                                targets: checked
                                  ? [...previous.targets, index]
                                  : previous.targets.filter((target) => target !== index),
                              }));
                            }}
                          />
                          {house.name}
                        </label>
                      ))}
                    </div>
                    <p className="mt-3 text-[13px] text-ink-soft">{t("copyHouseNotice")}</p>
                  </fieldset>
                )}

                {/* Device Model */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_2px_8px_rgba(22,35,61,0.035)]">
                  <label className="flex items-center gap-2 text-sm font-medium text-ink">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={draft.model_enabled}
                      onChange={(e) => updateDraft({ model_enabled: e.target.checked })}
                    />
                    {t("deviceModel")}
                  </label>
                  {draft.model_enabled && (
                    <div className="model-select-row mt-3">
                      <div className="flex-1">
                        <div className="flex gap-3">
                          <div className="flex-1">
                            {renderModelSelect("CONTROLLER", selectedModel, draft.device_models[0]?.model_name ?? modelData[selectedModel]?.name ?? selectedModel, (option) => selectEquipment("device_models", "model", option))}
                          </div>
                          {!isBulkEditing && (
                            <div className="flex-1">
                              <label className="block text-[13px] font-semibold text-ink">
                                S / N<span className="ml-0.5 text-alert">*</span>
                                <input
                                  type="text"
                                  className="mt-1.5 h-11 w-full rounded-xl border border-line-strong bg-white px-3.5 text-[13.5px] text-ink shadow-sm outline-none transition hover:border-brand/50 focus:border-brand focus:ring-4 focus:ring-brand-tint disabled:bg-mist disabled:text-ink-soft disabled:shadow-none"
                                  placeholder={t("enterSerialNumber")}
                                  disabled={!selectedModel}
                                  value={draft.device_models?.[0]?.serial_number ?? ""}
                                  onChange={(e) => changeEquipmentSerial("device_models", e.target.value)}
                                />
                              </label>
                            </div>
                          )}
                        </div>
                        {renderCommunicationPicker("device_communication", { showSmartlinkSerial: !isBulkEditing })}
                      </div>
                      <ModelImagePreview
                        svgHtml={findArtwork(modelData, draft.device_models[0])?.svg}
                        name={draft.device_models[0]?.model_name ?? modelData[selectedModel]?.name ?? ""}
                      />
                    </div>
                  )}
                </div>

                {/* Alarm */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_2px_8px_rgba(22,35,61,0.035)]">
                  <label className="flex items-center gap-2 text-sm font-medium text-ink">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={draft.alarm_enabled}
                      onChange={(e) => updateDraft({ alarm_enabled: e.target.checked })}
                    />
                    {t("alarmController")}
                  </label>
                  {draft.alarm_enabled && (
                    <div className="model-select-row mt-3">
                      <div className="flex-1">
                        <div className="flex gap-3">
                          <div className="flex-1">
                            {renderModelSelect("ALARM", selectedAlarms[0]?.key || "", selectedAlarms[0]?.model_name ?? summarizeAlarms(selectedAlarms), (option) => selectEquipment("alarms", "key", option))}
                          </div>
                          {!isBulkEditing && (
                            <div className="flex-1">
                              <label className="block text-[13px] font-semibold text-ink">
                                S / N<span className="ml-0.5 text-alert">*</span>
                                <input
                                  type="text"
                                  className="mt-1.5 h-11 w-full rounded-xl border border-line-strong bg-white px-3.5 text-[13.5px] text-ink shadow-sm outline-none transition hover:border-brand/50 focus:border-brand focus:ring-4 focus:ring-brand-tint disabled:bg-mist disabled:text-ink-soft disabled:shadow-none"
                                  placeholder={t("enterSerialNumber")}
                                  disabled={!selectedAlarms[0]?.key}
                                  value={draft.alarms?.[0]?.serial_number ?? ""}
                                  onChange={(e) => changeEquipmentSerial("alarms", e.target.value)}
                                />
                              </label>
                            </div>
                          )}
                        </div>
                        {renderCommunicationPicker("alarm_communication")}
                      </div>
                      <ModelImagePreview
                        image={findArtwork(modelAlarmData, selectedAlarms[0])?.image}
                        name={summarizeAlarms(selectedAlarms)}
                      />
                    </div>
                  )}
                </div>

                {/* Weight Scale / Silonic-Xi */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_2px_8px_rgba(22,35,61,0.035)]">
                  <label className="flex items-center gap-2 text-sm font-medium text-ink">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={draft.silonic_enabled}
                      onChange={(e) => updateDraft({ silonic_enabled: e.target.checked })}
                    />
                    {t("communicationSilonic")}
                  </label>
                  {draft.silonic_enabled && (
                    <div className="model-select-row mt-3">
                      <div className="flex-1">
                        <div className="flex gap-3">
                          <div className="flex-1">
                            {renderModelSelect("SILONIC", selectedSilonic[0]?.model || "", selectedSilonic[0]?.model_name ?? selectedSilonic[0]?.model, (option) => selectEquipment("silonic_models", "model", option))}
                          </div>
                          {!isBulkEditing && (
                            <div className="flex-1">
                              <label className="block text-[13px] font-semibold text-ink">
                                S / N<span className="ml-0.5 text-alert">*</span>
                                <input
                                  type="text"
                                  className="mt-1.5 h-11 w-full rounded-xl border border-line-strong bg-white px-3.5 text-[13.5px] text-ink shadow-sm outline-none transition hover:border-brand/50 focus:border-brand focus:ring-4 focus:ring-brand-tint disabled:bg-mist disabled:text-ink-soft disabled:shadow-none"
                                  placeholder={t("enterSerialNumber")}
                                  disabled={!selectedSilonic[0]?.model}
                                  value={draft.silonic_models?.[0]?.serial_number ?? ""}
                                  onChange={(e) => changeEquipmentSerial("silonic_models", e.target.value)}
                                />
                              </label>
                            </div>
                          )}
                        </div>
                        {renderCommunicationPicker("silonic_communication")}
                      </div>
                      <ModelImagePreview
                        image={findArtwork(modelWeightScaleData, selectedSilonic[0])?.image}
                        name={summarizeSilonic(selectedSilonic)}
                      />
                    </div>
                  )}
                </div>

                {/* Egg */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_2px_8px_rgba(22,35,61,0.035)]">
                  <label className="flex items-center gap-2 text-sm font-medium text-ink">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={draft.egg_enabled}
                      onChange={(e) => updateDraft({ egg_enabled: e.target.checked })}
                    />
                    {t("egg")}
                  </label>
                  {draft.egg_enabled && (
                    <div className="model-select-row mt-3">
                      <div className="flex-1">
                        <div className="flex gap-3">
                          <div className="flex-1">
                            {renderModelSelect("EGG", selectedEggModels[0]?.model || "", selectedEggModels[0]?.model_name ?? selectedEggModels[0]?.model, (option) => selectEquipment("egg_models", "model", option))}
                          </div>
                          {!isBulkEditing && (
                            <div className="flex-1">
                              <label className="block text-[13px] font-semibold text-ink">
                                S / N<span className="ml-0.5 text-alert">*</span>
                                <input
                                  type="text"
                                  className="mt-1.5 h-11 w-full rounded-xl border border-line-strong bg-white px-3.5 text-[13.5px] text-ink shadow-sm outline-none transition hover:border-brand/50 focus:border-brand focus:ring-4 focus:ring-brand-tint disabled:bg-mist disabled:text-ink-soft disabled:shadow-none"
                                  placeholder={t("enterSerialNumber")}
                                  disabled={!selectedEggModels[0]?.model}
                                  value={draft.egg_models?.[0]?.serial_number ?? ""}
                                  onChange={(e) => changeEquipmentSerial("egg_models", e.target.value)}
                                />
                              </label>
                            </div>
                          )}
                        </div>
                        {renderCommunicationPicker("egg_communication")}
                      </div>
                      <ModelImagePreview
                        image={findArtwork(modelEggCounterData, selectedEggModels[0])?.image}
                        name={summarizeEggModels(selectedEggModels)}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-shrink-0 justify-end gap-2 rounded-b-xl border-t border-line-strong px-7 py-5">
                <button
                  type="button"
                  onClick={closeEditor}
                  className="h-10 rounded-xl border border-line-strong bg-white px-4 text-[13px] font-medium text-ink transition hover:bg-mist"
                >
                  {t("cancel")}
                </button>
                <button
                  type="button"
                  onClick={saveEditor}
                  disabled={isBulkEditing && !canCopy}
                  className="h-10 rounded-xl border border-brand bg-brand px-5 text-[13px] font-semibold text-white shadow-sm transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t(isBulkEditing ? "copyHouseApply" : "save")}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
