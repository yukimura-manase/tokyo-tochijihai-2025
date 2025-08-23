# 都立一時滞在施設 ジオコーディングスクリプト

このスクリプトは、都立一時滞在施設一覧CSVファイルの各施設に対して緯度・経度情報を追加するためのツールです。

## 機能

- CSVファイルから施設情報を読み込み
- 各施設の住所から緯度・経度を取得（ジオコーディング）
- 座標情報を追加したCSVファイルを出力
- 複数のジオコーディングAPIに対応
- エラーハンドリングとリトライ機能
- Shift-JISとUTF-8両方のエンコーディングに対応

## セットアップ

### 1. 依存パッケージのインストール

```bash
cd scripts/geocoding
npm install
```

### 2. 環境設定

`.env.example`をコピーして`.env`ファイルを作成します：

```bash
cp .env.example .env
```

必要に応じて`.env`ファイルを編集してください。

## 使用方法

### 基本的な実行

```bash
npm run geocode
```

または

```bash
npm start
```

### 開発モードでの実行

```bash
npm run dev
```

## 対応ジオコーディングAPI

### 1. 国土地理院API（デフォルト・推奨）
- **料金**: 無料
- **特徴**: 日本の住所に特化、高精度
- **制限**: 1秒に1リクエスト程度を推奨
- **設定**: `.env`で`GEOCODING_API_TYPE=gsi`

### 2. Google Maps Geocoding API
- **料金**: 有料（月$200分の無料枠あり）
- **特徴**: 最高精度、高速
- **制限**: 1秒に50リクエストまで
- **設定**: 
  ```
  GEOCODING_API_TYPE=google
  GOOGLE_MAPS_API_KEY=your_api_key_here
  ```
- **APIキー取得**: [Google Cloud Console](https://developers.google.com/maps/documentation/geocoding/get-api-key)

### 3. OpenStreetMap Nominatim
- **料金**: 無料
- **特徴**: オープンソース、世界対応
- **制限**: 1秒に1リクエストまで
- **設定**: `.env`で`GEOCODING_API_TYPE=nominatim`

## 出力ファイル

スクリプトを実行すると、以下のファイルが`output`ディレクトリに生成されます：

1. **facilities_with_coordinates.csv** - UTF-8エンコーディングの結果ファイル
2. **facilities_with_coordinates_sjis.csv** - Shift-JISエンコーディングの結果ファイル
3. **failed_addresses.json** - ジオコーディングに失敗した住所のログ（該当がある場合）

## 出力フォーマット

元のCSVに以下の列が追加されます：
- **緯度**: 施設の緯度（十進法）
- **経度**: 施設の経度（十進法）

例：
```csv
番号,施設名称,所在地,緯度,経度
1,千代田都税事務所,千代田区内神田2-1-12,35.691638,139.770896
```

## エラーハンドリング

- ジオコーディングに失敗した住所は、デフォルト座標（東京都庁）が設定されます
- 失敗した住所は`output/failed_addresses.json`に記録されます
- 手動で修正が必要な場合は、このファイルを参照してください

## トラブルシューティング

### APIレート制限エラー
- `.env`の`API_DELAY_MS`値を増やしてください
- または別のAPIタイプに切り替えてください

### 文字化け
- 入力CSVがShift-JISでない場合は、`csv-handler.ts`のエンコーディング設定を確認してください

### 住所が見つからない
- 住所の表記を確認してください（旧字体、略称など）
- 複数のAPIで試してみてください（フォールバック機能が自動で動作します）

## 開発

### ビルド

```bash
npm run build
```

### ファイル構成

```
scripts/geocoding/
├── src/
│   ├── index.ts          # メインスクリプト
│   ├── geocoder.ts       # ジオコーディング処理
│   └── csv-handler.ts    # CSV読み書き処理
├── output/               # 出力ディレクトリ
├── package.json
├── tsconfig.json
├── .env.example          # 環境変数テンプレート
└── README.md
```

## ライセンス

MIT