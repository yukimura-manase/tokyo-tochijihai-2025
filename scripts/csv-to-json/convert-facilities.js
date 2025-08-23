const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");
const iconv = require("iconv-lite");

/**
 * Shift-JISエンコーディングのCSVファイルを読み込む
 */
function readShiftJISCsv(filePath) {
  const buffer = fs.readFileSync(filePath);
  return iconv.decode(buffer, "shift_jis");
}

/**
 * UTF-8エンコーディングのCSVファイルを読み込む（BOM対応）
 */
function readUTF8Csv(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  // BOMを除去
  return content.replace(/^\uFEFF/, "");
}

/**
 * CSVファイルを読み込んでJSONに変換
 */
function convertCsvToJson() {
  const dataSourcePath = path.join(__dirname, "../../data-source");
  const outputPath = path.join(__dirname, "../../frontend/public/data");

  // 出力ディレクトリを作成
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }

  const facilities = [];
  let idCounter = 1;

  // 消火栓データは量が多すぎるため除外
  console.log("⚠️  消火栓データ: パフォーマンス上の理由により除外");

  // 給水拠点データの変換
  try {
    const waterSupplyCsv = readShiftJISCsv(
      path.join(dataSourcePath, "給水拠点一覧.csv")
    );

    const waterSupplies = parse(waterSupplyCsv, {
      columns: true,
      skip_empty_lines: true,
    });

    let waterSupplyCount = 0;
    waterSupplies.forEach((row) => {
      const lat = parseFloat(row["緯度"]);
      const lon = parseFloat(row["経度"]);

      if (!isNaN(lat) && !isNaN(lon)) {
        facilities.push({
          id: `water-${idCounter++}`,
          type: "water_supply",
          name: row["施設名"] || "給水拠点",
          latitude: lat,
          longitude: lon,
          address: row["設置地"] || "",
          capacity: parseInt(row["確保水量（立方メートル）"]) || undefined,
          imageUrl: row["詳細画像"] || undefined,
          updatedAt: row["最更新日"] || undefined,
        });
        waterSupplyCount++;
      }
    });

    console.log(`✅ 給水拠点データ: ${waterSupplyCount}件を変換`);
  } catch (error) {
    console.error("❌ 給水拠点データの変換エラー:", error.message);
  }

  // 避難場所データの変換
  try {
    const evacuationCsv = readUTF8Csv(
      path.join(dataSourcePath, "避難場所一覧.csv")
    );

    const evacuations = parse(evacuationCsv, {
      columns: true,
      skip_empty_lines: true,
    });

    let evacuationCount = 0;
    evacuations.forEach((row) => {
      const lat = parseFloat(row["緯度"]);
      const lon = parseFloat(row["経度"]);

      if (!isNaN(lat) && !isNaN(lon) && row["施設名"] && row["施設名"].trim()) {
        facilities.push({
          id: `evacuation-${idCounter++}`,
          type: "evacuation",
          name: row["施設名"] || "避難場所",
          latitude: lat,
          longitude: lon,
          address: row["所在地住所"] || "",
        });
        evacuationCount++;
      }
    });

    console.log(`✅ 避難場所データ: ${evacuationCount}件を変換`);
  } catch (error) {
    console.error("❌ 避難場所データの変換エラー:", error.message);
  }

  // 都立一時滞在施設データの変換
  try {
    const shelterCsv = readUTF8Csv(
      path.join(dataSourcePath, "都立一時滞在施設一覧(緯度:経度あり).csv")
    );

    const shelters = parse(shelterCsv, {
      columns: true,
      skip_empty_lines: true,
    });

    let shelterCount = 0;
    shelters.forEach((row) => {
      const lat = parseFloat(row["緯度"]);
      const lon = parseFloat(row["経度"]);

      if (!isNaN(lat) && !isNaN(lon)) {
        facilities.push({
          id: `shelter-${idCounter++}`,
          type: "shelter",
          name: row["施設名称"] || "一時滞在施設",
          latitude: lat,
          longitude: lon,
          address: row["所在地"] || "",
        });
        shelterCount++;
      }
    });

    console.log(`✅ 都立一時滞在施設データ: ${shelterCount}件を変換`);
  } catch (error) {
    console.error("❌ 都立一時滞在施設データの変換エラー:", error.message);
  }

  // 無料WiFiデータの変換
  try {
    const wifiCsv = readShiftJISCsv(path.join(dataSourcePath, "無料Wifi.csv"));

    const wifis = parse(wifiCsv, {
      columns: true,
      skip_empty_lines: true,
    });

    let wifiCount = 0;
    wifis.forEach((row) => {
      const lat = parseFloat(row["緯度"]);
      const lon = parseFloat(row["経度"]);

      if (!isNaN(lat) && !isNaN(lon) && row["名称"] && row["名称"].trim()) {
        facilities.push({
          id: `wifi-${idCounter++}`,
          type: "wifi",
          name: `${row["名称"]} 無料WiFi`,
          latitude: lat,
          longitude: lon,
          address: row["住所"] || "",
          ssid: row["SSID"] || "FREE_Wi-Fi_and_TOKYO",
          url: row["URL"] || "",
        });
        wifiCount++;
      }
    });

    console.log(`✅ 無料WiFiデータ: ${wifiCount}件を変換`);
  } catch (error) {
    console.error("❌ 無料WiFiデータの変換エラー:", error.message);

    // エラーの場合はサンプルデータを作成
    const wifiSamples = [
      { name: "東京都庁", latitude: 35.6895, longitude: 139.6917 },
      { name: "新宿駅", latitude: 35.6896, longitude: 139.7006 },
      { name: "渋谷駅", latitude: 35.658, longitude: 139.7016 },
      { name: "東京駅", latitude: 35.6812, longitude: 139.7671 },
      { name: "上野駅", latitude: 35.7141, longitude: 139.7774 },
    ];

    wifiSamples.forEach((spot) => {
      facilities.push({
        id: `wifi-${idCounter++}`,
        type: "wifi",
        name: `${spot.name} 無料WiFi`,
        latitude: spot.latitude,
        longitude: spot.longitude,
        ssid: "FREE_Wi-Fi_and_TOKYO",
      });
    });

    console.log(
      `✅ 無料WiFiデータ: ${wifiSamples.length}件のサンプルを作成（フォールバック）`
    );
  }

  // JSONファイルとして保存
  const outputFile = path.join(outputPath, "facilities.json");
  fs.writeFileSync(outputFile, JSON.stringify(facilities, null, 2), "utf-8");

  console.log(
    `\n✅ 全施設データ（${facilities.length}件）を保存: ${outputFile}`
  );
}

// 実行
convertCsvToJson();
