import countryData from "../data/countryData.js";

const requiredFarmFields = {
  farm_name: "farmName",
  farm_short: "companyName",
  country: "country",
  timezone: "timezone",
  contact_name: "contactName",
  contact_phone: "phoneNumber",
  contact_email: "email",
  dealer_name: "dealerName",
};

export function isValidRegistrationEmail(email) {
  return email.length <= 50 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validateFarmInformation(data, t) {
  for (const [field, label] of Object.entries(requiredFarmFields)) {
    if (!data[field]?.trim()) return t("registrationRequiredField", { field: t(label) });
  }
  const dialCode = countryData.find((country) => country.name === data.country)?.dialCode;
  if (dialCode && data.contact_phone.trim() === `+${dialCode}`) {
    return t("registrationRequiredField", { field: t("phoneNumber") });
  }
  if (!isValidRegistrationEmail(data.contact_email.trim())) return t("registrationInvalidContactEmail");
  if (![data.dealer_contact_phone, data.dealer_contact_line, data.dealer_contact_email, data.dealer_contact_other_value]
    .some((value) => value?.trim())) {
    return t("registrationRequiredField", { field: t("dealerContact") });
  }
  return "";
}
