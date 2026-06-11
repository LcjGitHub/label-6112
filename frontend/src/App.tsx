import { BrowserRouter, Routes, Route } from "react-router-dom";
import { BoothListPage } from "@/pages/BoothListPage";
import { BoothDetailPage } from "@/pages/BoothDetailPage";
import { StatisticsPage } from "@/pages/StatisticsPage";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<BoothListPage />} />
        <Route path="/statistics" element={<StatisticsPage />} />
        <Route path="/booths/:id" element={<BoothDetailPage />} />
      </Routes>
    </BrowserRouter>
  );
}
