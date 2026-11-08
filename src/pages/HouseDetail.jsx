import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import Topbar from "../components/Topbar";
import Sidebar from "../components/Sidebar";
import Icon from "../components/Icon";
import { fetchHomeSummaryMock } from "../api/client";
import { isAuthenticated } from "../api/auth";
import { useLanguage } from "../i18n.jsx";

export default function HouseDetail() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { index } = useParams();
  const location = useLocation();
  const [house, setHouse] = useState(location.state?.house ?? null);
  const [farmName, setFarmName] = useState(location.state?.farm_name ?? "");
  const [loading, setLoading] = useState(!location.state?.house);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/");
      return;
    }
    if (house) return;
    // เปิดหน้านี้ตรงๆ (ไม่ได้มาจากหน้า Home) — โหลด mock summary ใหม่แล้วดึงข้อมูล house ตาม index
    fetchHomeSummaryMock().then((data) => {
      setHouse(data.houses[Number(index)] ?? null);
      setFarmName(data.farm_name);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-screen">
      <Sidebar active="home" mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="min-w-0 flex-1">
        <Topbar
          tag="HOUSE"
          tagClass="rounded-full bg-brand-dark px-2.5 py-1 text-[11px] tracking-[0.04em] text-white"
          onMenuClick={() => setSidebarOpen(true)}
        />
      <div className="mx-auto max-w-[720px] px-6 py-10">
        <button
          type="button"
          onClick={() => navigate("/home")}
          className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-ink-soft transition hover:text-brand-dark"
        >
          <Icon name="arrow-left" />
          <span>{t("back")}</span>
        </button>

        {loading && <div className="text-[13.5px] text-ink-soft">{t("loading")}</div>}

        {!loading && !house && (
          <div className="text-[13.5px] text-ink-soft">{t("houseNotFound")}</div>
        )}

        {!loading && house && (
          <>
            <div className="mb-6">
              <p className="text-[12.5px] text-ink-soft">{farmName}</p>
              <h2 className="font-['Space_Grotesk'] text-[22px] font-semibold">{house.name}</h2>
              <p className="text-sm text-ink-soft">{house.serial_number}</p>
            </div>

            <div className="mb-6 rounded-control border border-line bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-base font-semibold text-ink">{t("deviceInformation")}</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="mb-1 text-[11px] uppercase tracking-[0.05em] text-ink-soft">{t("deviceModel")}</div>
                  <div className="text-ink">{house.device_model || "-"}</div>
                </div>
                <div>
                  <div className="mb-1 text-[11px] uppercase tracking-[0.05em] text-ink-soft">{t("serialNumber")}</div>
                  <div className="text-ink">{house.serial_number}</div>
                </div>
                <div>
                  <div className="mb-1 text-[11px] uppercase tracking-[0.05em] text-ink-soft">{t("installDate")}</div>
                  <div className="text-ink">{house.install_date || "-"}</div>
                </div>
              </div>
            </div>

            <div className="rounded-control border border-line bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-base font-semibold text-ink">{t("registeredAccessories")}</h3>
              {house.accessories && house.accessories.length > 0 ? (
                <ul className="space-y-2">
                  {house.accessories.map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2 rounded-control border border-line bg-mist px-3.5 py-2.5 text-sm text-ink"
                    >
                      <Icon name="check" style={{ fontSize: 14, color: "#16a34a" }} />
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-ink-soft">{t("noAccessories")}</p>
              )}
            </div>

            <p className="mt-6 text-[11.5px] text-ink-soft">
              * {t("mockNotice")}
            </p>
          </>
        )}
      </div>
      </div>
    </div>
  );
}
