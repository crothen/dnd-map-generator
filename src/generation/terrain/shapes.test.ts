import { describe, it, expect } from 'vitest';
import { generateHeightmap } from './heightmap';
import { MapType } from '../../types';

describe('Map Type Shape Verification', () => {
    const width = 256;
    const height = 256;

    const testTypes: MapType[] = ['archipelago', 'atoll', 'fjord'];

    testTypes.forEach(type => {
        it(`generates valid ${type} map`, () => {
            const heightmap = generateHeightmap({
                width,
                height,
                seed: 'test-seed',
                mapType: type,
                seaLevel: 0.35,
                roughness: 0.5,
                waterCoverage: 0.5
            });

            // Check for valid values
            let min = Infinity;
            let max = -Infinity;
            let hasNaN = false;

            for (let i = 0; i < heightmap.length; i++) {
                const val = heightmap[i];
                if (Number.isNaN(val)) hasNaN = true;
                if (val < min) min = val;
                if (val > max) max = val;
            }

            expect(hasNaN).toBe(false);
            expect(min).toBeGreaterThanOrEqual(0);
            expect(max).toBeLessThanOrEqual(1);
        });
    });

    it('generates deep cuts for fjord', () => {
        const heightmap = generateHeightmap({
            width,
            height,
            seed: 'fjord-deep',
            mapType: 'fjord',
            seaLevel: 0.35,
            roughness: 0.5,
            waterCoverage: 0.5
        });

        // Fjord logic puts exactly -0.2 into the mask loop, which is then blended.
        // Wait, mask -0.2 -> (mask - 0.3) / 0.7  is for land
        // if mask < 0.3 -> it's ocean.
        // The fjordMask returns -0.2.
        // In applyLandmassMask:
        // if (mask < 0.3) { heightmap[idx] = (mask / 0.3) * seaLevel * 0.95 }
        // If mask is -0.2, then mask / 0.3 is negative!
        // So heightmap value will be negative.
        // generateHeightmap *normalizes* the map at the end (0..1).
        // So negative values will be normalized to 0.

        // So we expect some 0s (deepest ocean) in the top half of the map.
        let zeroCount = 0;
        for (let y = 0; y < height / 2; y++) {
            for (let x = 0; x < width; x++) {
                if (heightmap[y * width + x] === 0) zeroCount++;
            }
        }

        // We expect plenty of 0s because of the deep cuts
        expect(zeroCount).toBeGreaterThan(0);
    });
});
