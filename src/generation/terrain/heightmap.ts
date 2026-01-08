import { createNoise2D, type NoiseFunction2D } from 'simplex-noise';
import { SeededRandom } from '../../utils/random';
import { clamp, coordToIndex, smootherstep, distance } from '../../utils/math';
import type { MapType } from '../../types';

export interface HeightmapOptions {
  width: number;
  height: number;
  seed: string;
  mapType: MapType;
  seaLevel: number;
  roughness: number;
  waterCoverage: number;
}

/**
 * Generate a heightmap using layered simplex noise
 */
export function generateHeightmap(options: HeightmapOptions): Float32Array {
  const { width, height, seed, mapType, roughness, seaLevel, waterCoverage } = options;
  const rng = new SeededRandom(seed);
  const noise = createNoise2D(() => rng.next());

  const heightmap = new Float32Array(width * height);

  // Generate base terrain using fractal Brownian motion (fBm)
  generateFBM(heightmap, width, height, noise, roughness);

  // Apply landmass mask based on map type with domain warping and rotation
  applyLandmassMask(heightmap, width, height, mapType, rng, waterCoverage);

  // Normalize the heightmap
  normalizeHeightmap(heightmap);

  // Clean up artifacts (despeckle)
  // We do this BEFORE water coverage adjustment to ensure clean shapes
  cleanupArtifacts(heightmap, width, height, seaLevel);

  // Adjust heightmap to achieve desired water coverage
  adjustWaterCoverage(heightmap, seaLevel, waterCoverage, mapType);

  return heightmap;
}

/**
 * Clean up artifacts like single-pixel islands or lakes
 * Simple cellular automata pass: if a cell is surrounded by opposite type, flip it
 */
function cleanupArtifacts(
  heightmap: Float32Array,
  width: number,
  height: number,
  threshold: number
): void {
  // We do a single pass to remove obvious 1-pixel outliers
  // This is non-destructive enough to not ruin jagged coastlines but removes "sand in ocean"
  const changes: { idx: number; val: number }[] = [];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = coordToIndex(x, y, width);
      const val = heightmap[idx];
      const isLand = val > threshold;

      let neighborLandCount = 0;
      let neighbors = 0;

      // Check 4-connected neighbors
      const nIdxs = [
        coordToIndex(x + 1, y, width),
        coordToIndex(x - 1, y, width),
        coordToIndex(x, y + 1, width),
        coordToIndex(x, y - 1, width)
      ];

      for (const nIdx of nIdxs) {
        neighbors++;
        if (heightmap[nIdx] > threshold) neighborLandCount++;
      }

      // If we are land but surrounded by water (0 or 1 neighbor is land)
      if (isLand && neighborLandCount <= 1) {
        // Sink it
        changes.push({ idx, val: threshold - 0.01 });
      }
      // If we are water but surrounded by land (3 or 4 neighbors are land)
      else if (!isLand && neighborLandCount >= 3) {
        // Raise it
        changes.push({ idx, val: threshold + 0.01 });
      }
    }
  }

  // Apply changes
  for (const { idx, val } of changes) {
    heightmap[idx] = val;
  }
}

/**
 * Generate fractal Brownian motion noise
 */
function generateFBM(
  heightmap: Float32Array,
  width: number,
  height: number,
  noise: NoiseFunction2D,
  roughness: number
): void {
  const octaves = 6;
  const persistence = 0.5 + roughness * 0.2;
  const lacunarity = 2.0;
  const baseScale = Math.max(width, height) / 4;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let amplitude = 1;
      let frequency = 1;
      let value = 0;
      let maxAmplitude = 0;

      for (let o = 0; o < octaves; o++) {
        const nx = (x / baseScale) * frequency;
        const ny = (y / baseScale) * frequency;
        value += noise(nx, ny) * amplitude;
        maxAmplitude += amplitude;
        amplitude *= persistence;
        frequency *= lacunarity;
      }

      heightmap[coordToIndex(x, y, width)] = value / maxAmplitude;
    }
  }
}

/**
 * Apply a landmass mask based on the map type
 * The mask determines land (1) vs ocean (0) areas
 * We blend the terrain noise with the mask to create varied coastlines
 */
function applyLandmassMask(
  heightmap: Float32Array,
  width: number,
  height: number,
  mapType: MapType,
  rng: SeededRandom,
  waterCoverage: number
): void {
  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = Math.min(width, height) / 2;

  // Domain warping noise
  const warpNoiseX = createNoise2D(() => rng.next());
  const warpNoiseY = createNoise2D(() => rng.next());
  const warpScale = 0.005; // Low frequency for large shape distortion
  const warpStrength = Math.min(width, height) * 0.2; // 20% warp

  // Rotation parameters
  // We allow 360 degree rotation for most maps to vary orientation
  const angle = rng.next() * Math.PI * 2;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  // Scale variation (stretch)
  const scaleX = 0.8 + rng.next() * 0.4; // 0.8 to 1.2
  const scaleY = 0.8 + rng.next() * 0.4;

  const transformCoords = (x: number, y: number): { tx: number; ty: number } => {
    // 1. Center
    let dx = x - centerX;
    let dy = y - centerY;

    // 2. Rotate
    let rx = dx * cos - dy * sin;
    let ry = dx * sin + dy * cos;

    // 3. Scale
    rx *= scaleX;
    ry *= scaleY;

    // 4. Un-center (map back to 0..width/height space for the mask functions)
    return { tx: rx + centerX, ty: ry + centerY };
  };

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = coordToIndex(x, y, width);

      // Apply domain warping
      const wx = x + warpNoiseX(x * warpScale, y * warpScale) * warpStrength;
      const wy = y + warpNoiseY(x * warpScale, y * warpScale) * warpStrength;

      const dist = distance(wx, wy, centerX, centerY);
      const normalizedDist = dist / maxRadius;

      // Transform coordinates for directional shapes
      // We pass the warped coordinates to the transformer
      const { tx, ty } = transformCoords(wx, wy);

      // Variation for the mask itself
      // We use un-warped coords for this high-frequency detail noise to strictly match pixel space
      // or using warped is also fine. Let's use warped to match the distortions.
      const variation = warpNoiseX(wx / 50, wy / 50) * 0.2;

      let mask = 1;

      switch (mapType) {
        case 'island':
          mask = islandMask(normalizedDist, variation);
          break;
        case 'archipelago':
          // Pass the RNG to allow it to pick random centers
          mask = archipelagoMask(wx, wy, width, height, rng, normalizedDist);
          break;
        case 'peninsula':
          mask = peninsulaMask(tx, ty, width, height, normalizedDist, variation);
          break;
        case 'continent':
          mask = continentMask(normalizedDist, variation);
          break;
        case 'coastal':
          mask = coastalMask(tx, ty, width, height, variation, rng); // Pass RNG
          break;
        case 'inland':
          // Use water coverage to determine lake density/size
          // High waterCoverage = more lakes
          mask = inlandMask(wx, wy, width, height, rng, waterCoverage);
          break;
        case 'isthmus':
          mask = isthmusMask(tx, ty, width, height, variation);
          break;
        case 'atoll':
          mask = atollMask(wx, wy, width, height, rng, normalizedDist, variation);
          break;
        case 'great-lake':
          mask = greatLakeMask(wx, wy, width, height, rng, normalizedDist, variation, waterCoverage);
          break;
        case 'delta':
          mask = deltaMask(tx, ty, width, height, rng, variation);
          break;
        case 'fjord':
          mask = fjordMask(tx, ty, width, height, rng, variation);
          break;
      }

      // INLAND BLENDING:
      // For large landmasses, we want to carve out some lakes in the deep inland areas
      // to avoid massive boring flat lands.
      const largeLandmassTypes: MapType[] = ['continent', 'peninsula', 'isthmus', 'island'];
      if (largeLandmassTypes.includes(mapType) && mask > 0.8) {
        // Only affect deep inland (mask > 0.8)
        // Generate an "inland" mask purely for lakes (waterCoverage determines density)
        // We use the warped coordinates we already calculated
        const lakeVal = inlandMask(wx, wy, width, height, rng, waterCoverage);

        // If lakeVal is 0 (water), we want to reduce the mask to create a lake
        // But inlandMask returns 0 for water, 1 for land.
        if (lakeVal < 0.1) {
          // Ideally we smoothly blend it down.
          // If inlandMask says "lake here", we drop the mask value to seaLevel - epsilon
          // We can blend based on how "deep" into the lake we are, but inlandMask is binary-ish.
          // Let's just multiply the mask.
          mask *= 0.3; // Drop below sea level threshold
        }
      }

      // Blend terrain with mask to create proper land/ocean separation
      const terrainValue = (heightmap[idx] + 1) / 2; // Normalize noise from [-1,1] to [0,1]

      // Sea level is 0.35
      // Smooth blend instead of hard cuts to avoid artifacts
      const seaLvl = 0.35;

      // Use smootherstep for the mask transition
      // Values < 0.3 are ocean, > 0.5 are land. 0.3-0.5 is transition.
      // We want mask 0 -> 0 height (deep ocean)
      // mask 1 -> full terrain

      if (mask < 0.3) {
        // Ocean - fade out to 0
        // normalize mask 0..0.3 to 0..1
        const oceanDepth = mask / 0.3;
        heightmap[idx] = oceanDepth * seaLvl * 0.95; // Slightly below sea level key
      } else {
        // Land/Coast
        // normalize 0.3..1.0 to 0..1
        const landFactor = (mask - 0.3) / 0.7;
        const smoothedLand = smootherstep(0, 1, landFactor);

        // Base height is sea level
        // Max height is determined by terrain noise
        // At mask=0.3 (coast), height should be exactly seaLvl
        // At mask=1.0 (inland), height should be full terrain

        const minHeight = seaLvl;
        const maxHeight = 0.4 + terrainValue * 0.6; // Terrain noise lifts it up

        heightmap[idx] = minHeight + (maxHeight - minHeight) * smoothedLand;
      }
    }
  }
}

function islandMask(normalizedDist: number, variation: number): number {
  const falloff = smootherstep(0.3, 0.9, normalizedDist + variation);
  return 1 - falloff;
}

function archipelagoMask(
  x: number,
  y: number,
  width: number,
  height: number,
  rng: SeededRandom,
  _normalizedDist: number // Ignored to break circularity
): number {
  // New approach: Scattered clusters using voronoi-esque or noise peaks
  // This allows islands to form in a chain or random scatter, not just a circle

  const nx = x / width;
  const ny = y / height;

  // Create 3-5 centers for island groups
  // We don't actually need explicit centers, we can use low-frequency noise peaks
  const clusterNoise = createNoise2D(() => rng.next());
  const detailNoise = createNoise2D(() => rng.next());

  // 1. Broad cluster shapes (the "where" islands can be)
  // Scale 2-3 means 2-3 major blobs across the map
  const clusters = clusterNoise(nx * 3, ny * 3);

  // 2. Individual islands within clusters (the "what" shape)
  // Higher frequency
  const islands = detailNoise(nx * 15, ny * 15);

  // 3. Combine: Islands exist where clusters are high AND island noise is high
  // Normalize -1..1 to 0..1
  const clusterVal = (clusters + 1) / 2;
  const islandVal = (islands + 1) / 2;

  // Shape the clusters: push down low values to make gaps
  const shapedCluster = smootherstep(0.4, 0.8, clusterVal);

  // Combine
  let mask = shapedCluster * islandVal;

  // Boost the core of islands
  mask = mask * 1.5;

  // Fade edges of map slightly to ensure we don't have hard cuts
  const edgeDist = Math.max(Math.abs(nx - 0.5), Math.abs(ny - 0.5)) * 2; // 0 center, 1 edge
  const edgeFalloff = smootherstep(0.8, 1.0, edgeDist);

  return clamp(mask * (1 - edgeFalloff), 0, 1);
}

function peninsulaMask(
  x: number,
  y: number,
  width: number,
  height: number,
  _normalizedDist: number,
  variation: number
): number {
  // Peninsula extends from the top, narrowing toward the bottom into water
  const yFactor = y / height;
  const xCenter = Math.abs(x - width / 2) / (width / 2);

  // Width narrows as we go down (toward the tip)
  // Wide at top (mainland), narrow at bottom (peninsula tip)
  const baseWidth = 0.8 - yFactor * 0.6 + variation * 0.15;

  // The peninsula tapers to a point
  const tipStart = 0.7; // Peninsula tip starts at 70% down

  if (yFactor > tipStart) {
    // Taper to point
    const tipProgress = (yFactor - tipStart) / (1 - tipStart);
    const tipWidth = baseWidth * (1 - tipProgress * 0.9);

    if (xCenter < tipWidth) {
      const edgeSoftness = smootherstep(tipWidth, tipWidth * 0.5, xCenter);
      // Fade out at the very tip
      const tipFade = 1 - smootherstep(0.85, 1.0, yFactor);
      return edgeSoftness * tipFade;
    }
    return 0;
  }

  // Main body of peninsula
  if (xCenter < baseWidth) {
    return smootherstep(baseWidth, baseWidth * 0.6, xCenter);
  }
  return 0;
}

function continentMask(normalizedDist: number, variation: number): number {
  const falloff = smootherstep(0.5, 1.0, normalizedDist + variation * 0.5);
  return 1 - falloff * 0.7;
}

function coastalMask(
  x: number,
  y: number,
  width: number,
  height: number,
  variation: number,
  rng: SeededRandom
): number {
  // Ocean on left side with varied, jagged coastline
  const xFactor = x / width;
  const yFactor = y / height;

  // Create a wavy, irregular coastline using multiple sine waves
  // Randomize phases and frequencies
  const phase1 = rng.next() * Math.PI * 2;
  const phase2 = rng.next() * Math.PI * 2;
  const phase3 = rng.next() * Math.PI * 2;

  const wave1 = Math.sin(yFactor * Math.PI * 3 + phase1) * 0.08;
  const wave2 = Math.sin(yFactor * Math.PI * 7 + 1.5 + phase2) * 0.04;
  const wave3 = Math.sin(yFactor * Math.PI * 13 + 3.0 + phase3) * 0.02;

  // Add larger bays and headlands
  const bays = Math.sin(yFactor * Math.PI * 1.5) * 0.12;

  // Combine waves with variation noise
  const coastLine = 0.25 + wave1 + wave2 + wave3 + bays + variation * 0.15;

  // Create some inlets/fjords
  const inletChance = Math.sin(yFactor * Math.PI * 5) * Math.sin(yFactor * Math.PI * 8);
  const inlet = inletChance > 0.5 ? 0.1 : 0;

  const effectiveCoast = coastLine + inlet;

  if (xFactor < effectiveCoast) {
    // Gradual transition into water
    return smootherstep(0, effectiveCoast * 0.8, xFactor);
  }
  return 1;
}

function isthmusMask(
  x: number,
  y: number,
  width: number,
  height: number,
  variation: number
): number {
  const xCenter = Math.abs(x - width / 2) / (width / 2);
  const yFactor = y / height;

  // Wide at top and bottom (landmasses), narrow in the middle (the isthmus)
  // sin gives 0 at ends, 1 in middle - we want opposite
  const narrowness = Math.sin(yFactor * Math.PI);
  // Invert: wide at ends (0.7), narrow in middle (0.15)
  const isthmusWidth = 0.7 - narrowness * 0.55 + variation * 0.1;

  // Add some coastal variation
  const coastWobble = Math.sin(yFactor * Math.PI * 6) * 0.05;

  const effectiveWidth = isthmusWidth + coastWobble;

  if (xCenter < effectiveWidth) {
    return smootherstep(effectiveWidth, effectiveWidth * 0.7, xCenter);
  }
  return 0;
}

function atollMask(
  x: number,
  y: number,
  width: number,
  height: number,
  rng: SeededRandom,
  normalizedDist: number,
  variation: number
): number {
  // Atoll: broken ring of small islands around a central lagoon
  const centerX = width / 2;
  const centerY = height / 2;

  // Angle from center
  const angle = Math.atan2(y - centerY, x - centerX);

  // Create noise for breaking up the ring
  const breakNoise = createNoise2D(() => rng.next());
  const islandNoise = createNoise2D(() => rng.next());

  // Ring parameters
  const ringCenter = 0.45; // Where the ring of islands sits
  const ringWidth = 0.12; // Width of the ring zone

  // Distance from the ring center line
  const ringDist = Math.abs(normalizedDist - ringCenter);

  // Base ring shape
  const inRing = ringDist < ringWidth;

  if (!inRing) {
    // Outside ring - ocean (either lagoon or outer ocean)
    return 0;
  }

  // Break up the ring into separate islands using angular noise
  const angularBreak = breakNoise(Math.cos(angle) * 2, Math.sin(angle) * 2);
  const islandShape = islandNoise(x / 30, y / 30);

  // Create gaps in the ring (channels between islands)
  const gapThreshold = -0.1 + variation * 0.2;
  if (angularBreak < gapThreshold) {
    return 0; // Gap in the ring
  }

  // Island shape within the ring
  const ringStrength = 1 - ringDist / ringWidth;
  const islandMask = (angularBreak + 0.5) * ringStrength;

  // Add small island variation
  const smallIslands = islandShape > 0.3 ? 0.3 : 0;

  return clamp(islandMask + smallIslands, 0, 1);
}

function deltaMask(
  x: number,
  y: number,
  width: number,
  height: number,
  rng: SeededRandom,
  variation: number
): number {
  const xNorm = x / width;
  const yFactor = y / height;

  // Delta: land at top fanning out into finger-like islands toward the bottom (sea)
  // The river comes from top-center and splits into distributaries

  // Main delta shape - triangular, wider at bottom
  const centerX = 0.5;
  const distFromCenter = Math.abs(xNorm - centerX);
  const maxWidth = 0.1 + (1 - yFactor) * 0.45; // Narrow at top, wide at bottom

  if (distFromCenter > maxWidth) {
    return 0; // Outside delta
  }

  // Create distributary channels (fingers of water between land)
  const channelNoise = createNoise2D(() => rng.next());

  // More channels as we go toward the sea
  const channelDensity = (1 - yFactor) * 8 + 2;
  const channelPattern = channelNoise(xNorm * channelDensity, yFactor * 3);

  // Channels cut through the delta
  const isChannel = channelPattern < -0.2 - yFactor * 0.3;

  if (isChannel && yFactor > 0.3) {
    return 0; // Water channel
  }

  // Base land mask
  const edgeFade = smootherstep(maxWidth, maxWidth * 0.6, distFromCenter);

  // Add islands in the lower delta
  const islandNoise = channelNoise(x / 40, y / 40);
  const hasIsland = islandNoise > 0.2;

  if (yFactor > 0.7) {
    // Outer delta - scattered islands
    if (hasIsland) {
      return edgeFade * 0.8;
    }
    return 0;
  }

  // Inner delta - more solid land with channels
  return edgeFade * (0.6 + yFactor * 0.4 + variation * 0.1);
}

function fjordMask(
  x: number,
  y: number,
  width: number,
  height: number,
  rng: SeededRandom,
  variation: number
): number {
  const xNorm = x / width;
  const yFactor = y / height;

  // Fjord coast: deep, narrow inlets cutting into mountainous coastline
  // Ocean at top, land at bottom

  // Base: land increases toward bottom
  const baseLand = smootherstep(0.1, 0.5, yFactor);

  // Create multiple fjord channels using noise
  const fjordNoise1 = createNoise2D(() => rng.next());
  const fjordNoise2 = createNoise2D(() => rng.next());

  // Randomized frequencies for variety
  const freq1X = 4 + rng.next() * 3; // 4-7
  const freq1Y = 0.4 + rng.next() * 0.4; // 0.4-0.8
  const freq2X = 7 + rng.next() * 5; // 7-12
  const freq2Y = 0.6 + rng.next() * 0.6; // 0.6-1.2

  // Primary fjords - deep cuts into the land
  const fjord1 = fjordNoise1(xNorm * freq1X, yFactor * freq1Y);
  const fjord2 = fjordNoise2(xNorm * freq2X + 10, yFactor * freq2Y);

  // Fjords extend from the coast (top) deep into the land
  // They should be narrow and long
  const fjordDepth1 = fjord1 > 0.3 ? (fjord1 - 0.3) * 2.5 : 0;
  const fjordDepth2 = fjord2 > 0.4 ? (fjord2 - 0.4) * 2.0 : 0;

  // Fjords penetrate deeper into land the stronger the signal
  const maxFjordPenetration = 0.7; // How far fjords can reach (70% down the map)
  const fjordReach1 = fjordDepth1 * maxFjordPenetration;
  const fjordReach2 = fjordDepth2 * maxFjordPenetration * 0.8;

  // Check if we're in a fjord
  const inFjord1 = yFactor < fjordReach1 && fjord1 > 0.3;
  const inFjord2 = yFactor < fjordReach2 && fjord2 > 0.4;

  if (inFjord1 || inFjord2) {
    // Inside a fjord - this is water
    // But add some small islands/skerries
    const skerry = fjordNoise1(x / 20, y / 20);
    if (skerry > 0.7 && yFactor > 0.15) {
      return 0.6; // Small island in fjord
    }
    return 0; // Fjord water
  }

  // Add rugged coastline detail
  const coastDetail = fjordNoise1(xNorm * 15, yFactor * 2) * 0.15;

  // Near the coast, add more variation
  if (yFactor < 0.3) {
    const coastRuffle = fjordNoise2(xNorm * 20, yFactor * 10) * 0.2;
    if (coastRuffle > 0.15) {
      return 0; // Small bays
    }
  }

  return clamp(baseLand + coastDetail + variation * 0.1, 0, 1);
}

function inlandMask(
  x: number,
  y: number,
  width: number,
  height: number,
  rng: SeededRandom,
  waterCoverage: number
): number {
  // Inland map with Lakes
  // Standard inland is solid land (1)
  // We subtract noise to create lakes based on waterCoverage

  // waterCoverage 0.1 -> Few small lakes
  // waterCoverage 0.5 -> Many big lakes

  const lakeNoise = createNoise2D(() => rng.next());
  const lakeDetail = createNoise2D(() => rng.next());

  const nx = x / width;
  const ny = y / height;

  // Base noise
  // Use lower frequency for bigger lakes
  const val = lakeNoise(nx * 3, ny * 3);

  // Detail
  const detail = lakeDetail(nx * 10, ny * 10) * 0.2;

  const combined = val + detail;

  // Threshold determination
  // We want to return 0 (water) when combined < threshold
  // Low waterCoverage -> Low threshold (fewer things below it)
  // High waterCoverage -> High threshold

  // Map value range approx -1.2 to 1.2
  // We want waterCoverage 0 -> threshold -1.5 (none)
  // waterCoverage 1 -> threshold 1.5 (all)
  const threshold = (waterCoverage * 2.4) - 1.2;

  if (combined < threshold) {
    return 0; // Lake
  }

  return 1; // Land
}

function greatLakeMask(
  x: number,
  y: number,
  _width: number, // Unused
  _height: number, // Unused
  rng: SeededRandom,
  normalizedDist: number,
  _variation: number, // Unused
  waterCoverage: number
): number {
  // Great Lake: A massive central body of water surrounded by land
  // Inverse of an island/continent

  // Base circular shape from center (normalizedDist 0 at center, 1 at edge)
  // We want land at edges (dist > radius), water at center (dist < radius)

  // Water coverage determines size of the lake
  // 0.2 -> Small lake (radius 0.3)
  // 0.8 -> Huge lake (radius 0.7)
  const lakeRadius = 0.2 + waterCoverage * 0.5;

  // Distort the lake shape
  const shapeNoise = createNoise2D(() => rng.next());
  const distortion = shapeNoise(x / 150, y / 150) * 0.2;

  // Calculate boundary
  const lakeBoundary = lakeRadius + distortion;

  if (normalizedDist < lakeBoundary) {
    // Inside lake

    // Add some islands in the lake?
    const islandNoise = createNoise2D(() => rng.next());
    const islandVal = islandNoise(x / 50, y / 50);

    // Some islands near the shore or random
    if (islandVal > 0.6) {
      return 1; // Island
    }

    return 0; // Water
  }

  // Land
  // Smooth transition from lake to land
  return smootherstep(lakeBoundary, lakeBoundary + 0.1, normalizedDist);
}

/**
 * Normalize heightmap to [0, 1] range
 * Only clamps values - the mask application already produces proper ranges
 */
function normalizeHeightmap(heightmap: Float32Array): void {
  for (let i = 0; i < heightmap.length; i++) {
    heightmap[i] = clamp(heightmap[i], 0, 1);
  }
}

/**
 * Adjust heightmap to ensure proper sea level threshold
 * The mask already defines ocean vs land - this just ensures values are properly distributed
 */
function adjustWaterCoverage(
  _heightmap: Float32Array,
  _seaLevel: number,
  _targetWaterCoverage: number,
  mapType: MapType
): void {
  // For inland maps, push everything above sea level
  // Legacy adjustment removed to support lakes in inland maps
  // The inlandMask now handles water generation correctly
  if (mapType === 'inland') {
    // We allow lakes now, so we don't force everything up
    // But we might want to ensure the "land" parts are actually land
    // The mask sets them to > seaLevel, so we should be fine.
    // However, if we do nothing, the random noise might dip below seaLevel.
    // The mask logic in applyLandmassMask explicitly handles this:
    // ... heightmap[idx] = seaLvl + 0.03 + ...
    // So we are safe to remove this override.
    return;
  }

  // For other map types, the mask already defines ocean areas
  // Just ensure ocean values (negative after mask) stay below seaLevel
  // and land values are above seaLevel

  // No additional adjustment needed - normalization handles this
}
