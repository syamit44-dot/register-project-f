/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "var(--ink)",
        "ink-soft": "var(--ink-soft)",
        brand: "var(--brand)",
        "brand-dark": "var(--brand-dark)",
        "brand-tint": "var(--brand-tint)",
        mist: "var(--mist)",
        panel: "var(--panel)",
        line: "var(--line)",
        "line-strong": "var(--line-strong)",
        alert: "var(--alert)",
        "alert-tint": "var(--alert-tint)",
        amber: "var(--amber)",
        "amber-tint": "var(--amber-tint)",
        good: "var(--good)",
        "good-tint": "var(--good-tint)",
      },
      borderRadius: {
        card: "6px",
        control: "12px",
      },
      fontFamily: {
        display: ["IBM Plex Sans Thai", "IBM Plex Sans", "sans-serif"],
      },
    },
  },
  plugins: [],
};
