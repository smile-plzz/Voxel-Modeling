# Voxel Toy Box 🎲

An interactive 3D voxel physics engine, sculpture playground, and morphing sandbox built with **Three.js**, **React**, and **TypeScript**.

![Voxel Toy Box](https://img.shields.io/badge/Three.js-r160-blue?style=for-the-badge&logo=three.js)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)

---

## 🌟 Key Features

### 🔨 3D War Hammer & Impact Physics System
- **Animated 3D Hammer Strike**: Trigger a heavy 3D Voxel War Hammer that cocks back, swings down at high speed, and smashes into sculptures with accelerating momentum.
- **Multi-Sized Hammer Arsenal**:
  - 🔨 **Precision Mini-Hammer**: Surgical strikes requiring multiple hits to break individual blocks.
  - 🛠️ **Sledgehammer**: Balanced medium blast radius for chipping away sections.
  - 💥 **Mega War Hammer**: Massive impact clearing large chunks in a single swing.
- **✨ Floating Debris Particle System**: Spawns floating, color-matched 3D debris fragments that erupt, tumble, and float upward with thermal draft physics whenever a block is hit or broken.
- **Radial Explosion Dynamics**: Voxels blast outward in proportion to their distance from the impact point.
- **💥 Configurable Explosion Tool**: Detonate radial kinetic blast waves at any targeted point on the sculpture, with a real-time adjustable blast radius slider (from surgical 6m to massive 60m blasts) and instant presets (10m, 20m, 35m, 55m).
- **Interactive Raycasting**: Click directly on any voxel in the 3D model canvas to land a targeted hammer blow on that exact spot!
- **Impact Visual Effects**: Features color-matched floating debris bursts, expanding shockwave rings, glowing spark particle bursts, and visceral camera shake on impact.

### 🧱 Voxel Layout Choosability (Block Geometry Styles)
- Switch voxel geometry layouts in real-time:
  - 🧊 **Cube**: Classic 3D Voxels.
  - 🧰 **Bevel**: Smooth chamfered blocks.
  - 🔮 **Orb**: Spherical 3D orb matrix.
  - 🏛️ **Pillars**: Cylindrical peg pillars.
  - 💎 **Gem**: Octahedron diamond crystals.
  - 🧱 **Toy Brick**: Studded Lego-style bricks.

### 🏙️ Mega & Standard Model Gallery
- **High-Performance Instanced Renderer**: Up to 250,000+ Voxels rendered smoothly via Three.js `InstancedMesh`.
- **Expanded Model Library**:
  - 🏎️ **Cyberpunk Sports Car** (Neon underglow & spoiler)
  - 🏛️ **Golden Pyramid Tomb** (Pharaoh entrance & twin Sphinx guardians)
  - 🐉 **Mechanical Cyber Dragon** (Spine plates & plasma beam)
  - 🗼 **Coastal Lighthouse** (Island, beacon light & ocean waves)
  - ⛵ **Royal Golden Galleon** (Triple masts & brass cannons)
  - 🛸 **Orbital Space Station** (Habitat ring & solar arrays)
  - 🐶 **Cute Pug Puppy** (Wrinkled snout & collar)
  - 💀 **Cybernetic Skull** (Glowing eye sockets & neural wires)
- **Mega Scenes**: Mega Metropolis (~100k), Volcano Island (~120k), Sphere Matrix (~100k), Titan Colossus (~150k), Galaxy Cluster (~200k), Cyber Megacity (~250k).
- **Classic Models**: Majestic Eagle, Fire Dragon, Sci-Fi Robot, Stone Castle, Star Fighter, Sports Car, Bamboo Panda, Pirate Galleon, and more.

### 🔄 Fast O(N) Color-Bucket Morphing & Rebuilding
- Rebuilds dismantled voxel rubble into any target sculpture by matching color hexes in linear time $O(N)$ with zero stutters.

### 💾 JSON Import & Export
- Export models to compact JSON format to share creations or import custom voxel arrays.

---

## 🎮 Controls

| Action | Control |
| :--- | :--- |
| **Rotate Camera** | Left-click + Drag |
| **Pan Camera** | Right-click + Drag / Middle-click |
| **Zoom In / Out** | Scroll Wheel / Pinch Gesture |
| **Hammer Strike (Targeted)** | Click directly on any voxel in the 3D canvas |
| **Hammer Smash (General)** | Click the **HAMMER SMASH** button at the bottom |
| **Rebuild Sculpture** | Click **Rebuild Into...** when model is dismantled |
| **Change Voxel Layout** | Select Voxel Layout pill (Cube, Bevel, Orb, Pillar, Gem, Brick) |
| **Export / Share** | Click **Share** button in top toolbar |

---

## 🛠️ Tech Stack

- **Framework**: React 18
- **3D Graphics**: Three.js (WebGL, InstancedMesh, ShadowMaps, Custom Geometry)
- **Camera Controls**: Three.js OrbitControls
- **Icons**: Lucide React
- **Styling**: Tailwind CSS
- **Build Tool**: Vite & TypeScript

---

## 🚀 Getting Started

1. Clone or download the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open your browser at `http://localhost:3000` (or `http://localhost:5173`).

---

## 📄 License

Distributed under the Apache 2.0 License.
