import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import csv from 'csv-parser';
import { createObjectCsvWriter } from 'csv-writer';
import * as iconv from 'iconv-lite';
import { Readable } from 'stream';

export interface Facility {
  番号: string;
  施設名称: string;
  所在地: string;
  緯度?: number;
  経度?: number;
}

export interface FacilityWithCoordinates extends Facility {
  緯度: number;
  経度: number;
}

export class CsvHandler {
  private inputPath: string;
  private outputPath: string;

  constructor(inputPath: string, outputPath: string) {
    this.inputPath = inputPath;
    this.outputPath = outputPath;
  }

  async readFacilities(): Promise<Facility[]> {
    return new Promise((resolve, reject) => {
      const facilities: Facility[] = [];
      
      // ファイルを読み込み、最初の2行をスキップ
      const fileContent = fs.readFileSync(this.inputPath, 'utf8');
      const lines = fileContent.split('\n');
      
      // 最初の2行（タイトルと日付）を削除
      const csvContent = lines.slice(2).join('\n');
      
      // 文字列をStreamに変換
      const readable = Readable.from([csvContent]);
      
      // CSVパーサーに渡す
      const stream = readable.pipe(csv());

      stream.on('data', (row: any) => {
        // ヘッダー行や空行をスキップ
        if (row['番号'] && row['施設名称'] && row['所在地']) {
          facilities.push({
            番号: row['番号'],
            施設名称: row['施設名称'],
            所在地: row['所在地']
          });
        }
      });

      stream.on('end', () => {
        console.log(`読み込み完了: ${facilities.length}件の施設`);
        resolve(facilities);
      });

      stream.on('error', (error: Error) => {
        reject(error);
      });
    });
  }

  async writeFacilitiesWithCoordinates(facilities: FacilityWithCoordinates[]): Promise<void> {
    const csvWriter = createObjectCsvWriter({
      path: this.outputPath,
      header: [
        { id: '番号', title: '番号' },
        { id: '施設名称', title: '施設名称' },
        { id: '所在地', title: '所在地' },
        { id: '緯度', title: '緯度' },
        { id: '経度', title: '経度' }
      ],
      encoding: 'utf8' // UTF-8で出力
    });

    try {
      await csvWriter.writeRecords(facilities);
      console.log(`CSVファイルを出力しました: ${this.outputPath}`);
    } catch (error) {
      throw new Error(`CSV書き込みエラー: ${error}`);
    }
  }

  async writeFacilitiesWithCoordinatesShiftJIS(facilities: FacilityWithCoordinates[]): Promise<void> {
    // Shift-JIS版も作成
    const shiftJisPath = this.outputPath.replace('.csv', '_sjis.csv');
    
    // ヘッダー行を作成
    let csvContent = '番号,施設名称,所在地,緯度,経度\n';
    
    // データ行を追加
    facilities.forEach(facility => {
      csvContent += `${facility.番号},"${facility.施設名称}","${facility.所在地}",${facility.緯度},${facility.経度}\n`;
    });

    // Shift-JISでエンコードして保存
    const buffer = iconv.encode(csvContent, 'Shift_JIS');
    fs.writeFileSync(shiftJisPath, buffer);
    console.log(`Shift-JIS版CSVファイルを出力しました: ${shiftJisPath}`);
  }
}