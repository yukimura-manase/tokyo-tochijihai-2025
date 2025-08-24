import { useState } from "react";
import { useAtom, useAtomValue } from "jotai";
import {
  currentPositionAtom,
  registeredLocationsAtom,
  nearestFacilitiesAtom,
  mapViewAtom,
  calculateDistance,
} from "@/stores/map";
import { FacilityType, LocationType } from "@/types/facility";
import { Button } from "@/components/shared/ui-elements/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/shared/ui-elements/sheet";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/shared/ui-elements/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";

/**
 * 避難所案内コンポーネント
 */
export const EvacuationGuide = () => {
  const currentPosition = useAtomValue(currentPositionAtom);
  const registeredLocations = useAtomValue(registeredLocationsAtom);
  const nearestFacilities = useAtomValue(nearestFacilitiesAtom);
  const [, setMapView] = useAtom(mapViewAtom);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStartPoint, setSelectedStartPoint] = useState<
    "current" | "home" | "office"
  >("current");
  const [selectedFacilityType, setSelectedFacilityType] = useState<
    FacilityType | "all"
  >("all");

  // 開始地点の座標を取得
  const getStartPointCoords = () => {
    if (selectedStartPoint === "current" && currentPosition) {
      return {
        latitude: currentPosition.latitude,
        longitude: currentPosition.longitude,
        name: "現在地",
      };
    }

    const locationType =
      selectedStartPoint === "home" ? LocationType.HOME : LocationType.OFFICE;
    const location = registeredLocations.find(
      (loc) => loc.type === locationType
    );

    if (location) {
      return {
        latitude: location.latitude,
        longitude: location.longitude,
        name: location.name,
      };
    }

    return null;
  };

  // フィルター済みの最寄り施設を取得
  const getFilteredNearestFacilities = () => {
    const startPoint = getStartPointCoords();
    if (!startPoint) return [];

    let facilities =
      selectedFacilityType === "all"
        ? nearestFacilities
        : nearestFacilities.filter((f) => f.type === selectedFacilityType);

    // 開始地点からの距離で再ソート
    return facilities
      .map((facility) => ({
        ...facility,
        distance: calculateDistance(
          startPoint.latitude,
          startPoint.longitude,
          facility.latitude,
          facility.longitude
        ),
      }))
      .sort((a, b) => a.distance - b.distance);
  };

  // 方向を計算（簡易的な8方向）
  const getDirection = (
    fromLat: number,
    fromLon: number,
    toLat: number,
    toLon: number
  ): string => {
    const latDiff = toLat - fromLat;
    const lonDiff = toLon - fromLon;

    const angle = (Math.atan2(lonDiff, latDiff) * 180) / Math.PI;

    if (angle >= -22.5 && angle < 22.5) return "北";
    if (angle >= 22.5 && angle < 67.5) return "北東";
    if (angle >= 67.5 && angle < 112.5) return "東";
    if (angle >= 112.5 && angle < 157.5) return "南東";
    if (angle >= 157.5 || angle < -157.5) return "南";
    if (angle >= -157.5 && angle < -112.5) return "南西";
    if (angle >= -112.5 && angle < -67.5) return "西";
    if (angle >= -67.5 && angle < -22.5) return "北西";

    return "";
  };

  // 施設タイプの日本語名を取得
  const getFacilityTypeName = (type: FacilityType): string => {
    const typeNames = {
      [FacilityType.HYDRANT]: "消火栓",
      [FacilityType.WATER_SUPPLY]: "給水拠点",
      [FacilityType.WIFI]: "無料WiFi",
      [FacilityType.EVACUATION]: "避難場所",
      [FacilityType.SHELTER]: "都立一時滞在施設",
    };
    return typeNames[type] || "施設";
  };

  // 距離の表示形式を整形
  const formatDistance = (distance: number): string => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
  };

  // 歩いた時にかかる時間を計算
  const calculateWalkingTime = (distance: number): string => {
    const walkingSpeed = 5; // 歩行速度（km/h）
    const timeInHours = distance / walkingSpeed;
    const timeInMinutes = timeInHours * 60;

    if (timeInMinutes < 60) {
      return `徒歩約${Math.round(timeInMinutes)}分`;
    } else {
      const hours = Math.floor(timeInMinutes / 60);
      const minutes = Math.round(timeInMinutes % 60);
      if (minutes === 0) {
        return `徒歩約${hours}時間`;
      }
      return `徒歩約${hours}時間${minutes}分`;
    }
  };

  // 施設をクリックした時の処理
  const handleNavigate = (facility: any) => {
    setMapView({
      center: [facility.latitude, facility.longitude],
      zoom: 16,
    });
    setIsOpen(false);
  };

  const startPoint = getStartPointCoords();
  const filteredFacilities = getFilteredNearestFacilities();
  const homeLocation = registeredLocations.find(
    (loc) => loc.type === LocationType.HOME
  );
  const officeLocation = registeredLocations.find(
    (loc) => loc.type === LocationType.OFFICE
  );

  const isMobile = useIsMobile();

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <SheetTrigger asChild>
            <button
              className="absolute top-36 right-4 z-[1001] bg-blue-500 text-white rounded-lg shadow-lg p-3 hover:bg-blue-600 transition-colors"
              aria-label="避難所案内"
              style={{
                top: isMobile ? "222px" : "144px",
              }}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            </button>
          </SheetTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>最寄りの避難施設への案内を表示</p>
        </TooltipContent>
      </Tooltip>

      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={
          isMobile
            ? "h-[60vh] w-full overflow-y-auto rounded-t-lg p-2"
            : "w-[400px] md:w-[540px] overflow-y-auto"
        }
      >
        <SheetHeader className={isMobile ? "pb-2" : ""}>
          {isMobile && (
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
          )}
          <SheetTitle className={isMobile ? "text-lg" : ""}>
            最寄りの避難施設案内
          </SheetTitle>
          <SheetDescription className={isMobile ? "text-sm" : ""}>
            選択した地点から最寄りの施設への案内を表示します
          </SheetDescription>
        </SheetHeader>

        <div className={`${isMobile ? "mt-4" : "mt-6"} space-y-4`}>
          {/* 出発地点選択 */}
          <div>
            <label className="block text-sm font-medium mb-2">出発地点</label>
            <div
              className={`flex ${
                isMobile ? "flex-row" : "flex-col sm:flex-row"
              } gap-2`}
            >
              <Button
                type="button"
                variant={
                  selectedStartPoint === "current" ? "default" : "outline"
                }
                onClick={() => setSelectedStartPoint("current")}
                disabled={!currentPosition}
                className={`flex-1 ${
                  isMobile ? "text-xs px-2 py-1" : "text-sm"
                }`}
              >
                現在地
              </Button>
              <Button
                type="button"
                variant={selectedStartPoint === "home" ? "default" : "outline"}
                onClick={() => setSelectedStartPoint("home")}
                disabled={!homeLocation}
                className={`flex-1 ${
                  isMobile ? "text-xs px-2 py-1" : "text-sm"
                }`}
              >
                自宅
              </Button>
              <Button
                type="button"
                variant={
                  selectedStartPoint === "office" ? "default" : "outline"
                }
                onClick={() => setSelectedStartPoint("office")}
                disabled={!officeLocation}
                className={`flex-1 ${
                  isMobile ? "text-xs px-2 py-1" : "text-sm"
                }`}
              >
                会社
              </Button>
            </div>
          </div>

          {/* 施設タイプフィルター */}
          <div>
            <label className="block text-sm font-medium mb-2">施設タイプ</label>
            <select
              value={selectedFacilityType}
              onChange={(e) =>
                setSelectedFacilityType(e.target.value as FacilityType | "all")
              }
              className={`w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isMobile ? "px-2 py-1 text-sm" : "px-3 py-2"
              }`}
            >
              <option value="all">すべて</option>
              <option value={FacilityType.SHELTER}>都立一時滞在施設</option>
              <option value={FacilityType.EVACUATION}>避難場所</option>
              <option value={FacilityType.WATER_SUPPLY}>給水拠点</option>
              <option value={FacilityType.WIFI}>無料WiFi</option>
              <option value={FacilityType.HYDRANT}>消火栓</option>
            </select>
          </div>

          {/* 最寄り施設リスト */}
          {startPoint ? (
            <div>
              <h3 className="font-medium text-sm mb-3">
                {startPoint.name}から近い施設（上位10件）
              </h3>
              <div className="space-y-2">
                {filteredFacilities.slice(0, 10).map((facility) => {
                  const direction = getDirection(
                    startPoint.latitude,
                    startPoint.longitude,
                    facility.latitude,
                    facility.longitude
                  );

                  return (
                    <div
                      key={facility.id}
                      className={`border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${
                        isMobile ? "p-2" : "p-3"
                      }`}
                      onClick={() => handleNavigate(facility)}
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm break-words">
                            {facility.name}
                          </h4>
                          <div className="flex flex-col gap-1 mt-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs bg-gray-100 px-2 py-1 rounded whitespace-nowrap">
                                {getFacilityTypeName(facility.type)}
                              </span>
                              <span className="text-xs text-blue-600 font-medium whitespace-nowrap">
                                {direction}へ約
                                {formatDistance(facility.distance)}
                              </span>
                            </div>
                            <span className="text-xs text-green-600 font-medium">
                              {calculateWalkingTime(facility.distance)}
                            </span>
                          </div>
                          {facility.address && (
                            <p className="text-xs text-gray-600 mt-1 break-words">
                              {facility.address}
                            </p>
                          )}
                        </div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              className="self-start sm:ml-2 p-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex-shrink-0"
                              aria-label="マップで表示"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M17.8 19.2L16 11l3.5-3.5C21.08 6.03 19.05 4 17 4s-4 2-4 4c0-2-2-4-4-4S4.92 6.03 6.5 7.5L10 11l-1.8 8.2L13 17l4.8 2.2z"
                                />
                              </svg>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>マップで場所を確認</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredFacilities.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">
                  該当する施設が見つかりませんでした
                </p>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-sm text-center py-4">
              出発地点を選択してください
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
