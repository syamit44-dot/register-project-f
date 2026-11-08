// ตรวจสอบความครบถ้วนของข้อมูลในแต่ละขั้นตอนของฟอร์มลงทะเบียน (Step 1-4)
// ใช้ก่อนอนุญาตให้กด "ถัดไป" หรือกระโดดข้ามขั้นตอนผ่าน StepRail
// คืนค่า "" หากผ่าน หรือ key ข้อความ error (ให้ CustomerForm นำไปแปลผ่าน t())

const STEP1_REQUIRED_FIELDS = [
  "farm_name",
  "farm_short",
  "address",
  "subdistrict",
  "district",
  "province",
  "country",
  "postal_code",
  "timezone",
  "contact_name",
  "contact_phone",
  "contact_email",
  "dealer_name",
];

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

function isBlank(value) {
  return value === undefined || value === null || String(value).trim() === "";
}

// ต้องกรอกอย่างน้อย 1 ช่องทางติดต่อ dealer (phone / line / email / other)
function hasDealerContactChannel(data) {
  return (
    !isBlank(data.dealer_contact_phone) ||
    !isBlank(data.dealer_contact_line) ||
    !isBlank(data.dealer_contact_email) ||
    !isBlank(data.dealer_contact_other_value)
  );
}

function validateStep1(data) {
  const hasMissingField = STEP1_REQUIRED_FIELDS.some((field) => isBlank(data[field]));
  if (hasMissingField) return "stepIncompleteFarm";
  if (!hasDealerContactChannel(data)) return "stepIncompleteDealerContact";
  if (!EMAIL_PATTERN.test(String(data.contact_email).trim())) return "invalidEmail";
  return "";
}

function validateStep2(data) {
  // โฟลว์ TempView ไม่ต้องผูกกับโรงเรือน จึงข้ามการตรวจสอบนี้ได้
  if (data.platform === "tempview") return "";
  const houses = data.houses ?? [];
  const hasConfiguredHouse = houses.some((h) => h?.configured);
  if (houses.length === 0 || !hasConfiguredHouse) return "stepIncompleteDevice";
  return "";
}

function validateStep3(data) {
  const users = data.app_users ?? [];
  if (users.length === 0) return "stepIncompleteUsers";
  const hasIncompleteUser = users.some((u) => isBlank(u?.username));
  if (hasIncompleteUser) return "stepIncompleteUsers";
  return "";
}

// index: 0 = Step1CustomerInfo, 1 = Step2DeviceInfo, 2 = Step3Users, 3 = Step4Confirm (ไม่ต้องตรวจ)
export function validateStep(index, data) {
  switch (index) {
    case 0:
      return validateStep1(data);
    case 1:
      return validateStep2(data);
    case 2:
      return validateStep3(data);
    default:
      return "";
  }
}

// ตรวจไล่ทีละขั้นตั้งแต่ 0 จนถึง (targetIndex - 1) ใช้ตอนกดข้ามหลายขั้นตอนพร้อมกัน (เช่นคลิก StepRail)
// คืนค่า index ของขั้นตอนแรกที่ไม่ผ่าน พร้อม error key หรือ null หากผ่านหมด
export function findFirstInvalidStep(data, targetIndex) {
  for (let i = 0; i < targetIndex; i += 1) {
    const errorKey = validateStep(i, data);
    if (errorKey) return { index: i, errorKey };
  }
  return null;
}