// เก็บข้อมูลการล็อกอิน (access token) ไว้ใน localStorage
// ไม่มีที่ไหนใน UI ที่ควรเอา token ออกมาแสดงตรงๆ — ใช้แค่แนบไป header ตอนยิง API เท่านั้น
// (refresh_token จริงๆ อยู่ใน cookie httpOnly ฝั่ง browser จัดการเอง ไม่เก็บซ้ำที่นี่)
const STORAGE_KEY = "farm_auth";

// อ่าน claim "exp" (unix seconds) จาก JWT แบบไม่ verify signature — ใช้แค่กะเวลาต่ออายุฝั่ง client
// เท่านั้น การตรวจสอบจริงทำที่ backend เสมอ
function decodeJwtClaims(token) {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))) ?? {};
  } catch {
    return {};
  }
}

function decodeJwtExpiry(token) {
  const { exp } = decodeJwtClaims(token);
  return typeof exp === "number" ? exp * 1000 : null;
}

function accountKey(auth) {
  if (!auth?.token) return null;
  const { uid } = decodeJwtClaims(auth.token);
  return uid ?? auth.username ?? auth.email ?? auth.token;
}

let tabAccount = accountKey(readStoredAuth());
let accountChanged = false;
let sessionExpired = false;

function markAccountChanged() {
  if (accountChanged) return;
  accountChanged = true;
  window.dispatchEvent(new Event("auth:changed"));
}

export function checkAuthSession() {
  if (accountKey(readStoredAuth()) !== tabAccount) markAccountChanged();
  return !accountChanged;
}

window.addEventListener("storage", (event) => {
  if (event.key !== STORAGE_KEY && event.key !== null) return;
  // Storage events preserve intermediate changes even if the original account signs in again.
  try {
    if (accountKey(JSON.parse(event.newValue)) !== tabAccount) markAccountChanged();
  } catch {
    markAccountChanged();
  }
});

export function saveAuth({ username, email, token, first_name, last_name, account_type = "customer" }) {
  const data = { username, email, token, first_name, last_name, account_type, expiresAt: decodeJwtExpiry(token) };
  if (!checkAuthSession()) throw new Error("The account changed in another tab.");
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  tabAccount = accountKey(data);
  sessionExpired = false;
  return data;
}

// ใช้ตอน /api/refresh ได้ access token ใหม่มา — อัปเดตแค่ token/expiresAt เก็บฟิลด์อื่นไว้เหมือนเดิม
export function updateAccessToken(newToken, accountType) {
  const current = getAuth();
  if (!current || !checkAuthSession()) return null;
  const next = { ...current, account_type: accountType ?? current.account_type, token: newToken, expiresAt: decodeJwtExpiry(newToken) };
  if (accountKey(next) !== tabAccount) {
    markAccountChanged();
    return null;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

// เช็คว่า token เป็นรูปแบบ JWT จริง (ต้องมี 3 ส่วนคั่นด้วย .) — กัน token เก่า/พังที่ค้างอยู่ใน
// localStorage (เช่น "mock-token" จากตอนที่ยังไม่เชื่อม backend จริง) ถูกแนบไปกับทุก request
// รวมถึง endpoint สาธารณะอย่าง /check-key แล้วโดน JWTAuthentication ฝั่ง backend ปฏิเสธเป็น 403
function isValidJwtFormat(token) {
  return typeof token === "string" && token.split(".").length === 3;
}

function readStoredAuth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data?.token && !isValidJwtFormat(data.token)) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function getAuth() {
  const auth = readStoredAuth();
  return !accountChanged && accountKey(auth) === tabAccount ? auth : null;
}

export function getToken() {
  return getAuth()?.token ?? null;
}

export function clearAuth() {
  if (!checkAuthSession()) return;
  localStorage.removeItem(STORAGE_KEY);
  tabAccount = null;
}

export function expireAuth() {
  clearAuth();
  sessionExpired = true;
  window.dispatchEvent(new Event("auth:expired"));
}

export function hasExpiredSession() {
  return sessionExpired;
}

export function isAuthenticated() {
  return !!getToken();
}
