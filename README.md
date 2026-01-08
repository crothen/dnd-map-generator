# D&D Realm Cartographer
[Demo](https://crothen.github.io/dnd-map-generator/)

A procedural fantasy map generator for tabletop RPG campaigns, built with React, Vite, and TypeScript.

## Features

-   **Procedural Terrain**: Generates realistic heightmaps using layered Simplex noise, domain warping, and hydraulic erosion.
-   **Varied Map Types**:
    -   **Island / Archipelago / Atoll**: Classic oceanic maps.
    -   **Continent / Peninsula / Isthmus**: Large-scale landmasses with inland lakes.
    -   **Great Lake**: A massive central lake surrounded by land.
    -   **Fjord Coast**: Jagged, dramatic coastlines.
-   **Simulated Climate**:
    -   **Temperature**: Based on latitude, elevation, and noise.
    -   **Moisture**: Simulates wind patterns, rain shadows, and evaporation.
    -   **Biomes**: Whittaker-style classification (Desert, Rainforest, Tundra, etc.) with organic transitions.
-   **Civilization**:
    -   **Rivers**: Downhill flow simulation with lake pooling.
    -   **Settlements**: Towns and cities placed near water and flat land.
    -   **Names**: Procedural name generation for towns and rivers.
-   **Customization**:
    -   Control water levels, roughness, map size, and random seeds.
    -   Interactive "Water Level" slider for real-time lake/ocean adjustments.

## Getting Started

### Prerequisites

-   Node.js (v16+)
-   npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/crothen/dnd-map-generator.git

# Navigate to directory
cd dnd-map-generator

# Install dependencies
npm install
```

### Development

```bash
# Start the dev server
npm run dev
```

### Build

```bash
# Build for production
npm run build
```

## Deployment (GitHub Pages)

This project is configured to deploy to GitHub Pages via GitHub Actions.

1.  Push to `main`.
2.  The action will automatically build and deploy to `gh-pages` branch.
3.  Go to Settings > Pages in your repository and select the `gh-pages` branch as source.

## tech Stack

-   **Frontend**: React 19, TypeScript
-   **Build Tool**: Vite
-   **Styling**: Tailwind CSS
-   **Algorithms**: Simplex Noise, Cellular Automata, Hydraulic Erosion
-   **State Management**: Zustand

## License

MIT
