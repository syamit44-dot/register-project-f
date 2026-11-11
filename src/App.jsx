import { createHashRouter, Outlet, RouterProvider } from "react-router-dom";
import IconSprite from "./components/IconSprite";
import Landing from "./pages/Landing";
import CustomerForm, { FarmEditPage } from "./pages/CustomerForm";
import AdminPage from "./pages/AdminPage";
import Home from "./pages/Home";
import AccountPage from "./pages/AccountPage";
import HouseDetail from "./pages/HouseDetail";
import FarmDetail from "./pages/FarmDetail";

const router = createHashRouter([{
  element: <><IconSprite /><Outlet /></>,
  children: [
    { path: "/", element: <Landing /> },
    { path: "/customer", element: <CustomerForm /> },
    { path: "/customer/edit/:farmId", element: <FarmEditPage /> },
    { path: "/admin", element: <AdminPage /> },
    { path: "/admin/farms/:farmId/edit", element: <FarmEditPage isAdmin /> },
    { path: "/home", element: <Home /> },
    { path: "/home/house/:index", element: <HouseDetail /> },
    { path: "/home/farm", element: <FarmDetail /> },
    { path: "/account", element: <AccountPage /> },
    { path: "*", element: null },
  ],
}]);

export default function App() {
  return <RouterProvider router={router} />;
}
