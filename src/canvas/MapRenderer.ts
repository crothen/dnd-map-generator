import * as PIXI from 'pixi.js';
import type { MapData, ViewMode, Settlement } from '../types';
import { getBiomeColor, BIOME_IDS } from '../generation/climate/biomes';
import { coordToIndex } from '../utils/math';

export interface RendererOptions {
  container: HTMLElement;
  width: number;
  height: number;
}

export class MapRenderer {
  private app: PIXI.Application;
  private mapContainer: PIXI.Container;
  private terrainSprite: PIXI.Sprite | null = null;
  private riverGraphics: PIXI.Graphics;
  private settlementContainer: PIXI.Container;
  private labelContainer: PIXI.Container;
  private gridGraphics: PIXI.Graphics;

  private mapData: MapData | null = null;
  private viewMode: ViewMode = 'illustrated';
  private showRivers = true;
  private showLabels = true;
  private showGrid = false;

  private isDragging = false;
  private lastMousePos = { x: 0, y: 0 };

  private initialized = false;
  private destroyed = false;
  private initPromise: Promise<void> | null = null;

  constructor(private options: RendererOptions) {
    this.app = new PIXI.Application();
    this.mapContainer = new PIXI.Container();
    this.riverGraphics = new PIXI.Graphics();
    this.settlementContainer = new PIXI.Container();
    this.labelContainer = new PIXI.Container();
    this.gridGraphics = new PIXI.Graphics();
  }

  async init(): Promise<void> {
    this.initPromise = this.app.init({
      width: this.options.width,
      height: this.options.height,
      backgroundColor: 0x1a1a2e,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    await this.initPromise;

    // Check if destroyed while init was in progress
    if (this.destroyed) {
      return;
    }

    this.options.container.appendChild(this.app.canvas);

    // Set up container hierarchy
    this.app.stage.addChild(this.mapContainer);
    this.mapContainer.addChild(this.riverGraphics);
    this.mapContainer.addChild(this.settlementContainer);
    this.mapContainer.addChild(this.labelContainer);
    this.mapContainer.addChild(this.gridGraphics);

    // Enable interactivity
    this.app.stage.eventMode = 'static';
    this.app.stage.hitArea = this.app.screen;

    // Set up pan/zoom controls
    this.setupControls();

    this.initialized = true;
  }

  private setupControls(): void {
    const stage = this.app.stage;

    stage.on('pointerdown', (e: PIXI.FederatedPointerEvent) => {
      this.isDragging = true;
      this.lastMousePos = { x: e.globalX, y: e.globalY };
    });

    stage.on('pointerup', () => {
      this.isDragging = false;
    });

    stage.on('pointerupoutside', () => {
      this.isDragging = false;
    });

    stage.on('pointermove', (e: PIXI.FederatedPointerEvent) => {
      if (this.isDragging) {
        const dx = e.globalX - this.lastMousePos.x;
        const dy = e.globalY - this.lastMousePos.y;
        this.mapContainer.x += dx;
        this.mapContainer.y += dy;
        this.lastMousePos = { x: e.globalX, y: e.globalY };
      }
    });

    // Zoom with wheel
    this.app.canvas.addEventListener('wheel', (e: WheelEvent) => {
      e.preventDefault();
      const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.max(0.1, Math.min(10, this.mapContainer.scale.x * scaleFactor));

      // Zoom toward mouse position
      const mouseX = e.offsetX;
      const mouseY = e.offsetY;
      const worldPos = {
        x: (mouseX - this.mapContainer.x) / this.mapContainer.scale.x,
        y: (mouseY - this.mapContainer.y) / this.mapContainer.scale.y,
      };

      this.mapContainer.scale.set(newScale);

      this.mapContainer.x = mouseX - worldPos.x * newScale;
      this.mapContainer.y = mouseY - worldPos.y * newScale;
    });
  }

  setMapData(mapData: MapData): void {
    if (!this.initialized || this.destroyed) return;
    this.mapData = mapData;
    this.render();
  }

  setViewMode(mode: ViewMode): void {
    if (!this.initialized || this.destroyed) return;
    this.viewMode = mode;
    this.renderTerrain();
  }

  setShowRivers(show: boolean): void {
    if (!this.initialized || this.destroyed) return;
    this.showRivers = show;
    this.riverGraphics.visible = show;
  }

  setShowSettlements(show: boolean): void {
    if (!this.initialized || this.destroyed) return;
    this.settlementContainer.visible = show;
  }

  setShowLabels(show: boolean): void {
    if (!this.initialized || this.destroyed) return;
    this.showLabels = show;
    this.labelContainer.visible = show;
  }

  setShowGrid(show: boolean): void {
    if (!this.initialized || this.destroyed) return;
    this.showGrid = show;
    this.renderGrid();
  }

  setZoom(zoom: number): void {
    if (!this.initialized || this.destroyed) return;
    this.mapContainer.scale.set(zoom);
  }

  setPan(x: number, y: number): void {
    if (!this.initialized || this.destroyed) return;
    this.mapContainer.x = x;
    this.mapContainer.y = y;
  }

  resetView(): void {
    if (!this.initialized || this.destroyed) return;
    this.mapContainer.scale.set(1);
    this.mapContainer.x = 0;
    this.mapContainer.y = 0;
  }

  centerMap(): void {
    if (!this.mapData) return;

    const { width, height } = this.mapData.config;
    const scale = Math.min(
      this.options.width / width,
      this.options.height / height
    ) * 0.9;

    this.mapContainer.scale.set(scale);
    this.mapContainer.x = (this.options.width - width * scale) / 2;
    this.mapContainer.y = (this.options.height - height * scale) / 2;
  }

  private render(): void {
    this.renderTerrain();
    this.renderRivers();
    this.renderSettlements();
    this.renderGrid();
    this.centerMap();
  }

  private renderTerrain(): void {
    if (!this.mapData) return;

    const { width, height } = this.mapData.config;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.createImageData(width, height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = coordToIndex(x, y, width);
        const pixelIdx = idx * 4;

        const color = this.getPixelColor(x, y, idx);
        imageData.data[pixelIdx] = color.r;
        imageData.data[pixelIdx + 1] = color.g;
        imageData.data[pixelIdx + 2] = color.b;
        imageData.data[pixelIdx + 3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);

    // Remove old sprite
    if (this.terrainSprite) {
      this.mapContainer.removeChild(this.terrainSprite);
      this.terrainSprite.destroy();
    }

    // Create new sprite
    const texture = PIXI.Texture.from(canvas);
    this.terrainSprite = new PIXI.Sprite(texture);
    this.mapContainer.addChildAt(this.terrainSprite, 0);
  }

  private getPixelColor(x: number, y: number, idx: number): { r: number; g: number; b: number } {
    if (!this.mapData) return { r: 0, g: 0, b: 0 };

    switch (this.viewMode) {
      case 'heightmap':
        return this.getHeightmapColor(idx);
      case 'biome':
        return this.getBiomePixelColor(idx);
      case 'temperature':
        return this.getTemperatureColor(idx);
      case 'precipitation':
        return this.getPrecipitationColor(idx);
      case 'political':
        return this.getPoliticalColor(x, y, idx);
      default:
        return this.getIllustratedColor(x, y, idx);
    }
  }

  private getHeightmapColor(idx: number): { r: number; g: number; b: number } {
    const height = this.mapData!.heightmap[idx];
    const v = Math.floor(height * 255);
    return { r: v, g: v, b: v };
  }

  private getBiomePixelColor(idx: number): { r: number; g: number; b: number } {
    const biomeId = this.mapData!.biomes[idx];
    const colorHex = getBiomeColor(biomeId);
    return this.hexToRgb(colorHex);
  }

  private getTemperatureColor(idx: number): { r: number; g: number; b: number } {
    const temp = this.mapData!.temperature[idx];
    // Blue (cold) to Red (hot)
    return {
      r: Math.floor(temp * 255),
      g: Math.floor((1 - Math.abs(temp - 0.5) * 2) * 200),
      b: Math.floor((1 - temp) * 255),
    };
  }

  private getPrecipitationColor(idx: number): { r: number; g: number; b: number } {
    const moist = this.mapData!.moisture[idx];
    // Brown (dry) to Blue (wet)
    return {
      r: Math.floor((1 - moist) * 200 + 55),
      g: Math.floor((1 - moist) * 150 + 50 + moist * 50),
      b: Math.floor(moist * 200 + 55),
    };
  }

  private getPoliticalColor(x: number, y: number, idx: number): { r: number; g: number; b: number } {
    const biomeId = this.mapData!.biomes[idx];

    // Ocean stays blue
    if (biomeId === BIOME_IDS.ocean) {
      return { r: 100, g: 150, b: 200 };
    }

    // Land is a neutral tan color
    const base = { r: 230, g: 220, b: 190 };

    // Add slight variation based on position
    const variation = ((x * 13 + y * 17) % 20) - 10;

    return {
      r: Math.max(0, Math.min(255, base.r + variation)),
      g: Math.max(0, Math.min(255, base.g + variation)),
      b: Math.max(0, Math.min(255, base.b + variation)),
    };
  }

  private getIllustratedColor(x: number, y: number, idx: number): { r: number; g: number; b: number } {
    const biomeId = this.mapData!.biomes[idx];
    const height = this.mapData!.heightmap[idx];
    const baseColor = this.hexToRgb(getBiomeColor(biomeId));

    // Add shading based on height
    const shade = 0.7 + height * 0.3;

    // Add slight texture variation
    const noise = ((x * 7 + y * 11) % 20 - 10) / 100;

    return {
      r: Math.floor(Math.max(0, Math.min(255, baseColor.r * shade + noise * 50))),
      g: Math.floor(Math.max(0, Math.min(255, baseColor.g * shade + noise * 50))),
      b: Math.floor(Math.max(0, Math.min(255, baseColor.b * shade + noise * 50))),
    };
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 };
  }

  private renderRivers(): void {
    this.riverGraphics.clear();

    if (!this.mapData || !this.showRivers) return;

    for (const river of this.mapData.rivers) {
      if (river.segments.length < 2) continue;

      this.riverGraphics.moveTo(river.segments[0].x, river.segments[0].y);

      for (let i = 1; i < river.segments.length; i++) {
        const seg = river.segments[i];
        const width = Math.max(1, seg.flow * 3);

        this.riverGraphics.stroke({ width, color: 0x4488cc });
        this.riverGraphics.lineTo(seg.x, seg.y);
      }
    }
  }

  private renderSettlements(): void {
    this.settlementContainer.removeChildren();
    this.labelContainer.removeChildren();

    if (!this.mapData) return;

    for (const settlement of this.mapData.settlements) {
      // Draw settlement marker
      const graphics = new PIXI.Graphics();
      const size = this.getSettlementSize(settlement);

      graphics.circle(0, 0, size);
      graphics.fill({ color: 0x8b4513 });
      graphics.stroke({ width: 1, color: 0x000000 });

      graphics.x = settlement.x;
      graphics.y = settlement.y;

      this.settlementContainer.addChild(graphics);

      // Draw label
      if (this.showLabels) {
        const label = new PIXI.Text({
          text: settlement.name,
          style: {
            fontFamily: 'Lora, Georgia, serif',
            fontSize: Math.max(8, size + 4),
            fill: 0x000000,
            stroke: { color: 0xffffff, width: 2 },
          },
        });

        label.x = settlement.x + size + 2;
        label.y = settlement.y - label.height / 2;

        this.labelContainer.addChild(label);
      }
    }
  }

  private getSettlementSize(settlement: Settlement): number {
    switch (settlement.size) {
      case 'metropolis':
        return 8;
      case 'large_city':
        return 7;
      case 'small_city':
        return 6;
      case 'large_town':
        return 5;
      case 'small_town':
        return 4;
      case 'village':
        return 3;
      case 'hamlet':
        return 2;
      default:
        return 1.5;
    }
  }

  private renderGrid(): void {
    this.gridGraphics.clear();

    if (!this.mapData || !this.showGrid) return;

    const { width, height } = this.mapData.config;
    const gridSize = 50;

    this.gridGraphics.stroke({ width: 0.5, color: 0x000000, alpha: 0.3 });

    // Vertical lines
    for (let x = 0; x <= width; x += gridSize) {
      this.gridGraphics.moveTo(x, 0);
      this.gridGraphics.lineTo(x, height);
    }

    // Horizontal lines
    for (let y = 0; y <= height; y += gridSize) {
      this.gridGraphics.moveTo(0, y);
      this.gridGraphics.lineTo(width, y);
    }
  }

  resize(width: number, height: number): void {
    if (!this.initialized || this.destroyed) return;
    this.options.width = width;
    this.options.height = height;
    this.app.renderer.resize(width, height);
  }

  async destroy(): Promise<void> {
    this.destroyed = true;

    // Wait for init to complete before destroying
    if (this.initPromise) {
      await this.initPromise.catch(() => {});
    }

    if (this.initialized) {
      this.app.destroy(true);
    }
  }

  get isInitialized(): boolean {
    return this.initialized;
  }

  getCanvas(): HTMLCanvasElement {
    return this.app.canvas;
  }

  async exportImage(): Promise<Blob> {
    const canvas = this.app.canvas as HTMLCanvasElement;
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob!);
      }, 'image/png');
    });
  }
}
