import { BrowserRouter, Routes, Route } from "react-router-dom";
import MusicPlayer from "./pages/musicPlayer";
import AuthPage from "./pages/authPage";
import NotFound from "./pages/notFound";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/dashboard" element={<MusicPlayer />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
