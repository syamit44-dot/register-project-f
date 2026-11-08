import Icon from "./Icon";
import { useLanguage } from "../i18n.jsx";

export default function StepRail({ current, onGoTo }) {
  const { t } = useLanguage();

  const steps = [
    { icon: "barn", title: t("farmInformation"), hint: `${t("farmName")} / ${t("address")} / ${t("contactName")}` },
    { icon: "router", title: t("deviceInformation"), hint: `${t("platform")} / ${t("model")} / ${t("house")}` },
    { icon: "user", title: t("appUsers"), hint: `${t("Username")} / ${t("UserType")}` },
    { icon: "clipboard-text", title: t("confirmInformation"), hint: `${t("note")} / PDPA` },
  ];

  return (
    <nav className="editorial-steps" aria-label="Registration steps">
      <div className="editorial-steps-list">
        {steps.map((step, i) => {
          const isActive = i === current;
          const isDone = i < current;

          return (
            <button
              type="button"
              key={i}
              onClick={() => onGoTo(i)}
              className={`editorial-step group ${isActive ? "is-active" : ""} ${isDone ? "is-done" : ""}`}
            >
              <span className="editorial-step-number">
                {isDone ? <Icon name="check" style={{ fontSize: 13 }} /> : `0${i + 1}`}
              </span>
              <span className="min-w-0">
                <span className="editorial-step-title">{step.title}</span>
                <span className="editorial-step-hint">{step.hint}</span>
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}