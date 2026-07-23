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
- **Interactive Raycasting**: Click directly on any voxel in the 3D model canvas to land a targeted hammer blow on that exact spot!
- **Impact Visual Effects**: Features color-matched floating debris bursts, expanding shockwave rings, glowing spark particle bursts, and visceral camera shake on impact.

### 🏙️ Mega Presets & High-Performance Instanced Renderer
- **Up to 250,000+ Voxels**: Utilizes Three.js `InstancedMesh` with `DynamicDrawUsage` for silky smooth 60 FPS performance.
- **Mega Scenes**:
  - 🏙️ **Mega Metropolis** (~100,000 blocks)
  - 🌋 **Volcano Island** (~120,000 blocks)
  - 🌐 **Sphere Matrix** (~100,000 blocks)
  - 🗿 **Titan Colossus** (~150,000 blocks)
  - ✨ **Galaxy Cluster** (~200,000 blocks)
  - 🌆 **Cyber Megacity** (~250,000 blocks)
- **Standard Presets**: Majestic Eagle, Fire Dragon, Sci-Fi Robot, Stone Castle, Star Fighter, Sports Car, Bamboo Panda, Pirate Galleon, and more.

### ⚙️ Density Scale Sub-divider
- Adjust scene density on the fly:
  - **1x** (Base Count)
  - **8x** (~25k blocks)
  - **27x** (~100k blocks)
  - **64x** (150k+ blocks)

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
| **Change Density Scale** | Select density pill (1x, 8x, 27x, 64x) |
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
