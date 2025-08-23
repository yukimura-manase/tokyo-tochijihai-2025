import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

interface GeocodeResult {
  latitude: number;
  longitude: number;
}

export class Geocoder {
  private apiType: 'google' | 'gsi' | 'nominatim';
  private apiKey?: string;
  private requestCount: number = 0;
  private delayMs: number = 1000; // デフォルト1秒の遅延

  constructor(apiType: 'google' | 'gsi' | 'nominatim' = 'gsi') {
    this.apiType = apiType;
    
    if (apiType === 'google') {
      this.apiKey = process.env.GOOGLE_MAPS_API_KEY;
      if (!this.apiKey) {
        throw new Error('Google Maps APIキーが設定されていません。.envファイルにGOOGLE_MAPS_API_KEYを設定してください。');
      }
      this.delayMs = 100; // GoogleはAPI制限が緩い
    } else if (apiType === 'gsi') {
      this.delayMs = 1000; // 国土地理院APIは1秒間隔を推奨
    } else if (apiType === 'nominatim') {
      this.delayMs = 1500; // Nominatimは使用量制限が厳しい
    }
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async geocode(address: string): Promise<GeocodeResult | null> {
    // APIレート制限対策
    if (this.requestCount > 0) {
      await this.delay(this.delayMs);
    }
    this.requestCount++;

    try {
      switch (this.apiType) {
        case 'google':
          return await this.geocodeWithGoogle(address);
        case 'gsi':
          return await this.geocodeWithGSI(address);
        case 'nominatim':
          return await this.geocodeWithNominatim(address);
        default:
          throw new Error(`未対応のAPIタイプ: ${this.apiType}`);
      }
    } catch (error) {
      console.error(`ジオコーディングエラー (${address}):`, error);
      return null;
    }
  }

  private async geocodeWithGoogle(address: string): Promise<GeocodeResult | null> {
    const url = 'https://maps.googleapis.com/maps/api/geocode/json';
    const params = {
      address: address,
      key: this.apiKey,
      language: 'ja',
      region: 'jp'
    };

    try {
      const response = await axios.get(url, { params });
      
      if (response.data.status === 'OK' && response.data.results.length > 0) {
        const location = response.data.results[0].geometry.location;
        return {
          latitude: location.lat,
          longitude: location.lng
        };
      }
      
      console.warn(`Google Maps: 住所が見つかりません - ${address}`);
      return null;
    } catch (error) {
      throw error;
    }
  }

  private async geocodeWithGSI(address: string): Promise<GeocodeResult | null> {
    // 国土地理院のジオコーディングAPI
    const url = 'https://msearch.gsi.go.jp/address-search/AddressSearch';
    const params = {
      q: address
    };

    try {
      const response = await axios.get(url, { params });
      
      if (response.data && response.data.length > 0) {
        const result = response.data[0];
        // 国土地理院APIは座標を[経度, 緯度]の順で返す
        if (result.geometry && result.geometry.coordinates) {
          return {
            latitude: result.geometry.coordinates[1],
            longitude: result.geometry.coordinates[0]
          };
        }
      }
      
      console.warn(`国土地理院: 住所が見つかりません - ${address}`);
      return null;
    } catch (error) {
      throw error;
    }
  }

  private async geocodeWithNominatim(address: string): Promise<GeocodeResult | null> {
    // OpenStreetMap Nominatim API
    const url = 'https://nominatim.openstreetmap.org/search';
    const params = {
      q: `${address}, 日本`,
      format: 'json',
      limit: 1,
      countrycodes: 'jp',
      'accept-language': 'ja'
    };

    try {
      const response = await axios.get(url, {
        params,
        headers: {
          'User-Agent': 'TokyoFacilitiesGeocoder/1.0'
        }
      });
      
      if (response.data && response.data.length > 0) {
        const result = response.data[0];
        return {
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon)
        };
      }
      
      console.warn(`Nominatim: 住所が見つかりません - ${address}`);
      return null;
    } catch (error) {
      throw error;
    }
  }

  // 複数のAPIを試すフォールバック機能
  async geocodeWithFallback(address: string): Promise<GeocodeResult | null> {
    // まず国土地理院APIを試す（無料）
    let result = await this.geocodeWithGSI(address);
    if (result) return result;

    // 次にNominatimを試す（無料）
    await this.delay(1000);
    result = await this.geocodeWithNominatim(address);
    if (result) return result;

    // Google Maps APIがある場合は最後に試す（有料）
    if (process.env.GOOGLE_MAPS_API_KEY) {
      await this.delay(1000);
      result = await this.geocodeWithGoogle(address);
    }

    return result;
  }

  getRequestCount(): number {
    return this.requestCount;
  }
}