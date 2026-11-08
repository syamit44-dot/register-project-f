// เก็บข้อมูลการล็อกอิน (access token) ไว้ใน localStorage
// ไม่มีที่ไหนใน UI ที่ควรเอา token ออกมาแสดงตรงๆ — ใช้แค่แนบไป header ตอนยิง API เท่านั้น
// (refresh_token จริงๆ อยู่ใน cookie httpOnly ฝั่ง browser จัดการเอง ไม่เก็บซ้ำที่นี่)
const STORAGE_KEY = "farm_auth";

// อ่าน claim "exp" (unix seconds) จาก JWT แบบไม่ verify signature — ใช้แค่กะเวลาต่ออายุฝั่ง client
// เท่านั้น การตรวจสอบจริงทำที่ backend เสมอ
function decodeJwtExpiry(token) {
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const { exp } = JSON.parse(json);
    return typeof exp === "number" ? exp * 1000 : null;
  } catch {
    return null;
  }
}

export function saveAuth({ username, email, token, first_name, last_name }) {
  const data = { username, email, token, first_name, last_name, expiresAt: decodeJwtExpiry(token) };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  return data;
}

// ใช้ตอน /api/refresh ได้ access token ใหม่มา — อัปเดตแค่ token/expiresAt เก็บฟิลด์อื่นไว้เหมือนเดิม
export function updateAccessToken(newToken) {
  const current = getAuth();
  if (!current) return null;
  const next = { ...current, token: newToken, expiresAt: decodeJwtExpiry(newToken) };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

// เช็คว่า token เป็นรูปแบบ JWT จริง (ต้องมี 3 ส่วนคั่นด้วย .) — กัน token เก่า/พังที่ค้างอยู่ใน
// localStorage (เช่น "mock-token" จากตอนที่ยังไม่เชื่อม backend จริง) ถูกแนบไปกับทุก request
// รวมถึง endpoint สาธารณะอย่าง /check-key แล้วโดน JWTAuthentication ฝั่ง backend ปฏิเสธเป็น 403
function isValidJwtFormat(token) {
  return typeof token === "string" && token.split(".").length === 3;
}

export function getAuth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data?.token && !isValidJwtFormat(data.token)) {
      // token รูปแบบผิด (ไม่ใช่ JWT) — เคลียร์ทิ้งแทนที่จะปล่อยให้แนบไปกับทุก request แล้วพังซ้ำ
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function getToken() {
  return getAuth()?.token ?? null;
}

export function clearAuth() {
  localStorage.removeItem(STORAGE_KEY);
}

export function isAuthenticated() {
  return !!getToken();
}
