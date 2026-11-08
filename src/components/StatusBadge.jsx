import Icon from "./Icon";
import { useLanguage } from "../i18n.jsx";

const STATUS_CONFIG = {
  approved: {
    labelKey: "statusApproved",
    icon: "circle-check",
    className: "bg-good-tint text-good",
  },
  pending: {
    labelKey: "statusPending",
    icon: "clock",
    className: "bg-amber-tint text-amber",
  },
  rejected: {
    labelKey: "statusRejected",
    icon: "x",
    className: "bg-alert-tint text-alert",
  },
  // เผื่อข้อมูลเก่าที่ยังส่งสถานะแบบเดิมมา (backend เดิมใช้ "pushed")
  pushed: {
    labelKey: "statusApproved",
    icon: "circle-check",
    className: "bg-good-tint text-good",
  },
};

export default function StatusBadge({ status }) {
  const { t } = useLanguage();
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span
     className={`inline-flex w-[110px] items-center justify-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-medium ${config.className}`}
    >
      <Icon name={config.icon} style={{ fontSize: 13 }} />
      {t(config.labelKey)}
    </span>
  );
}