import { BoundingBox } from './utils';

export interface AreaConfig {
  name: string;
  boundingBox: BoundingBox;
}

export interface MapSourceConfig {
  name: string;
  urlTemplate: string;
  attribution: string;
  fileExtension: string;
  maxZoom: number;
  minZoom: number;
}

export const AREAS: { [key: string]: AreaConfig } = {
  tokyo_all: {
    name: '東京都全域',
    boundingBox: {
      north: 35.9,
      south: 35.5,
      east: 139.95,
      west: 138.9
    }
  },
  tokyo_23ku: {
    name: '東京23区',
    boundingBox: {
      north: 35.8,
      south: 35.6,
      east: 139.85,
      west: 139.65
    }
  },
  tokyo_central: {
    name: '東京都心部',
    boundingBox: {
      north: 35.72,
      south: 35.65,
      east: 139.8,
      west: 139.7
    }
  },
  tokyo_tama: {
    name: '多摩地域',
    boundingBox: {
      north: 35.8,
      south: 35.6,
      east: 139.65,
      west: 139.2
    }
  },
  custom: {
    name: 'カスタムエリア',
    boundingBox: {
      north: 35.7,
      south: 35.65,
      east: 139.75,
      west: 139.7
    }
  }
};

export const OSM_SOURCES: { [key: string]: MapSourceConfig } = {
  standard: {
    name: 'OpenStreetMap Standard',
    urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors',
    fileExtension: 'png',
    maxZoom: 19,
    minZoom: 0
  },
  humanitarian: {
    name: 'OpenStreetMap Humanitarian',
    urlTemplate: 'https://a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors, Humanitarian OpenStreetMap Team',
    fileExtension: 'png',
    maxZoom: 19,
    minZoom: 0
  }
};

export const GSI_SOURCES: { [key: string]: MapSourceConfig } = {
  std: {
    name: '国土地理院 標準地図',
    urlTemplate: 'https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png',
    attribution: '© 国土地理院',
    fileExtension: 'png',
    maxZoom: 18,
    minZoom: 2
  },
  pale: {
    name: '国土地理院 淡色地図',
    urlTemplate: 'https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png',
    attribution: '© 国土地理院',
    fileExtension: 'png',
    maxZoom: 18,
    minZoom: 2
  },
  blank: {
    name: '国土地理院 白地図',
    urlTemplate: 'https://cyberjapandata.gsi.go.jp/xyz/blank/{z}/{x}/{y}.png',
    attribution: '© 国土地理院',
    fileExtension: 'png',
    maxZoom: 14,
    minZoom: 5
  },
  seamlessphoto: {
    name: '国土地理院 全国最新写真',
    urlTemplate: 'https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg',
    attribution: '© 国土地理院',
    fileExtension: 'jpg',
    maxZoom: 18,
    minZoom: 2
  },
  relief: {
    name: '国土地理院 色別標高図',
    urlTemplate: 'https://cyberjapandata.gsi.go.jp/xyz/relief/{z}/{x}/{y}.png',
    attribution: '© 国土地理院',
    fileExtension: 'png',
    maxZoom: 15,
    minZoom: 5
  },
  disaster: {
    name: '国土地理院 災害時指定緊急避難場所',
    urlTemplate: 'https://cyberjapandata.gsi.go.jp/xyz/skhb/{z}/{x}/{y}.png',
    attribution: '© 国土地理院',
    fileExtension: 'png',
    maxZoom: 18,
    minZoom: 2
  }
};

export interface DownloadConfig {
  area: AreaConfig;
  source: MapSourceConfig;
  minZoom: number;
  maxZoom: number;
  outputDir: string;
  concurrency: number;
  retryAttempts: number;
  timeout: number;
}

export const DEFAULT_DOWNLOAD_CONFIG = {
  minZoom: 10,
  maxZoom: 15,  // より実用的なデフォルト値に変更
  concurrency: 5,
  retryAttempts: 3,
  timeout: 30000
};

export const OUTPUT_BASE_DIR = '../../data/map-tiles';

export function getOutputDirectory(sourceType: string, sourceName: string): string {
  return `${OUTPUT_BASE_DIR}/${sourceType}/${sourceName}`;
}

export function getDefaultZoomLevels(source: MapSourceConfig, detailed: boolean = false): { min: number; max: number } {
  if (detailed) {
    return {
      min: Math.max(13, source.minZoom),
      max: Math.min(17, source.maxZoom)
    };
  } else {
    return {
      min: Math.max(10, source.minZoom),
      max: Math.min(15, source.maxZoom)
    };
  }
}