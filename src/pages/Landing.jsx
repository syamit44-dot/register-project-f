import { useNavigate } from "react-router-dom";
import Icon from "../components/Icon";
import engFlag from "../assets/icon/ENG.png";
import thaFlag from "../assets/icon/THA.png";
import chaFlag from "../assets/icon/CHA.png";
import { useEffect, useRef, useState } from "react";
import { signUp, signIn, checkAccessKey, scheduleTokenRefresh } from "../api/client";
import { saveAuth } from "../api/auth";
import CaptchaField from "../components/CaptchaField";
import { useLanguage } from "../i18n.jsx";
import countryData from "../data/countryData";
import heroSlide1 from "../assets/images/landing1.jpg";
import heroSlide2 from "../assets/images/landing2.jpg";
import heroSlide3 from "../assets/images/landing3.jpg";
import heroSlide4 from "../assets/images/landing4.jpg";
import heroSlide5 from "../assets/images/landing5.jpg";
import siamLogo from "../assets/images/siam-water-flame-logo.png";

const languageOptions = [
  { code: "ENG", lang: "en", image: engFlag },
  { code: "THA", lang: "th", image: thaFlag },
  { code: "CHN", lang: "zh", image: chaFlag },
];

// รูปสไลด์ฝั่งซ้าย (แบนเนอร์ประชาสัมพันธ์อุปกรณ์) — static ล้วน ไม่ผูก state ของฟอร์ม
const heroSlides = [
  { src: heroSlide1},
  { src: heroSlide2},
  { src: heroSlide3},
  { src: heroSlide4},
  { src: heroSlide5},
];

export default function Landing() {
  const navigate = useNavigate();
  const { t, lang, setLang } = useLanguage();
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isAuthExiting, setIsAuthExiting] = useState(false);
  const [homeAnimationKey, setHomeAnimationKey] = useState(0);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [Conpassword, setConPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [country, setCountry] = useState("");
  const [countryQuery, setCountryQuery] = useState("");
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [invitationKey, setInvitationKey] = useState("");
  const [invitationError, setInvitationError] = useState("");
  const [invitationVerifying, setInvitationVerifying] = useState(false);
  const [invitationVerified, setInvitationVerified] = useState(false);
  const passwordInputRef = useRef(null);
  const [page, setPage] = useState("");
  const [authMode, setAuthMode] = useState("Sign In");
  // signupStep: "verify" (ยืนยันตัวตน + รหัสเชิญ) -> "account" (ข้อมูลบัญชี)
  const [signupStep, setSignupStep] = useState("verify");
  const [authLoading, setAuthLoading] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const captchaRef = useRef(null);
  // อ้างอิงจาก lang โดยตรงแทนการเก็บ state ภาษาซ้ำซ้อน (เดิม initialize ผิดตอนโหลดค่า "zh" จาก localStorage)
  const selectedLanguage = languageOptions.find((option) => option.lang === lang) ?? languageOptions[1];
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActiveSlide((i) => (i + 1) % heroSlides.length);
    }, 4500);
    return () => clearInterval(id);
  }, []);

  const filteredCountries = countryData
    .filter((c) => {
      const query = countryQuery.trim().toLowerCase();
      if (!query) return true;
      return (
        c.name.toLowerCase().startsWith(query) ||
        c.alpha3.toLowerCase().startsWith(query) ||
        c.code.toLowerCase().startsWith(query)
      );
    })
    .slice(0, 100);

  const getDialPrefix = (countryName) => {
    const match = countryData.find((c) => c.name === countryName);
    return match?.dialCode ? `+${match.dialCode}` : "";
  };

  const stripDialPrefix = (phone, prefix) => {
    if (!phone) return "";
    if (prefix && phone.startsWith(prefix)) {
      return phone.slice(prefix.length).trim();
    }
    return phone;
  };

  const currentDialPrefix = getDialPrefix(country);
  const localPhone = stripDialPrefix(phoneNumber, currentDialPrefix);

  const handleCountrySelect = (countryName) => {
    const newPrefix = getDialPrefix(countryName);
    const existingLocalPhone = stripDialPrefix(phoneNumber, currentDialPrefix);
    const newPhone = newPrefix ? `${newPrefix} ${existingLocalPhone}`.trim() : existingLocalPhone;
    setCountry(countryName);
    setPhoneNumber(newPhone);
    setCountryQuery(countryName);
    setIsCountryOpen(false);
  };

  const handleCountryInputChange = (e) => {
    setCountryQuery(e.target.value);
    setIsCountryOpen(true);
  };

  const handleCountryInputKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (filteredCountries.length > 0) {
        handleCountrySelect(filteredCountries[0].name);
      }
    }
  };

  const handlePhoneChange = (e) => {
    const raw = e.target.value.replace(/[^\d]/g, "");
    const combined = currentDialPrefix ? `${currentDialPrefix} ${raw}`.trim() : raw;
    setPhoneNumber(combined);
  };

  // Access key บังคับเสมอ — เรียก POST /api/check-key จริง ก่อนปล่อยให้ไปกรอกขั้นตอน Account
  const handleVerifyInvitation = async () => {
    setError("");
    setInvitationError("");
    setFieldErrors({});
    if (!invitationKey.trim()) {
      setInvitationError(t("invitationKeyRequired"));
      return;
    }
    setInvitationVerifying(true);
    try {
      // POST /api/check-key — ตรวจว่า accessKey มีอยู่จริงและยังไม่ถูกใช้ (ยังไม่ mark ว่าใช้แล้ว
      // จะ mark ตอน signup สำเร็จจริงๆ ที่ backend)
      await checkAccessKey(invitationKey.trim());
      setInvitationVerified(true);
      setSignupStep("account");
    } catch (err) {
      setInvitationVerified(false);
      setInvitationError(err?.response?.data?.error || t("invitationKeyInvalid"));
    } finally {
      setInvitationVerifying(false);
    }
  };

  const handleBackToVerify = () => {
    setError("");
    setFieldErrors({});
    setSignupStep("verify");
  };

  const openAuth = (targetPage, mode = "Sign In") => {
    setPage(targetPage);
    setAuthMode(mode);
    setIsLoginOpen(true);
  };

  const handleBackFromAuth = () => {
    if (isAuthExiting) return;
    setError("");
    setIsAuthExiting(true);
    window.setTimeout(() => {
      setIsLoginOpen(false);
      setAuthMode("Sign In");
      handleClearData();
      setIsAuthExiting(false);
      setHomeAnimationKey((key) => key + 1);
    }, 420);
  };

  // ปุ่มลูกศรย้อนกลับ (มุมซ้ายบน): ย้อนไปหน้าก่อนหน้าเสมอ
  // - Sign Up ขั้นตอน Account -> ย้อนกลับไป Access Key (ขั้นตอนก่อนหน้าในสมัครสมาชิก)
  // - Sign In หรือ Sign Up ขั้นตอน Access Key -> ย้อนกลับไปหน้าเลือก role (หน้าแรก)
  const handleBack = () => {
    if (authMode === "Sign Up" && signupStep === "account") {
      handleBackToVerify();
    } else if (authMode === "Sign Up" && signupStep === "verify") {
      setError("");
      setFieldErrors({});
      setAuthMode("Sign In");
    } else {
      handleBackFromAuth();
    }
  };

  const handleAuth = async (event) => {
    event?.preventDefault();
    setError("");
    setFieldErrors({});
    if (!username.trim() || !password.trim()) {
      const nextFieldErrors = {};
      if (!username.trim()) nextFieldErrors.username = t("pleaseEnterEmailAndPassword");
      if (!password.trim()) nextFieldErrors.password = t("pleaseEnterEmailAndPassword");
      setFieldErrors(nextFieldErrors);
      return;
    }
    if (authMode === "Sign Up") {
      if (password.length < 8) {
        setFieldErrors({ password: t("passwordTooShort") });
        return;
      }
      if (password !== Conpassword) {
        setFieldErrors({ confirmPassword: t("passwordMismatch") });
        return;
      }
      if (!phoneNumber.trim()) {
        setFieldErrors({ phone: t("phoneNumberRequired") });
        return;
      }
      if (!country.trim()) {
        setFieldErrors({ country: t("countryRequired") });
        return;
      }
      // Access key บังคับเสมอ (ตรงกับ Api_SignUp ฝั่ง backend) — ถ้ายังไม่ผ่าน verify ให้เด้งกลับไปกรอกก่อน
      if (!invitationVerified || !invitationKey.trim()) {
        setSignupStep("verify");
        setError(t("invitationKeyRequired"));
        return;
      }
    }
    // ทั้ง Sign In และ Sign Up ต้องผ่าน Cloudflare Turnstile ก่อนเสมอ (backend เช็ค captcha_token ทั้งคู่)
    if (!captchaRef.current?.isVerified) {
      setError(t("captchaRequired"));
      return;
    }
    setError("");
    setFieldErrors({});
    setAuthLoading(true);
    if (authMode === "Sign In") {
      const isAdmin = page === "admin";
      try {
        const captchaToken = await captchaRef.current.getToken();
        const data = await signIn({
          username: username.trim(),
          password,
          captcha_token: captchaToken,
          isAdmin,
        });
        saveAuth({
          username: data.username,
          token: data.access_token,
          first_name: data.first_name,
          last_name: data.last_name,
        });
        scheduleTokenRefresh();
        setIsLoginOpen(false);
        handleClearData();
        navigate(isAdmin ? "/admin" : "/customer");
      } catch (err) {
        captchaRef.current?.reset();
        setError(err?.response?.data?.message || err?.response?.data?.error || t("signinFailed"));
      } finally {
        setAuthLoading(false);
      }
      return;
    }
    // Sign Up: ยิงไปที่ POST /api/signup พร้อม captcha_token จาก Cloudflare Turnstile + accessKey ที่ verify แล้ว
    try {
      const captchaToken = await captchaRef.current.getToken();
      await signUp({
        username: username.trim(),
        password,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        mobile: phoneNumber.trim(),
        country: country.trim(),
        accessKey: invitationKey.trim(),
        captcha_token: captchaToken,
      });
      const signedUpEmail = username.trim();
      handleClearData();
      setUsername(signedUpEmail);
      setAuthMode("Sign In");
      setError("");
    } catch (err) {
      captchaRef.current?.reset();
      setInvitationVerified(false);
      setSignupStep("verify");
      setError(err?.response?.data?.error || err?.response?.data?.message || t("signupFailed"));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleClearData = () => {
    setPassword("");
    setUsername("");
    setConPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setFirstName("");
    setLastName("");
    setPhoneNumber("");
    setCountry("");
    setCountryQuery("");
    setIsCountryOpen(false);
    setCaptchaVerified(false);
    captchaRef.current?.reset();
    setInvitationKey("");
    setInvitationError("");
    setInvitationVerified(false);
    setInvitationVerifying(false);
    setSignupStep("verify");
    setFieldErrors({});
  };

  // เนื้อหาแบรนด์ฝั่งซ้าย: สไลด์รูปภาพอุปกรณ์ เลื่อนอัตโนมัติทุก 4.5 วิ (static ล้วน ไม่ผูก state ของฟอร์ม)
  const brandPanel = (
    <div className="relative h-full w-full overflow-hidden bg-[#042C53]">
      {heroSlides.map((slide, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${i === activeSlide ? "opacity-100" : "opacity-0"}`}
        >
          <img src={slide.src} alt="" className={`h-full w-full object-cover hero-slide-image ${i === activeSlide ? "opacity-100" : "opacity-0"}`} />
          <div className="absolute inset-0 bg-gradient-to-t from-[#042C53]/95 via-[#042C53]/20 to-[#042C53]/45" />
          <div className="hero-brand-glow pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        </div>
      ))}
      <div className="absolute left-8 top-6 z-10 flex items-center gap-3 md:left-10 md:top-8">
      </div>
      <div className="absolute bottom-10 left-8 right-8 z-10 md:left-10 md:right-16">
        <p key={`${activeSlide}-caption`} className="hero-slide-caption mb-5 max-w-lg text-xl font-semibold leading-snug text-white lg:text-2xl">
          {t(heroSlides[activeSlide].key)}
        </p>
        <div className="flex items-center gap-2">
          {heroSlides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveSlide(i)}
              aria-label={`slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${i === activeSlide ? "w-7 bg-white" : "w-1.5 bg-white/40"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );

  // ปุ่มเลือกประเภทบัญชี — compact enterprise cards: แตกต่างกันด้วย identity แต่ยังเป็นชุดเดียวกัน
  const roleSelector = (
    <div className="role-selector mt-8">
      <div className="grid gap-4">
        <button
          type="button"
          className="role-card role-card-customer group relative flex min-h-[110px] w-full items-center gap-5 overflow-hidden rounded-[18px] border border-slate-200 bg-white px-5 py-4 text-left transition-all duration-300 ease-out sm:px-5"
          onClick={() => openAuth("customer", "Sign In")}
        >
          <span className="role-accent role-accent-customer absolute inset-y-3 left-0 w-[3px] rounded-r-full" />
          <span className="role-icon role-icon-customer relative z-10 flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-[15px] border transition-all duration-300">
            <Icon name="user" style={{ fontSize: 22 }} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="mb-1 flex flex-wrap items-center gap-2">
              <span className="text-[17px] font-semibold tracking-[-0.015em] text-slate-900 sm:text-[18px]">
                {t("customerCardTitle")}
              </span>
            </span>
            <span className="block max-w-[500px] text-[13px] leading-[1.6] text-slate-500 sm:text-[14px]">
              {t("customerCardDesc")}
            </span>
          </span>
          <span className="role-arrow role-arrow-customer relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-white transition-all duration-300 group-hover:translate-x-0.5">
            <Icon name="arrow-right" style={{ fontSize: 16 }} />
          </span>
        </button>
        <button
          type="button"
          className="role-card role-card-admin group relative flex min-h-[110px] w-full items-center gap-5 overflow-hidden rounded-[18px] border border-slate-300 bg-white px-5 py-4 text-left transition-all duration-300 ease-out sm:px-5"
          onClick={() => {
            setUsername("admin");
            setPassword("admin");
            openAuth("admin", "Sign In");
          }}
        >
          <span className="role-accent role-accent-admin absolute inset-y-3 left-0 w-[3px] rounded-r-full" />
          <span className="role-icon role-icon-admin relative z-10 flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-[15px] border transition-all duration-300">
            <Icon name="shield-check" style={{ fontSize: 22 }} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="mb-1 flex flex-wrap items-center gap-2">
              <span className="text-[17px] font-semibold tracking-[-0.015em] text-slate-900 sm:text-[18px]">
                {t("adminCardTitle")}
              </span>
            </span>
            <span className="block max-w-[500px] text-[13px] leading-[1.6] text-slate-500 sm:text-[14px]">
              {t("adminCardDesc")}
            </span>
          </span>
          <span className="role-arrow role-arrow-admin relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-white transition-all duration-300 group-hover:translate-x-0.5">
            <Icon name="arrow-right" style={{ fontSize: 16 }} />
          </span>
        </button>
      </div>
    </div>
  );

  // ปุ่มเปลี่ยนภาษา — ย้ายมามุมบนขวาของทั้งหน้าจอ (เนื้อหา/logic เดิมทั้งหมด)
  const languageSwitcher = (
    <div className="language-dropdown absolute right-5 top-4 z-30 sm:right-6 sm:top-5">
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsLanguageMenuOpen((open) => !open)}
          aria-haspopup="listbox"
          aria-expanded={isLanguageMenuOpen}
          className={`language-trigger flex min-h-[44px] w-full items-center justify-between gap-3 border bg-white px-4 py-2 text-[14px] font-semibold text-slate-700 shadow-[0_10px_26px_rgba(15,23,42,0.14)] transition-all duration-200 ${isLanguageMenuOpen ? "rounded-t-xl rounded-b-none border-slate-300 shadow-none" : "rounded-xl border-slate-300 hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-[0_14px_32px_rgba(15,23,42,0.18)]"}`}
        >
          <span className="flex items-center gap-2">
            <img src={selectedLanguage.image} alt={selectedLanguage.code} className="h-6 w-6 rounded-full object-cover" />
            <span>{selectedLanguage.code}</span>
          </span>
          <span className={`text-[11px] transition-transform duration-200 ${isLanguageMenuOpen ? "rotate-180" : ""}`}>▾</span>
        </button>
        {isLanguageMenuOpen && (
          <div className="language-menu absolute right-0 top-full w-full overflow-hidden rounded-b-xl border border-t-0 border-slate-300 bg-white p-1.5 shadow-[0_14px_30px_rgba(15,23,42,0.14)]">
            {languageOptions.map(({ code, lang: optionLang, image }) => (
              <button
                key={code}
                type="button"
                onClick={() => {
                  setLang(optionLang);
                  setIsLanguageMenuOpen(false);
                }}
                className={`language-option flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-semibold transition-all duration-150 ${lang === optionLang ? "bg-blue-700 text-white" : "text-slate-600 hover:bg-slate-100"}`}
              >
                <img src={image} alt={code} className="h-5 w-5 rounded-full object-cover" />
                <span className="flex-1">{code}</span>
                {lang === optionLang && <span className="text-sm">✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const authPageKey = `${page}-${authMode}-${signupStep}`;

  return (
    <>
      <style>{`
        @keyframes homePageEnter {
          from { opacity: 0; transform: translate3d(0, 18px, 0); }
          to { opacity: 1; transform: translate3d(0, 0, 0); }
        }
        @keyframes homeLogoEnter {
          from { opacity: 0; transform: translate3d(0, 14px, 0) scale(0.98); }
          to { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
        }
        @keyframes homeRegisterEnter {
          from { opacity: 0; transform: translate3d(0, 14px, 0); }
          to { opacity: 1; transform: translate3d(0, 0, 0); }
        }
        @keyframes homeContentEnter {
          from { opacity: 0; transform: translate3d(0, 12px, 0); }
          to { opacity: 1; transform: translate3d(0, 0, 0); }
        }
        @keyframes homeCardsEnter {
          from { opacity: 0; transform: translate3d(0, 16px, 0); }
          to { opacity: 1; transform: translate3d(0, 0, 0); } 
        }
        @keyframes authPageEnter {
          from { opacity: 0; transform: translate3d(18px, 6px, 0) scale(0.99); }
          to { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
        }
        @keyframes authPageExit {
          from { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
          to { opacity: 0; transform: translate3d(-18px, 0, 0) scale(0.99); }
        }
        @keyframes heroImageEnter {
          from { opacity: 0; transform: scale(1.035); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes heroCaptionEnter {
          from { opacity: 0; transform: translate3d(0, 10px, 0); }
          to { opacity: 1; transform: translate3d(0, 0, 0); }
        }
        @keyframes softFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        @keyframes brandUnderlineEnter {
          from { transform: scaleX(0); opacity: 0; }
          to { transform: scaleX(1); opacity: 1; }
        }
        .brand-register-line { animation: brandUnderlineEnter 620ms cubic-bezier(0.22, 1, 0.36, 1) 250ms both; transform-origin: center; }
        .role-card {
          isolation: isolate;
          position: relative;
          transform: translateZ(0);
          border: 1px solid #dfe5eb !important;
          border-top-color: #dfe5eb !important;
          outline: none !important;
          -webkit-appearance: none !important;
          appearance: none !important;
          background: #ffffff !important;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(15,23,42,0.055);
          transition: transform 240ms cubic-bezier(0.22,1,0.36,1), box-shadow 240ms ease, border-color 240ms ease, background 240ms ease;
        }
        .role-card::before {
          content: " ";
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0;
          transition: opacity 220ms ease;
          background: linear-gradient(105deg, rgba(255,255,255,0.65), transparent 42%);
        }
        .role-card:hover::before { opacity: 1; }
        .role-card-customer:hover {
          transform: translateY(-3px);
          border-color: #b9d3ea !important;
          border-top-color: #b9d3ea !important;
          box-shadow: 0 16px 34px rgba(24,95,165,0.13);
        }
        .role-card-admin {
          border-color: #cfd4da !important;
          border-top-color: #cfd4da !important;
          background: #ffffff !important;
          color: #24282e;
          box-shadow: 0 10px 30px rgba(15,23,42,0.06);
        }
        .role-card-admin:hover {
          transform: translateY(-3px);
          border-color: #3a3f47 !important;
          border-top-color: #3a3f47 !important;
          box-shadow: 0 16px 34px rgba(15,23,42,0.13);
        }
        .role-card:focus,
        .role-card:focus-visible,
        .role-card:active {
          outline: none !important;
          -webkit-tap-highlight-color: transparent;
        }
        .role-card-customer:focus-visible {
          border-color: #8db5d9 !important;
          box-shadow: 0 0 0 3px rgba(24,95,165,0.11), 0 16px 34px rgba(24,95,165,0.12);
        }
        .role-card-admin:focus-visible {
          border-color: #545a63 !important;
          border-top-color: #545a63 !important;
          box-shadow: 0 0 0 3px rgba(17,24,39,0.10), 0 16px 34px rgba(15,23,42,0.11);
        }
        .role-accent-customer { background: #2d73b7; }
        .role-accent-admin { background: #24282e; }
        .role-icon-customer {
          border-color: #cfe1f2;
          color: #185fa5;
          background: #f7fbff;
          box-shadow: 0 4px 12px rgba(24,95,165,0.05); 
        }
        .role-card-customer:hover .role-icon-customer {
          color: #185fa5;
          border-color: #9ec3e5;
          background: #f0f7fd;
          box-shadow: 0 7px 16px rgba(24,95,165,0.10);
          transform: translateY(-1px);
        }
        .role-icon-admin {
          border-color: #cfd4da;
          color: #2f343b;
          background: #f5f6f7;
          box-shadow: 0 4px 12px rgba(15,23,42,0.05);
        }
        .role-card-admin:hover .role-icon-admin {
          color: #15191f;
          border-color: #9da3ab;
          background: #eef0f2;
          box-shadow: 0 7px 16px rgba(15,23,42,0.10);
          transform: translateY(-1px);
        }
        .role-badge-customer {
          color: #24659b;
          background: #edf6fd;
          border: 1px solid #d8e8f6;
        }
        .role-badge-admin {
          color: #fff;
          background: #24282e;
          border: 1px solid #24282e;
        }
        .role-arrow-customer {
          border-color: #d5e4f1;
          color: #185fa5;
          background: #f8fbfe;
          box-shadow: 0 5px 14px rgba(15,23,42,0.05);
        }
        .role-card-customer:hover .role-arrow-customer {
          color: #fff;
          border-color: #185fa5;
          background: #185fa5;
          box-shadow: 0 8px 18px rgba(24,95,165,0.18);
        }
        .role-arrow-admin {
          border-color: #cfd4da;
          color: #24282e;
          background: #fafafa;
          box-shadow: 0 5px 14px rgba(15,23,42,0.05);
        }
        .role-card-admin:hover .role-arrow-admin {
          color: #fff;
          border-color: #24282e;
          background: #24282e;
          box-shadow: 0 8px 18px rgba(15,23,42,0.18);
        }
        .role-card > span { will-change: transform; }
         .home-page-enter { animation: authPageEnter 460ms cubic-bezier(0.22, 1, 0.36, 1) both; }
         .home-logo-enter { animation: authContentEnter 420ms cubic-bezier(0.22, 1, 0.36, 1) 80ms both; }
         .home-register-enter { animation: authContentEnter 420ms cubic-bezier(0.22, 1, 0.36, 1) 160ms both; }
         .home-content-enter { animation: authContentEnter 420ms cubic-bezier(0.22, 1, 0.36, 1) 240ms both; }
         .home-cards-enter { animation: authContentEnter 420ms cubic-bezier(0.22, 1, 0.36, 1) 320ms both; }
        .role-selector .role-card:nth-child(1) { animation: roleCardEnter 480ms cubic-bezier(0.22, 1, 0.36, 1) 420ms both; }
        .role-selector .role-card:nth-child(2) { animation: roleCardEnter 480ms cubic-bezier(0.22, 1, 0.36, 1) 480ms both; }
        @keyframes roleCardEnter {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .auth-column-open {
          align-items: stretch;
          min-height: 0;
          height: 100%;
          overflow: hidden;
        }
        .auth-column-open > div {
          display: flex;
          align-items: stretch;
          width: 100%;
          min-height: 0;
          height: 100%;
          overflow: hidden;
        }
        .language-dropdown {
          width: 132px;
        }
        .language-trigger {
          min-height: 44px;
          min-width: 132px;
          background: #ffffff !important;
          border-color: #cbd5e1 !important;
          opacity: 1 !important;
          backdrop-filter: none;
          -webkit-backdrop-filter: none;
        }
        .auth-primary-button {
          min-height: 48px;
        }
        @keyframes authContentEnter {
          from { opacity: 0; transform: translate3d(0, 10px, 0); }
          to { opacity: 1; transform: translate3d(0, 0, 0); }
        }
         .auth-stagger-1 {
          animation: authContentEnter 420ms cubic-bezier(0.22, 1, 0.36, 1) 80ms both;
        }
         .auth-stagger-2 {
          animation: authContentEnter 420ms cubic-bezier(0.22, 1, 0.36, 1) 160ms both;
        }
        .auth-page-enter {
          width: 100%;
          animation: authPageEnter 460ms cubic-bezier(0.22, 1, 0.36, 1) both;
          will-change: transform, opacity;
        }
        .auth-page-exit {
          width: 100%;
          animation: authPageExit 420ms cubic-bezier(0.65, 0, 0.35, 1) both;
          pointer-events: none;
          will-change: transform, opacity;
        }
        .auth-surface {
          --auth-gap: 18px;
          --auth-radius: 12px;
          position: relative;
          width: 100%;
          height: 100%;
          max-height: 100%;
          min-height: 0;
          display: flex;
          flex-direction: column;
          overflow-y: hidden;
          overflow-x: hidden;
          overscroll-behavior: contain;
          scrollbar-gutter: stable;
          padding: 0 2px;
          background: transparent;
          border: 0;
          border-radius: 0;
          box-shadow: none;
        }
        .auth-surface > :first-child {
          width: 100%;
          max-width: 500px;
          margin: 0 auto;
          flex: 0 0 auto;
        }
        /* Keep Sign In and Access Key visually aligned as the same compact auth layout. */
        /* Sign In: center the complete form group at the same visual level as Access Key. */
        .auth-surface.auth-surface-signin {
          justify-content: center;
          padding-top: 0;
          padding-bottom: 0;
        }
        /* Access Key: center the complete verification block in the left panel. */
        .auth-surface.auth-surface-verify {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          align-content: center;
          justify-items: center;
          row-gap: 0;
          padding-top: 0;
          padding-bottom: 0;
        }
        .auth-surface.auth-surface-verify > * {
          width: 100%;
          max-width: 500px;
          margin-left: auto;
          margin-right: auto;
        }
        /* Signup has the most fields of any page. Its --auth-gap is tighter so the same
           spacing rules used everywhere else still read as one coherent rhythm, and
           overflow falls back to an internal scroll (instead of clipping) if a
           longer translation ever pushes it past the viewport. */
        .auth-surface.auth-surface-signup {
          --auth-gap: 14px;
          justify-content: flex-start;
          overflow-y: auto;
          overflow-x: hidden;
          padding-top: 32px;
          padding-bottom: var(--auth-gap);
        }
        .auth-surface.auth-surface-signup .auth-footer-hint {
          display: none;
        }
        .auth-context {
          position: relative;
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: var(--auth-gap);
          padding: 0 0 calc(var(--auth-gap) - 2px);
          border-bottom: 1px solid #e8edf2;
          background: transparent;
        }
        .auth-context-icon {
          display: flex;
          height: 44px;
          width: 44px;
          flex: 0 0 44px;
          align-items: center;
          justify-content: center;
          border-radius: 13px;
          border: 1px solid #d8e3ee;
          background: #ffffff;
          color: #185fa5;
          box-shadow: 0 5px 16px rgba(15, 23, 42, 0.06);
        }
        .auth-context-icon-admin {
          border-color: #d9dde2;
          color: #20242a;
        }
        .auth-eyebrow {
          margin-bottom: 2px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #94a3b8;
        }
        .auth-helper {
          font-size: 14px;
          line-height: 1.55;
          color: #64748b;
        }
        .auth-form-section {
          width: 100%;
          padding-top: 0;
        }
        .auth-signin-form,
        .auth-verify-form {
          margin-top: var(--auth-gap);
        }
        .auth-form-section > div {
          margin-bottom: var(--auth-gap);
        }
        .auth-verify-form > * {
          margin-bottom: var(--auth-gap);
        }
        .auth-verify-form > *:last-child {
          margin-bottom: 0;
        }
        .auth-surface .auth-footer-hint {
          margin-left: 0;
          margin-right: 0;
        }
        .auth-footer-hint {
          margin-top: var(--auth-gap);
          padding-top: 14px;
          border-top: 1px solid #edf1f5;
          font-size: 13px;
          line-height: 1.5;
          color: #94a3b8;
          text-align: center;
        }
        /* Unified modern input system — one look shared by every field on every
           auth page (Sign In, Access Key, Sign Up), instead of each field
           carrying its own one-off Tailwind border/ring string. */
        .auth-input {
          width: 100%;
          border-radius: var(--auth-radius);
          border: 1.5px solid #e2e8f0;
          background: #f8fafc;
          padding: 12px 14px;
          font-size: 16px;
          color: #0f172a;
          outline: none;
          transition: border-color 160ms ease, background-color 160ms ease, box-shadow 160ms ease;
        }
        .auth-input::placeholder { color: #94a3b8; }
        .auth-input:hover { border-color: #cbd5e1; }
        .auth-input:focus {
          border-color: #185fa5;
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(24, 95, 165, 0.10);
        }
        .auth-input:disabled {
          background: #f1f5f9;
          color: #94a3b8;
          cursor: not-allowed;
        }
        .auth-input-error {
          border-color: #fca5a5 !important;
          background: #fff6f6 !important;
        }
        .auth-input-error:focus {
          border-color: #ef4444 !important;
          box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.10);
        }
        .auth-input-success {
          border-color: #86efac !important;
        }
        .auth-input-success:focus {
          border-color: #22c55e !important;
          box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.10);
        }
        /* Grouped input (country-code + phone) shares the same border/focus
           treatment as a plain .auth-input, just applied to the wrapper. */
        .auth-input-group {
          display: flex;
          align-items: stretch;
          width: 100%;
          border-radius: var(--auth-radius);
          border: 1.5px solid #e2e8f0;
          background: #f8fafc;
          overflow: hidden;
          transition: border-color 160ms ease, background-color 160ms ease, box-shadow 160ms ease;
        }
        .auth-input-group:hover { border-color: #cbd5e1; }
        .auth-input-group:focus-within {
          border-color: #185fa5;
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(24, 95, 165, 0.10);
        }
        .auth-input-group.auth-input-error { border-color: #fca5a5 !important; background: #fff6f6 !important; }
        .auth-input-group.auth-input-error:focus-within {
          border-color: #ef4444 !important;
          box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.10);
        }
        .auth-input-group-prefix {
          display: flex;
          align-items: center;
          padding: 0 12px;
          font-size: 15px;
          color: #64748b;
          background: rgba(15, 23, 42, 0.03);
          border-right: 1px solid #e2e8f0;
        }
        .auth-input-group input {
          flex: 1;
          min-width: 0;
          border: 0;
          background: transparent;
          padding: 12px 14px;
          font-size: 16px;
          outline: none;
        }
        /* Top nav row: icon-only back arrow (left, goes to the previous step)
           and icon-only close (right, always exits to the first/role-select
           page) — shared across Sign In, Access Key, and Sign Up.
           Inset + vertical gap are tuned to match the icon block below it. */
        .auth-surface > .auth-nav-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
          padding: 0;
          /* Buttons should reach the real edges of the panel, not the
             narrower 500px reading-width used for the form fields below.
             We now simply let the row fill 100% of auth-surface's own box
             (whose own side padding was shrunk to 2px above) instead of
             using negative margins to "escape" a bigger padding — that
             earlier approach pushed the row past auth-surface's own edge,
             and since auth-surface has overflow:hidden, part of the arrow
             icon got silently clipped down to a stray "-". This way there
             is nothing to clip. */
          max-width: none;
          position: relative;
        }
        .auth-icon-button {
          display: flex;
          height: 44px;
          width: 44px;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          border: 0;
          background: transparent;
          color: #64748b;
          transition: background-color 160ms ease, color 160ms ease;
        }
        .auth-icon-button:hover {
          background: #f1f5f9;
          color: #1f2937;
        }
        .auth-icon-button:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px rgba(100, 116, 139, 0.14);
        }
        @media (max-width: 1279px) {
          /* Every screen (role-select, sign in, sign up, access key) on
             phone/tablet: pin the whole page to the real viewport height so
             it centers vertically instead of growing taller than the screen
             and getting cut off. If content is ever too tall for a very
             short device, it scrolls internally rather than hiding behind
             the browser UI. The language switcher stays "absolute" on the
             outer wrapper, so it is unaffected and stays pinned to the
             top-right corner. */
          .home-viewport-fit {
            height: 100dvh;
            min-height: 100dvh;
            overflow-y: auto;
          }
        }
        @media (max-width: 1279px) {
          .auth-column-open {
            width: 100%;
            min-height: auto;
            height: auto;
            overflow: visible;
            align-items: center;
            justify-content: center;
            padding: 18px 16px 32px;
          }

          .auth-column-open > div {
            align-items: stretch;
            justify-content: center;
            width: 100%;
            height: auto;
            overflow: visible;
          }

          .auth-page-enter,
          .auth-page-exit {
            width: 100%;
            max-width: 390px;
            margin: 0 auto;
          }

          .auth-surface {
            width: 100%;
            height: auto;
            max-height: none;
            min-height: 0;
            overflow: visible;
            padding: 0;
            display: block;
            margin: 0 auto;
          }

          .auth-surface.auth-surface-signin,
          .auth-surface.auth-surface-verify {
            padding-top: 0;
            padding-bottom: 24px;
          }

          /* Sit just below the language switcher (which ends ~60px from the
             top) instead of overlapping it, while still reaching the full
             left/right edges — auth-surface is overflow:visible on mobile
             (see below) so, unlike desktop, there's no clipping risk here. */
          .auth-surface > .auth-nav-row {
            z-index: 40;
            top: 44px;
            margin-bottom: 68px;
            padding: 0;
          }

          .language-dropdown {
            width: 124px;
            z-index: 50;
          }

          .language-trigger {
            min-width: 124px;
            min-height: 42px;
            padding-left: 12px;
            padding-right: 12px;
            font-size: 13px;
          }
        }

        @media (min-width: 768px) and (max-width: 1279px) {
          .auth-surface { padding-left: 4px; padding-right: 4px; }
          .auth-surface > .auth-nav-row { max-width: none; }
          .auth-context { gap: 12px; }
          .auth-context-icon { height: 42px; width: 42px; flex-basis: 42px; }
          .auth-helper { font-size: 13px; }
          .role-card { min-height: 100px; padding-left: 16px; padding-right: 16px; }
          /* Tablets have real width to spare — the 390px phone-sized card
             cap (above) made the form float tiny in a sea of white space on
             an iPad. Let the card grow to use the space instead. */
          .auth-page-enter,
          .auth-page-exit {
            max-width: 640px;
          }
          .auth-surface > :first-child {
            max-width: 560px;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .auth-page-enter, .auth-page-exit, .auth-page-enter .auth-stagger-1,
          .auth-page-enter .auth-stagger-2, .home-page-enter, .home-logo-enter,
          .home-register-enter, .home-content-enter, .home-cards-enter,
          .hero-slide-image, .hero-slide-caption, .hero-brand-glow, .brand-register-line, .role-selector .role-card { animation: none !important; }
          .role-card, .auth-surface, .auth-context, .language-trigger, .language-option, .auth-icon-button, .auth-input, .auth-input-group { transition: none !important; }
          .auth-surface { animation: none !important; }
        }
      `}</style>
      <div className="relative min-h-screen w-full overflow-x-hidden bg-white xl:h-screen xl:overflow-hidden home-viewport-fit">
        {languageSwitcher}
        <div className="flex h-full flex-col justify-center overflow-visible xl:h-screen xl:min-h-0 xl:flex-row xl:justify-start xl:overflow-hidden">
          <div className={`flex h-full min-h-0 w-full items-center justify-center overflow-hidden px-5 py-8 xl:w-1/3 xl:px-4 ${isLoginOpen ? "auth-column-open" : ""}`}>
            <div className="flex h-full min-h-0 w-full max-w-[620px] flex-col justify-center">
              {!isLoginOpen ? (
                <div key={homeAnimationKey} className="home-page-enter">
                  <div className="mb-4 flex w-full justify-center home-logo-enter">
                    <img
                      src={siamLogo}
                      alt="Siam Water Flame"
                      className="h-auto w-full max-w-[330px] object-contain sm:max-w-[390px] lg:max-w-[440px]"
                    />
                  </div>
                  <div className="mb-9 text-center home-register-enter">
                    <h2 className="text-[clamp(34px,11vw,64px)] font-extrabold leading-none tracking-[0.055em] text-[#2947B5] sm:text-[72px] lg:text-[80px]">REGISTER</h2>
                    <div className="brand-register-line mx-auto mt-4 h-1.5 w-24 rounded-full bg-gradient-to-r from-[#8EBBE1] via-[#185FA5] to-[#0C447C]" />
                  </div>
                  <div className="mb-2 home-content-enter">
                    <h2 className="text-center text-[26px] font-bold tracking-[-0.02em] text-slate-900 lg:text-[30px]">{t("landingRoleTitle")}</h2>
                  </div>
                  <p className="mb-6 text-center text-base text-slate-500 lg:text-[16px] home-content-enter">{t("landingSubtitle")}</p>
                  <div className="home-cards-enter">
                    {roleSelector}
                  </div>
                </div>
              ) : (
                <div key={authPageKey} className={`min-h-0 flex-1 ${isAuthExiting ? "auth-page-exit" : "auth-page-enter"}`}>
                  <div className={`auth-surface ${authMode === "Sign In" ? "auth-surface-signin" : ""} ${authMode === "Sign Up" ? "auth-surface-signup" : ""} ${authMode === "Sign Up" && signupStep === "verify" ? "auth-surface-verify" : ""}`}>
                    <>
                      <div className="auth-nav-row auth-stagger-1">
                        <button
                          type="button"
                          onClick={handleBack}
                          className="auth-icon-button"
                          aria-label={t("back") || "Back"}
                        >
                          <Icon name="arrow-left" style={{ fontSize: 24 }} />
                        </button>
                        <button
                          type="button"
                          onClick={handleBackFromAuth}
                          className="auth-icon-button"
                          aria-label={t("close") || "Close"}
                        >
                          <Icon name="x" style={{ fontSize: 24 }} />
                        </button>
                      </div>
                      <div className="auth-context auth-stagger-1">
                        <div className={`auth-context-icon ${page === "admin" ? "auth-context-icon-admin" : ""}`}>
                          <Icon
                            name={
                              page === "admin"
                                ? "shield-check"
                                : authMode === "Sign In"
                                  ? "user"
                                  : signupStep === "verify"
                                    ? "shield-check"
                                    : "user"
                            }
                            style={{ fontSize: 20 }}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h2 className="text-[26px] font-bold leading-tight text-slate-900 lg:text-[28px]">
                            {authMode === "Sign In"
                              ? t("signIn")
                              : signupStep === "verify"
                                ? t("identityVerification")
                                : t("signUp")}
                          </h2>
                          <p className="auth-helper">
                            {page === "admin"
                              ? "Review and manage registration requests."
                              : authMode === "Sign In"
                                ? "Enter your account details to continue."
                                : signupStep === "verify"
                                  ? t("identityVerificationDesc")
                                  : "Complete your account details to finish registration."}
                          </p>
                        </div>
                      </div>
                      {/* ขั้นตอน Access Key ของ Sign Up — กด Verify เพื่อไปยัง Account details โดยยังไม่ตรวจ API */}
                      <div className={`auth-stagger-2 auth-form-section auth-verify-form ${authMode === "Sign Up" && signupStep === "verify" ? "block" : "hidden"}`}>
                        <p className="mb-4 text-[15px] leading-6 text-slate-500">{t("identityVerificationDesc")}</p>
                        <div className="mb-2">
                          <label className="mb-1.5 block text-[15px] font-medium text-gray-600">
                            {t("InvitationKey")}<span className="ml-0.5 text-red-700">*</span>
                          </label>
                          <input
                            type="text"
                            value={invitationKey}
                            onChange={(e) => {
                              setInvitationKey(e.target.value);
                              if (invitationError) setInvitationError("");
                              if (invitationVerified) setInvitationVerified(false);
                            }}
                            disabled={invitationVerifying}
                            className={`auth-input ${
                              invitationError
                                ? "auth-input-error"
                                : invitationVerified
                                  ? "auth-input-success"
                                  : ""
                            }`}
                          />
                          {invitationError ? (
                            <p className="mt-1.5 text-[13px] font-medium text-red-600">{invitationError}</p>
                          ) : invitationVerified ? (
                            <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-green-600">
                              <Icon name="check-circle" style={{ fontSize: 14 }} />
                              {t("invitationKeyVerified")}
                            </p>
                          ) : (
                            <p className="mt-1.5 text-[13px] text-slate-400">{t("invitationKeyHint")}</p>
                          )}
                        </div>
                        {error && (
                          <p className="mb-4 mt-4 rounded-lg bg-red-50 px-3 py-2 text-center text-sm font-medium text-red-600">{error}</p>
                        )}
                        <button
                          type="button"
                          onClick={handleVerifyInvitation}
                          disabled={invitationVerifying}
                          className="auth-primary-button flex w-full items-center justify-center gap-2 rounded-xl bg-[#185FA5] py-3.5 text-[16px] font-semibold text-white shadow-[0_10px_24px_rgba(24,95,165,0.18)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#0C447C] hover:shadow-[0_14px_28px_rgba(24,95,165,0.22)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                        >
                          {invitationVerifying && (
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                          )}
                          {invitationVerifying ? t("verifyingInvitationKey") : t("verifyInvitationKey")}
                        </button>
                      </div>
                      {/* ขั้นตอนที่ 2 ของ Sign Up (หรือหน้า Sign In ตามปกติ): ข้อมูลบัญชี */}
                      <form
                        onSubmit={handleAuth}
                        noValidate
                        className={`auth-stagger-2 auth-form-section ${authMode === "Sign In" ? "auth-signin-form" : ""} ${authMode === "Sign Up" && signupStep === "verify" ? "hidden" : "block"}`}
                      >
                        {authMode === "Sign Up" && (
                          <>
                            <div className="mb-4 mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                              <div>
                                <label className="mb-1.5 block text-[15px] font-medium text-gray-600">{t("firstName")}<span className="ml-0.5 text-red-700">*</span></label>
                                <input
                                  type="text"
                                  value={firstName}
                                  onChange={(e) => setFirstName(e.target.value)}
                                  className="auth-input"
                                />
                              </div>
                              <div>
                                <label className="mb-1.5 block text-[15px] font-medium text-gray-600">{t("lastName")}<span className="ml-0.5 text-red-700">*</span></label>
                                <input
                                  type="text"
                                  value={lastName}
                                  onChange={(e) => setLastName(e.target.value)}
                                  className="auth-input"
                                />
                              </div>
                            </div>
                            <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                              <div>
                                <label className="mb-1.5 block text-[15px] font-medium text-gray-600">{t("country")}<span className="ml-0.5 text-red-700">*</span></label>
                                <div className="relative">
                                  <input
                                    type="text"
                                    value={countryQuery}
                                    onChange={(e) => {
                                      handleCountryInputChange(e);
                                      if (fieldErrors.country) setFieldErrors((prev) => ({ ...prev, country: undefined }));
                                    }}
                                    onKeyDown={handleCountryInputKeyDown}
                                    onFocus={() => setIsCountryOpen(true)}
                                    onBlur={() => setTimeout(() => setIsCountryOpen(false), 120)}
                                    className={`auth-input ${fieldErrors.country ? "auth-input-error" : ""}`}
                                  />
                                  {isCountryOpen && filteredCountries.length > 0 && (
                                    <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-gray-300 bg-white shadow-lg">
                                      {filteredCountries.map((c) => (
                                        <li key={c.code}>
                                          <button
                                            type="button"
                                            className="flex w-full items-center justify-between px-3 py-2 text-left text-[14px] text-slate-700 hover:bg-slate-100"
                                            onMouseDown={(e) => e.preventDefault()}
                                            onClick={() => handleCountrySelect(c.name)}
                                          >
                                            <span>{c.name}</span>
                                          </button>
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                                {fieldErrors.country && <p className="mt-1.5 text-[13px] font-medium text-red-600">{fieldErrors.country}</p>}
                              </div>
                              <div>
                                <label className="mb-1.5 block text-[15px] font-medium text-gray-600">{t("phoneNumber")}<span className="ml-0.5 text-red-700">*</span></label>
                                <div className={`auth-input-group ${fieldErrors.phone ? "auth-input-error" : ""}`}>
                                  {currentDialPrefix && (
                                    <span className="auth-input-group-prefix">
                                      {currentDialPrefix}
                                    </span>
                                  )}
                                  <input
                                    type="tel"
                                    inputMode="numeric"
                                    value={localPhone}
                                    onChange={(e) => {
                                      handlePhoneChange(e);
                                      if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: undefined }));
                                    }}
                                  />
                                </div>
                                {fieldErrors.phone && <p className="mt-1.5 text-[13px] font-medium text-red-600">{fieldErrors.phone}</p>}
                              </div>
                            </div>
                            <div className="mb-5 border-t border-slate-100" />
                          </>
                        )}
                        <div className="mb-4">
                          <label className="mb-1.5 block text-[15px] font-medium text-gray-600">{t("email")}<span className="ml-0.5 text-red-700">*</span></label>
                          <input
                            type="email"
                            value={username}
                            onChange={(e) => {
                              setUsername(e.target.value);
                              if (fieldErrors.username) setFieldErrors((prev) => ({ ...prev, username: undefined }));
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                passwordInputRef.current?.focus();
                              }
                            }}
                            className={`auth-input ${fieldErrors.username ? "auth-input-error" : ""}`}
                          />
                          {fieldErrors.username && <p className="mt-1.5 text-[13px] font-medium text-red-600">{fieldErrors.username}</p>}
                        </div>
                        <div className="mb-4">
                          <label className="mb-1.5 block text-[15px] font-medium text-gray-600">{t("password")}<span className="ml-0.5 text-red-700">*</span></label>
                          <div className="relative">
                            <input
                              type={showPassword ? "text" : "password"}
                              ref={passwordInputRef}
                              value={password}
                              onChange={(e) => {
                                setPassword(e.target.value);
                                if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
                              }}
                              className={`auth-input pr-10 ${fieldErrors.password ? "auth-input-error" : ""}`}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword((v) => !v)}
                              className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-slate-400 hover:text-slate-600"
                              aria-label={showPassword ? t("hidePassword") : t("showPassword")}
                              tabIndex={-1}
                            >
                              <Icon name={showPassword ? "eye-off" : "eye"} style={{ fontSize: 16 }} />
                            </button>
                          </div>
                          {fieldErrors.password && <p className="mt-1.5 text-[13px] font-medium text-red-600">{fieldErrors.password}</p>}
                        </div>
                        {authMode === "Sign Up" && (
                          <div className="mb-4">
                            <label className="mb-1.5 block text-[15px] font-medium text-gray-600">{t("confirmPassword")}<span className="ml-0.5 text-red-700">*</span></label>
                            <div className="relative">
                              <input
                                type={showConfirmPassword ? "text" : "password"}
                                value={Conpassword}
                                onChange={(e) => {
                                  setConPassword(e.target.value);
                                  if (fieldErrors.confirmPassword) setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                                }}
                                className={`auth-input pr-10 ${fieldErrors.confirmPassword ? "auth-input-error" : ""}`}
                              />
                              <button
                                type="button"
                                onClick={() => setShowConfirmPassword((v) => !v)}
                                className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-slate-400 hover:text-slate-600"
                                aria-label={showConfirmPassword ? t("hidePassword") : t("showPassword")}
                                tabIndex={-1}
                              >
                                <Icon name={showConfirmPassword ? "eye-off" : "eye"} style={{ fontSize: 16 }} />
                              </button>
                            </div>
                            {fieldErrors.confirmPassword && <p className="mt-1.5 text-[13px] font-medium text-red-600">{fieldErrors.confirmPassword}</p>}
                          </div>
                        )}
                        {/* Cloudflare Turnstile จำเป็นทั้ง Sign In และ Sign Up (backend เช็ค captcha_token ทั้งคู่) */}
                        <div className="mb-4">
                          <CaptchaField ref={captchaRef} onVerifiedChange={setCaptchaVerified} />
                        </div>
                        {error && (
                          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-center text-sm font-medium text-red-600">{error}</p>
                        )}
                        <button
                          type="submit"
                          className="auth-primary-button mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-[#185FA5] py-3.5 text-[16px] font-semibold text-white shadow-[0_10px_24px_rgba(24,95,165,0.18)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#0C447C] hover:shadow-[0_14px_28px_rgba(24,95,165,0.22)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                          disabled={authLoading || !captchaVerified}
                        >
                          {authLoading && (
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                          )}
                          {authMode === "Sign In"
                            ? authLoading ? t("signingIn") : t("signIn")
                            : authLoading ? t("signingUp") : t("signUp")}
                        </button>
                      </form>
                      {!(authMode === "Sign Up" && signupStep === "account") && (
                        <div className="auth-footer-hint">
                          {page === "admin"
                            ? "Administrator access is limited to authorized personnel."
                            : "Your information is securely handled by the registration system."}
                        </div>
                      )}
                      {page !== "admin" && (
                        <div className="mt-4 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setAuthMode(authMode === "Sign In" ? "Sign Up" : "Sign In");
                              handleClearData();
                            }}
                            className="text-[14px] text-slate-400 transition hover:text-blue-700"
                          >
                            {authMode === "Sign In" ? t("dontHaveAccount") : t("alreadyHaveAccount")}
                          </button>
                        </div>
                      )}
                    </>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="hidden min-h-0 overflow-hidden xl:block xl:h-full xl:w-2/3">{brandPanel}</div>
        </div>
      </div>
    </>
  );
}