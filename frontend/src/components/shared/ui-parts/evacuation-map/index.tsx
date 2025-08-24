import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useAtom, useAtomValue } from "jotai";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  facilitiesAtom,
  currentPositionAtom,
  mapViewAtom,
  filteredFacilitiesAtom,
  selectedFacilityAtom,
  isTrackingLocationAtom,
  registeredLocationsAtom,
} from "@/stores/map";
import { FacilityType, LocationType } from "@/types/facility";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/shared/ui-elements/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileBtnArea } from "../mobile-btn-area";

// Leafletのデフォルトアイコンの問題を修正
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

/**
 * 施設タイプごとのアイコンファイルパスを取得
 */
const getFacilityIconPath = (type: FacilityType): string => {
  const iconPaths = {
    [FacilityType.HYDRANT]: "/icon/ピン=消化器.svg",
    [FacilityType.WATER_SUPPLY]: "/icon/ピン=給水所.svg",
    [FacilityType.WIFI]: "/icon/ピン=Wi-Fi.svg",
    [FacilityType.EVACUATION]: "/icon/ピン=避難所.svg",
    [FacilityType.SHELTER]: "/icon/ピン=緊急(一時)避難.svg",
  };
  return iconPaths[type] || "/icon/ピン=避難所.svg";
};

/**
 * 施設タイプごとのアイコンを作成
 */
const createFacilityIcon = (type: FacilityType): L.Icon => {
  const iconPath = getFacilityIconPath(type);

  return L.icon({
    iconUrl: iconPath,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
    className: "facility-icon",
  });
};

/**
 * 現在地アイコンを作成
 */
const currentLocationIcon = L.divIcon({
  html: `
    <div style="position: relative;">
      <!-- 外側の脈動する円 -->
      <div style="
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 40px;
        height: 40px;
        background: rgba(37, 99, 235, 0.2);
        border-radius: 50%;
        animation: pulse 2s infinite;
      "></div>
      <!-- メインの現在地アイコン -->
      <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="
        position: relative;
        z-index: 2;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
      ">
        <circle cx="12" cy="12" r="8" fill="#2563eb" stroke="white" stroke-width="2"/>
        <circle cx="12" cy="12" r="3" fill="white"/>
      </svg>
    </div>
    <style>
      @keyframes pulse {
        0% {
          transform: translate(-50%, -50%) scale(0.8);
          opacity: 1;
        }
        100% {
          transform: translate(-50%, -50%) scale(2);
          opacity: 0;
        }
      }
    </style>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  className: "current-location-icon",
});

/**
 * 登録地点タイプごとのアイコンファイルパスを取得
 */
const getLocationIconPath = (type: LocationType): string => {
  const iconPaths = {
    [LocationType.HOME]: "/icon/ピン=自宅.svg",
    [LocationType.OFFICE]: "/icon/ピン=会社.svg",
    [LocationType.CURRENT]: "/icon/ピン=緊急(一時)避難.svg", // 現在地用のデフォルト
    [LocationType.LAST_ONLINE]: "/icon/ピン=緊急(一時)避難.svg", // 最終オンライン地点用のデフォルト
  };
  return iconPaths[type] || "/icon/ピン=自宅.svg";
};

/**
 * 登録地点用のアイコンを作成
 */
const createLocationIcon = (type: LocationType): L.Icon => {
  const iconPath = getLocationIconPath(type);

  return L.icon({
    iconUrl: iconPath,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
    className: "location-icon",
  });
};

/**
 * マップの位置を更新するコンポーネント
 */
function MapController() {
  const map = useMap();
  const [mapView] = useAtom(mapViewAtom);

  useEffect(() => {
    map.setView(mapView.center, mapView.zoom);
  }, [map, mapView]);

  // マップの初期化時にリサイズを実行
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
      console.log("マップリサイズ実行");
    }, 100);

    return () => clearTimeout(timer);
  }, [map]);

  return null;
}

/**
 * 避難マップコンポーネント
 */
export const EvacuationMap = () => {
  const [, setFacilities] = useAtom(facilitiesAtom);
  const filteredFacilities = useAtomValue(filteredFacilitiesAtom);
  const [currentPosition, setCurrentPosition] = useAtom(currentPositionAtom);
  const [mapView, setMapView] = useAtom(mapViewAtom);
  const [, setSelectedFacility] = useAtom(selectedFacilityAtom);
  const [isTracking, setIsTracking] = useAtom(isTrackingLocationAtom);
  const [registeredLocations, setRegisteredLocations] = useAtom(
    registeredLocationsAtom
  );
  const watchIdRef = useRef<number | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // 施設データの読み込み
  useEffect(() => {
    const loadFacilities = async () => {
      try {
        const response = await fetch("/data/facilities.json");
        const data = await response.json();
        setFacilities(data);
      } catch (error) {
        console.error("施設データの読み込みエラー:", error);
      }
    };
    loadFacilities();
  }, [setFacilities]);

  // 登録地点の読み込み
  useEffect(() => {
    const savedLocations = localStorage.getItem("registeredLocations");
    if (savedLocations) {
      try {
        const locations = JSON.parse(savedLocations);
        setRegisteredLocations(locations);
      } catch (error) {
        console.error("登録地点の読み込みエラー:", error);
      }
    }
  }, [setRegisteredLocations]);

  // 位置情報の取得
  useEffect(() => {
    if (!isTracking) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    // 位置情報の取得
    if ("geolocation" in navigator) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const newPosition = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          };
          setCurrentPosition(newPosition);

          // 初回取得時はマップを現在地に移動
          if (!currentPosition) {
            setMapView({
              center: [newPosition.latitude, newPosition.longitude],
              zoom: 15,
            });
          }
        },
        (error) => {
          console.error("位置情報の取得エラー:", error);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      );
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [isTracking, currentPosition, setCurrentPosition, setMapView]);

  // 現在地を一回だけ取得する関数
  const handleGetCurrentLocation = async () => {
    if (!navigator.geolocation) {
      alert("お使いのブラウザは位置情報をサポートしていません");
      return;
    }

    setIsGettingLocation(true);

    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          });
        }
      );

      const newPosition = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp,
      };

      setCurrentPosition(newPosition);

      // マップを現在地に移動
      setMapView({
        center: [newPosition.latitude, newPosition.longitude],
        zoom: 16,
      });

      console.log("現在地を取得しました:", newPosition);
    } catch (error) {
      console.error("位置情報の取得エラー:", error);

      let errorMessage = "位置情報の取得に失敗しました。";
      if (error instanceof GeolocationPositionError) {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage =
              "位置情報の使用が拒否されています。ブラウザの設定を確認してください。";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "位置情報が利用できません。";
            break;
          case error.TIMEOUT:
            errorMessage = "位置情報の取得がタイムアウトしました。";
            break;
        }
      }
      alert(errorMessage);
    } finally {
      setIsGettingLocation(false);
    }
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

  const isMobile = useIsMobile();

  return (
    <div className="w-full h-full relative" style={{ minHeight: "850px" }}>
      <MapContainer
        center={mapView.center}
        zoom={mapView.zoom}
        className="w-full h-full"
        zoomControl={false}
        style={{ height: "100%", width: "100%", minHeight: "850px" }}
        whenReady={() => {
          console.log("マップ作成完了");
        }}
        preferCanvas={false}
        attributionControl={true}
      >
        <MapController />

        {/* オンラインタイル（CartoDB Positron - 軽量で確実） */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          maxZoom={19}
          minZoom={1}
          subdomains={["a", "b", "c", "d"]}
          eventHandlers={{
            loading: () => console.log("タイル読み込み開始"),
            load: () => console.log("タイル読み込み完了"),
            tileerror: (error: any) => console.error("タイルエラー:", error),
          }}
        />

        {/* 代替タイル - 必要に応じてコメントアウトを外してください。

        CartoDB Positron (軽量で高速)
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          maxZoom={19}
          subdomains="abcd"
        />

        GSI標準地図
        <TileLayer
          attribution='&copy; <a href="https://maps.gsi.go.jp/development/ichiran.html">国土地理院</a>'
          url="https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png"
          maxZoom={18}
          minZoom={5}
        />
        */}

        {/* 施設マーカー */}
        {filteredFacilities.map((facility) => (
          <Marker
            key={facility.id}
            position={[facility.latitude, facility.longitude]}
            icon={createFacilityIcon(facility.type)}
            eventHandlers={{
              click: () => setSelectedFacility(facility),
            }}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-sm mb-1">{facility.name}</h3>
                <p className="text-xs text-gray-600 mb-1">
                  {getFacilityTypeName(facility.type)}
                </p>
                {facility.address && (
                  <p className="text-xs text-gray-600">{facility.address}</p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* 現在地マーカー */}
        {currentPosition && (
          <Marker
            position={[currentPosition.latitude, currentPosition.longitude]}
            icon={currentLocationIcon}
          >
            <Popup>
              <div className="p-3">
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-blue-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  現在地
                </h3>
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-gray-600">
                    📍 緯度: {currentPosition.latitude.toFixed(6)}
                  </p>
                  <p className="text-xs text-gray-600">
                    📍 経度: {currentPosition.longitude.toFixed(6)}
                  </p>
                  <p className="text-xs text-gray-600">
                    🎯 精度: ±{Math.round(currentPosition.accuracy)}m
                  </p>
                  <p className="text-xs text-gray-500">
                    🕒{" "}
                    {new Date(currentPosition.timestamp).toLocaleTimeString(
                      "ja-JP"
                    )}
                  </p>
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* 登録地点マーカー */}
        {registeredLocations.map((location) => (
          <Marker
            key={location.id}
            position={[location.latitude, location.longitude]}
            icon={createLocationIcon(location.type)}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-sm">{location.name}</h3>
                <p className="text-xs text-gray-600">
                  {location.type === LocationType.HOME ? "自宅" : "会社"}
                </p>
                {location.address && (
                  <p className="text-xs text-gray-600 mt-1">
                    {location.address}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Mobile版: 現在地/自宅/職場ボタンのエリア */}
      {isMobile && <MobileBtnArea />}

      {/* Desktop版: 現在地/自宅/職場ボタンのエリア */}
      {!isMobile && (
        // {/* 現在地取得ボタン */}
        <div className="absolute bottom-4 right-4 z-[1001] flex flex-col gap-2">
          {/* 現在地に移動ボタン */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleGetCurrentLocation}
                disabled={isGettingLocation}
                className={`p-3 rounded-full shadow-lg transition-colors ${
                  isGettingLocation
                    ? "bg-gray-400 text-white cursor-not-allowed"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                }`}
                aria-label="現在地を取得"
              >
                {isGettingLocation ? (
                  <svg
                    className="w-6 h-6 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                ) : (
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
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {isGettingLocation
                  ? "位置情報を取得中..."
                  : "現在地を取得してマップを移動"}
              </p>
            </TooltipContent>
          </Tooltip>

          {/* 位置情報追跡ボタン */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setIsTracking(!isTracking)}
                className={`p-3 rounded-full shadow-lg transition-colors ${
                  isTracking
                    ? "bg-green-500 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
                aria-label={isTracking ? "位置追跡を停止" : "位置追跡を開始"}
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
                    d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 11.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"
                  />
                </svg>
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {isTracking ? "位置追跡を停止" : "リアルタイムで位置を追跡"}
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      )}
    </div>
  );
};
