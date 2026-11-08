import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Icon from "./Icon";
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

// key ของ ALARM_OPTIONS ("alarm04") ไม่ตรงกับ key ใน data/modelAlarm.js ("Alarm-04") — ใช้ตารางนี้แปลงไปมา
const ALARM_KEY_TO_IMAGE_KEY = {
  alarm04: "Alarm-04",
  alarm05: "Alarm-05",
};

const modelEggData = [
  { key: "Egg-Ai1", label: "Egg-Ai1" },
  { key: "Egg-C12", label: "Egg-C12" },
];
const modelSilonicData = [
  { key: "Silonic-Xi", label: "Silonic-Xi" }
];

const EGG_MODEL_OPTIONS = modelEggData.map((egg) => egg.key);

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

  base.egg_models = base.egg_models.filter((dm) => EGG_MODEL_OPTIONS.includes(dm?.model));
  base.device_models = base.device_models.filter((dm) => !EGG_MODEL_OPTIONS.includes(dm?.model));

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
    .map((a) => ALARM_OPTIONS.find((o) => o.key === a.key)?.label ?? a.key)
    .join(", ");
}

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

export default function Step2DeviceInfo({ data, onChange }) {
  const { t } = useLanguage();
  const [editingIndex, setEditingIndex] = useState(null);
  const [draft, setDraft] = useState(null);
  const [selectedModel, setSelectedModel] = useState(data.device_model || "");
  const [selectedEggModels, setSelectedEggModels] = useState(data.egg_models || []);
  const [selectedAlarms, setSelectedAlarms] = useState(data.alarms || []);
  const [selectedSilonic, setSelectedSilonic] = useState([]);
  const [showHouseListInfo, setShowHouseListInfo] = useState(false);

  const houses = useMemo(() => (data.houses ?? []).map(normalizeHouse), [data.houses]);
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
    const normalized = normalizeHouse(houses[index]);
    setDraft(normalized);
    setSelectedModel(normalized.device_models?.[0]?.model || "");
    setSelectedAlarms(normalized.alarms || []);
    setSelectedEggModels(normalized.egg_models || []);
    setEditingIndex(index);
    setSelectedSilonic(normalized.silonic_models || []);
  }

  function closeEditor() {
    setEditingIndex(null);
    setDraft(null);
  }

  function saveEditor() {
    if (editingIndex === null || !draft) return;
    const nextHouses = houses.map((h, i) => (i === editingIndex ? { ...draft, configured: true } : h));
    onChange({ ...data, houses: nextHouses });
    closeEditor();
  }

  function updateDraft(patch) {
    setDraft((prev) => ({ ...prev, ...patch }));
  }

  function selectDraftCommunication(section, key) {
    setDraft((prev) => {
      const isActive = prev[section][key];
      const next = emptyCommunication();
      if (!isActive) next[key] = true;
      return { ...prev, [section]: next };
    });
  }

  function handleDeviceModelSelect(modelKey) {
    setSelectedModel(modelKey);
    setDraft((prev) => ({
      ...prev,
      device_models: modelKey
        ? [{ model: modelKey, serial_number: prev.device_models?.[0]?.serial_number ?? "" }]
        : [],
    }));
  }

  function handleDeviceSerialChange(value) {
    setDraft((prev) => ({
      ...prev,
      device_models: prev.device_models?.[0]
        ? [{ ...prev.device_models[0], serial_number: value }]
        : selectedModel
          ? [{ model: selectedModel, serial_number: value }]
          : [],
    }));
  }

  function handleEggModelSelect(modelKey) {
    setDraft((prev) => {
      const nextEggModels = modelKey
        ? [{ model: modelKey, serial_number: prev.egg_models?.[0]?.serial_number ?? "" }]
        : [];
      setSelectedEggModels(nextEggModels);
      return { ...prev, egg_models: nextEggModels };
    });
  }

  function handleEggSerialChange(value) {
    setDraft((prev) => {
      const currentModel = prev.egg_models?.[0]?.model || selectedEggModels[0]?.model || "";
      const nextEggModels = currentModel ? [{ model: currentModel, serial_number: value }] : [];
      setSelectedEggModels(nextEggModels);
      return { ...prev, egg_models: nextEggModels };
    });
  }

  function handleAlarmSelect(alarmKey) {
    setDraft((prev) => {
      const nextAlarms = alarmKey
        ? [{ key: alarmKey, serial_number: prev.alarms?.[0]?.serial_number ?? "" }]
        : [];
      setSelectedAlarms(nextAlarms);
      return { ...prev, alarms: nextAlarms };
    });
  }

  function handleAlarmSerialChange(value) {
    setDraft((prev) => {
      const currentKey = prev.alarms?.[0]?.key || selectedAlarms[0]?.key || "";
      const nextAlarms = currentKey ? [{ key: currentKey, serial_number: value }] : [];
      setSelectedAlarms(nextAlarms);
      return { ...prev, alarms: nextAlarms };
    });
  }

  function handleSilonicSelect(silonicKey) {
    setDraft((prev) => {
      const nextSilonic = silonicKey
        ? [
            {
              model: silonicKey,
              serial_number: prev.silonic_models?.[0]?.serial_number ?? "",
            },
          ]
        : [];

      setSelectedSilonic(nextSilonic);

      return {
        ...prev,
        silonic_models: nextSilonic,
      };
    });
  }

  function handleSilonicSerialChange(value) {
    setDraft((prev) => {
      const currentKey =
        prev.silonic_models?.[0]?.model ||
        selectedSilonic[0]?.model ||
        "";

      const nextSilonic = currentKey
        ? [
            {
              model: currentKey,
              serial_number: value,
            },
          ]
        : [];

      setSelectedSilonic(nextSilonic);

      return {
        ...prev,
        silonic_models: nextSilonic,
        silonic_serial_number: value,
      };
    });
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
        <div className="flex items-center gap-2 border-b border-line pb-3">
          <p className="text-[13px] font-bold uppercase tracking-[0.06em] text-ink-soft">{t("houseList")}</p>
          <button
            type="button"
            onClick={() => setShowHouseListInfo((value) => !value)}
            className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-line-strong bg-white text-[12px] font-semibold text-ink-soft transition hover:border-brand hover:text-brand"
            aria-label={t("descriptionHouseList")}
          >
            <Icon name="info-circle" style={{ fontSize: 14 }} />
          </button>
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

      {editingIndex !== null && draft &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-ink/45 px-4 py-6">
            <div className="flex max-h-[92vh] w-full max-w-5xl flex-col rounded-xl bg-white shadow-2xl">
              <div className="flex flex-shrink-0 items-center justify-between rounded-t-xl border-b border-line-strong bg-brand px-7 py-5">
                <span className="text-xl font-bold text-white sm:text-2xl">{houses[editingIndex]?.name}</span>
                <button type="button" onClick={closeEditor} className="flex h-8 w-8 items-center justify-center rounded-full text-white/90 transition hover:bg-white/15 hover:text-white">
                  <Icon name="x" style={{ fontSize: 20 }} />
                </button>
              </div>

              <div className="space-y-6 overflow-y-auto px-7 py-7">
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
                            <label className="block text-[13px] font-semibold text-ink">
                              {t("selectDeviceModel")}<span className="ml-0.5 text-alert">*</span>
                              <select
                                className="mt-1.5 h-11 w-full rounded-xl border border-line-strong bg-white px-3.5 text-[13.5px] text-ink shadow-sm outline-none transition hover:border-brand/50 focus:border-brand focus:ring-4 focus:ring-brand-tint"
                                value={selectedModel}
                                onChange={(e) => handleDeviceModelSelect(e.target.value)}
                              >
                                <option value="">{t("selectModelPlaceholder")}</option>
                                {Object.keys(modelData).map((model) => (
                                  <option key={model} value={model}>
                                    {modelData[model].name}
                                  </option>
                                ))}
                              </select>
                            </label>
                          </div>
                          <div className="flex-1">
                            <label className="block text-[13px] font-semibold text-ink">
                              S / N<span className="ml-0.5 text-alert">*</span>
                              <input
                                type="text"
                                className="mt-1.5 h-11 w-full rounded-xl border border-line-strong bg-white px-3.5 text-[13.5px] text-ink shadow-sm outline-none transition hover:border-brand/50 focus:border-brand focus:ring-4 focus:ring-brand-tint disabled:bg-mist disabled:text-ink-soft disabled:shadow-none"
                                placeholder={t("enterSerialNumber")}
                                disabled={!selectedModel}
                                value={draft.device_models?.[0]?.serial_number ?? ""}
                                onChange={(e) => handleDeviceSerialChange(e.target.value)}
                              />
                            </label>
                          </div>
                        </div>
                        {renderCommunicationPicker("device_communication", { showSmartlinkSerial: true })}
                      </div>
                      <ModelImagePreview
                        svgHtml={selectedModel ? modelData[selectedModel]?.svg : null}
                        name={selectedModel ? modelData[selectedModel]?.name : ""}
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
                            <label className="block text-[13px] font-semibold text-ink">
                              {t("selectDeviceModel")}<span className="ml-0.5 text-alert">*</span>
                              <select
                                className="mt-1.5 h-11 w-full rounded-xl border border-line-strong bg-white px-3.5 text-[13.5px] text-ink shadow-sm outline-none transition hover:border-brand/50 focus:border-brand focus:ring-4 focus:ring-brand-tint"
                                value={selectedAlarms[0]?.key || ""}
                                onChange={(e) => handleAlarmSelect(e.target.value)}
                              >
                                <option value="">{t("selectModelPlaceholder")}</option>
                                {ALARM_OPTIONS.map((alarm) => (
                                  <option key={alarm.key} value={alarm.key}>
                                    {alarm.label}
                                  </option>
                                ))}
                              </select>
                            </label>
                          </div>
                          <div className="flex-1">
                            <label className="block text-[13px] font-semibold text-ink">
                              S / N<span className="ml-0.5 text-alert">*</span>
                              <input
                                type="text"
                                className="mt-1.5 h-11 w-full rounded-xl border border-line-strong bg-white px-3.5 text-[13.5px] text-ink shadow-sm outline-none transition hover:border-brand/50 focus:border-brand focus:ring-4 focus:ring-brand-tint disabled:bg-mist disabled:text-ink-soft disabled:shadow-none"
                                placeholder={t("enterSerialNumber")}
                                disabled={!selectedAlarms[0]?.key}
                                value={draft.alarms?.[0]?.serial_number ?? ""}
                                onChange={(e) => handleAlarmSerialChange(e.target.value)}
                              />
                            </label>
                          </div>
                        </div>
                        {renderCommunicationPicker("alarm_communication")}
                      </div>
                      <ModelImagePreview
                        image={selectedAlarms[0]?.key ? modelAlarmData[ALARM_KEY_TO_IMAGE_KEY[selectedAlarms[0].key]]?.image : null}
                        name={selectedAlarms[0]?.key ? modelAlarmData[ALARM_KEY_TO_IMAGE_KEY[selectedAlarms[0].key]]?.name : ""}
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
                            <label className="block text-[13px] font-semibold text-ink">
                              {t("selectDeviceModel")}<span className="ml-0.5 text-alert">*</span>
                              <select
                                className="mt-1.5 h-11 w-full rounded-xl border border-line-strong bg-white px-3.5 text-[13.5px] text-ink shadow-sm outline-none transition hover:border-brand/50 focus:border-brand focus:ring-4 focus:ring-brand-tint"
                                value={selectedSilonic[0]?.model || ""}
                                onChange={(e) => handleSilonicSelect(e.target.value)}
                              >
                                <option value="">{t("selectModelPlaceholder")}</option>
                                {modelSilonicData.map((silonic) => (
                                  <option key={silonic.key} value={silonic.key}>
                                    {silonic.label}
                                  </option>
                                ))}
                              </select>
                            </label>
                          </div>
                          <div className="flex-1">
                            <label className="block text-[13px] font-semibold text-ink">
                              S / N<span className="ml-0.5 text-alert">*</span>
                              <input
                                type="text"
                                className="mt-1.5 h-11 w-full rounded-xl border border-line-strong bg-white px-3.5 text-[13.5px] text-ink shadow-sm outline-none transition hover:border-brand/50 focus:border-brand focus:ring-4 focus:ring-brand-tint disabled:bg-mist disabled:text-ink-soft disabled:shadow-none"
                                placeholder={t("enterSerialNumber")}
                                disabled={!selectedSilonic[0]?.model}
                                value={draft.silonic_models?.[0]?.serial_number ?? ""}
                                onChange={(e) => handleSilonicSerialChange(e.target.value)}
                              />
                            </label>
                          </div>
                        </div>
                        {renderCommunicationPicker("silonic_communication")}
                      </div>
                      <ModelImagePreview
                        image={selectedSilonic[0]?.model ? modelWeightScaleData[selectedSilonic[0].model]?.image : null}
                        name={selectedSilonic[0]?.model ? modelWeightScaleData[selectedSilonic[0].model]?.name : ""}
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
                            <label className="block text-[13px] font-semibold text-ink">
                              {t("selectDeviceModel")}<span className="ml-0.5 text-alert">*</span>
                              <select
                                className="mt-1.5 h-11 w-full rounded-xl border border-line-strong bg-white px-3.5 text-[13.5px] text-ink shadow-sm outline-none transition hover:border-brand/50 focus:border-brand focus:ring-4 focus:ring-brand-tint"
                                value={selectedEggModels[0]?.model || ""}
                                onChange={(e) => handleEggModelSelect(e.target.value)}
                              >
                                <option value="">{t("selectModelPlaceholder")}</option>
                                {modelEggData.map((egg) => (
                                  <option key={egg.key} value={egg.key}>
                                    {egg.label}
                                  </option>
                                ))}
                              </select>
                            </label>
                          </div>
                          <div className="flex-1">
                            <label className="block text-[13px] font-semibold text-ink">
                              S / N<span className="ml-0.5 text-alert">*</span>
                              <input
                                type="text"
                                className="mt-1.5 h-11 w-full rounded-xl border border-line-strong bg-white px-3.5 text-[13.5px] text-ink shadow-sm outline-none transition hover:border-brand/50 focus:border-brand focus:ring-4 focus:ring-brand-tint disabled:bg-mist disabled:text-ink-soft disabled:shadow-none"
                                placeholder={t("enterSerialNumber")}
                                disabled={!selectedEggModels[0]?.model}
                                value={draft.egg_models?.[0]?.serial_number ?? ""}
                                onChange={(e) => handleEggSerialChange(e.target.value)}
                              />
                            </label>
                          </div>
                        </div>
                        {renderCommunicationPicker("egg_communication")}
                      </div>
                      <ModelImagePreview
                        image={selectedEggModels[0]?.model ? modelEggCounterData[selectedEggModels[0].model]?.image : null}
                        name={selectedEggModels[0]?.model ? modelEggCounterData[selectedEggModels[0].model]?.name : ""}
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
                  className="h-10 rounded-xl border border-brand bg-brand px-5 text-[13px] font-semibold text-white shadow-sm transition hover:bg-brand-dark"
                >
                  {t("save")}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}