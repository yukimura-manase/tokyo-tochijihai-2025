import { Command } from 'commander';
import fs from 'fs-extra';
import path from 'path';
import {
  getTilesInBoundingBox,
  downloadTilesBatch,
  saveMetadata,
  calculateTileCount,
  calculateDirectorySize,
  formatBytes
} from './utils';
import {
  AREAS,
  GSI_SOURCES,
  DEFAULT_DOWNLOAD_CONFIG,
  getOutputDirectory
} from './config';

async function downloadGSITiles(
  areaKey: string,
  sourceKey: string,
  minZoom: number,
  maxZoom: number,
  concurrency: number
): Promise<void> {
  const area = AREAS[areaKey];
  const source = GSI_SOURCES[sourceKey];
  
  if (!area) {
    console.error(`Error: Area '${areaKey}' not found`);
    console.log('Available areas:', Object.keys(AREAS).join(', '));
    process.exit(1);
  }
  
  if (!source) {
    console.error(`Error: Source '${sourceKey}' not found`);
    console.log('Available sources:', Object.keys(GSI_SOURCES).join(', '));
    process.exit(1);
  }
  
  minZoom = Math.max(minZoom, source.minZoom);
  maxZoom = Math.min(maxZoom, source.maxZoom);
  
  const outputDir = path.join(__dirname, '..', getOutputDirectory('gsi', sourceKey));
  
  console.log('========================================');
  console.log('国土地理院タイルダウンローダー');
  console.log('GSI (Geospatial Information Authority) Tile Downloader');
  console.log('========================================');
  console.log(`エリア: ${area.name}`);
  console.log(`地図タイプ: ${source.name}`);
  console.log(`境界: 北緯:${area.boundingBox.north}, 南緯:${area.boundingBox.south}, 東経:${area.boundingBox.east}, 西経:${area.boundingBox.west}`);
  console.log(`ズームレベル: ${minZoom} - ${maxZoom}`);
  console.log(`出力先: ${outputDir}`);
  console.log(`同時ダウンロード数: ${concurrency}`);
  console.log('========================================\n');
  
  const tileCount = calculateTileCount(area.boundingBox, minZoom, maxZoom);
  console.log(`ダウンロードするタイル数: ${tileCount.toLocaleString()}枚`);
  
  const avgTileSize = sourceKey === 'seamlessphoto' ? 50 * 1024 : 30 * 1024;
  const estimatedSize = tileCount * avgTileSize;
  console.log(`推定ダウンロードサイズ: ${formatBytes(estimatedSize)}\n`);
  
  const confirmation = await promptConfirmation(
    `約 ${tileCount.toLocaleString()} 枚のタイル (${formatBytes(estimatedSize)}) をダウンロードします。続行しますか？`
  );
  
  if (!confirmation) {
    console.log('ダウンロードをキャンセルしました。');
    process.exit(0);
  }
  
  await fs.ensureDir(outputDir);
  
  const tilesGenerator = getTilesInBoundingBox(area.boundingBox, minZoom, maxZoom);
  
  console.log('\nダウンロードを開始しています...\n');
  const startTime = Date.now();
  
  const results = await downloadTilesBatch(
    tilesGenerator,
    source.urlTemplate,
    outputDir,
    concurrency,
    10000, // batchSize
    source.fileExtension,
    true,
    tileCount
  );
  
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;
  
  const successfulDownloads = results.filter(r => r.success).length;
  const failedDownloads = results.filter(r => !r.success).length;
  
  console.log('\n========================================');
  console.log('ダウンロード完了');
  console.log('========================================');
  console.log(`所要時間: ${duration.toFixed(2)} 秒`);
  console.log(`成功: ${successfulDownloads.toLocaleString()} タイル`);
  console.log(`失敗: ${failedDownloads.toLocaleString()} タイル`);
  console.log(`成功率: ${((successfulDownloads / results.length) * 100).toFixed(2)}%`);
  
  if (failedDownloads > 0) {
    const failedTilesPath = path.join(outputDir, 'failed_tiles.json');
    const failedTiles = results.filter(r => !r.success).map(r => ({
      tile: r.tile,
      error: r.error
    }));
    await fs.writeJson(failedTilesPath, failedTiles, { spaces: 2 });
    console.log(`\n失敗したタイル情報を保存しました: ${failedTilesPath}`);
  }
  
  const actualSize = await calculateDirectorySize(outputDir);
  console.log(`\n合計ディスク使用量: ${formatBytes(actualSize)}`);
  
  await saveMetadata(outputDir, {
    source: source.name,
    downloadedAt: new Date(),
    totalTiles: results.length,
    successfulTiles: successfulDownloads,
    failedTiles: failedDownloads,
    boundingBox: area.boundingBox,
    zoomLevels: { min: minZoom, max: maxZoom }
  });
  
  console.log('\nメタデータを metadata.json に保存しました');
  console.log('\n地図タイルのダウンロードが完了しました！オフラインで使用可能です。');
  
  if (sourceKey === 'disaster') {
    console.log('\n注意: 災害時指定緊急避難場所タイルは半透明のオーバーレイ用です。');
    console.log('基本地図（標準地図など）と組み合わせて使用してください。');
  }
}

async function promptConfirmation(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    readline.question(`${message} (y/N): `, (answer: string) => {
      readline.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

const program = new Command();

program
  .name('gsi-tiles')
  .description('国土地理院の地図タイルをダウンロード (Download GSI map tiles for Tokyo area)')
  .version('1.0.0');

program
  .command('download')
  .description('GSIタイルをダウンロード')
  .option('-a, --area <area>', 'ダウンロードエリア (tokyo_all, tokyo_23ku, tokyo_central, tokyo_tama)', 'tokyo_23ku')
  .option('-s, --source <source>', 'GSIタイルソース (std, pale, blank, seamlessphoto, relief, disaster)', 'std')
  .option('--min-zoom <number>', '最小ズームレベル', (val) => parseInt(val), DEFAULT_DOWNLOAD_CONFIG.minZoom)
  .option('--max-zoom <number>', '最大ズームレベル', (val) => parseInt(val), DEFAULT_DOWNLOAD_CONFIG.maxZoom)
  .option('-c, --concurrency <number>', '同時ダウンロード数', (val) => parseInt(val), DEFAULT_DOWNLOAD_CONFIG.concurrency)
  .action(async (options) => {
    await downloadGSITiles(
      options.area,
      options.source,
      options.minZoom,
      options.maxZoom,
      options.concurrency
    );
  });

program
  .command('list-areas')
  .description('利用可能なエリアを表示')
  .action(() => {
    console.log('\n利用可能なエリア:');
    Object.entries(AREAS).forEach(([key, area]) => {
      console.log(`  ${key}: ${area.name}`);
      console.log(`    境界: 北緯:${area.boundingBox.north}, 南緯:${area.boundingBox.south}, 東経:${area.boundingBox.east}, 西経:${area.boundingBox.west}`);
    });
  });

program
  .command('list-sources')
  .description('利用可能なGSIソースを表示')
  .action(() => {
    console.log('\n利用可能な国土地理院タイルソース:');
    Object.entries(GSI_SOURCES).forEach(([key, source]) => {
      console.log(`  ${key}: ${source.name}`);
      console.log(`    URL: ${source.urlTemplate}`);
      console.log(`    ズーム: ${source.minZoom} - ${source.maxZoom}`);
      console.log(`    形式: ${source.fileExtension}`);
    });
    console.log('\n推奨される組み合わせ:');
    console.log('  - 通常使用: std (標準地図)');
    console.log('  - 見やすい地図: pale (淡色地図)');
    console.log('  - 印刷用: blank (白地図)');
    console.log('  - 航空写真: seamlessphoto (全国最新写真)');
    console.log('  - 地形確認: relief (色別標高図)');
    console.log('  - 災害対策: disaster (災害時指定緊急避難場所) ※オーバーレイ用');
  });

program
  .command('download-disaster-set')
  .description('災害対策用の地図セットをダウンロード（標準地図＋避難場所オーバーレイ）')
  .option('-a, --area <area>', 'ダウンロードエリア', 'tokyo_23ku')
  .action(async (options) => {
    console.log('災害対策用地図セットをダウンロードします\n');
    
    console.log('1/2: 標準地図をダウンロード中...');
    await downloadGSITiles(
      options.area,
      'std',
      DEFAULT_DOWNLOAD_CONFIG.minZoom,
      DEFAULT_DOWNLOAD_CONFIG.maxZoom,
      DEFAULT_DOWNLOAD_CONFIG.concurrency
    );
    
    console.log('\n2/2: 災害時指定緊急避難場所オーバーレイをダウンロード中...');
    await downloadGSITiles(
      options.area,
      'disaster',
      DEFAULT_DOWNLOAD_CONFIG.minZoom,
      DEFAULT_DOWNLOAD_CONFIG.maxZoom,
      DEFAULT_DOWNLOAD_CONFIG.concurrency
    );
    
    console.log('\n災害対策用地図セットのダウンロードが完了しました！');
  });

if (require.main === module) {
  if (process.argv.length === 2) {
    downloadGSITiles(
      'tokyo_23ku',
      'std',
      DEFAULT_DOWNLOAD_CONFIG.minZoom,
      DEFAULT_DOWNLOAD_CONFIG.maxZoom,
      DEFAULT_DOWNLOAD_CONFIG.concurrency
    );
  } else {
    program.parse(process.argv);
  }
}