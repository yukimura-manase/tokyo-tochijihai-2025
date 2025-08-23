import { useAtom, useAtomValue } from "jotai";
import {
  nearestFacilitiesAtom,
  selectedFacilityAtom,
  mapViewAtom,
  currentPositionAtom,
  calculateDistance,
} from "@/stores/map";
import { FacilityType } from "@/types/facility";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/shared/ui-elements/sheet";

/**
 * 施設リストコンポーネント
 */
export const FacilityList = ({
  isOpen = false,
  onOpenChange,
}: {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}) => {
  const nearestFacilities = useAtomValue(nearestFacilitiesAtom);
  const currentPosition = useAtomValue(currentPositionAtom);
  const [selectedFacility, setSelectedFacility] = useAtom(selectedFacilityAtom);
  const [, setMapView] = useAtom(mapViewAtom);

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

  // 施設タイプごとの色を取得
  const getFacilityColor = (type: FacilityType): string => {
    const colors = {
      [FacilityType.HYDRANT]: "bg-red-100 text-red-800",
      [FacilityType.WATER_SUPPLY]: "bg-blue-100 text-blue-800",
      [FacilityType.WIFI]: "bg-green-100 text-green-800",
      [FacilityType.EVACUATION]: "bg-orange-100 text-orange-800",
      [FacilityType.SHELTER]: "bg-purple-100 text-purple-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  // 施設をクリックした時の処理
  const handleFacilityClick = (facility: any) => {
    setSelectedFacility(facility);
    setMapView({
      center: [facility.latitude, facility.longitude],
      zoom: 16,
    });
  };

  // 距離の表示形式を整形
  const formatDistance = (distance: number): string => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="w-[350px] sm:w-[400px] overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle>近くの施設</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-2">
          {nearestFacilities.length === 0 ? (
            <p className="text-gray-500 text-sm">施設データを読み込み中...</p>
          ) : (
            nearestFacilities.slice(0, 50).map((facility) => {
              const distance = currentPosition
                ? calculateDistance(
                    currentPosition.latitude,
                    currentPosition.longitude,
                    facility.latitude,
                    facility.longitude
                  )
                : null;

              return (
                <div
                  key={facility.id}
                  onClick={() => handleFacilityClick(facility)}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                    selectedFacility?.id === facility.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{facility.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`inline-block px-2 py-1 text-xs rounded-full ${getFacilityColor(
                            facility.type
                          )}`}
                        >
                          {getFacilityTypeName(facility.type)}
                        </span>
                        {distance && (
                          <span className="text-xs text-gray-600">
                            約{formatDistance(distance)}
                          </span>
                        )}
                      </div>
                      {facility.address && (
                        <p className="text-xs text-gray-600 mt-1">
                          {facility.address}
                        </p>
                      )}
                    </div>
                    <button
                      className="ml-2 p-1 hover:bg-gray-200 rounded"
                      aria-label="地図で表示"
                    >
                      <svg
                        className="w-4 h-4 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {nearestFacilities.length > 50 && (
          <p className="text-xs text-gray-500 text-center mt-4">
            上位50件を表示中（全{nearestFacilities.length}件）
          </p>
        )}
      </SheetContent>
    </Sheet>
  );
};
