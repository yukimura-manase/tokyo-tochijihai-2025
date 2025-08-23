import { Command } from 'commander';
import fs from 'fs-extra';
import path from 'path';
import {
  getTilesInBoundingBox,
  downloadTilesBatch,
  saveMetadata,
  calculateTileCount,
  calculateDirectorySize,
  formatBytes,
  TileDownloadResult
} from './utils';
import {
  AREAS,
  OSM_SOURCES,
  DEFAULT_DOWNLOAD_CONFIG,
  getOutputDirectory
} from './config';

async function downloadOSMTiles(
  areaKey: string,
  sourceKey: string,
  minZoom: number,
  maxZoom: number,
  concurrency: number
): Promise<void> {
  const area = AREAS[areaKey];
  const source = OSM_SOURCES[sourceKey];
  
  if (!area) {
    console.error(`Error: Area '${areaKey}' not found`);
    console.log('Available areas:', Object.keys(AREAS).join(', '));
    process.exit(1);
  }
  
  if (!source) {
    console.error(`Error: Source '${sourceKey}' not found`);
    console.log('Available sources:', Object.keys(OSM_SOURCES).join(', '));
    process.exit(1);
  }
  
  const outputDir = path.join(__dirname, '..', getOutputDirectory('osm', sourceKey));
  
  console.log('========================================');
  console.log('OpenStreetMap Tile Downloader');
  console.log('========================================');
  console.log(`Area: ${area.name}`);
  console.log(`Source: ${source.name}`);
  console.log(`Bounding Box: N:${area.boundingBox.north}, S:${area.boundingBox.south}, E:${area.boundingBox.east}, W:${area.boundingBox.west}`);
  console.log(`Zoom Levels: ${minZoom} - ${maxZoom}`);
  console.log(`Output Directory: ${outputDir}`);
  console.log(`Concurrent Downloads: ${concurrency}`);
  console.log('========================================\n');
  
  const tileCount = calculateTileCount(area.boundingBox, minZoom, maxZoom);
  console.log(`Total tiles to download: ${tileCount.toLocaleString()}`);
  
  const estimatedSize = tileCount * 30 * 1024; // Assume average 30KB per tile
  console.log(`Estimated download size: ${formatBytes(estimatedSize)}\n`);
  
  const confirmation = await promptConfirmation(
    `This will download approximately ${tileCount.toLocaleString()} tiles (${formatBytes(estimatedSize)}). Continue?`
  );
  
  if (!confirmation) {
    console.log('Download cancelled.');
    process.exit(0);
  }
  
  await fs.ensureDir(outputDir);
  
  const tilesGenerator = getTilesInBoundingBox(area.boundingBox, minZoom, maxZoom);
  
  console.log('\nStarting download...\n');
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
  console.log('Download Complete');
  console.log('========================================');
  console.log(`Duration: ${duration.toFixed(2)} seconds`);
  console.log(`Successful: ${successfulDownloads.toLocaleString()} tiles`);
  console.log(`Failed: ${failedDownloads.toLocaleString()} tiles`);
  console.log(`Success Rate: ${((successfulDownloads / results.length) * 100).toFixed(2)}%`);
  
  if (failedDownloads > 0) {
    const failedTilesPath = path.join(outputDir, 'failed_tiles.json');
    const failedTiles = results.filter(r => !r.success).map(r => ({
      tile: r.tile,
      error: r.error
    }));
    await fs.writeJson(failedTilesPath, failedTiles, { spaces: 2 });
    console.log(`\nFailed tiles saved to: ${failedTilesPath}`);
  }
  
  const actualSize = await calculateDirectorySize(outputDir);
  console.log(`\nTotal disk usage: ${formatBytes(actualSize)}`);
  
  await saveMetadata(outputDir, {
    source: source.name,
    downloadedAt: new Date(),
    totalTiles: results.length,
    successfulTiles: successfulDownloads,
    failedTiles: failedDownloads,
    boundingBox: area.boundingBox,
    zoomLevels: { min: minZoom, max: maxZoom }
  });
  
  console.log('\nMetadata saved to metadata.json');
  console.log('\nDownload complete! Tiles are ready for offline use.');
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
  .name('osm-tiles')
  .description('Download OpenStreetMap tiles for Tokyo area')
  .version('1.0.0');

program
  .command('download')
  .description('Download OSM tiles')
  .option('-a, --area <area>', 'Area to download (tokyo_all, tokyo_23ku, tokyo_central, tokyo_tama)', 'tokyo_23ku')
  .option('-s, --source <source>', 'OSM tile source (standard, humanitarian)', 'standard')
  .option('--min-zoom <number>', 'Minimum zoom level', (val) => parseInt(val), DEFAULT_DOWNLOAD_CONFIG.minZoom)
  .option('--max-zoom <number>', 'Maximum zoom level', (val) => parseInt(val), DEFAULT_DOWNLOAD_CONFIG.maxZoom)
  .option('-c, --concurrency <number>', 'Number of concurrent downloads', (val) => parseInt(val), DEFAULT_DOWNLOAD_CONFIG.concurrency)
  .action(async (options) => {
    await downloadOSMTiles(
      options.area,
      options.source,
      options.minZoom,
      options.maxZoom,
      options.concurrency
    );
  });

program
  .command('list-areas')
  .description('List available areas')
  .action(() => {
    console.log('\nAvailable areas:');
    Object.entries(AREAS).forEach(([key, area]) => {
      console.log(`  ${key}: ${area.name}`);
      console.log(`    Bounds: N:${area.boundingBox.north}, S:${area.boundingBox.south}, E:${area.boundingBox.east}, W:${area.boundingBox.west}`);
    });
  });

program
  .command('list-sources')
  .description('List available OSM sources')
  .action(() => {
    console.log('\nAvailable OpenStreetMap sources:');
    Object.entries(OSM_SOURCES).forEach(([key, source]) => {
      console.log(`  ${key}: ${source.name}`);
      console.log(`    URL: ${source.urlTemplate}`);
      console.log(`    Zoom: ${source.minZoom} - ${source.maxZoom}`);
    });
  });

if (require.main === module) {
  if (process.argv.length === 2) {
    downloadOSMTiles(
      'tokyo_23ku',
      'standard',
      DEFAULT_DOWNLOAD_CONFIG.minZoom,
      DEFAULT_DOWNLOAD_CONFIG.maxZoom,
      DEFAULT_DOWNLOAD_CONFIG.concurrency
    );
  } else {
    program.parse(process.argv);
  }
}