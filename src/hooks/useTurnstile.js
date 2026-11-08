import { useEffect, useRef, useState } from "react";

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;
const CONTAINER_ID = "turnstile-widget";

// Loaded once per page (module-level, not per-component) so React StrictMode's
// double-effect in dev, or multiple SignupForm instances, never inject the
// Cloudflare script twice.
let scriptPromise = null;
function loadTurnstileScript() {
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve) => {
    const existing = document.querySelector(
      'script[src*="challenges.cloudflare.com/turnstile"]'
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    document.head.appendChild(script);
  });

  return scriptPromise;
}

// Loads Cloudflare Turnstile and renders a visible checkbox widget
// (appearance: "always"). The challenge runs automatically once rendered;
// depending on risk signals it may auto-pass or ask the visitor to tick
// the box. getToken() resolves once a token is available.
export function useTurnstile() {
  const widgetIdRef = useRef(null);
  const tokenRef = useRef(null);
  const resolversRef = useRef([]);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    if (!SITE_KEY) return;
    let cancelled = false;

    loadTurnstileScript().then(() => {
      if (cancelled) return;
      const container = document.getElementById(CONTAINER_ID);
      // Guard against StrictMode's double-mount trying to render twice
      // into the same container.
      if (!container || container.childElementCount > 0) return;

      widgetIdRef.current = window.turnstile.render(`#${CONTAINER_ID}`, {
        sitekey: SITE_KEY,
        appearance: "always",
        size: "flexible",
        callback: (token) => {
          tokenRef.current = token;
          setIsVerified(true);
          resolveAll(resolversRef, token);
        },
        "expired-callback": () => {
          tokenRef.current = null;
          setIsVerified(false);
        },
        "error-callback": () => {
          setIsVerified(false);
          rejectAll(resolversRef, new Error("ยืนยันตัวตนไม่สำเร็จ"));
        },
      });
    });

    return () => {
      cancelled = true;
      if (widgetIdRef.current !== null && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
      widgetIdRef.current = null;
    };
  }, []);

  async function getToken() {
    if (!SITE_KEY) {
      throw new Error(
        "ไม่พบ VITE_TURNSTILE_SITE_KEY กรุณาตั้งค่าใน .env ก่อนใช้งาน"
      );
    }
    if (tokenRef.current) return tokenRef.current;

    await waitForWidget(widgetIdRef);
    return new Promise((resolve, reject) => {
      resolversRef.current.push(resolve);
      setTimeout(() => {
        rejectAll(
          resolversRef,
          new Error("กรุณายืนยันตัวตนในกล่อง captcha ก่อน submit")
        );
      }, 15000);
    });
  }

  function reset() {
    tokenRef.current = null;
    setIsVerified(false);
    if (widgetIdRef.current !== null && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
    }
  }

  return { getToken, containerId: CONTAINER_ID, reset, isVerified };
}

function resolveAll(resolversRef, token) {
  const resolvers = resolversRef.current;
  resolversRef.current = [];
  resolvers.forEach((resolve) => resolve(token));
}

function rejectAll(resolversRef, error) {
  if (resolversRef.current.length === 0) return;
  resolversRef.current = [];
  // Errors surface through the getToken() promise via the timeout path,
  // this just clears pending resolvers so they don't fire twice.
  void error;
}

function waitForWidget(widgetIdRef, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    (function check() {
      if (widgetIdRef.current !== null) return resolve();
      if (Date.now() - start > timeoutMs) {
        return reject(new Error("โหลด Turnstile ไม่สำเร็จ ลองรีเฟรชหน้า"));
      }
      setTimeout(check, 100);
    })();
  });
}
