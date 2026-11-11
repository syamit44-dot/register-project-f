import modelData from "../data/modelData";

const EQUIPMENT = [
  ["device", "model", "device_models", "modelTemp", "controllerSN", "model"],
  ["alarm", "alarm", "alarms", "modelAlarm", "serialNumber", "key"],
  ["silonic", "silonic", "silonic_models", "modelSilonic", "serialNumber", "model"],
  ["egg", "egg", "egg_models", "modelEgg", "serialNumber", "model"],
];

export function registrationFormData(registration, catalog) {
  const { farm, userapp } = registration;
  const models = new Map(catalog.map((model) => [model.id, model]));
  const houses = Array.from({ length: Number(farm.numbOfHouse) }, (_, index) => ({
    name: `House ${index + 1}`,
    configured: true,
  }));
  for (const [category, prefix, field, modelField, serialField, codeKey] of EQUIPMENT) {
    for (const item of registration[category]) {
      const house = houses[Number(item.house) - 1];
      const modelId = item[modelField];
      const model = models.get(modelId);
      house[`${prefix}_enabled`] = true;
      house[`${category}_communication`] = { smartlink: item.type === "SMARTLINK", tempview: item.type === "TEMPVIEW" };
      house[field] = [{
        id: item.id,
        model_id: modelId,
        model_name: model?.name ?? String(modelId),
        [codeKey]: model?.code ?? String(modelId),
        serial_number: item[serialField] ?? "",
      }];
      if (category === "device") house.smartlink_serial_number = item.smartlinkSN ?? "";
      if (category === "silonic") house.silonic_use_app = Boolean(item.useApp);
    }
  }
  const contact = farm.saleContract ?? {};
  return {
    id: farm.id,
    farm_name: farm.nameFarm,
    farm_short: farm.companyName ?? "",
    house_count: houses.length,
    address: farm.address1 ?? "",
    subdistrict: farm.address2 ?? "",
    district: farm.townCity ?? "",
    province: farm.province ?? "",
    country: farm.country ?? "",
    postal_code: farm.postcode ?? "",
    timezone: farm.timezone ?? "",
    contact_name: farm.contact ?? "",
    contact_phone: farm.mobile ?? "",
    contact_email: farm.emailFarm ?? "",
    dealer_name: farm.saleName ?? "",
    dealer_contact_phone: contact.phone ?? "",
    dealer_contact_line: contact.line ?? "",
    dealer_contact_email: contact.email ?? "",
    dealer_contact_other_label: contact.other_label ?? "",
    dealer_contact_other_value: contact.other_value ?? "",
    note: farm.note ?? "",
    pdpa_consent: farm.pdpa_consent,
    houses,
    app_users: userapp.map((user) => ({
      id: user.id,
      username: user.username,
      original_username: user.username,
      email: user.userEmail ?? "",
      device_model: String(user.deviceModel),
      user_type: user.userType === "Superuser" ? "super" : "normal",
      is_dealer: Boolean(user.isDealer),
    })),
  };
}

export function getSelectedAppModels(houses) {
  const models = new Map();
  for (const house of houses ?? []) {
    const controllers = house.model_enabled ? house.device_models ?? [] : [];
    const scales = house.silonic_enabled && house.silonic_communication?.smartlink && house.silonic_use_app
      ? house.silonic_models ?? [] : [];
    for (const item of [...controllers, ...scales]) {
      if (item.model_id) models.set(String(item.model_id), item.model_name ?? modelData[item.model]?.name ?? item.model);
    }
  }
  return models;
}
