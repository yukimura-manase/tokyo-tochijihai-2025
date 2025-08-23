import axios, { AxiosResponse } from 'axios';
import fs from 'fs-extra';
import path from 'path';
import cliProgress from 'cli-progress';
import pLimit from 'p-limit';

export interface TileCoordinate {
  x: number;
  y: number;
  z: number;
}

export interface BoundingBox {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface DownloadOptions {
  url: string;
  outputPath: string;
  retries?: number;
  timeout?: number;
}

export interface TileDownloadResult {
  success: boolean;
  tile: TileCoordinate;
  path?: string;
  error?: string;
}

export function lon2tile(lon: number, zoom: number): number {
  return Math.floor((lon + 180) / 360 * Math.pow(2, zoom));
}

export function lat2tile(lat: number, zoom: number): number {
  return Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 
    1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
}

export function tile2lon(x: number, z: number): number {
  return x / Math.pow(2, z) * 360 - 180;
}

export function tile2lat(y: number, z: number): number {
  const n = Math.PI - 2 * Math.PI * y / Math.pow(2, z);
  return 180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

export function* getTilesInBoundingBox(bbox: BoundingBox, minZoom: number, maxZoom: number): Generator<TileCoordinate> {
  for (let z = minZoom; z <= maxZoom; z++) {
    const minX = lon2tile(bbox.west, z);
    const maxX = lon2tile(bbox.east, z);
    const minY = lat2tile(bbox.north, z);
    const maxY = lat2tile(bbox.south, z);
    
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        yield { x, y, z };
      }
    }
  }
}

export function getTilesInBoundingBoxArray(bbox: BoundingBox, minZoom: number, maxZoom: number): TileCoordinate[] {
  return Array.from(getTilesInBoundingBox(bbox, minZoom, maxZoom));
}

export async function downloadFile(options: DownloadOptions): Promise<boolean> {
  const { url, outputPath, retries = 3, timeout = 30000 } = options;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response: AxiosResponse = await axios({
        method: 'GET',
        url: url,
        responseType: 'stream',
        timeout: timeout,
        headers: {
          'User-Agent': 'TokyoDisasterEvacuationGuide/1.0'
        }
      });
      
      await fs.ensureDir(path.dirname(outputPath));
      
      const writer = fs.createWriteStream(outputPath);
      response.data.pipe(writer);
      
      return new Promise((resolve, reject) => {
        writer.on('finish', () => resolve(true));
        writer.on('error', reject);
      });
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  return false;
}

export async function downloadTile(
  tile: TileCoordinate,
  urlTemplate: string,
  outputDir: string,
  fileExtension: string = 'png'
): Promise<TileDownloadResult> {
  const url = urlTemplate
    .replace('{z}', tile.z.toString())
    .replace('{x}', tile.x.toString())
    .replace('{y}', tile.y.toString());
  
  const tilePath = path.join(outputDir, tile.z.toString(), tile.x.toString());
  const filePath = path.join(tilePath, `${tile.y}.${fileExtension}`);
  
  if (await fs.pathExists(filePath)) {
    return {
      success: true,
      tile,
      path: filePath
    };
  }
  
  try {
    await downloadFile({
      url,
      outputPath: filePath,
      retries: 3,
      timeout: 30000
    });
    
    return {
      success: true,
      tile,
      path: filePath
    };
  } catch (error) {
    return {
      success: false,
      tile,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export class ProgressBar {
  private bar: cliProgress.SingleBar;
  private total: number;
  private current: number;
  
  constructor(total: number, format?: string) {
    this.total = total;
    this.current = 0;
    this.bar = new cliProgress.SingleBar({
      format: format || 'Progress |{bar}| {percentage}% | {value}/{total} tiles | ETA: {eta}s',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true
    }, cliProgress.Presets.shades_classic);
  }
  
  start(): void {
    this.bar.start(this.total, 0);
  }
  
  increment(): void {
    this.current++;
    this.bar.update(this.current);
  }
  
  stop(): void {
    this.bar.stop();
  }
}

export async function downloadTilesParallel(
  tiles: TileCoordinate[] | Generator<TileCoordinate>,
  urlTemplate: string,
  outputDir: string,
  concurrency: number = 5,
  fileExtension: string = 'png',
  showProgress: boolean = true,
  totalCount?: number
): Promise<TileDownloadResult[]> {
  const limit = pLimit(concurrency);
  const tilesArray = Array.isArray(tiles) ? tiles : Array.from(tiles);
  const total = totalCount || tilesArray.length;
  const progressBar = showProgress ? new ProgressBar(total) : null;
  
  if (progressBar) {
    progressBar.start();
  }
  
  const promises = tilesArray.map(tile =>
    limit(async () => {
      const result = await downloadTile(tile, urlTemplate, outputDir, fileExtension);
      if (progressBar) {
        progressBar.increment();
      }
      return result;
    })
  );
  
  const results = await Promise.all(promises);
  
  if (progressBar) {
    progressBar.stop();
  }
  
  return results;
}

export async function downloadTilesBatch(
  tilesGenerator: Generator<TileCoordinate>,
  urlTemplate: string,
  outputDir: string,
  concurrency: number = 5,
  batchSize: number = 10000,
  fileExtension: string = 'png',
  showProgress: boolean = true,
  totalCount?: number
): Promise<TileDownloadResult[]> {
  const allResults: TileDownloadResult[] = [];
  const progressBar = showProgress && totalCount ? new ProgressBar(totalCount) : null;
  
  if (progressBar) {
    progressBar.start();
  }
  
  let batch: TileCoordinate[] = [];
  let batchNumber = 0;
  
  for (const tile of tilesGenerator) {
    batch.push(tile);
    
    if (batch.length >= batchSize) {
      batchNumber++;
      if (!progressBar) {
        console.log(`Processing batch ${batchNumber} (${batch.length} tiles)...`);
      }
      
      const limit = pLimit(concurrency);
      const promises = batch.map(t =>
        limit(async () => {
          const result = await downloadTile(t, urlTemplate, outputDir, fileExtension);
          if (progressBar) {
            progressBar.increment();
          }
          return result;
        })
      );
      
      const results = await Promise.all(promises);
      allResults.push(...results);
      batch = [];
      
      // Give memory a chance to be garbage collected
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  // Process remaining tiles
  if (batch.length > 0) {
    batchNumber++;
    if (!progressBar) {
      console.log(`Processing final batch ${batchNumber} (${batch.length} tiles)...`);
    }
    
    const limit = pLimit(concurrency);
    const promises = batch.map(t =>
      limit(async () => {
        const result = await downloadTile(t, urlTemplate, outputDir, fileExtension);
        if (progressBar) {
          progressBar.increment();
        }
        return result;
      })
    );
    
    const results = await Promise.all(promises);
    allResults.push(...results);
  }
  
  if (progressBar) {
    progressBar.stop();
  }
  
  return allResults;
}

export async function saveMetadata(
  outputDir: string,
  metadata: {
    source: string;
    downloadedAt: Date;
    totalTiles: number;
    successfulTiles: number;
    failedTiles: number;
    boundingBox: BoundingBox;
    zoomLevels: { min: number; max: number };
  }
): Promise<void> {
  const metadataPath = path.join(outputDir, 'metadata.json');
  await fs.writeJson(metadataPath, metadata, { spaces: 2 });
}

export function calculateTileCount(bbox: BoundingBox, minZoom: number, maxZoom: number): number {
  let count = 0;
  
  for (let z = minZoom; z <= maxZoom; z++) {
    const minX = lon2tile(bbox.west, z);
    const maxX = lon2tile(bbox.east, z);
    const minY = lat2tile(bbox.north, z);
    const maxY = lat2tile(bbox.south, z);
    
    count += (maxX - minX + 1) * (maxY - minY + 1);
  }
  
  return count;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export async function calculateDirectorySize(dirPath: string): Promise<number> {
  let totalSize = 0;
  
  const files = await fs.readdir(dirPath);
  
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stats = await fs.stat(filePath);
    
    if (stats.isDirectory()) {
      totalSize += await calculateDirectorySize(filePath);
    } else {
      totalSize += stats.size;
    }
  }
  
  return totalSize;
}