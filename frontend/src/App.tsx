import { BrowserRouter, Routes, Route } from "react-router-dom";
import { BoothListPage } from "@/pages/BoothListPage";
import { BoothDetailPage } from "@/pages/BoothDetailPage";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<BoothListPage />} />
        <Route path="/booths/:id" element={<BoothDetailPage />} />
      </Routes>
    </BrowserRouter>
  );
}
