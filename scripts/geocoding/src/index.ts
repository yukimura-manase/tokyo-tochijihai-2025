import * as path from 'path';
import * as fs from 'fs';
import { CsvHandler, Facility, FacilityWithCoordinates } from './csv-handler';
import { Geocoder } from './geocoder';
import * as dotenv from 'dotenv';

dotenv.config();

class GeocodingScript {
  private csvHandler: CsvHandler;
  private geocoder: Geocoder;
  private failedAddresses: Array<{ facility: Facility; error: string }> = [];

  constructor() {
    const inputPath = path.join(__dirname, '../../../data-source/都立一時滞在施設一覧 .csv');
    const outputPath = path.join(__dirname, '../output/facilities_with_coordinates.csv');
    
    this.csvHandler = new CsvHandler(inputPath, outputPath);
    
    // APIタイプを環境変数から取得（デフォルトは国土地理院）
    const apiType = (process.env.GEOCODING_API_TYPE || 'gsi') as 'google' | 'gsi' | 'nominatim';
    this.geocoder = new Geocoder(apiType);
  }

  async run(): Promise<void> {
    try {
      console.log('========================================');
      console.log('都立一時滞在施設 ジオコーディング処理');
      console.log('========================================\n');

      // CSVファイルを読み込む
      console.log('1. CSVファイルを読み込み中...');
      const facilities = await this.csvHandler.readFacilities();
      console.log(`   読み込み完了: ${facilities.length}件\n`);

      // ジオコーディング処理
      console.log('2. ジオコーディング処理を開始...');
      const facilitiesWithCoordinates = await this.processFacilities(facilities);

      // 結果を出力
      console.log('\n3. 結果をCSVファイルに出力中...');
      await this.csvHandler.writeFacilitiesWithCoordinates(facilitiesWithCoordinates);
      await this.csvHandler.writeFacilitiesWithCoordinatesShiftJIS(facilitiesWithCoordinates);

      // 統計情報を表示
      this.printStatistics(facilities.length, facilitiesWithCoordinates.length);

      // 失敗したアドレスをログファイルに記録
      if (this.failedAddresses.length > 0) {
        await this.saveFailedAddresses();
      }

      console.log('\n処理が完了しました！');
      
    } catch (error) {
      console.error('エラーが発生しました:', error);
      process.exit(1);
    }
  }

  private async processFacilities(facilities: Facility[]): Promise<FacilityWithCoordinates[]> {
    const results: FacilityWithCoordinates[] = [];
    const total = facilities.length;

    for (let i = 0; i < facilities.length; i++) {
      const facility = facilities[i];
      const progress = ((i + 1) / total * 100).toFixed(1);
      
      process.stdout.write(`   処理中: ${i + 1}/${total} (${progress}%) - ${facility.施設名称}\r`);

      try {
        // フォールバック機能を使用してジオコーディング
        const coordinates = await this.geocoder.geocodeWithFallback(facility.所在地);

        if (coordinates) {
          results.push({
            ...facility,
            緯度: coordinates.latitude,
            経度: coordinates.longitude
          });
        } else {
          // 座標が取得できなかった場合はデフォルト値を設定
          this.failedAddresses.push({
            facility,
            error: '座標が見つかりませんでした'
          });
          
          // デフォルトとして東京都庁の座標を設定（後で手動修正用）
          results.push({
            ...facility,
            緯度: 35.6896,
            経度: 139.6923
          });
        }
      } catch (error) {
        console.error(`\n   エラー: ${facility.施設名称} - ${error}`);
        this.failedAddresses.push({
          facility,
          error: String(error)
        });

        // エラーの場合もデフォルト座標を設定
        results.push({
          ...facility,
          緯度: 35.6896,
          経度: 139.6923
        });
      }
    }

    console.log('\n'); // 進捗表示をクリア
    return results;
  }

  private printStatistics(total: number, success: number): void {
    const failed = this.failedAddresses.length;
    const successRate = ((success - failed) / total * 100).toFixed(1);

    console.log('\n========================================');
    console.log('処理結果サマリー');
    console.log('========================================');
    console.log(`総施設数: ${total}件`);
    console.log(`成功: ${success - failed}件`);
    console.log(`失敗: ${failed}件`);
    console.log(`成功率: ${successRate}%`);
    console.log(`API呼び出し回数: ${this.geocoder.getRequestCount()}回`);
  }

  private async saveFailedAddresses(): Promise<void> {
    const failedPath = path.join(__dirname, '../output/failed_addresses.json');
    const failedData = {
      timestamp: new Date().toISOString(),
      count: this.failedAddresses.length,
      addresses: this.failedAddresses
    };

    fs.writeFileSync(failedPath, JSON.stringify(failedData, null, 2));
    console.log(`\n失敗したアドレスを保存しました: ${failedPath}`);
  }
}

// メイン処理
if (require.main === module) {
  const script = new GeocodingScript();
  script.run().catch(console.error);
}