import { BrowserRouter, Routes, Route } from "react-router-dom";
import { BoothListPage } from "@/pages/BoothListPage";
import { BoothDetailPage } from "@/pages/BoothDetailPage";
import { StatisticsPage } from "@/pages/StatisticsPage";
import { OperationLogPage } from "@/pages/OperationLogPage";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<BoothListPage />} />
        <Route path="/statistics" element={<StatisticsPage />} />
        <Route path="/operation-logs" element={<OperationLogPage />} />
        <Route path="/booths/:id" element={<BoothDetailPage />} />
      </Routes>
    </BrowserRouter>
  );
}
