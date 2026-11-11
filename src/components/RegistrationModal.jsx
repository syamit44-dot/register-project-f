import Icon from "./Icon";
import RegistrationDetailView from "./RegistrationDetailView";
import { useLanguage } from "../i18n.jsx";

export default function RegistrationModal({
  registration,
  onClose,
  onApprove,
  onReject,
  onEdit,
  canModerate = true,
  pending = false,
  error,
  title,
}) {
  const { t } = useLanguage();
  if (!registration) return null;
  const { id, status } = registration;
  const editable = status !== "approved" && status !== "pushed";

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/45 px-4 py-8"
      onClick={(event) => event.target === event.currentTarget && !pending && onClose()}
    >
      <div role="dialog" aria-modal="true" aria-labelledby="farm-details-title" className="flex max-h-[90vh] w-full max-w-[960px] flex-col overflow-hidden rounded-control bg-white shadow-xl">
        <div className="bg-brand-dark px-6 py-4">
          <h3 id="farm-details-title" className="flex items-center gap-2 text-base font-semibold text-white">
            <Icon name="clipboard-text" />
            {title ?? t("modalTitle")}
          </h3>
        </div>

        <div className="max-h-[75vh] overflow-y-auto px-6 py-6">
          <RegistrationDetailView data={registration} />
        </div>

        {error && <p role="alert" className="px-6 py-2 text-sm text-alert">{error}</p>}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line-strong px-6 py-4">
          <button type="button" disabled={pending} onClick={onClose} className="inline-flex items-center gap-2 rounded-control border border-line-strong px-4 py-2 text-sm font-medium text-ink hover:bg-brand-tint">
            <Icon name="x" />
            {t("close")}
          </button>
          {editable && (
            <div className="flex flex-wrap gap-2.5">
              <button type="button" disabled={pending} onClick={() => onEdit(id)} className="inline-flex items-center gap-1.5 rounded-control border border-line-strong px-4 py-2 text-sm font-medium text-ink hover:bg-brand-tint">
                <Icon name="edit" style={{ fontSize: 14 }} />
                {t("edit")}
              </button>
              {canModerate && (
                <>
                  <button type="button" disabled={pending} onClick={() => onReject(id)} className="inline-flex items-center gap-2 rounded-control border border-alert-tint px-4 py-2 text-sm font-medium text-alert hover:bg-alert-tint">
                    <Icon name="x" />
                    {t("reject")}
                  </button>
                  <button type="button" disabled={pending} onClick={() => onApprove(id)} className="inline-flex items-center gap-2 rounded-control bg-brand-dark px-4 py-2 text-sm font-semibold text-white">
                    <Icon name="circle-check" />
                    {t("approve")}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
