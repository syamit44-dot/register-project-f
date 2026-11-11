const equipmentFields = [
  { output: "device", enabled: "model_enabled", models: "device_models", communication: "device_communication", modelField: "modelTemp", serialField: "controllerSN" },
  { output: "alarm", enabled: "alarm_enabled", models: "alarms", communication: "alarm_communication", modelField: "modelAlarm", serialField: "serialNumber" },
  { output: "silonic", enabled: "silonic_enabled", models: "silonic_models", communication: "silonic_communication", modelField: "modelSilonic", serialField: "serialNumber" },
  { output: "egg", enabled: "egg_enabled", models: "egg_models", communication: "egg_communication", modelField: "modelEgg", serialField: "serialNumber" },
];

export class RegistrationInputError extends Error {}

export const APP_USERNAME_MAX_LENGTH = 50;

export function isValidAppUsername(value) {
  return typeof value === "string" && value === value.trim()
    && value.length <= APP_USERNAME_MAX_LENGTH && /^[a-z0-9]+@[a-z0-9]+$/.test(value);
}

export function sanitizeAppUsername(value) {
  const [name, ...farm] = value.toLowerCase().replace(/[^a-z0-9@]/g, "").split("@");
  return (farm.length ? `${name}@${farm.join("")}` : name).slice(0, APP_USERNAME_MAX_LENGTH);
}

export const FARM_APP_USER_LIMIT = 5;

export function registrationPayload(data, t, isDealer = false, original = null) {
  const equipment = { device: [], alarm: [], silonic: [], egg: [] };
  const appModelIds = new Set();

  data.houses.forEach((house, index) => {
    const enabled = equipmentFields.filter((field) => house[field.enabled]);
    const houseName = house.name || `House ${index + 1}`;
    if (enabled.length === 0) {
      throw new RegistrationInputError(t("registrationHouseNeedsEquipment", { house: houseName }));
    }
    for (const field of enabled) {
      const item = house[field.models]?.[0];
      const communication = house[field.communication];
      const type = communication?.smartlink ? "SMARTLINK" : communication?.tempview ? "TEMPVIEW" : "";
      const needsSmartlinkSerial = field.output === "device" && type === "SMARTLINK";
      if (!item?.model_id || !item.serial_number?.trim() || !type
        || (needsSmartlinkSerial && !house.smartlink_serial_number?.trim())) {
        throw new RegistrationInputError(t("registrationHouseIncomplete", { house: houseName }));
      }
      const row = {
        house: String(index + 1),
        type,
        [field.modelField]: item.model_id,
        [field.serialField]: item.serial_number.trim(),
      };
      const id = item.id ?? original?.houses[index]?.[field.models]?.[0]?.id;
      if (id) row.id = id;
      if (field.output === "device") {
        appModelIds.add(String(item.model_id));
        if (needsSmartlinkSerial) row.smartlinkSN = house.smartlink_serial_number.trim();
      }
      if (field.output === "silonic") {
        row.useApp = type === "SMARTLINK" && Boolean(house.silonic_use_app);
        if (row.useApp) appModelIds.add(String(item.model_id));
      }
      equipment[field.output].push(row);
    }
  });

  const farmName = data.farm_name.trim();
  const appUsers = data.app_users.filter((user) => user.device_model || user.email || user.username !== "default1234");
  const mainUsers = appUsers.filter((user) => !user.is_dealer);
  const dealerCount = appUsers.length - mainUsers.length;
  const originalMain = original?.app_users.filter((user) => !user.is_dealer) ?? [];
  if (mainUsers.length > Math.max(FARM_APP_USER_LIMIT, originalMain.length)) throw new RegistrationInputError(t("userLimitWarning"));
  const originalSuperusers = originalMain.filter((user) => user.user_type === "super").length;
  if (mainUsers.filter((user) => user.user_type === "super").length > Math.max(1, originalSuperusers)) {
    throw new RegistrationInputError(t("appSuperuserLimit"));
  }
  if (dealerCount > Number(isDealer)) throw new RegistrationInputError(t("dealerAppUserLimit"));

  const userapp = appUsers.map((user) => {
    const model = String(user.device_model ?? "");
    if (!appModelIds.has(model)) throw new RegistrationInputError(t("registrationUserNeedsController"));
    const previous = original?.app_users.find((item) => item.id === user.id || (!user.id && item.username === user.username));
    if (previous?.username !== user.username && !isValidAppUsername(user.username)) {
      throw new RegistrationInputError(t("registrationAppUsernameInvalid"));
    }
    return {
      username: user.username,
      ...(previous ? { id: previous.id } : {}),
      deviceModel: Number(model),
      userType: user.user_type === "super" ? "Superuser" : "Normaluser",
      isDealer: Boolean(user.is_dealer),
      userEmail: user.email?.trim() || null,
    };
  });

  return {
    farm: {
      ...(original ? { id: original.id } : {}),
      nameFarm: farmName,
      companyName: data.farm_short.trim(),
      numbOfHouse: String(data.house_count),
      address1: data.address,
      address2: data.subdistrict,
      townCity: data.district,
      province: data.province,
      country: data.country || undefined,
      postcode: data.postal_code,
      timezone: data.timezone || undefined,
      contact: data.contact_name,
      mobile: data.contact_phone,
      emailFarm: data.contact_email,
      saleName: data.dealer_name,
      saleContract: {
        phone: data.dealer_contact_phone,
        line: data.dealer_contact_line,
        email: data.dealer_contact_email,
        other_label: data.dealer_contact_other_label,
        other_value: data.dealer_contact_other_value,
      },
      note: data.note,
      pdpa_consent: data.pdpa_consent,
    },
    ...equipment,
    userapp,
  };
}

export function registrationErrorMessage(error, t) {
  if (error instanceof RegistrationInputError) return error.message;
  const response = error.response?.data;
  if (response && typeof response === "object") {
    const detail = response.detail ?? response.error ?? response.message;
    if (typeof detail === "string") return detail;
    if (detail && typeof detail === "object") {
      const messages = Object.entries(detail).flatMap(([field, errors]) => (
        Array.isArray(errors) ? errors.filter((message) => typeof message === "string").map((message) => `${field} — ${message}`) : []
      ));
      if (messages.length) return messages.join(" ");
    }
  }
  return t("submissionFailed");
}
