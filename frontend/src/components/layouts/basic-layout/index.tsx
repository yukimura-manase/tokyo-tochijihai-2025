import { Fragment, ReactNode } from "react";
import { Header } from "@/components/shared/ui-parts/header";
import { useIsMobile } from "@/hooks/use-mobile";

/**
 * 共通のBasic Layout
 *
 * - Header (デスクトップ版のみ)
 * - Main Area
 */
export const BasicLayout = ({ children }: { children: ReactNode }) => {
  const isMobile = useIsMobile();

  return (
    <Fragment>
      {/* デスクトップ版のみHeaderを表示 */}
      {!isMobile && <Header />}

      <div
        className={`flex flex-col h-screen w-full ${
          !isMobile ? "gap-[50px]" : ""
        }`}
      >
        <main className={`${!isMobile ? "flex gap-2" : "flex-1"}`}>
          {children}
        </main>
      </div>
    </Fragment>
  );
};
