# D&D Realm Cartographer

A procedural fantasy map generator that creates stunning, Lord of the Rings-inspired maps with vibrant colors for tabletop RPG campaigns.

## Project Overview

Create a web-based application that procedurally generates realistic fantasy maps. Users select a landmass type, and the generator creates a unique, explorable world complete with terrain, settlements, and points of interest. The aesthetic should evoke classic fantasy cartography (hand-drawn, parchment feel) but with a richer, more colorful palette.

---

## Core Features

### Map Type Selection

Users choose from the following landmass configurations:

| Type | Description |
|------|-------------|
| **Island** | Single isolated landmass surrounded by ocean |
| **Archipelago** | Cluster of islands with varying sizes |
| **Peninsula** | Land connected to a larger continent on one side |
| **Continent** | Large landmass with varied coastlines |
| **Inland Region** | Landlocked area (no ocean, surrounded by borders) |
| **Coastal Region** | Partial coastline with land extending off-map |
| **Isthmus** | Narrow strip connecting two larger landmasses |
| **Atoll** | Ring-shaped coral reef/island encircling a lagoon |
| **Delta** | River delta with branching waterways and sediment islands |
| **Fjord Coast** | Dramatic coastline with deep glacial inlets |

### Map Size Options

- **Local** (5-10 miles) - A village and its surroundings
- **Regional** (50-100 miles) - A barony or small kingdom
- **Kingdom** (200-500 miles) - A full nation
- **Continental** (1000+ miles) - Epic scale campaigns

---

## Procedural Generation Pipeline

### Phase 1: Tectonic Foundation
- Generate tectonic plate boundaries
- Simulate plate movement to create mountain ranges and fault lines
- Determine volcanic activity zones
- Create continental shelf depths

### Phase 2: Heightmap Generation
- Use layered noise algorithms (Perlin, Simplex, Worley)
- Apply erosion simulation (hydraulic and thermal)
- Carve river systems following realistic water flow
- Generate valleys, canyons, and geological features

### Phase 3: Climate Simulation
- Calculate latitude-based temperature zones
- Simulate prevailing wind patterns
- Generate precipitation maps based on terrain and wind
- Create rain shadows behind mountain ranges
- Determine ocean currents affecting coastal climates

### Phase 4: Biome Distribution
- Assign biomes based on temperature and precipitation
- Generate transition zones between biomes
- Add microbiomes in unique terrain features
- Scatter vegetation density maps

### Phase 5: Hydrology
- River generation from watersheds
- Lake formation in basins
- Wetland and marsh placement
- Underground water systems (for cave networks)
- Waterfalls at elevation changes

### Phase 6: Civilization Placement
- Settlement placement based on:
  - Fresh water access
  - Defensible positions
  - Trade route intersections
  - Resource proximity
  - Arable land availability
- Road network generation (following terrain)
- Border generation between territories
- Ruin placement in historically strategic locations

---

## View Modes

### Geographic Views

| View | Description |
|------|-------------|
| **Illustrated** | Classic fantasy map style with artistic terrain icons, decorative borders, and hand-drawn aesthetic |
| **Heightmap** | Grayscale elevation data (black = lowest, white = highest) |
| **Topographic** | Contour lines showing elevation changes |
| **Satellite** | Realistic top-down view with natural colors |
| **Political** | Territories, borders, and faction control zones |
| **Physical** | Color-coded terrain types without illustrations |

### Data Overlay Views

| View | Description |
|------|-------------|
| **Temperature** | Heat map showing climate zones (blue to red gradient) |
| **Precipitation** | Rainfall intensity visualization |
| **Biome** | Color-coded ecosystem regions |
| **Population Density** | Settlement and civilization spread |
| **Trade Routes** | Commercial pathways and their importance |
| **Danger Zones** | Monster territories, cursed lands, wild regions |
| **Magic Density** | Ley lines, magical hotspots, dead magic zones |
| **Resource Distribution** | Minerals, forests, farmland, special materials |
| **Wind Patterns** | Prevailing winds and storm paths |
| **Ocean Currents** | Sea travel routes and hazards |

### Special Views

| View | Description |
|------|-------------|
| **Player Map** | Fog of war - only explored areas visible |
| **DM Map** | Full information with hidden locations marked |
| **Parchment** | Aged paper effect with tea-stained aesthetics |
| **Night** | How the map looks at night (lights in cities) |
| **Seasonal** | Toggle between seasons (affects vegetation, snow coverage) |
| **Historical** | View the map at different points in its history |

---

## Terrain Types & Features

### Natural Terrain

**Mountains & Hills**
- Snow-capped peaks
- Volcanic mountains (active/dormant)
- Rolling hills
- Mesas and plateaus
- Cliff faces and escarpments
- Mountain passes

**Forests**
- Temperate deciduous
- Coniferous/Taiga
- Tropical rainforest
- Enchanted/magical forest (glowing, unusual colors)
- Dead/corrupted forest
- Mangrove swamps

**Water Features**
- Rivers (with rapids, forks, deltas)
- Lakes (freshwater, volcanic, magical)
- Waterfalls
- Hot springs and geysers
- Oases
- Underground rivers

**Wetlands**
- Swamps
- Marshes
- Bogs
- Fens
- Tidal flats

**Arid Regions**
- Sandy deserts (with dunes)
- Rocky badlands
- Salt flats
- Canyons
- Mesas

**Cold Regions**
- Glaciers
- Tundra
- Ice sheets
- Frozen lakes
- Permafrost zones

**Coastal**
- Beaches
- Cliffs
- Coves and bays
- Coral reefs
- Sea stacks
- Tide pools

**Grasslands**
- Plains
- Prairies
- Savannas
- Steppes
- Alpine meadows

### Fantastical Terrain

- **Floating Islands** - Gravity-defying landmasses
- **Crystal Forests** - Areas of crystalline growth
- **Blight Lands** - Corrupted, twisted terrain
- **Eternal Storm** - Regions of perpetual weather phenomena
- **Giant's Country** - Oversized terrain features
- **Fey Crossings** - Areas where the material plane thins
- **Shadowfell Bleeds** - Dark, muted regions
- **Elemental Scars** - Areas touched by elemental chaos
- **Petrified Battlefields** - Ancient magical war sites
- **Living Terrain** - Areas that shift and change

---

## Points of Interest Generation

### Settlements

**By Size:**
- Thorps (20-80 people)
- Hamlets (81-400)
- Villages (401-900)
- Small Towns (901-2,000)
- Large Towns (2,001-5,000)
- Small Cities (5,001-12,000)
- Large Cities (12,001-25,000)
- Metropolises (25,001+)

**Settlement Types:**
- Farming communities
- Mining towns
- Port cities
- Mountain fortresses
- Forest villages (including tree-top)
- Desert oases
- Floating settlements
- Underground cities
- Nomadic camp regions
- Magical academies

### Dungeons & Adventure Sites

- Ancient ruins
- Dragon lairs
- Wizard towers
- Abandoned mines
- Haunted mansions
- Sacred groves
- Monster dens
- Sunken temples
- Planar rifts
- Sealed tombs
- Crashed skyships
- Giant creature skeletons
- Cursed battlefields
- Fey rings
- Ancient observatories

### Infrastructure

- Roads (dirt, cobblestone, ancient)
- Bridges
- Walls and fortifications
- Lighthouses
- Wayshrine networks
- Teleportation circles
- Aqueducts
- Dams
- Quarries
- Farmland patterns

---

## Naming Generation

### Procedural Name Generator

Generate culturally-consistent names for:
- Regions and territories
- Mountains and mountain ranges
- Rivers and lakes
- Forests and wilds
- Settlements
- Points of interest

**Cultural Presets:**
- High Fantasy (Elvish-inspired)
- Nordic/Viking
- Celtic
- Mediterranean
- Eastern/Asian
- Arabic/Desert
- Slavic
- Germanic
- Tribal/Primitive
- Infernal/Dark
- Custom phoneme rules

### Naming Features
- Compound names based on terrain ("Stormhold," "Riverdale")
- Historical event names ("Dragonfall Keep")
- Descriptive names ("The Whispering Woods")
- Named after fictional figures
- Translations/alternate names for different cultures

---

## Export Options

### Image Formats
- PNG (with transparency options)
- JPEG (high quality)
- SVG (vector for printing)
- PDF (multi-page with legend)
- TIFF (print-ready)

### Export Sizes
- Screen (72 DPI)
- Print (300 DPI)
- Poster (large format)
- Tile-based (for VTT import)

### Data Exports
- JSON (full map data for re-import)
- GeoJSON (for GIS applications)
- Foundry VTT module
- Roll20 compatible
- Fantasy Grounds format
- World Anvil integration

### Print Options
- Single sheet
- Multi-page atlas
- Hexgrid overlay
- Square grid overlay
- Gridless
- Custom scale bar

---

## Interactive Features

### Map Editing Tools
- Terrain brush (paint terrain types)
- Elevation adjustment
- River drawing tool
- Road/path drawing
- Settlement placement
- POI markers (custom icons)
- Text labels (with styling)
- Border drawing
- Area highlighting

### Generation Controls
- Seed input (reproducible maps)
- Regenerate specific regions
- Lock areas from regeneration
- Adjust generation parameters:
  - Terrain roughness
  - Water coverage percentage
  - Forest density
  - Settlement density
  - Road connectivity
  - Fantasy element frequency

### Navigation
- Pan and zoom
- Minimap overview
- Bookmark locations
- Measurement tools
- Coordinate display

---

## Visual Style Options

### Map Themes
- **Classic Parchment** - Tolkien-inspired with brown inks
- **Colorful Fantasy** - Vibrant, saturated colors
- **Watercolor** - Soft, painted appearance
- **Ink & Wash** - Bold lines with color washes
- **Woodcut** - Medieval print aesthetic
- **Modern Minimal** - Clean, contemporary style
- **Dark Fantasy** - Muted, ominous palette
- **Tropical** - Bright, lush coloring
- **Winter** - Cool blues and whites
- **Ancient** - Faded, historical appearance

### Customization
- Custom color palettes
- Adjustable line weights
- Icon style selection
- Font choices for labels
- Border and compass rose styles
- Scale bar designs
- Legend positioning

### Decorative Elements
- Ornate borders
- Compass roses
- Sea monsters in ocean
- Ships and caravans
- Decorative cartouches
- Corner illustrations
- "Here be dragons" zones

---

## Technical Architecture

### Stack

| Layer | Technology |
|-------|------------|
| **Framework** | React 18+ with Vite |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS + CSS Modules for canvas UI |
| **State Management** | Zustand (lightweight, perfect for complex map state) |
| **Rendering** | HTML5 Canvas with Pixi.js (WebGL) for performance |
| **Generation** | Web Workers (offload heavy computation) |
| **Storage** | IndexedDB via Dexie.js (local map persistence) |
| **Routing** | React Router (for future multi-page features) |
| **Testing** | Vitest + React Testing Library |
| **Linting** | ESLint + Prettier |

### Project Structure

```
src/
├── assets/              # Static assets (icons, textures, fonts)
├── components/          # React components
│   ├── ui/              # Reusable UI components (buttons, modals)
│   ├── map/             # Map-specific components
│   ├── controls/        # Generation controls and settings
│   └── export/          # Export functionality
├── canvas/              # Canvas/Pixi.js rendering logic
│   ├── renderers/       # Different view mode renderers
│   ├── layers/          # Layer management
│   └── interactions/    # Pan, zoom, selection
├── generation/          # Procedural generation algorithms
│   ├── terrain/         # Heightmap, erosion, landmass
│   ├── climate/         # Temperature, precipitation, biomes
│   ├── hydrology/       # Rivers, lakes, water systems
│   ├── civilization/    # Settlements, roads, POIs
│   └── naming/          # Name generation
├── workers/             # Web Worker scripts
├── store/               # Zustand stores
├── hooks/               # Custom React hooks
├── utils/               # Utility functions
├── types/               # TypeScript type definitions
└── constants/           # Configuration constants
```

### Key Libraries

```json
{
  "dependencies": {
    "react": "^18.x",
    "react-dom": "^18.x",
    "zustand": "^4.x",
    "pixi.js": "^8.x",
    "@pixi/react": "^7.x",
    "simplex-noise": "^4.x",
    "dexie": "^4.x",
    "react-router-dom": "^6.x",
    "file-saver": "^2.x",
    "jszip": "^3.x"
  },
  "devDependencies": {
    "vite": "^5.x",
    "typescript": "^5.x",
    "tailwindcss": "^3.x",
    "vitest": "^1.x",
    "@types/react": "^18.x"
  }
}
```

### Performance Considerations

- **Web Workers** - All heavy generation runs off main thread
- **Progressive Rendering** - Show partial results during generation
- **Level of Detail** - Simplify rendering at low zoom levels
- **Chunked Generation** - Generate large maps in tiles
- **WebGL Shaders** - Custom shaders for terrain visualization
- **Memoization** - Cache expensive calculations
- **Virtual Layers** - Only render visible layers
- **RequestAnimationFrame** - Smooth canvas updates

### State Architecture

```typescript
// Main map store structure
interface MapStore {
  // Map metadata
  seed: string;
  mapType: MapType;
  mapSize: MapSize;

  // Generated data
  heightmap: Float32Array;
  biomes: Uint8Array;
  rivers: RiverNetwork;
  settlements: Settlement[];
  pois: PointOfInterest[];

  // View state
  currentView: ViewMode;
  zoom: number;
  pan: { x: number; y: number };
  visibleLayers: Set<LayerType>;

  // Actions
  generate: (config: GenerationConfig) => Promise<void>;
  setView: (view: ViewMode) => void;
  exportMap: (options: ExportOptions) => Promise<Blob>;
}
```

---

## Future Expansion Ideas

- **3D View Mode** - Perspective terrain visualization
- **Animation** - Animated water, clouds, day/night cycle
- **Collaboration** - Real-time multi-user editing
- **AI Enhancement** - GPT integration for location descriptions
- **VR Support** - Immersive map exploration
- **Mobile App** - Touch-optimized version
- **Procedural History** - Generate timeline of world events
- **Faction Simulation** - Watch borders change over time
- **Weather System** - Real-time weather generation
- **SoundScape** - Ambient audio based on terrain

---

## User Flow

```
1. NEW MAP
   ├── Select Map Type (Island, Continent, etc.)
   ├── Select Map Size (Local → Continental)
   ├── Choose Theme/Style
   └── Set Generation Parameters (or use defaults)

2. GENERATION
   ├── Watch progressive generation (optional)
   ├── Preview result
   └── Regenerate or Accept

3. CUSTOMIZE
   ├── Switch between View Modes
   ├── Edit terrain/features
   ├── Add/remove settlements and POIs
   ├── Adjust names
   └── Add custom markers and notes

4. EXPORT
   ├── Choose format and resolution
   ├── Select layers to include
   ├── Add grid overlay (optional)
   └── Download or share
```

---

## MVP Features (Phase 1)

1. Basic landmass generation (Island, Peninsula, Continent)
2. Heightmap with erosion
3. Basic biome distribution
4. River generation
5. Settlement placement (3 sizes)
6. 3 view modes (Illustrated, Heightmap, Political)
7. Basic naming generation
8. PNG export
9. Seed-based regeneration
10. Pan/zoom navigation

---

## Success Metrics

- Generation time under 10 seconds for regional maps
- Visually distinct output on each generation
- Geographically plausible terrain and hydrology
- Intuitive user interface requiring no tutorial
- Export quality suitable for printing at poster size
