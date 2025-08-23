import { useState } from "react";
import { BasicLayout } from "@/components/layouts/basic-layout";
import { EvacuationMap } from "@/components/shared/ui-parts/evacuation-map";
import { MapFilter } from "@/components/shared/ui-parts/map-filter";
import { FacilityList } from "@/components/shared/ui-parts/facility-list";
import { LocationRegister } from "@/components/shared/ui-parts/location-register";
import { EvacuationGuide } from "@/components/shared/ui-parts/evacuation-guide";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/shared/ui-elements/tooltip";

/**
 * エントリーポイントとなる Top Page
 */
export const HomePage = () => {
  const [showList, setShowList] = useState(false);

  return (
    <BasicLayout>
      <section className="w-full h-full relative">
        {/* マップ表示 */}
        <EvacuationMap />

        {/* フィルターパネル */}
        <MapFilter />

        {/* 地点登録 */}
        <LocationRegister />

        {/* 避難所案内 */}
        <EvacuationGuide />

        {/* 施設リストボタン */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setShowList(!showList)}
              className="absolute top-4 right-4 z-[1001] bg-white rounded-lg shadow-lg p-3 hover:bg-gray-100 transition-colors"
              aria-label="施設リストを表示"
            >
              <svg
                className="w-6 h-6 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>近くの施設一覧を表示</p>
          </TooltipContent>
        </Tooltip>

        {/* 施設リスト */}
        <FacilityList isOpen={showList} onOpenChange={setShowList} />
      </section>
    </BasicLayout>
  );
};
