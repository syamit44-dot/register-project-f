import countries from "i18n-iso-countries";
import dialCodes from "./dialCodes";

const fallbackRegionCodes = ["AF", "AX", "AL", "DZ", "AS", "AD", "AO", "AI", "AQ", "AG",
"AR", "AM", "AW", "AU", "AT", "AZ", "BS", "BH", "BD", "BB",
"BY", "BE", "BZ", "BJ", "BM", "BT", "BO", "BA", "BW", "BV",
"BR", "IO", "BN", "BG", "BF", "BI", "KH", "CM", "CA", "CV",
"KY", "CF", "TD", "CL", "CN", "CX", "CC", "CO", "KM", "CG",
"CD", "CK", "CR", "CI", "HR", "CU", "CY", "CZ", "DK", "DJ",
"DM", "DO", "EC", "EG", "SV", "GQ", "ER", "EE", "ET", "FK",
"FO", "FJ", "FI", "FR", "GF", "PF", "TF", "GA", "GM", "GE",
"DE", "GH", "GI", "GR", "GL", "GD", "GP", "GU", "GT", "GG",
"GN", "GW", "GY", "HT", "HM", "VA", "HN", "HK", "HU", "IS",
"IN", "ID", "IR", "IQ", "IE", "IM", "IL", "IT", "JM", "JP",
"JE", "JO", "KZ", "KE", "KI", "KP", "KR", "KW", "KG", "LA",
"LV", "LB", "LS", "LR", "LY", "LI", "LT", "LU", "MO", "MK",
"MG", "MW", "MY", "MV", "ML", "MT", "MH", "MQ", "MR", "MU",
"YT", "MX", "FM", "MD", "MC", "MN", "MS", "MA", "MZ", "MM",
"NA", "NR", "NP", "NL", "AN", "NC", "NZ", "NI", "NE", "NG",
"NU", "NF", "MP", "NO", "OM", "PK", "PW", "PS", "PA", "PG",
"PY", "PE", "PH", "PN", "PL", "PT", "PR", "QA", "RE", "RO",
"RU", "RW", "SH", "KN", "LC", "PM", "VC", "WS", "SM", "ST",
"SA", "SN", "CS", "SC", "SL", "SG", "SK", "SI", "SB", "SO",
"ZA", "GS", "ES", "LK", "SD", "SR", "SJ", "SZ", "SE", "CH",
"SY", "TW", "TJ", "TZ", "TH", "TL", "TG", "TK", "TO", "TT",
"TN", "TR", "TM", "TC", "TV", "UG", "UA", "AE", "GB", "US",
"UM", "UY", "UZ", "VU", "VE", "VN", "VG", "VI", "WF", "EH",
"YE", "ZM", "ZW"];

let regionCodes = fallbackRegionCodes;

if (typeof Intl !== "undefined" && typeof Intl.supportedValuesOf === "function") {
  try {
    const supportedRegions = Intl.supportedValuesOf("region");
    if (Array.isArray(supportedRegions) && supportedRegions.length > 0) {
      regionCodes = supportedRegions;
    }
  } catch {
    regionCodes = fallbackRegionCodes;
  }
}

const countryData = regionCodes
  .map((regionCode) => {
    if (!regionCode) return null;

    const alpha3 = countries.getAlpha3Code(regionCode) || regionCode;
    const displayName = new Intl.DisplayNames(["en"], { type: "region" }).of(regionCode);

    if (!displayName) return null;

    return {
      code: regionCode,
      alpha3,
      name: displayName,
      dialCode: dialCodes[regionCode] || "",
    };
  })
  .filter(Boolean)
  .sort((a, b) => a.name.localeCompare(b.name, "th"));

export default countryData;
