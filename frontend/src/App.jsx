import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthPage from "./pages/authPage";
import NotFound from "./pages/notFound";
import DashboardPage from "./pages/dashboard";
import AdminPage from "./pages/adminPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/admin" element={<AdminPage />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
