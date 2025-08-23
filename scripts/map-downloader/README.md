# 東京エリア マップタイルダウンローダー

災害避難ガイドアプリケーション用の東京エリア地図タイルをダウンロードするスクリプトです。

## 機能

- **OpenStreetMap (OSM)** タイルのダウンロード
- **国土地理院 (GSI)** タイルのダウンロード
- 複数のエリア設定（東京全域、23 区、都心部、多摩地域）
- 並列ダウンロード対応
- ダウンロード済みタイルのスキップ
- 進捗表示とメタデータ保存

## インストール

```bash
cd scripts/map-downloader
npm install
```

## 使用方法

### クイックスタート（災害対策用基本セット）

東京 23 区の標準地図と避難場所情報をダウンロード:

```bash
npm run quick-start
```

### OpenStreetMap タイルをダウンロード

```bash
# デフォルト設定（東京23区、ズーム10-17）
npm run download:osm

# カスタム設定
node dist/osm-tiles.js download --area tokyo_all --min-zoom 10 --max-zoom 15
```

### 国土地理院タイルをダウンロード

```bash
# デフォルト設定（東京23区、標準地図）
npm run download:gsi

# 淡色地図をダウンロード
node dist/gsi-tiles.js download --source pale

# 災害時指定緊急避難場所オーバーレイ
node dist/gsi-tiles.js download --source disaster
```

### すべての地図をダウンロード

東京都全域（23区＋多摩地域）の地図をダウンロード:

```bash
# 東京都全域
npm run download:all

# 23区のみ
npm run download:all-23ku

# 多摩地域のみ
npm run download:all-tama
```

## 利用可能なエリア

| エリアコード    | 名称       | 範囲                               |
| --------------- | ---------- | ---------------------------------- |
| `tokyo_all`     | 東京都全域 | 北緯 35.5-35.9, 東経 138.9-139.95  |
| `tokyo_23ku`    | 東京 23 区 | 北緯 35.6-35.8, 東経 139.65-139.85 |
| `tokyo_central` | 東京都心部 | 北緯 35.65-35.72, 東経 139.7-139.8 |
| `tokyo_tama`    | 多摩地域   | 北緯 35.6-35.8, 東経 139.2-139.65  |

## 利用可能な地図ソース

### OpenStreetMap

- `standard`: 標準地図
- `humanitarian`: 人道支援地図

### 国土地理院

- `std`: 標準地図
- `pale`: 淡色地図
- `blank`: 白地図
- `seamlessphoto`: 全国最新写真（航空写真）
- `relief`: 色別標高図
- `disaster`: 災害時指定緊急避難場所（オーバーレイ用）

## コマンド一覧

### メインコマンド

```bash
# ヘルプを表示
node dist/index.js --help

# エリアとソースの情報を表示
node dist/index.js info

# クイックスタート（災害対策基本セット）
node dist/index.js quick-start

# すべての地図をダウンロード（東京都全域）
npm run download:all

# エリアを指定してダウンロード
node dist/index.js download-all --area tokyo_23ku
```

### OSM タイル専用コマンド

```bash
# ダウンロード
node dist/osm-tiles.js download [options]

# 利用可能なエリアを表示
node dist/osm-tiles.js list-areas

# 利用可能なソースを表示
node dist/osm-tiles.js list-sources
```

### GSI タイル専用コマンド

```bash
# ダウンロード
node dist/gsi-tiles.js download [options]

# 災害対策セットをダウンロード
node dist/gsi-tiles.js download-disaster-set --area tokyo_23ku

# 利用可能なエリアを表示
node dist/gsi-tiles.js list-areas

# 利用可能なソースを表示
node dist/gsi-tiles.js list-sources
```

## オプション

| オプション      | 説明               | デフォルト              |
| --------------- | ------------------ | ----------------------- |
| `--area`        | ダウンロードエリア | tokyo_23ku              |
| `--source`      | 地図ソース         | OSM: standard, GSI: std |
| `--min-zoom`    | 最小ズームレベル   | 10                      |
| `--max-zoom`    | 最大ズームレベル   | 17                      |
| `--concurrency` | 同時ダウンロード数 | 5                       |

## 出力ディレクトリ構造

```bash
data/map-tiles/
├── osm/
│   ├── standard/
│   │   ├── {z}/{x}/{y}.png
│   │   └── metadata.json
│   └── humanitarian/
└── gsi/
    ├── std/
    ├── pale/
    ├── blank/
    ├── seamlessphoto/
    ├── relief/
    └── disaster/
```

## 注意事項

1. **ダウンロードサイズ**: ズームレベルが上がるとタイル数が指数的に増加します

   - ズーム 10: 約 4 タイル
   - ズーム 15: 約 1,000 タイル
   - ズーム 17: 約 16,000 タイル

2. **レート制限**: OpenStreetMap には利用制限があります。大量ダウンロードは控えめに行ってください

3. **災害時指定緊急避難場所タイル**: 半透明のオーバーレイ用です。基本地図と組み合わせて使用してください

4. **ストレージ容量**: 東京 23 区のズーム 10-17 をダウンロードすると約 500MB-1GB 必要です

## トラブルシューティング

### ダウンロードが失敗する場合

- ネットワーク接続を確認してください
- `--concurrency`を減らして再試行してください
- `failed_tiles.json`を確認して失敗したタイルを特定してください

### メモリ不足エラー

- より小さいエリアを選択してください
- ズームレベルの範囲を狭めてください

## ライセンス

- OpenStreetMap データ: © OpenStreetMap contributors
- 国土地理院データ: © 国土地理院
- このスクリプト: MIT License
