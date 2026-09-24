# 🪐 GeoGenesis 3D

> **A real-time planetary geodynamics simulator, deep-time lithosphere sandbox, and geological idle tycoon.**

[![Built with Vite](https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Powered by Three.js](https://img.shields.io/badge/Three.js-r170-000000?logo=three.js&logoColor=white)](https://threejs.org/)
[![Status](https://img.shields.io/badge/Status-Prototype%20%2F%20Proof%20of%20Concept-orange)](#)
[![Vibe Coded](https://img.shields.io/badge/Vibe%20Coded-100%25%20Intuition%20%26%20AI-ff69b4)](#-a-note-on-the-codebase-mostly-vibe-coded)

---

## 🔮 The Idea

**What if Earth science was as engaging, tactile, and visually satisfying as a god-game, wrapped in an idle-tycoon progression loop?**

In **GeoGenesis 3D**, you oversee a living, rotating spherical planet spanning **4.54 billion years of deep geological time**. From the primordial inferno of the **Hadean Eon** to modern continental glaciations in the **Cenozoic Era**, the planet is driven by procedural plate kinematics, fault-friction thermodynamics, Milankovitch orbital climate cycles, and true stratigraphic core mechanics.

You aren't just an observer:
- **Drill 35 km deep boreholes** into the crust to reveal stratigraphic rock columns, borehole temperatures, lithostatic pressure, and rare mineral veins.
- **Trigger seismic ruptures** along strained fault lines to harvest mechanical earthquake energy.
- **Spawn volcanic mantle plumes**, carve U-shaped valleys with glacial ice, wash sediment downriver with fluvial erosion, or shatter the crust with supersonic meteorite impacts.
- **Automate extraction** by funding seismic arrays, geothermal boreholes, hydrothermal vents, and Moho mantle taps to fuel geological research and technological discovery.

---

## ⚠️ A Note on the Codebase: *Mostly Vibe Coded*

> **Notice:** This prototype is **mostly vibe coded**. 🌊✨
>
> It was built in a rapid, flow-state collaboration with AI assistants—prioritizing immediate tactile fun, gorgeous visuals, planetary scientific charm, and responsive user feedback over textbook software architecture or hyper-pedantic academic simulation models.
>
> - **Expect creative shortcuts:** Simplified plate boundaries, playful empirical formulas for seismic energy, and stylized thermal gradients.
> - **Expect great vibes:** Procedurally synthesized Web Audio rumble synthesizers, interactive 3D crustal shaders, glassmorphic HUDs, and real-time core cross-sections.
> - **Hackers & geonerds welcome:** If you see an unhandled edge case, an unphysical tectonic collision vector, or a quirk in the strata generation—feel free to tweak the knobs, hack the numbers, and submit PRs!

---

## 🌋 Key Systems & Features

### 1. 3D Spherical Geodynamics & Tectonic Plates
- **Dynamic Crustal Mesh**: A spherical geodesic terrain mesh that morphs dynamically based on tectonic uplift, rifting, and erosion.
- **Tectonic Drift & Boundaries**: 7 distinct tectonic plates with continuous kinematic motion, Euler drift direction arrows, and convergent/divergent/transform fault interactions.
- **Fault-Line Stress & Earthquakes**: Real-time shear stress accumulation along faults. Over-stressed faults trigger sudden ruptures, camera-shaking tremors, acoustic shockwaves, and harvested energy.

### 2. Deep Time & Epoch Evolution
Travel across 6 major planetary eras—each altering planetary ocean levels, volcanism rates, seismic frequency, and dominant mineral yields:
- **Hadean Eon (4,540 – 4,000 Ma)**: Magma ocean cooling, volatile degassing, asteroid bombardment, proto-crust formation.
- **Archean Eon (4,000 – 2,500 Ma)**: First stable continental cratons, hydrothermal gold vents, and massive Banded Iron Formations.
- **Proterozoic Eon (2,500 – 541 Ma)**: Supercontinent Rodinia assembly/breakup, Great Oxidation Event, vast carbonate platforms.
- **Paleozoic Era (541 – 252 Ma)**: Appalachian/Ural orogeny, swamp forest accumulation, thick Carboniferous coal measures.
- **Mesozoic Era (252 – 66 Ma)**: Pangaea rifting, Pacific Rim subduction, diamond kimberlite pipe emplacement.
- **Cenozoic Era (66 – 0 Ma)**: Modern Alpine-Himalayan orogeny, Milankovitch icehouse glaciations, exposed continental shelves.

### 3. Milankovitch Climate Engine & Glacial Ice Ages
- Orbital eccentricity oscillations compute real-time global surface temperatures.
- When temperatures plummet below 11°C, the planet plunges into an **Ice Age**, advancing white polar glaciers across continents and freezing high-altitude mountain chains.

### 4. Interactive Geologist Toolbelt
Interact directly with the planetary sphere using specialized geological tools:
- 🔍 **Core Drill**: Plunge a rotary borehole down 35 km to inspect lithological strata layers, temperature gradients, lithostatic pressure, and discover minerals.
- ⚡ **Trigger Fault**: Manually release tectonic strain on any fault zone to unleash an earthquake and collect instant seismic energy.
- 🌋 **Magma Plume Hotspot**: Inject an asthenospheric conduit to uplift active volcanic cones and erupt basaltic lava fields.
- ❄️ **Glacial Carve**: Scour broad U-shaped alpine valleys through mountain ranges.
- 🌧️ **Fluvial Weathering**: Trigger intense precipitation networks that carve dendritic river canyons and deposit sediment into coastal ocean deltas.
- ☄️ **Meteorite Impact**: Blast hypervelocity craters into the lithosphere, inducing shock metamorphism (diamond synthesis) and global seismic ringing.

### 5. Multi-Spectral Analytical Visual Overlays
Switch between specialized analytical visualizations on the fly:
- **🌍 Lithology**: Natural surface view with deep abyssal plains, shallow continental shelves, beaches, vegetated plains, highlands, and glaciated peaks.
- **🗺️ Plates & Drift**: Plate color-coding and animated 3D drift velocity vectors.
- **🔥 Fault Stress Heatmap**: Real-time stress colorization (green dormant &rarr; amber charged &rarr; crimson critical rupture).
- **💎 Mineral Radar**: Subsurface spectral scan highlighting precious veins (Gold, Diamond, Lithium, Iron Ore).
- **🔬 Planetary Core X-Ray**: Makes the crust transparent to expose the solid white-hot inner core, swirling liquid outer core magnetic dynamo, and convective mantle.

### 6. Idle Tycoon Economy & Research Tree
- **4 Key Resources**: Mineral Wealth (`$`), Seismic Energy (`MJ`), Geothermal Heat (`GW`), and Research Points (`RP`).
- **Automated Facilities**: Seismograph Arrays, Geothermal Boreholes, Automated Core Rigs, Hydrothermal Seafloor Taps, Subduction Tectonic Anchors, and Moho Mantle Plume Taps.
- **Technological Research**: Piezoelectric grids, mantle convection accelerators, diamond anvil presses, radiometric dating, and automated fault-venting rigs.

### 7. Lithosphere Compendium
Catalog and study **15 distinct rock and mineral classifications** complete with Mohs hardness ratings, genesis conditions, economic values, and geological descriptions:
- *Igneous*: Basalt, Obsidian, Granite
- *Sedimentary*: Sandstone, Shale, Limestone, Coal
- *Metamorphic*: Marble, Slate, Quartzite
- *Precious & Rare Veins*: Quartz, Gold, Diamond, Lithium, Uranium, Iron Ore

### 8. Procedural Web Audio Engine
100% synthetically generated sound effects via the Web Audio API—no external MP3/WAV assets needed:
- Sub-bass seismic fault rumbles
- Resonant volcanic explosive bursts
- High-frequency rotary drill friction
- Meteor impact blasts & supersonic shockwave hums

---

## 🛠️ Tech Stack & Architecture

- **Runtime / Bundler**: [Vite 6](https://vitejs.dev/) (ES Modules, HMR, zero-config bundling)
- **3D Graphics**: [Three.js r170](https://threejs.org/) (OrbitControls, procedural shaders, custom canvas heightmaps, particle systems)
- **Audio**: Web Audio API (Synthesized oscillators, noise buffers, and biquad filter nodes)
- **Styling**: Native CSS3 Glassmorphism (backdrop-filter blurs, CSS variables, zero heavy CSS framework bloat)
- **Architecture**: Modular vanilla JavaScript with decoupled simulation, visualization, and UI event loops:
  ```
  src/
  ├── config/             # Data configs (epochs, minerals, upgrades)
  ├── simulation/         # Headless geological & idle game logic
  │   ├── GeologyEngine.js   # Central orchestrator & tick dispatcher
  │   ├── StrataGrid.js      # Elevation, water table, strata layers
  │   ├── TectonicPlates.js  # Kinematics, boundaries, fault stresses
  │   ├── MineralSystem.js   # Vein seeding & discovery checks
  │   ├── BiomeSystem.js     # Elevation/climate classification
  │   └── IdleManager.js     # Resource accumulation & tech tree
  ├── visualizer/         # Three.js 3D rendering pipeline
  │   ├── Scene3D.js         # Camera, renderer, animation loop, rays
  │   ├── PlanetMesh.js      # Procedural sphere mesh & dynamic textures
  │   ├── CrustMesh.js       # Topographical displacement layers
  │   ├── FaultVisualizer.js # 3D fault boundaries & stress indicators
  │   ├── CoreXRayView.js    # Inner/outer core & mantle shaders
  │   ├── ParticleEffects.js # Eruptions, quakes, meteors, dust
  │   └── AudioFX.js         # Procedural sound synthesizers
  └── ui/                 # DOM HUD, Modals, Tooltips, & Controls
      ├── UIManager.js       # Dashboard, side deck, modals, toolbelt
      └── TooltipManager.js  # Floating descriptive telemetry tooltips
  ```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or higher recommended)
- `npm` or `pnpm` or `yarn`

### Installation & Run

1. Clone or open the repository:
   ```bash
   git clone https://github.com/your-username/geology-simulation.git
   cd "geology simulation"
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Launch the development server:
   ```bash
   npm run dev
   ```

4. Open your browser to the local URL (typically `http://localhost:5173/`).

### Production Build
To test or deploy a production bundle:
```bash
npm run build
npm run preview
```

---

## 🎮 How to Play

| Action | Control | Description |
| :--- | :--- | :--- |
| **Rotate Planet** | Left-Click + Drag | Orbits the camera around the spherical globe |
| **Pan Camera** | Right-Click + Drag | Translates camera focus |
| **Zoom** | Scroll Wheel / Pinch | Zooms in for detailed borehole inspections or out for global views |
| **Interact / Drill** | Left-Click (on planet) | Applies the currently selected tool (Drill, Slip, Volcano, etc.) |
| **Adjust Speed** | Top HUD Buttons | Cycle from `1x` (10 yr/s) up to `Epoch Warp` (10M yr/s) |
| **Toggle Core X-Ray**| Overlays &rarr; Core X-Ray | Peer through the crust into the dynamo and molten mantle |
| **Upgrade Operations**| Side Deck &rarr; Facilities | Spend mineral wealth to automate seismic and geothermal harvesting |

---

## 🗺️ Roadmap & Future Brainstorms

- [ ] **Fluid Atmospheric & Ocean Dynamics**: Add real-time Coriolis wind cells and thermohaline ocean conveyor belts.
- [ ] **Paleo-Biology & Fossil Records**: Track the appearance of cyanobacteria, trilobites, dinosaurs, and fossiliferous limestone beds.
- [ ] **Custom Planet Generator**: Sliders for planet mass, rotational speed, water budget, core thermal output, and tectonic plate count.
- [ ] **WebGPU Compute Shaders**: Scale the spherical strata grid from 64×32 up to 1024×512 for millimeter-scale fault scarps.
- [ ] **Exportable Geological Cross-Sections**: Download high-resolution PNG stratigraphic logs and GIS-compatible tectonic shapefiles.

---

## 📄 License

MIT License. Feel free to fork, experiment, learn, and build your own planetary geology worlds!
