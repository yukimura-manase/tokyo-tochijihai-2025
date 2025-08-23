/**
 * 施設タイプの定義
 */
export enum FacilityType {
  HYDRANT = 'hydrant',              // 消火栓
  WATER_SUPPLY = 'water_supply',    // 給水拠点
  WIFI = 'wifi',                    // 無料WiFi
  EVACUATION = 'evacuation',        // 避難場所
  SHELTER = 'shelter',              // 都立一時滞在施設
}

/**
 * 基本的な施設情報
 */
export interface BaseFacility {
  id: string;
  type: FacilityType;
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
}

/**
 * 消火栓情報
 */
export interface Hydrant extends BaseFacility {
  type: FacilityType.HYDRANT;
}

/**
 * 給水拠点情報
 */
export interface WaterSupply extends BaseFacility {
  type: FacilityType.WATER_SUPPLY;
  capacity?: number;  // 確保水量（立方メートル）
  imageUrl?: string;
  updatedAt?: string;
}

/**
 * 無料WiFi情報
 */
export interface WiFiSpot extends BaseFacility {
  type: FacilityType.WIFI;
  ssid?: string;
  serviceArea?: string;
  url?: string;
  phone?: string;
}

/**
 * 避難場所情報
 */
export interface EvacuationSite extends BaseFacility {
  type: FacilityType.EVACUATION;
  disasters?: {
    flood?: boolean;          // 洪水
    landslide?: boolean;      // 崖崩れ、土石流及び地滑り
    highTide?: boolean;       // 高潮
    earthquake?: boolean;     // 地震
    tsunami?: boolean;        // 津波
    largeFire?: boolean;      // 大規模な火事
    inlandFlood?: boolean;    // 内水氾濫
    volcano?: boolean;        // 火山現象
  };
  accessibility?: {
    elevator?: boolean;       // エレベーター有/避難スペースが１階
    slope?: boolean;          // スロープ等
    braille?: boolean;        // 点字ブロック
    wheelchairToilet?: boolean; // 車椅子使用者対応トイレ
  };
}

/**
 * 都立一時滞在施設情報
 */
export interface TemporaryShelter extends BaseFacility {
  type: FacilityType.SHELTER;
}

/**
 * すべての施設タイプのユニオン型
 */
export type Facility = Hydrant | WaterSupply | WiFiSpot | EvacuationSite | TemporaryShelter;

/**
 * 地点登録タイプ
 */
export enum LocationType {
  HOME = 'home',       // 自宅
  OFFICE = 'office',   // 会社
  CURRENT = 'current', // 現在地
  LAST_ONLINE = 'last_online', // 最終オンライン地点
}

/**
 * 登録地点情報
 */
export interface RegisteredLocation {
  id: string;
  userId: string;
  type: LocationType;
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * マップ表示設定
 */
export interface MapSettings {
  showHydrants: boolean;
  showWaterSupplies: boolean;
  showWiFiSpots: boolean;
  showEvacuationSites: boolean;
  showShelters: boolean;
  showUserLocations: boolean;
  offlineMode: boolean;
}