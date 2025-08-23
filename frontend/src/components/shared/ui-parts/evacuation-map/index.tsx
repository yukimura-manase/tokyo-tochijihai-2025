import { useEffect, useRef } from "react";
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

// Leafletのデフォルトアイコンの問題を修正
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

/**
 * 施設タイプごとのアイコンを作成
 */
const createFacilityIcon = (type: FacilityType): L.DivIcon => {
  const iconColors = {
    [FacilityType.HYDRANT]: "#dc2626", // 赤
    [FacilityType.WATER_SUPPLY]: "#2563eb", // 青
    [FacilityType.WIFI]: "#16a34a", // 緑
    [FacilityType.EVACUATION]: "#ea580c", // オレンジ
    [FacilityType.SHELTER]: "#7c3aed", // 紫
  };

  const color = iconColors[type] || "#6b7280";

  const svgIcon = `
    <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.5 0C5.6 0 0 5.6 0 12.5C0 21.9 12.5 41 12.5 41S25 21.9 25 12.5C25 5.6 19.4 0 12.5 0Z"
            fill="${color}" stroke="white" stroke-width="1"/>
      <circle cx="12.5" cy="12.5" r="5" fill="white"/>
    </svg>
  `;

  return L.divIcon({
    html: svgIcon,
    iconSize: [25, 41],
    iconAnchor: [12.5, 41],
    popupAnchor: [0, -41],
    className: "custom-div-icon",
  });
};

/**
 * 現在地アイコンを作成
 */
const currentLocationIcon = L.divIcon({
  html: `
    <svg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
      <circle cx="15" cy="15" r="8" fill="#2563eb" stroke="white" stroke-width="2"/>
      <circle cx="15" cy="15" r="3" fill="white"/>
    </svg>
  `,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  className: "current-location-icon",
});

/**
 * 登録地点用のアイコンを作成
 */
const createLocationIcon = (type: LocationType): L.DivIcon => {
  const iconSymbols = {
    [LocationType.HOME]: "🏠",
    [LocationType.OFFICE]: "🏢",
    [LocationType.CURRENT]: "📍",
    [LocationType.LAST_ONLINE]: "📡",
  };

  const symbol = iconSymbols[type] || "📍";

  const svgIcon = `
    <svg width="30" height="45" viewBox="0 0 30 45" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 0C6.7 0 0 6.7 0 15C0 26.25 15 45 15 45S30 26.25 30 15C30 6.7 23.3 0 15 0Z"
            fill="#059669" stroke="white" stroke-width="1.5"/>
      <foreignObject x="7" y="5" width="16" height="16">
        <div xmlns="http://www.w3.org/1999/xhtml" style="font-size: 14px; text-align: center;">
          ${symbol}
        </div>
      </foreignObject>
    </svg>
  `;

  return L.divIcon({
    html: svgIcon,
    iconSize: [30, 45],
    iconAnchor: [15, 45],
    popupAnchor: [0, -45],
    className: "location-div-icon",
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
  const [facilities, setFacilities] = useAtom(facilitiesAtom);
  const filteredFacilities = useAtomValue(filteredFacilitiesAtom);
  const [currentPosition, setCurrentPosition] = useAtom(currentPositionAtom);
  const [mapView, setMapView] = useAtom(mapViewAtom);
  const [selectedFacility, setSelectedFacility] = useAtom(selectedFacilityAtom);
  const [isTracking, setIsTracking] = useAtom(isTrackingLocationAtom);
  const [registeredLocations, setRegisteredLocations] = useAtom(
    registeredLocationsAtom
  );
  const watchIdRef = useRef<number | null>(null);

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

  return (
    <div className="w-full h-full relative" style={{ minHeight: "1000px" }}>
      <MapContainer
        center={mapView.center}
        zoom={mapView.zoom}
        className="w-full h-full"
        zoomControl={false}
        style={{ height: "100%", width: "100%", minHeight: "1000px" }}
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
              <div className="p-2">
                <h3 className="font-bold text-sm">現在地</h3>
                <p className="text-xs text-gray-600">
                  精度: ±{Math.round(currentPosition.accuracy)}m
                </p>
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

      {/* 位置情報追跡ボタン */}
      <button
        onClick={() => setIsTracking(!isTracking)}
        className={`absolute bottom-4 right-4 z-[1000] p-3 rounded-full shadow-lg transition-colors ${
          isTracking
            ? "bg-blue-500 text-white"
            : "bg-white text-gray-700 hover:bg-gray-100"
        }`}
        aria-label="現在地を追跡"
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
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </button>
    </div>
  );
};
