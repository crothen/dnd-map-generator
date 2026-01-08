# Analysis of Map Generation

## Current State
The map generation relies on `simplex-noise` and geometric masking functions in `src/generation/terrain/heightmap.ts`.

### Issues Identified by User
1.  **Orientation**: Shapes are static or only flip 90 degrees.
    -   *Cause*: `applyLandmassMask` uses a simple switch on `rng.int(0, 3)` for basic flips.
2.  **Artifacts ("Random beach pixels")**:
    -   *Cause*: The blending logic in `applyLandmassMask` uses hard thresholds (`mask > 0.3` for beach). High-frequency noise components in `archipelagoMask` and `fjordMask` likely hover around this value, creating single-pixel islands.
3.  **Archipelago Roundness**:
    -   *Cause*: `archipelagoMask` uses `normalizedDist` (distance from center) for falloff (`densityFalloff = 1 - normalizedDist * 0.5`). This forces a circular distribution.
4.  **Lack of Variety**:
    -   *Cause*: Many mask functions use hardcoded frequencies and phases for sine waves and noise (e.g., `coastalMask` uses `Math.sin(yFactor * Math.PI * 3)`).
5.  **Unrealistic/Boring**:
    -   *Cause*: Simple geometric primitives (sine waves, linear gradients) are too apparent. The "FBM" noise is good but the masks override it too strongly with simple shapes.

## Proposed Changes

### 1. Advanced Coordinate Transformation (Domain Warping)
Instead of simple flips, we will implement **Domain Warping**.
-   Before passing `x, y` to mask functions, distort them using low-frequency noise.
    ```typescript
    const warpX = x + noise(x * scale, y * scale) * power;
    const warpY = y + noise(x * scale + 100, y * scale + 100) * power;
    ```
-   This will make "round" islands look organic and "straight" coastlines look natural.

### 2. Variable Orientation & Scale
-   Introduce rotation and stretching to the coordinate system.
-   Randomize the layout parameters (frequency, noise scales) based on the seed, rather than using constants.

### 3. Fix Archipelago
-   Replace the radial `densityFalloff` with a noise-based density map or a "Multi-center" approach (pick 3-5 random centers for island clusters instead of just one).
-   This removes the "perfect circle" effect.

### 4. Remove Artifacts (Beach Pixels)
-   Implement a "Despeckle" or "Clean" pass on the generated mask?
-   *Better*: Adjust the mask generation to "clamp" values. If `mask < 0.32` and `mask > 0.28`, push it down/up?
-   *Alternative*: Use smoother noise for the mask boundaries.

### 5. New Algorithm: "Voronoi-like" Regions for Archipelago?
-   The current noise-based approach is fine if configured better. We can layer "Continent" noise (low freq) with "Island" noise.

## Plan
1.  Update `gemini.md`.
2.  Refactor `heightmap.ts` to include `warpCoords` function.
3.  Rewrite `archipelagoMask` to use multiple centers and domain warping.
4.  Update `applyLandmassMask` to use continuous rotation/stretching instead of just flipping.
5.  Tune thresholds to eliminate beach artifacts.
