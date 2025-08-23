import { atom } from 'jotai';
import type { 
  Facility, 
  RegisteredLocation, 
  MapSettings,
  LocationType 
} from '@/types/facility';

/**
 * 現在の位置情報
 */
export interface CurrentPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

/**
 * マップの中心座標とズームレベル
 */
export interface MapView {
  center: [number, number];
  zoom: number;
}

/**
 * 施設データを保持するAtom
 */
export const facilitiesAtom = atom<Facility[]>([]);

/**
 * 登録地点を保持するAtom
 */
export const registeredLocationsAtom = atom<RegisteredLocation[]>([]);

/**
 * 現在の位置情報を保持するAtom
 */
export const currentPositionAtom = atom<CurrentPosition | null>(null);

/**
 * 最終オンライン位置を保持するAtom
 */
export const lastOnlinePositionAtom = atom<CurrentPosition | null>(null);

/**
 * マップの表示設定を保持するAtom
 */
export const mapSettingsAtom = atom<MapSettings>({
  showHydrants: true,
  showWaterSupplies: true,
  showWiFiSpots: true,
  showEvacuationSites: true,
  showShelters: true,
  showUserLocations: true,
  offlineMode: false,
});

/**
 * マップの表示状態を保持するAtom
 */
export const mapViewAtom = atom<MapView>({
  center: [35.6762, 139.6503], // 東京都庁の座標
  zoom: 11,
});

/**
 * 選択中の施設を保持するAtom
 */
export const selectedFacilityAtom = atom<Facility | null>(null);

/**
 * 位置情報追跡の有効/無効を保持するAtom
 */
export const isTrackingLocationAtom = atom<boolean>(false);

/**
 * フィルター済みの施設データを返すAtom
 */
export const filteredFacilitiesAtom = atom((get) => {
  const facilities = get(facilitiesAtom);
  const settings = get(mapSettingsAtom);
  
  return facilities.filter((facility) => {
    switch (facility.type) {
      case 'hydrant':
        return settings.showHydrants;
      case 'water_supply':
        return settings.showWaterSupplies;
      case 'wifi':
        return settings.showWiFiSpots;
      case 'evacuation':
        return settings.showEvacuationSites;
      case 'shelter':
        return settings.showShelters;
      default:
        return true;
    }
  });
});

/**
 * 距離計算ヘルパー関数（ハバーサイン公式）
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // 地球の半径（km）
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * 最寄りの施設を検索するAtom
 */
export const nearestFacilitiesAtom = atom((get) => {
  const facilities = get(filteredFacilitiesAtom);
  const currentPosition = get(currentPositionAtom);
  const registeredLocations = get(registeredLocationsAtom);
  
  if (!currentPosition && registeredLocations.length === 0) {
    return facilities;
  }
  
  // 基準となる位置を決定（現在地優先）
  const referencePosition = currentPosition || {
    latitude: registeredLocations[0]?.latitude || 35.6762,
    longitude: registeredLocations[0]?.longitude || 139.6503,
  };
  
  // 距離でソート
  return [...facilities].sort((a, b) => {
    const distA = calculateDistance(
      referencePosition.latitude,
      referencePosition.longitude,
      a.latitude,
      a.longitude
    );
    const distB = calculateDistance(
      referencePosition.latitude,
      referencePosition.longitude,
      b.latitude,
      b.longitude
    );
    return distA - distB;
  });
});