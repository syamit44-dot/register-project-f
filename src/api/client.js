import axios from "axios";
import { getToken, getAuth, updateAccessToken, clearAuth } from "./auth";
import { registrationsMockData } from "../data/registrationsMockData";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  // ต้องเปิดไว้เสมอ เพื่อให้ browser แนบ cookie `refresh_token` (httpOnly, ตั้งโดย
  // Api_SignIn) ไปกับ request อัตโนมัติ — ถ้าไม่เปิด /api/refresh จะไม่มี cookie ส่งไปด้วยเลย
  withCredentials: true,
});

// แนบ JWT access token (จาก /signin) ไปกับทุก request อัตโนมัติ — endpoint ที่ต้อง login ถึงจะเรียกได้
// (เช่น เปลี่ยนรหัสผ่าน) ต้องมี header นี้ ปรับ scheme ให้ตรงกับ authentication.py ฝั่ง Django ถ้าไม่ใช่ Bearer
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* ---------- Auto-refresh access token ---------- */
// endpoint พวกนี้ต้องไม่พยายาม refresh ซ้ำเมื่อโดน 401/403
// (signin/signup ผิด credential จริงๆ, check-key ผิดรหัสจริงๆ, refresh เองพังแล้วก็คือพังเลย)
const NO_REFRESH_PATHS = ["/signin", "/signup", "/refresh", "/check-key"];

let refreshPromise = null;

// เรียก POST /api/refresh (ใช้ cookie refresh_token, ไม่ต้องส่ง body) เพื่อขอ access token ใหม่
// กันเรียกซ้อนกันหลายรอบด้วย refreshPromise เดียว ถ้ามีหลาย request โดน 401 พร้อมกัน
function requestNewAccessToken() {
  if (!refreshPromise) {
    refreshPromise = api
      .post("/refresh")
      .then((res) => {
        const newToken = res.data?.access_token;
        if (!newToken) throw new Error("No access_token in /refresh response");
        updateAccessToken(newToken);
        return newToken;
      })
      .catch((err) => {
        // refresh token หมดอายุ/ไม่ถูกต้อง — เคลียร์ auth แล้วแจ้งให้ UI พาไปหน้า sign in
        clearAuth();
        window.dispatchEvent(new Event("auth:expired"));
        throw err;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

// ตั้ง timer ต่ออายุ access token ล่วงหน้าก่อนหมดอายุจริง (กันกรณีไม่มี request ใดๆ ยิงออกไปเลย
// ระหว่างที่ access token ใกล้หมดอายุ) เรียกใหม่ทุกครั้งหลัง sign in / refresh สำเร็จ
let refreshTimer = null;
export function scheduleTokenRefresh() {
  if (refreshTimer) clearTimeout(refreshTimer);
  const auth = getAuth();
  if (!auth?.token || !auth?.expiresAt) return;
  const msUntilRefresh = auth.expiresAt - Date.now() - 60_000; // ต่ออายุล่วงหน้า 60 วิ
  if (msUntilRefresh <= 0) {
    requestNewAccessToken().then(scheduleTokenRefresh).catch(() => {});
    return;
  }
  refreshTimer = setTimeout(() => {
    requestNewAccessToken().then(scheduleTokenRefresh).catch(() => {});
  }, msUntilRefresh);
}
// เผื่อกรณีรีเฟรชหน้าเว็บแล้วยังมี session ค้างอยู่ใน localStorage
scheduleTokenRefresh();

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { config, response } = error;
    const shouldSkip =
      !config || !getToken() || config._retry || NO_REFRESH_PATHS.some((p) => config.url?.includes(p));

    if (response?.status === 401 && !shouldSkip) {
      config._retry = true;
      try {
        const newToken = await requestNewAccessToken();
        config.headers.Authorization = `Bearer ${newToken}`;
        return api(config);
      } catch (refreshErr) {
        return Promise.reject(refreshErr);
      }
    }
    return Promise.reject(error);
  }
);

/* ---------- ฟอร์มลูกค้า ---------- */

// ส่งข้อมูลลงทะเบียนใหม่ (ทุก step รวมกัน) ไปที่ POST /api/registrations/
export function createRegistration(payload) {
  return api.post("/registrations/", payload).then((res) => res.data);
}

/* ---------- หน้า Admin ---------- */

// ดึงรายการลงทะเบียนทั้งหมด (รองรับ query ค้นหา ?search=)
export function listRegistrations(search = "") {
  return api
    .get("/registrations/", { params: search ? { search } : {} })
    .then((res) => res.data.results ?? res.data);
}

// ดึงข้อมูลภายในของรายการเดียว (ใช้เปิด modal)
export function getRegistration(id) {
  return api.get(`/registrations/${id}/`).then((res) => res.data);
}

// เปลี่ยนสถานะเป็น pushed
export function pushRegistration(id) {
  return api.post(`/registrations/${id}/push/`).then((res) => res.data);
}

// ลบรายการ
export function deleteRegistration(id) {
  return api.delete(`/registrations/${id}/`).then((res) => res.data);
}

/* ---------- Check access key (ก่อนเริ่ม sign up) ---------- */

// ยิงไปที่ Django CheckKey (POST /api/check-key) — ตรวจว่า accessKey มีอยู่จริงและยังไม่ถูกใช้
// สำเร็จ -> { message: "Access key is True." } / ไม่สำเร็จ -> 400/401 พร้อม { error }
export function checkAccessKey(accessKey) {
  return api.post("/check-key", { accessKey }).then((res) => res.data);
}

/* ---------- Sign in ---------- */

// ยิงไปที่ Django Api_SignIn (ต้องมี captcha_token เสมอ ไม่งั้น backend ตอบ 400)
// isAdmin: true -> ยิง /api/signin/admin (cmd="admin", backend เช็ค is_superuser/is_staff เพิ่ม)
// username ใน request รับได้ทั้งชื่อผู้ใช้และอีเมล
// และตั้ง cookie httpOnly ชื่อ refresh_token มาด้วย (ใช้กับ /api/refresh)
export function signIn({ username, password, captcha_token, isAdmin = false }) {
  const path = isAdmin ? "/signin/admin" : "/signin";
  return api.post(path, { username, password, captcha_token }).then((res) => res.data);
}

/* ---------- Sign up (พร้อม Cloudflare Turnstile + Access Key) ---------- */

// ยิงไปที่ Django Api_SignUp — accessKey บังคับเสมอ (backend ปฏิเสธถ้าไม่มี/ใช้ไปแล้ว)
export function signUp({ username, email, password, first_name, last_name, mobile, country, accessKey, captcha_token }) {
  return api
    .post("/signup", { username, email, password, first_name, last_name, mobile, country, accessKey, captcha_token })
    .then((res) => res.data);
}

/* ---------- หน้า Home: รายการฟาร์มทั้งหมด (mock ตัวอย่าง — ใช้ข้อมูลชุดเดียวกับหน้า Admin) ---------- */

// แปลงข้อมูลจาก registrationsMockData (โครงฝั่ง Admin) ให้เป็นรูปแบบ farm summary ที่ฝั่งลูกค้าใช้
// (house_count_actual -> house_count, และหาเวลาซิงค์ล่าสุดจาก house ที่ซิงค์ล่าสุด)
function toFarmSummary(r) {
  const lastSync = (r.houses || []).reduce(
    (latest, h) => (h.last_sync && (!latest || h.last_sync > latest) ? h.last_sync : latest),
    null
  );
  return { ...r, house_count: r.house_count_actual, last_sync: lastSync || "-" };
}

// คืนรายการฟาร์มทั้งหมด (mock) ให้หน้า Home แสดงครบทุกฟาร์ม เหมือนกับที่หน้า Admin เห็น
export function fetchAllFarmsMock() {
  return new Promise((resolve) => {
    setTimeout(() => resolve(registrationsMockData.map(toFarmSummary)), 700);
  });
}

/* ---------- หน้า Home (mock ตัวอย่าง — ยังไม่ได้ยิง backend จริง) ---------- */

export function fetchHomeSummaryMock() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        farm_name: "ฟาร์มตัวอย่าง A",
        farm_short: "FMA",
        platform: "smartlink",
        device_model: "R-Tron 612",
        house_count: 5,
        houses: [
          {
            name: "House 1",
            serial_number: "SN-2026-0001",
            device_model: "R-Tron 612",
            firmware_version: "v2.4.0",
            install_date: "2026-05-10",
            last_sync: "2026-07-22 09:12",
          },
          {
            name: "House 2",
            serial_number: "SN-2026-0002",
            device_model: "R-Tron 612",
            firmware_version: "v2.4.0",
            install_date: "2026-05-10",
            last_sync: "2026-07-22 09:11",
          },
          {
            name: "House 3",
            serial_number: "SN-2026-0003",
            device_model: "R-Tron 612",
            firmware_version: "v2.3.1",
            install_date: "2026-05-12",
            last_sync: "2026-07-21 18:40",
ช
          },
          {
            name: "House 4",
            serial_number: "SN-2026-0004",
            device_model: "R-Tron 612",
            firmware_version: "v2.4.0",
            install_date: "2026-05-15",
            last_sync: "2026-07-22 09:09",
            accessories: [],
          },
          {
            name: "House 5",
            serial_number: "SN-2026-0005",
            device_model: "R-Tron 612",
            firmware_version: "v2.4.0",
            install_date: "2026-06-01",
            last_sync: "2026-07-22 09:13",
          },
        ],
        contact_name: "สมชาย ใจดี",
        contact_phone: "081-234-5678",
        contact_email: "somchai@example.com",
        // ตรงกับ app_users ของ REG-0001 ใน registrationsMockData.js (หน้า Admin) เพื่อให้ข้อมูลสองฝั่งตรงกัน
        app_users: [
          { id: "U1", username: "somchai.a", user_type: "super" },
          { id: "U2", username: "default1234", user_type: "normal" },
        ],
        address: "99/1 หมู่ 4",
        subdistrict: "บ้านฉาง",
        district: "บ้านฉาง",
        province: "ระยอง",
        country: "ไทย",
        postal_code: "21130",
        timezone: "Asia/Bangkok",
        note: "ติดตั้งช่วงเช้าเท่านั้น",
        pdpa_consent: true,
        last_sync: "2026-07-22 09:15",
        // ค่าเดียวกับ REG-0001 ใน registrationsMockData.js (หน้า Admin) เพื่อให้ข้อมูลฟาร์มนี้ตรงกันทั้งสองฝั่ง
        status: "approved",
        created_at: "2026-05-10",
        updated_at: "2026-05-12",
      });
    }, 700);
  });
}

/* ---------- หน้า Account: รีเซ็ตรหัสผ่านด้วย OTP ---------- */
// ตรงกับ Django Api_GetOTP / Api_ResetPassword จริง (url.py: api/getotp, api/reset-password)
// Api_ResetPassword เช็คทั้ง OTP และ old_password (ถ้าส่งไป) ก่อนอนุญาตให้ตั้งรหัสผ่านใหม่

// ขอ OTP ไปที่อีเมล — body: { email }
export function getOtp(email) {
  return api.post("/getotp", { email }).then((res) => res.data);
}

// ส่ง OTP + รหัสผ่านเดิม/ใหม่ ไปตั้งรหัสผ่าน — body: { email, otp_code, old_password, new_password }
export function resetPassword({ email, otp_code, old_password, new_password }) {
  return api
    .post("/reset-password", { email, otp_code, old_password, new_password })
    .then((res) => res.data);
}

/* ---------- หน้า Account: แก้ไขชื่อ-นามสกุล ---------- */
// ⚠️ ยังไม่มี view/endpoint จริงจาก backend สำหรับอัปเดตชื่อ-นามสกุล
// path "/update-profile" เป็นแค่ชื่อที่ตั้งไว้ชั่วคราว ต้องเปลี่ยนให้ตรงกับของจริงตอนมี view แล้ว
export function updateProfile({ first_name, last_name }) {
  return api.post("/update-profile", { first_name, last_name }).then((res) => res.data);
}
