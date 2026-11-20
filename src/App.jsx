import { useEffect, useRef, useState } from "react";
import { checkAuthSession, hasExpiredSession } from "./api/auth";
import { useLanguage } from "./i18n.jsx";
import { createHashRouter, Navigate, Outlet, RouterProvider, useNavigate } from "react-router-dom";
import IconSprite from "./components/IconSprite";
import Landing from "./pages/Landing";
import CustomerForm, { FarmEditPage } from "./pages/CustomerForm";
import AdminPage from "./pages/AdminPage";
import Home from "./pages/Home";
import AccountPage from "./pages/AccountPage";

function AccountChangedDialog() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [changed, setChanged] = useState(false);
  const [expired, setExpired] = useState(hasExpiredSession);
  const dialogRef = useRef(null);

  useEffect(() => {
    const onChange = () => setChanged(true);
    const onExpired = () => setExpired(true);
    window.addEventListener("auth:changed", onChange);
    window.addEventListener("auth:expired", onExpired);
    if (hasExpiredSession()) onExpired();
    if (!checkAuthSession()) onChange();
    return () => {
      window.removeEventListener("auth:changed", onChange);
      window.removeEventListener("auth:expired", onExpired);
    };
  }, []);

  useEffect(() => {
    if (!changed && !expired) return;
    const dialog = dialogRef.current;
    dialog.showModal();
    return () => dialog.close();
  }, [changed, expired]);

  if (!changed && !expired) return null;
  return (
    <dialog ref={dialogRef} aria-labelledby="account-changed-title" onCancel={(event) => event.preventDefault()}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl border border-line bg-white p-6 text-ink shadow-xl backdrop:bg-ink/45">
      <h2 id="account-changed-title" className="text-lg font-bold">{t(changed ? "accountChangedTitle" : "sessionExpiredTitle")}</h2>
      <p className="mt-2 text-sm text-ink-soft">{t(changed ? "accountChangedMessage" : "sessionExpiredMessage")}</p>
      <button type="button" className="mt-5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white"
        onClick={() => {
          if (changed) {
            window.location.reload();
          } else {
            setExpired(false);
            navigate("/", { replace: true });
          }
        }}>
        {t(changed ? "accountChangedReload" : "signIn")}
      </button>
    </dialog>
  );
}

const router = createHashRouter([{
  element: <><IconSprite /><Outlet /><AccountChangedDialog /></>,
  children: [
    { path: "/", element: <Landing /> },
    { path: "/customer", element: <CustomerForm /> },
    { path: "/customer/edit/:farmId", element: <FarmEditPage /> },
    { path: "/admin", element: <AdminPage /> },
    { path: "/admin/farms/:farmId/edit", element: <FarmEditPage isAdmin /> },
    { path: "/home", element: <Home /> },
    { path: "/home/house/:index", element: <Navigate to="/home" replace /> },
    { path: "/home/farm", element: <Navigate to="/home" replace /> },
    { path: "/account", element: <AccountPage /> },
    { path: "*", element: null },
  ],
}]);

export default function App() {
  return <RouterProvider router={router} />;
}
