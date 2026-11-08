import { HashRouter, Routes, Route } from "react-router-dom";
import IconSprite from "./components/IconSprite";
import Landing from "./pages/Landing";
import CustomerForm from "./pages/CustomerForm";
import AdminPage from "./pages/AdminPage";
import Home from "./pages/Home";
import AccountPage from "./pages/AccountPage";
import HouseDetail from "./pages/HouseDetail";
import FarmDetail from "./pages/FarmDetail";

export default function App() {
  return (
    <HashRouter>
      <IconSprite />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/customer" element={<CustomerForm />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/home" element={<Home />} />
        <Route path="/home/house/:index" element={<HouseDetail />} />
        <Route path="/home/farm" element={<FarmDetail />} />
        <Route path="/account" element={<AccountPage />} />
      </Routes>
    </HashRouter>
  );
}
