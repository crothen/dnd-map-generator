import { createNoise2D } from 'simplex-noise';
import { SeededRandom } from '../../utils/random';
import { clamp, coordToIndex, gaussianBlur } from '../../utils/math';

export interface ClimateOptions {
  width: number;
  height: number;
  seed: string;
  heightmap: Float32Array;
  seaLevel: number;
}

export interface ClimateData {
  temperature: Float32Array;
  moisture: Float32Array;
}

/**
 * Generate climate data (temperature and moisture) based on heightmap
 */
export function generateClimate(options: ClimateOptions): ClimateData {
  const { width, height, seed, heightmap, seaLevel } = options;
  const rng = new SeededRandom(seed + '_climate');

  const temperature = generateTemperature(width, height, heightmap, seaLevel, rng);
  const moisture = generateMoisture(width, height, heightmap, temperature, seaLevel, rng);

  return { temperature, moisture };
}

/**
 * Generate temperature map
 * Temperature decreases with:
 * - Latitude (distance from equator/center)
 * - Elevation (higher = colder)
 */
function generateTemperature(
  width: number,
  height: number,
  heightmap: Float32Array,
  seaLevel: number,
  rng: SeededRandom
): Float32Array {
  const temperature = new Float32Array(width * height);
  const noise = createNoise2D(() => rng.next());

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = coordToIndex(x, y, width);
      const elevation = heightmap[idx];

      // Latitude effect: warmer at center (equator), colder at poles
      const latitudeFactor = 1 - Math.abs(y / height - 0.5) * 2;
      const baseTemp = latitudeFactor * 0.8 + 0.1;

      // Elevation effect: temperature decreases with altitude
      const elevationAboveSea = Math.max(0, elevation - seaLevel);
      const elevationFactor = 1 - elevationAboveSea * 1.5;

      // Add some noise for variation
      // Uses multi-scale noise for smoother, natural transitions instead of pixel jitter
      // Low frequency (x/150) gives broad regional variances
      // Medium frequency (x/50) gives local weather patterns
      const noiseLow = noise(x / 150, y / 150) * 0.15;
      const noiseMed = noise(x / 50 + 500, y / 50 + 500) * 0.08;
      const noiseValue = noiseLow + noiseMed;

      // Ocean moderates temperature
      const oceanModeration = elevation < seaLevel ? 0.5 : 0;

      temperature[idx] = clamp(
        baseTemp * elevationFactor + noiseValue + oceanModeration * 0.2,
        0,
        1
      );
    }
  }

  // Smooth the temperature map
  return gaussianBlur(temperature, width, height, 3);
}

/**
 * Generate moisture map
 * Moisture is affected by:
 * - Proximity to water (radial spread)
 * - Rain shadow from mountains
 * - Random wind patterns based on seed
 */
function generateMoisture(
  width: number,
  height: number,
  heightmap: Float32Array,
  temperature: Float32Array,
  seaLevel: number,
  rng: SeededRandom
): Float32Array {
  const moisture = new Float32Array(width * height);
  const noise = createNoise2D(() => rng.next());

  // First pass: identify water cells and set their moisture to max
  const waterMask = new Float32Array(width * height);
  for (let i = 0; i < heightmap.length; i++) {
    if (heightmap[i] < seaLevel) {
      waterMask[i] = 1;
      moisture[i] = 1;
    }
  }

  // Distance-based moisture spread from water (no directional bias)
  // Multiple passes to spread moisture inland
  const spreadPasses = 30;
  const tempMoisture = new Float32Array(moisture);

  for (let pass = 0; pass < spreadPasses; pass++) {
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = coordToIndex(x, y, width);

        if (heightmap[idx] >= seaLevel) {
          // Get max moisture from neighbors
          const neighbors = [
            tempMoisture[coordToIndex(x - 1, y, width)],
            tempMoisture[coordToIndex(x + 1, y, width)],
            tempMoisture[coordToIndex(x, y - 1, width)],
            tempMoisture[coordToIndex(x, y + 1, width)],
          ];
          const maxNeighbor = Math.max(...neighbors);

          // Spread moisture, reduced by elevation (rain shadow)
          const elevation = heightmap[idx];
          const elevationPenalty = elevation > seaLevel + 0.3 ? 0.7 : 0.92;

          tempMoisture[idx] = Math.max(tempMoisture[idx], maxNeighbor * elevationPenalty);
        }
      }
    }
  }

  // Copy back
  for (let i = 0; i < moisture.length; i++) {
    moisture[i] = tempMoisture[i];
  }

  // Add noise and temperature effects
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = coordToIndex(x, y, width);

      if (heightmap[idx] >= seaLevel) {
        // Add variation with noise
        // Smooth, organic noise (scale 100, 50) instead of high frequency
        const noiseValue = noise(x / 100, y / 100) * 0.2 + noise(x / 50, y / 50) * 0.1;

        // Warmer areas evaporate more
        const tempEffect = temperature[idx] * 0.15;

        moisture[idx] = clamp(moisture[idx] + noiseValue - tempEffect, 0, 1);
      }
    }
  }

  // Smooth the moisture map
  return gaussianBlur(moisture, width, height, 4);
}

/**
 * Calculate wind patterns (simplified)
 */
export function generateWindPatterns(
  width: number,
  height: number,
  seed: string
): { dx: Float32Array; dy: Float32Array } {
  const rng = new SeededRandom(seed + '_wind');
  const noise = createNoise2D(() => rng.next());

  const dx = new Float32Array(width * height);
  const dy = new Float32Array(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = coordToIndex(x, y, width);

      // Base prevailing winds (simplified trade winds / westerlies)
      const latitude = y / height;
      let baseWindX: number;
      let baseWindY: number;

      if (latitude < 0.3) {
        // Polar easterlies
        baseWindX = -0.5;
        baseWindY = 0.2;
      } else if (latitude < 0.6) {
        // Westerlies
        baseWindX = 0.7;
        baseWindY = 0;
      } else {
        // Trade winds
        baseWindX = -0.5;
        baseWindY = -0.2;
      }

      // Add turbulence
      const turbulenceX = noise(x / 50, y / 50) * 0.3;
      const turbulenceY = noise(x / 50 + 100, y / 50 + 100) * 0.3;

      dx[idx] = baseWindX + turbulenceX;
      dy[idx] = baseWindY + turbulenceY;
    }
  }

  return { dx, dy };
}
