import { BasicLayout } from "@/components/layouts/basic-layout";
import { EvacuationMap } from "@/components/shared/ui-parts/evacuation-map";
import { MapFilter } from "@/components/shared/ui-parts/map-filter";
import { MobileMapFilter } from "@/components/shared/ui-parts/mobile-map-filter";
import { SearchBox } from "@/components/shared/ui-parts/search-box";
import { LocationRegister } from "@/components/shared/ui-parts/location-register";
import { EvacuationGuide } from "@/components/shared/ui-parts/evacuation-guide";
import { useIsMobile } from "@/hooks/use-mobile";

/**
 * エントリーポイントとなる Top Page
 */
export const HomePage = () => {
  const isMobile = useIsMobile();

  return (
    <BasicLayout>
      <section className="w-full h-full relative">
        {/* マップ表示 */}
        <EvacuationMap />

        {/* Mobile版: SearchBox */}
        {isMobile && <SearchBox />}

        {/* Desktop版: フィルターパネル */}
        {!isMobile && <MapFilter />}

        {/* Mobile版: フィルターパネル */}
        {isMobile && <MobileMapFilter />}

        {/* 地点登録: 自宅/会社の地点を登録する */}
        <LocationRegister />

        {/* 避難所案内 */}
        {!isMobile && <EvacuationGuide />}
      </section>
    </BasicLayout>
  );
};
