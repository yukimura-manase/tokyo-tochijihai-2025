import HomePage from "@/pages/home";
import NotFoundPage from "@/pages/not-found";
import { BrowserRouter, Route, Routes } from "react-router";

/**
 * ルーティングを管理するコンポーネント
 */
export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* ホームページ */}
        <Route path="/" element={<HomePage />} />

        {/* 404ページ - 存在しないパスに対応 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
};
