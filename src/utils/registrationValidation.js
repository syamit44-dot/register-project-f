import countryData from "../data/countryData.js";

const requiredFarmFields = {
  farm_name: "farmName",
  farm_short: "companyName",
  address: "address",
  subdistrict: "subdistrict",
  district: "district",
  province: "province",
  country: "country",
  postal_code: "postalCode",
  timezone: "timezone",
  contact_name: "contactName",
  contact_phone: "phoneNumber",
  contact_email: "email",
  dealer_name: "dealerName",
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateFarmInformation(data, t) {
  for (const [field, label] of Object.entries(requiredFarmFields)) {
    if (!data[field]?.trim()) return t("registrationRequiredField", { field: t(label) });
  }
  const dialCode = countryData.find((country) => country.name === data.country)?.dialCode;
  if (dialCode && data.contact_phone.trim() === `+${dialCode}`) {
    return t("registrationRequiredField", { field: t("phoneNumber") });
  }
  if (!EMAIL_PATTERN.test(data.contact_email.trim())) return t("registrationInvalidContactEmail");
  if (![data.dealer_contact_phone, data.dealer_contact_line, data.dealer_contact_email, data.dealer_contact_other_value]
    .some((value) => value?.trim())) {
    return t("registrationRequiredField", { field: t("dealerContact") });
  }
  return "";
}
