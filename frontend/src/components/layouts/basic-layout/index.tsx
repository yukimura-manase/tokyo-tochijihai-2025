import { Fragment, ReactNode } from "react";
import { Header } from "@/components/shared/ui-parts/header";

/**
 * 共通のBasic Layout
 *
 * - Header
 * - Main Area
 */
export const BasicLayout = ({ children }: { children: ReactNode }) => {
  return (
    <Fragment>
      <Header />
      <div className="flex flex-col gap-[50px] h-screen w-full">
        <main className="flex gap-2">{children}</main>
      </div>
    </Fragment>
  );
};
