import { Command } from 'commander';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs-extra';
import { AREAS, OSM_SOURCES, GSI_SOURCES, DEFAULT_DOWNLOAD_CONFIG } from './config';

function runScript(scriptPath: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [scriptPath, ...args], {
      stdio: 'inherit',
      cwd: path.dirname(scriptPath)
    });
    
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Script exited with code ${code}`));
      }
    });
    
    child.on('error', reject);
  });
}

async function runOSMDownload(area: string, source: string, minZoom: number, maxZoom: number): Promise<void> {
  const scriptPath = path.join(__dirname, 'osm-tiles.js');
  const args = [
    'download',
    '--area', area,
    '--source', source,
    '--min-zoom', minZoom.toString(),
    '--max-zoom', maxZoom.toString()
  ];
  
  await runScript(scriptPath, args);
}

async function runGSIDownload(area: string, source: string, minZoom: number, maxZoom: number): Promise<void> {
  const scriptPath = path.join(__dirname, 'gsi-tiles.js');
  const args = [
    'download',
    '--area', area,
    '--source', source,
    '--min-zoom', minZoom.toString(),
    '--max-zoom', maxZoom.toString()
  ];
  
  await runScript(scriptPath, args);
}

async function downloadAllMaps(area: string): Promise<void> {
  console.log('========================================');
  console.log('東京エリア マップデータ一括ダウンロード');
  console.log('Tokyo Area Map Data Batch Downloader');
  console.log('========================================\n');
  
  const areaConfig = AREAS[area];
  if (!areaConfig) {
    console.error(`Error: Area '${area}' not found`);
    console.log('Available areas:', Object.keys(AREAS).join(', '));
    process.exit(1);
  }
  
  console.log(`対象エリア: ${areaConfig.name}`);
  console.log(`境界: 北緯:${areaConfig.boundingBox.north}, 南緯:${areaConfig.boundingBox.south}`);
  console.log(`     東経:${areaConfig.boundingBox.east}, 西経:${areaConfig.boundingBox.west}\n`);
  
  console.log('ダウンロードする地図タイル:');
  console.log('1. OpenStreetMap 標準地図');
  console.log('2. 国土地理院 標準地図');
  console.log('3. 国土地理院 淡色地図');
  console.log('4. 国土地理院 災害時指定緊急避難場所（オーバーレイ）\n');
  
  const confirmation = await promptConfirmation(
    'すべての地図タイルをダウンロードします。この処理には時間がかかります。続行しますか？'
  );
  
  if (!confirmation) {
    console.log('ダウンロードをキャンセルしました。');
    process.exit(0);
  }
  
  console.log('\n========================================');
  console.log('1/4: OpenStreetMap 標準地図');
  console.log('========================================\n');
  await runOSMDownload(area, 'standard', DEFAULT_DOWNLOAD_CONFIG.minZoom, DEFAULT_DOWNLOAD_CONFIG.maxZoom);
  
  console.log('\n========================================');
  console.log('2/4: 国土地理院 標準地図');
  console.log('========================================\n');
  await runGSIDownload(area, 'std', DEFAULT_DOWNLOAD_CONFIG.minZoom, DEFAULT_DOWNLOAD_CONFIG.maxZoom);
  
  console.log('\n========================================');
  console.log('3/4: 国土地理院 淡色地図');
  console.log('========================================\n');
  await runGSIDownload(area, 'pale', DEFAULT_DOWNLOAD_CONFIG.minZoom, DEFAULT_DOWNLOAD_CONFIG.maxZoom);
  
  console.log('\n========================================');
  console.log('4/4: 国土地理院 災害時指定緊急避難場所');
  console.log('========================================\n');
  await runGSIDownload(area, 'disaster', DEFAULT_DOWNLOAD_CONFIG.minZoom, DEFAULT_DOWNLOAD_CONFIG.maxZoom);
  
  console.log('\n========================================');
  console.log('すべてのダウンロードが完了しました！');
  console.log('All downloads completed!');
  console.log('========================================\n');
  
  const dataDir = path.join(__dirname, '..', '..', '..', 'data', 'map-tiles');
  if (await fs.pathExists(dataDir)) {
    console.log(`地図タイルは以下のディレクトリに保存されています:`);
    console.log(`📁 ${dataDir}`);
    console.log('  ├── 📁 osm/');
    console.log('  │   └── 📁 standard/');
    console.log('  └── 📁 gsi/');
    console.log('      ├── 📁 std/');
    console.log('      ├── 📁 pale/');
    console.log('      └── 📁 disaster/');
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
  .name('map-downloader')
  .description('東京エリアの地図タイルダウンローダー (Tokyo Area Map Tile Downloader)')
  .version('1.0.0');

program
  .command('download-all')
  .description('すべての地図タイルをダウンロード')
  .option('-a, --area <area>', 'ダウンロードエリア', 'tokyo_23ku')
  .action(async (options) => {
    await downloadAllMaps(options.area);
  });

program
  .command('download-osm')
  .description('OpenStreetMapタイルをダウンロード')
  .option('-a, --area <area>', 'エリア', 'tokyo_23ku')
  .option('-s, --source <source>', 'ソース', 'standard')
  .option('--min-zoom <number>', '最小ズーム', parseInt, DEFAULT_DOWNLOAD_CONFIG.minZoom)
  .option('--max-zoom <number>', '最大ズーム', parseInt, DEFAULT_DOWNLOAD_CONFIG.maxZoom)
  .action(async (options) => {
    await runOSMDownload(options.area, options.source, options.minZoom, options.maxZoom);
  });

program
  .command('download-gsi')
  .description('国土地理院タイルをダウンロード')
  .option('-a, --area <area>', 'エリア', 'tokyo_23ku')
  .option('-s, --source <source>', 'ソース', 'std')
  .option('--min-zoom <number>', '最小ズーム', parseInt, DEFAULT_DOWNLOAD_CONFIG.minZoom)
  .option('--max-zoom <number>', '最大ズーム', parseInt, DEFAULT_DOWNLOAD_CONFIG.maxZoom)
  .action(async (options) => {
    await runGSIDownload(options.area, options.source, options.minZoom, options.maxZoom);
  });

program
  .command('quick-start')
  .description('災害対策用の基本セットをダウンロード（東京23区、標準地図＋避難場所）')
  .action(async () => {
    console.log('災害対策用基本セットをダウンロードします\n');
    console.log('内容:');
    console.log('- エリア: 東京23区');
    console.log('- 国土地理院 標準地図');
    console.log('- 国土地理院 災害時指定緊急避難場所オーバーレイ\n');
    
    const confirmation = await promptConfirmation('続行しますか？');
    if (!confirmation) {
      console.log('キャンセルしました。');
      return;
    }
    
    console.log('\n1/2: 標準地図をダウンロード中...');
    await runGSIDownload('tokyo_23ku', 'std', DEFAULT_DOWNLOAD_CONFIG.minZoom, DEFAULT_DOWNLOAD_CONFIG.maxZoom);
    
    console.log('\n2/2: 避難場所オーバーレイをダウンロード中...');
    await runGSIDownload('tokyo_23ku', 'disaster', DEFAULT_DOWNLOAD_CONFIG.minZoom, DEFAULT_DOWNLOAD_CONFIG.maxZoom);
    
    console.log('\n災害対策用基本セットのダウンロードが完了しました！');
  });

program
  .command('info')
  .description('利用可能なエリアとソースの情報を表示')
  .action(() => {
    console.log('\n==== 利用可能なエリア ====');
    Object.entries(AREAS).forEach(([key, area]) => {
      console.log(`\n${key}: ${area.name}`);
      console.log(`  北緯: ${area.boundingBox.north}, 南緯: ${area.boundingBox.south}`);
      console.log(`  東経: ${area.boundingBox.east}, 西経: ${area.boundingBox.west}`);
    });
    
    console.log('\n==== OpenStreetMap ソース ====');
    Object.entries(OSM_SOURCES).forEach(([key, source]) => {
      console.log(`\n${key}: ${source.name}`);
      console.log(`  ズーム: ${source.minZoom} - ${source.maxZoom}`);
    });
    
    console.log('\n==== 国土地理院 ソース ====');
    Object.entries(GSI_SOURCES).forEach(([key, source]) => {
      console.log(`\n${key}: ${source.name}`);
      console.log(`  ズーム: ${source.minZoom} - ${source.maxZoom}`);
      console.log(`  形式: ${source.fileExtension}`);
    });
  });

if (require.main === module) {
  if (process.argv.length === 2) {
    program.outputHelp();
  } else {
    program.parse(process.argv);
  }
}