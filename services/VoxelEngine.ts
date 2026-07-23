/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils';
import { AppState, SimulationVoxel, RebuildTarget, VoxelData, ToolType, VoxelEngineStats, VoxelLayoutStyle } from '../types';
import { CONFIG } from '../utils/voxelConstants';

interface DebrisParticle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  rx: number;
  ry: number;
  rz: number;
  rvx: number;
  rvy: number;
  rvz: number;
  scale: number;
  initialScale: number;
  color: THREE.Color;
  life: number;
  maxLife: number;
  active: boolean;
}

export class VoxelEngine {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private instanceMesh: THREE.InstancedMesh | null = null;
  private dummy = new THREE.Object3D();
  
  private voxels: SimulationVoxel[] = [];
  private rebuildTargets: RebuildTarget[] = [];
  private rebuildStartTime: number = 0;
  
  private state: AppState = AppState.STABLE;
  private onStateChange: (state: AppState) => void;
  private onCountChange: (count: number) => void;
  private onStatsChange: (stats: VoxelEngineStats) => void;
  private animationId: number = 0;

  // --- Interactive Tools & Play Modes ---
  private activeTool: ToolType = 'miniHammer';
  private paintColor: number = 0xec4899; // Default Neon Pink
  private hitsCount: number = 0;

  // --- Hammer & Impact FX Props ---
  private hammerGroup: THREE.Group;
  private shockwaveMesh: THREE.Mesh;
  private sparkParticles: THREE.Points;
  private sparkGeom: THREE.BufferGeometry;
  private sparkPositions: Float32Array;
  private sparkVelocities: Float32Array;

  // --- Floating Debris Particle System Props ---
  private debrisMesh!: THREE.InstancedMesh;
  private debrisParticles: DebrisParticle[] = [];
  private maxDebrisCount: number = 600;
  private debrisDummy = new THREE.Object3D();

  // --- Dynamite FX Props ---
  private dynamiteGroup: THREE.Group;
  private isDynamiteActive: boolean = false;
  private dynamiteStartTime: number = 0;
  private dynamiteTargetPoint = new THREE.Vector3();

  // --- Explosion Tool State ---
  private explosionRadius: number = 20;

  // --- Voxel Layout Choosability State ---
  private layoutStyle: VoxelLayoutStyle = 'cube';

  private isSmashing: boolean = false;
  private smashProgress: number = 0;
  private smashStartPoint = new THREE.Vector3();
  private smashTargetPoint = new THREE.Vector3();
  private currentHitRadius: number = 8;
  private currentBlastForce: number = 1.2;

  private cameraShakeIntensity: number = 0;
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();

  private modelBounds = {
    minX: -10, maxX: 10,
    minY: 0, maxY: 20,
    minZ: -10, maxZ: 10
  };

  constructor(
    container: HTMLElement, 
    onStateChange: (state: AppState) => void,
    onCountChange: (count: number) => void,
    onStatsChange: (stats: VoxelEngineStats) => void
  ) {
    this.container = container;
    this.onStateChange = onStateChange;
    this.onCountChange = onCountChange;
    this.onStatsChange = onStatsChange;

    // Init Three.js
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(CONFIG.BG_COLOR);
    this.scene.fog = new THREE.Fog(CONFIG.BG_COLOR, 80, 250);

    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000);
    this.camera.position.set(40, 40, 80);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.5;
    this.controls.target.set(0, 10, 0);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLight.position.set(80, 120, 50);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.left = -100;
    dirLight.shadow.camera.right = 100;
    dirLight.shadow.camera.top = 100;
    dirLight.shadow.camera.bottom = -100;
    this.scene.add(dirLight);

    // Floor
    const planeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 1 });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(500, 500), planeMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = CONFIG.FLOOR_Y;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Create 3D Hammer Mesh
    this.hammerGroup = this.createHammerMesh();
    this.scene.add(this.hammerGroup);

    // Create 3D Dynamite Mesh
    this.dynamiteGroup = this.createDynamiteMesh();
    this.scene.add(this.dynamiteGroup);

    // Shockwave Ring
    this.shockwaveMesh = this.createShockwaveRing();
    this.scene.add(this.shockwaveMesh);

    // Spark Particles
    const sparkObj = this.createSparkParticles();
    this.sparkParticles = sparkObj.points;
    this.sparkGeom = sparkObj.geom;
    this.sparkPositions = sparkObj.positions;
    this.sparkVelocities = sparkObj.velocities;
    this.scene.add(this.sparkParticles);

    // Floating Debris Particle System
    this.debrisMesh = this.createDebrisParticleSystem();
    this.scene.add(this.debrisMesh);

    // Pointer Interaction Handler
    this.container.addEventListener('pointerdown', this.handlePointerDown.bind(this));

    this.animate = this.animate.bind(this);
    this.animate();
  }

  public setTool(tool: ToolType) {
    this.activeTool = tool;
  }

  public setPaintColor(colorHex: number) {
    this.paintColor = colorHex;
  }

  /**
   * Constructs a 3D Voxel War Hammer
   */
  private createHammerMesh(): THREE.Group {
    const hammer = new THREE.Group();

    // Wood Handle
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x5a3d28, roughness: 0.6 });
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 22, 12), handleMat);
    handle.position.y = -11;
    handle.castShadow = true;
    hammer.add(handle);

    // Gold Grip Rings
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.25, metalness: 0.85 });
    for (let i = 0; i < 5; i++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.15, 8, 16), goldMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = -16 + i * 2.5;
      ring.castShadow = true;
      hammer.add(ring);
    }

    // Heavy Metallic Hammer Head
    const headMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3, metalness: 0.9 });
    const head = new THREE.Mesh(new THREE.BoxGeometry(12, 7, 7), headMat);
    head.castShadow = true;
    hammer.add(head);

    // Metallic Striking Faces
    const faceMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.2, metalness: 0.95 });
    [-6.3, 6.3].forEach(x => {
      const face = new THREE.Mesh(new THREE.BoxGeometry(1.0, 6.2, 6.2), faceMat);
      face.position.x = x;
      face.castShadow = true;
      hammer.add(face);
    });

    // Glowing Power Gem in center
    const gemMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(2.2), gemMat);
    gem.position.z = 3.6;
    hammer.add(gem);

    hammer.visible = false;
    return hammer;
  }

  private createDynamiteMesh(): THREE.Group {
    const dyn = new THREE.Group();

    // Red TNT Sticks
    const redMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 });
    const yellowMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.5 });
    const blackMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.8 });

    // 3 Cylinders bundled together
    const offsets = [
      { x: -0.8, z: 0 },
      { x: 0.8, z: 0 },
      { x: 0, z: 1.2 }
    ];

    offsets.forEach(off => {
      const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 6, 12), redMat);
      stick.position.set(off.x, 3, off.z);
      stick.castShadow = true;
      dyn.add(stick);
    });

    // Yellow Strap
    const strap = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 1, 16), yellowMat);
    strap.position.y = 3;
    dyn.add(strap);

    // Black Fuse Wire
    const fuse = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.5, 8), blackMat);
    fuse.position.set(0, 6.5, 0);
    fuse.rotation.z = -0.3;
    dyn.add(fuse);

    // Glowing Spark at top of fuse
    const sparkMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const spark = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 8), sparkMat);
    spark.position.set(-0.4, 7.5, 0);
    spark.name = "spark";
    dyn.add(spark);

    dyn.visible = false;
    return dyn;
  }

  private createShockwaveRing(): THREE.Mesh {
    const geom = new THREE.RingGeometry(0.1, 1.5, 32);
    geom.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({ 
      color: 0xf59e0b, 
      side: THREE.DoubleSide, 
      transparent: true, 
      opacity: 0 
    });
    const ring = new THREE.Mesh(geom, mat);
    ring.visible = false;
    return ring;
  }

  private createSparkParticles() {
    const pCount = 150;
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(pCount * 3);
    const velocities = new Float32Array(pCount * 3);

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xfcb316,
      size: 1.4,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending
    });

    const points = new THREE.Points(geom, mat);
    points.visible = false;
    return { points, geom, positions, velocities };
  }

  private createDebrisParticleSystem(): THREE.InstancedMesh {
    const geom = new THREE.BoxGeometry(0.55, 0.55, 0.55);
    const mat = new THREE.MeshStandardMaterial({
      roughness: 0.5,
      metalness: 0.2,
      transparent: true,
      opacity: 0.95
    });
    const mesh = new THREE.InstancedMesh(geom, mat, this.maxDebrisCount);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    this.debrisParticles = new Array(this.maxDebrisCount);
    for (let i = 0; i < this.maxDebrisCount; i++) {
      this.debrisParticles[i] = {
        x: 0, y: -1000, z: 0,
        vx: 0, vy: 0, vz: 0,
        rx: 0, ry: 0, rz: 0,
        rvx: 0, rvy: 0, rvz: 0,
        scale: 0,
        initialScale: 0,
        color: new THREE.Color(0xffffff),
        life: 0,
        maxLife: 1,
        active: false
      };
      this.debrisDummy.position.set(0, -1000, 0);
      this.debrisDummy.scale.set(0, 0, 0);
      this.debrisDummy.updateMatrix();
      mesh.setMatrixAt(i, this.debrisDummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    return mesh;
  }

  /**
   * Spawns floating debris fragments at a hit/impact location
   */
  public spawnFloatingDebris(impact: THREE.Vector3, countToSpawn: number, blastForce: number, sampleColors: THREE.Color[]) {
    let spawned = 0;
    for (let i = 0; i < this.maxDebrisCount && spawned < countToSpawn; i++) {
      const p = this.debrisParticles[i];
      if (!p.active || p.life <= 0) {
        p.active = true;
        p.x = impact.x + (Math.random() - 0.5) * 2.5;
        p.y = impact.y + (Math.random() - 0.5) * 2.5;
        p.z = impact.z + (Math.random() - 0.5) * 2.5;

        // Outward radial direction + strong upward thermal buoyancy
        const theta = Math.random() * Math.PI * 2;
        const phi = (Math.random() - 0.1) * Math.PI * 0.5;
        const speed = (0.6 + Math.random() * 1.8) * Math.min(2.5, blastForce);

        p.vx = Math.cos(theta) * Math.cos(phi) * speed;
        p.vy = Math.sin(phi) * speed + (0.9 + Math.random() * 1.4); // Floating upward impulse
        p.vz = Math.sin(theta) * Math.cos(phi) * speed;

        p.rx = Math.random() * Math.PI * 2;
        p.ry = Math.random() * Math.PI * 2;
        p.rz = Math.random() * Math.PI * 2;

        p.rvx = (Math.random() - 0.5) * 0.5;
        p.rvy = (Math.random() - 0.5) * 0.5;
        p.rvz = (Math.random() - 0.5) * 0.5;

        p.initialScale = 0.4 + Math.random() * 0.9;
        p.scale = p.initialScale;
        p.life = 1.0;
        p.maxLife = 1.2 + Math.random() * 1.6;

        if (sampleColors.length > 0) {
          const randColor = sampleColors[Math.floor(Math.random() * sampleColors.length)];
          p.color.copy(randColor);
        } else {
          p.color.setHex(0xf59e0b);
        }
        this.debrisMesh.setColorAt(i, p.color);

        spawned++;
      }
    }
    if (this.debrisMesh.instanceColor) {
      this.debrisMesh.instanceColor.needsUpdate = true;
    }
  }

  private handlePointerDown(e: MouseEvent) {
    if (this.state === AppState.REBUILDING || this.isSmashing || !this.instanceMesh) return;

    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObject(this.instanceMesh);

    if (intersects.length > 0) {
      const hitPoint = intersects[0].point;

      if (this.activeTool === 'paintbrush') {
        this.paintAtPoint(hitPoint);
      } else if (this.activeTool === 'dynamite') {
        this.plantDynamiteAt(hitPoint);
      } else if (this.activeTool === 'magnet') {
        this.applyMagnetAt(hitPoint);
      } else if (this.activeTool === 'explosion') {
        this.triggerExplosionAt(hitPoint);
      } else {
        // Hammer Modes (miniHammer, sledgeHammer, megaHammer)
        this.triggerHammerStrike(hitPoint);
      }
    }
  }

  public setExplosionRadius(radius: number) {
    this.explosionRadius = radius;
  }

  public getExplosionRadius(): number {
    return this.explosionRadius;
  }

  private createVoxelGeometry(style: VoxelLayoutStyle): THREE.BufferGeometry {
    const size = CONFIG.VOXEL_SIZE - 0.04;
    switch (style) {
      case 'beveled':
        return new THREE.BoxGeometry(size * 0.9, size * 0.9, size * 0.9);
      case 'sphere':
        return new THREE.SphereGeometry(size * 0.52, 12, 12);
      case 'cylinder':
        return new THREE.CylinderGeometry(size * 0.46, size * 0.46, size, 12);
      case 'crystal':
        return new THREE.OctahedronGeometry(size * 0.62, 0);
      case 'lego': {
        const baseGeom = new THREE.BoxGeometry(size, size * 0.82, size);
        const studGeom = new THREE.CylinderGeometry(size * 0.28, size * 0.28, size * 0.2, 12);
        studGeom.translate(0, size * 0.48, 0);
        return BufferGeometryUtils.mergeGeometries([baseGeom, studGeom]);
      }
      case 'cube':
      default:
        return new THREE.BoxGeometry(size, size, size);
    }
  }

  public setVoxelLayoutStyle(style: VoxelLayoutStyle) {
    this.layoutStyle = style;
    if (this.instanceMesh) {
      const oldGeom = this.instanceMesh.geometry;
      this.instanceMesh.geometry = this.createVoxelGeometry(style);
      if (oldGeom) oldGeom.dispose();
      this.draw();
    }
  }

  public getVoxelLayoutStyle(): VoxelLayoutStyle {
    return this.layoutStyle;
  }

  public loadInitialModel(data: VoxelData[]) {
    this.createVoxels(data);
    this.hitsCount = 0;
    this.emitStats();
    this.state = AppState.STABLE;
    this.onStateChange(this.state);
  }

  private createVoxels(data: VoxelData[]) {
    if (this.instanceMesh) {
      this.scene.remove(this.instanceMesh);
      this.instanceMesh.geometry.dispose();
      if (Array.isArray(this.instanceMesh.material)) {
          this.instanceMesh.material.forEach(m => m.dispose());
      } else {
          this.instanceMesh.material.dispose();
      }
    }

    const count = data.length;
    this.voxels = new Array(count);

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    for (let i = 0; i < count; i++) {
        const v = data[i];
        if (v.x < minX) minX = v.x; if (v.x > maxX) maxX = v.x;
        if (v.y < minY) minY = v.y; if (v.y > maxY) maxY = v.y;
        if (v.z < minZ) minZ = v.z; if (v.z > maxZ) maxZ = v.z;

        const c = new THREE.Color(v.color);
        c.offsetHSL(0, 0, (Math.random() * 0.08) - 0.04);

        this.voxels[i] = {
            id: i,
            x: v.x, y: v.y, z: v.z, color: c,
            vx: 0, vy: 0, vz: 0, rx: 0, ry: 0, rz: 0,
            rvx: 0, rvy: 0, rvz: 0,
            isPhysicsActive: false
        };
    }

    this.modelBounds = { minX, maxX, minY, maxY, minZ, maxZ };

    const maxDim = Math.max(maxX - minX, maxY - minY, maxZ - minZ, 10);
    const centerY = (minY + maxY) / 2;
    this.controls.target.set(0, Math.max(5, centerY), 0);
    const camDist = Math.max(40, maxDim * 1.25);
    this.camera.position.set(camDist * 0.6, camDist * 0.6, camDist * 0.9);

    const geometry = this.createVoxelGeometry(this.layoutStyle);
    const material = new THREE.MeshStandardMaterial({ roughness: 0.75, metalness: 0.1 });
    
    this.instanceMesh = new THREE.InstancedMesh(geometry, material, count);
    this.instanceMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    
    this.instanceMesh.castShadow = count <= 80000;
    this.instanceMesh.receiveShadow = true;

    for (let i = 0; i < count; i++) {
        this.instanceMesh.setColorAt(i, this.voxels[i].color);
    }
    if (this.instanceMesh.instanceColor) {
        this.instanceMesh.instanceColor.needsUpdate = true;
    }

    this.scene.add(this.instanceMesh);
    this.onCountChange(count);
    this.draw();
  }

  private draw() {
    if (!this.instanceMesh) return;
    const count = this.voxels.length;
    const voxels = this.voxels;
    const dummy = this.dummy;
    const mesh = this.instanceMesh;

    for (let i = 0; i < count; i++) {
        const v = voxels[i];
        dummy.position.set(v.x, v.y, v.z);
        dummy.rotation.set(v.rx, v.ry, v.rz);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }

  private emitStats() {
    const totalCount = this.voxels.length;
    if (totalCount === 0) return;

    let intactCount = 0;
    for (let i = 0; i < totalCount; i++) {
      if (!this.voxels[i].isPhysicsActive) {
        intactCount++;
      }
    }

    const integrityPercent = Math.max(0, Math.round((intactCount / totalCount) * 100));
    this.onStatsChange({
      intactCount,
      totalCount,
      hitsCount: this.hitsCount,
      integrityPercent
    });
  }

  /**
   * Main Tool Dismantle Trigger (Supports button click or tap)
   */
  public dismantle(customHitPoint?: THREE.Vector3) {
    if (this.isSmashing) return;

    const hitPoint = customHitPoint || new THREE.Vector3(
      (this.modelBounds.minX + this.modelBounds.maxX) / 2,
      (this.modelBounds.minY + this.modelBounds.maxY) / 2,
      (this.modelBounds.minZ + this.modelBounds.maxZ) / 2
    );

    if (this.activeTool === 'explosion') {
      this.triggerExplosionAt(hitPoint);
    } else if (this.activeTool === 'dynamite') {
      this.plantDynamiteAt(hitPoint);
    } else if (this.activeTool === 'magnet') {
      this.applyMagnetAt(hitPoint);
    } else if (this.activeTool === 'paintbrush') {
      this.paintAtPoint(hitPoint);
    } else {
      this.triggerHammerStrike(hitPoint);
    }
  }

  /**
   * Configurable Radial Explosion Routine
   */
  public triggerExplosionAt(impact: THREE.Vector3, radiusOverride?: number) {
    this.hitsCount++;

    const radius = radiusOverride ?? this.explosionRadius;
    const blastForce = Math.max(1.5, radius * 0.16);

    const count = this.voxels.length;
    let affectedThisHit = 0;
    const sampledColors: THREE.Color[] = [];

    for (let i = 0; i < count; i++) {
        const v = this.voxels[i];

        const dx = v.x - impact.x;
        const dy = v.y - impact.y;
        const dz = v.z - impact.z;
        const distSq = dx * dx + dy * dy + dz * dz;

        if (distSq <= radius * radius) {
          const dist = Math.sqrt(distSq);
          v.isPhysicsActive = true;
          affectedThisHit++;

          if (sampledColors.length < 40) {
            sampledColors.push(v.color.clone());
          }

          const safeDist = Math.max(0.1, dist);
          const normalizedDist = dist / radius; // 0 at center, 1 at boundary
          const force = Math.max(0.8, (1.0 - normalizedDist) * blastForce * 2.2 + 0.5);

          const dirX = dx / safeDist;
          const dirY = dy / safeDist;
          const dirZ = dz / safeDist;

          // Propel outward with high radial kinetic velocity
          v.vx = dirX * force + (Math.random() - 0.5) * 0.8;
          v.vy = Math.max(0.4, dirY * force + (Math.random() * 1.5)) + (1.0 - normalizedDist) * 1.2;
          v.vz = dirZ * force + (Math.random() - 0.5) * 0.8;

          v.rvx = (Math.random() - 0.5) * 1.2;
          v.rvy = (Math.random() - 0.5) * 1.2;
          v.rvz = (Math.random() - 0.5) * 1.2;
        }
    }

    // Spawn floating debris particle burst matching destroyed voxel colors
    const debrisAmount = Math.min(150, Math.floor(radius * 3.5) + 30);
    this.spawnFloatingDebris(impact, debrisAmount, blastForce, sampledColors);

    // Shockwave Ring FX
    this.shockwaveMesh.position.copy(impact);
    const ringScale = Math.max(1.0, radius * 0.15);
    this.shockwaveMesh.scale.set(ringScale, ringScale, ringScale);
    (this.shockwaveMesh.material as THREE.MeshBasicMaterial).opacity = 1.0;
    this.shockwaveMesh.visible = true;

    // Spark Particles Burst
    const pCount = Math.min(180, Math.floor(radius * 4) + 50);
    for (let i = 0; i < pCount; i++) {
      const idx = i * 3;
      this.sparkPositions[idx] = impact.x + (Math.random() - 0.5) * 2;
      this.sparkPositions[idx + 1] = impact.y + (Math.random() - 0.5) * 2;
      this.sparkPositions[idx + 2] = impact.z + (Math.random() - 0.5) * 2;

      this.sparkVelocities[idx] = (Math.random() - 0.5) * (blastForce * 2.0);
      this.sparkVelocities[idx + 1] = Math.random() * (blastForce * 2.2) + 0.6;
      this.sparkVelocities[idx + 2] = (Math.random() - 0.5) * (blastForce * 2.0);
    }
    this.sparkGeom.attributes.position.needsUpdate = true;
    (this.sparkParticles.material as THREE.PointsMaterial).opacity = 1.0;
    this.sparkParticles.visible = true;

    // Camera Shake
    this.cameraShakeIntensity = Math.min(3.5, radius * 0.12 + 0.8);

    this.emitStats();

    if (this.state === AppState.STABLE) {
      this.state = AppState.DISMANTLING;
      this.onStateChange(this.state);
    }
  }

  /**
   * Triggers the 3D War Hammer Strike at a specified 3D impact point
   */
  public triggerHammerStrike(hitPoint: THREE.Vector3) {
    if (this.isSmashing) return;

    let scale = 0.7; // Mini hammer
    let radius = 8;
    let blastForce = 1.2;

    if (this.activeTool === 'sledgeHammer') {
      scale = 1.3;
      radius = 18;
      blastForce = 2.4;
    } else if (this.activeTool === 'megaHammer') {
      scale = 2.4;
      radius = 99999; // Total shatter
      blastForce = 4.0;
    }

    this.currentHitRadius = radius;
    this.currentBlastForce = blastForce;

    this.smashTargetPoint.copy(hitPoint);
    this.smashStartPoint.set(
      hitPoint.x - scale * 8,
      hitPoint.y + scale * 18,
      hitPoint.z + scale * 10
    );

    this.isSmashing = true;
    this.smashProgress = 0;
    this.hammerGroup.position.copy(this.smashStartPoint);
    this.hammerGroup.scale.set(scale, scale, scale);
    this.hammerGroup.rotation.set(-Math.PI / 4, Math.PI / 4, Math.PI / 3);
    this.hammerGroup.visible = true;
  }

  /**
   * Localized Impact Blast Routine
   */
  private triggerImpactAt(impact: THREE.Vector3, radius: number, blastForce: number) {
    this.hitsCount++;

    const count = this.voxels.length;
    let affectedThisHit = 0;
    const sampledColors: THREE.Color[] = [];

    for (let i = 0; i < count; i++) {
        const v = this.voxels[i];
        
        // Skip voxels that are already physics-active
        if (v.isPhysicsActive && radius < 1000) continue;

        const dx = v.x - impact.x;
        const dy = v.y - impact.y;
        const dz = v.z - impact.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist <= radius) {
          v.isPhysicsActive = true;
          affectedThisHit++;

          if (sampledColors.length < 30) {
            sampledColors.push(v.color.clone());
          }

          const safeDist = Math.max(0.1, dist);
          const force = Math.max(0.3, blastForce / (1 + safeDist * 0.12));

          v.vx = (dx / safeDist) * force + (Math.random() - 0.5) * 0.6;
          v.vy = Math.max(0.3, (dy / safeDist) * force) + Math.random() * 1.0;
          v.vz = (dz / safeDist) * force + (Math.random() - 0.5) * 0.6;

          v.rvx = (Math.random() - 0.5) * 0.5;
          v.rvy = (Math.random() - 0.5) * 0.5;
          v.rvz = (Math.random() - 0.5) * 0.5;
        }
    }

    // Spawn floating debris particle burst matching destroyed voxel colors
    const debrisAmount = Math.min(100, Math.floor(blastForce * 28) + 30);
    this.spawnFloatingDebris(impact, debrisAmount, blastForce, sampledColors);

    // Shockwave Ring FX
    this.shockwaveMesh.position.copy(impact);
    this.shockwaveMesh.scale.set(1, 1, 1);
    (this.shockwaveMesh.material as THREE.MeshBasicMaterial).opacity = 0.9;
    this.shockwaveMesh.visible = true;

    // Spark Particles Burst
    const pCount = 120;
    for (let i = 0; i < pCount; i++) {
      const idx = i * 3;
      this.sparkPositions[idx] = impact.x;
      this.sparkPositions[idx + 1] = impact.y;
      this.sparkPositions[idx + 2] = impact.z;

      this.sparkVelocities[idx] = (Math.random() - 0.5) * (blastForce * 1.5);
      this.sparkVelocities[idx + 1] = Math.random() * (blastForce * 1.5) + 0.5;
      this.sparkVelocities[idx + 2] = (Math.random() - 0.5) * (blastForce * 1.5);
    }
    this.sparkGeom.attributes.position.needsUpdate = true;
    (this.sparkParticles.material as THREE.PointsMaterial).opacity = 1.0;
    this.sparkParticles.visible = true;

    // Camera Shake
    this.cameraShakeIntensity = Math.min(2.0, blastForce * 0.8);

    this.emitStats();

    // If all voxels are activated, update engine state to DISMANTLING
    let allActive = true;
    for (let i = 0; i < count; i++) {
      if (!this.voxels[i].isPhysicsActive) {
        allActive = false;
        break;
      }
    }

    if (allActive && this.state === AppState.STABLE) {
      this.state = AppState.DISMANTLING;
      this.onStateChange(this.state);
    }
  }

  /**
   * Dynamite Bomb Plant Routine
   */
  private plantDynamiteAt(point: THREE.Vector3) {
    if (this.isDynamiteActive) return;

    this.dynamiteTargetPoint.copy(point);
    this.dynamiteGroup.position.copy(point);
    this.dynamiteGroup.visible = true;
    this.isDynamiteActive = true;
    this.dynamiteStartTime = Date.now();
  }

  /**
   * Paint Spray Routine
   */
  private paintAtPoint(point: THREE.Vector3) {
    if (!this.instanceMesh) return;
    const count = this.voxels.length;
    const radius = 7.0;
    const paintColorObj = new THREE.Color(this.paintColor);

    let painted = false;
    for (let i = 0; i < count; i++) {
      const v = this.voxels[i];
      const dx = v.x - point.x;
      const dy = v.y - point.y;
      const dz = v.z - point.z;
      if (dx * dx + dy * dy + dz * dz <= radius * radius) {
        v.color.copy(paintColorObj);
        this.instanceMesh.setColorAt(i, v.color);
        painted = true;
      }
    }

    if (painted && this.instanceMesh.instanceColor) {
      this.instanceMesh.instanceColor.needsUpdate = true;
    }
  }

  /**
   * Magnet / Anti-Gravity Impulse Routine
   */
  private applyMagnetAt(point: THREE.Vector3) {
    const count = this.voxels.length;
    const radius = 16.0;

    for (let i = 0; i < count; i++) {
      const v = this.voxels[i];
      const dx = point.x - v.x;
      const dy = point.y - v.y;
      const dz = point.z - v.z;
      const distSq = dx * dx + dy * dy + dz * dz;

      if (distSq <= radius * radius) {
        v.isPhysicsActive = true;
        const dist = Math.sqrt(distSq) + 0.1;
        // Pull voxels toward cursor with force
        v.vx += (dx / dist) * 0.8;
        v.vy += (dy / dist) * 0.8 + 0.5;
        v.vz += (dz / dist) * 0.8;
      }
    }
    this.emitStats();
  }

  public rebuild(targetModel: VoxelData[]) {
    if (this.state === AppState.REBUILDING) return;

    const targetCount = targetModel.length;
    let currentCount = this.voxels.length;

    // 1. Rescale voxel collection if target model has a different number of blocks
    if (currentCount !== targetCount) {
        if (targetCount > currentCount) {
            for (let i = currentCount; i < targetCount; i++) {
                const floorX = (Math.random() - 0.5) * 16;
                const floorZ = (Math.random() - 0.5) * 16;
                this.voxels[i] = {
                    id: i,
                    x: floorX,
                    y: CONFIG.FLOOR_Y + 0.5,
                    z: floorZ,
                    color: new THREE.Color(targetModel[i].color),
                    vx: 0, vy: 0, vz: 0,
                    rx: 0, ry: 0, rz: 0,
                    rvx: 0, rvy: 0, rvz: 0,
                    isPhysicsActive: true
                };
            }
        } else {
            this.voxels.length = targetCount;
        }

        currentCount = targetCount;

        // Recreate Instance Mesh
        this.scene.remove(this.instanceMesh);
        if (this.instanceMesh.geometry) this.instanceMesh.geometry.dispose();
        if (Array.isArray(this.instanceMesh.material)) {
            this.instanceMesh.material.forEach(m => m.dispose());
        } else if (this.instanceMesh.material) {
            this.instanceMesh.material.dispose();
        }

        const geometry = this.createVoxelGeometry(this.layoutStyle);
        const material = new THREE.MeshStandardMaterial({ roughness: 0.75, metalness: 0.1 });
        this.instanceMesh = new THREE.InstancedMesh(geometry, material, targetCount);
        this.instanceMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        this.instanceMesh.castShadow = targetCount <= 80000;
        this.instanceMesh.receiveShadow = true;
        this.scene.add(this.instanceMesh);
        this.onCountChange(targetCount);
    }

    // 2. Linear Color Bucket Matching O(N)
    const colorBuckets = new Map<number, number[]>();
    for (let i = 0; i < targetCount; i++) {
        const hex = this.voxels[i].color.getHex();
        let bucket = colorBuckets.get(hex);
        if (!bucket) {
            bucket = [];
            colorBuckets.set(hex, bucket);
        }
        bucket.push(i);
    }

    const used = new Uint8Array(targetCount);
    const mappings: RebuildTarget[] = new Array(targetCount);

    targetModel.forEach((target) => {
        let chosenIndex = -1;
        const bucket = colorBuckets.get(target.color);
        if (bucket && bucket.length > 0) {
            chosenIndex = bucket.pop()!;
            used[chosenIndex] = 1;
        } else {
            for (const [_, b] of colorBuckets) {
                while (b.length > 0) {
                    const idx = b.pop()!;
                    if (!used[idx]) {
                        chosenIndex = idx;
                        used[chosenIndex] = 1;
                        break;
                    }
                }
                if (chosenIndex !== -1) break;
            }
        }

        if (chosenIndex !== -1) {
            const v = this.voxels[chosenIndex];
            const heightRatio = Math.max(0, (target.y - CONFIG.FLOOR_Y) / 25);
            const distFromCenter = Math.sqrt(target.x * target.x + target.z * target.z) / 25;
            const delay = (heightRatio * 700) + (distFromCenter * 150);

            mappings[chosenIndex] = {
                startX: v.x, startY: v.y, startZ: v.z,
                startRx: v.rx, startRy: v.ry, startRz: v.rz,
                targetX: target.x, targetY: target.y, targetZ: target.z,
                startColor: v.color.clone(),
                targetColor: new THREE.Color(target.color),
                delay,
                flightDuration: 650
            };
        }
    });

    for (let i = 0; i < targetCount; i++) {
        if (!mappings[i]) {
            const v = this.voxels[i];
            mappings[i] = {
                startX: v.x, startY: v.y, startZ: v.z,
                startRx: v.rx, startRy: v.ry, startRz: v.rz,
                targetX: v.x, targetY: v.y, targetZ: v.z,
                startColor: v.color.clone(),
                targetColor: v.color.clone(),
                delay: 0,
                flightDuration: 500
            };
        }
    }

    this.rebuildTargets = mappings;
    this.rebuildStartTime = Date.now();
    this.state = AppState.REBUILDING;
    this.onStateChange(this.state);
  }

  private updatePhysics() {
    // --- Hammer Animation Loop ---
    if (this.isSmashing) {
      this.smashProgress += 0.08;
      
      if (this.smashProgress < 0.6) {
        const t = this.smashProgress / 0.6;
        const easeT = t * t * t;
        this.hammerGroup.position.lerpVectors(this.smashStartPoint, this.smashTargetPoint, easeT);
        this.hammerGroup.rotation.x = -Math.PI / 4 + easeT * (Math.PI / 2);
      } else if (this.smashProgress < 0.65) {
        // IMPACT MOMENT
        this.hammerGroup.position.copy(this.smashTargetPoint);
        this.triggerImpactAt(this.smashTargetPoint, this.currentHitRadius, this.currentBlastForce);
      } else if (this.smashProgress >= 1.0) {
        this.isSmashing = false;
        this.hammerGroup.visible = false;
      }
    }

    // --- Dynamite Fuse Loop ---
    if (this.isDynamiteActive) {
      const elapsed = Date.now() - this.dynamiteStartTime;
      const spark = this.dynamiteGroup.getObjectByName("spark");
      if (spark) {
        spark.scale.setScalar(1 + Math.sin(elapsed * 0.03) * 0.4);
      }

      if (elapsed >= 1000) {
        // BOOM!
        this.isDynamiteActive = false;
        this.dynamiteGroup.visible = false;
        this.triggerImpactAt(this.dynamiteTargetPoint, 26.0, 3.8);
      }
    }

    // --- Shockwave Ring FX ---
    if (this.shockwaveMesh.visible) {
      const mat = this.shockwaveMesh.material as THREE.MeshBasicMaterial;
      this.shockwaveMesh.scale.addScalar(1.2);
      mat.opacity -= 0.035;
      if (mat.opacity <= 0) {
        this.shockwaveMesh.visible = false;
      }
    }

    // --- Spark Particles ---
    if (this.sparkParticles.visible) {
      const mat = this.sparkParticles.material as THREE.PointsMaterial;
      const pCount = 150;
      for (let i = 0; i < pCount; i++) {
        const idx = i * 3;
        this.sparkPositions[idx] += this.sparkVelocities[idx];
        this.sparkPositions[idx + 1] += this.sparkVelocities[idx + 1];
        this.sparkPositions[idx + 2] += this.sparkVelocities[idx + 2];
        this.sparkVelocities[idx + 1] -= 0.06; // Spark gravity
      }
      this.sparkGeom.attributes.position.needsUpdate = true;
      mat.opacity -= 0.03;
      if (mat.opacity <= 0) {
        this.sparkParticles.visible = false;
      }
    }

    // --- Floating Debris Particle Loop ---
    let hasDebris = false;
    for (let i = 0; i < this.maxDebrisCount; i++) {
      const p = this.debrisParticles[i];
      if (!p.active) continue;

      p.life -= 0.018;
      if (p.life <= 0) {
        p.active = false;
        this.debrisDummy.position.set(0, -1000, 0);
        this.debrisDummy.scale.set(0, 0, 0);
        this.debrisDummy.updateMatrix();
        this.debrisMesh.setMatrixAt(i, this.debrisDummy.matrix);
        continue;
      }

      hasDebris = true;

      // Position update with air drag & floating upward thermal draft
      p.x += p.vx;
      p.y += p.vy;
      p.z += p.vz;

      p.vy += 0.007; // Upward anti-gravity float
      p.vx *= 0.95; // Air drag
      p.vy *= 0.97;
      p.vz *= 0.95;

      // Rotation tumbling
      p.rx += p.rvx;
      p.ry += p.rvy;
      p.rz += p.rvz;

      // Scale fade
      const lifeRatio = Math.max(0, p.life / p.maxLife);
      const currentScale = p.initialScale * Math.sin(lifeRatio * Math.PI * 0.5);

      this.debrisDummy.position.set(p.x, p.y, p.z);
      this.debrisDummy.rotation.set(p.rx, p.ry, p.rz);
      this.debrisDummy.scale.set(currentScale, currentScale, currentScale);
      this.debrisDummy.updateMatrix();
      this.debrisMesh.setMatrixAt(i, this.debrisDummy.matrix);
    }

    if (hasDebris) {
      this.debrisMesh.instanceMatrix.needsUpdate = true;
    }

    // --- Camera Shake ---
    if (this.cameraShakeIntensity > 0) {
      this.camera.position.x += (Math.random() - 0.5) * this.cameraShakeIntensity;
      this.camera.position.y += (Math.random() - 0.5) * this.cameraShakeIntensity;
      this.cameraShakeIntensity *= 0.88;
      if (this.cameraShakeIntensity < 0.02) this.cameraShakeIntensity = 0;
    }

    // --- Voxel Dismantling & Active Physics Physics ---
    const count = this.voxels.length;
    const floorY = CONFIG.FLOOR_Y + 0.5;

    if (this.state === AppState.DISMANTLING || this.hasActivePhysics()) {
        for (let i = 0; i < count; i++) {
            const v = this.voxels[i];
            if (!v.isPhysicsActive) continue;

            v.vy -= 0.032; // Gravity acceleration for active debris
            v.x += v.vx; v.y += v.vy; v.z += v.vz;
            v.rx += v.rvx; v.ry += v.rvy; v.rz += v.rvz;

            // Floor bounce
            if (v.y < floorY) {
                v.y = floorY;
                v.vy *= -0.5; v.vx *= 0.85; v.vz *= 0.85;
                v.rvx *= 0.8; v.rvy *= 0.8; v.rvz *= 0.8;
            }
        }
        this.emitStats();
    } else if (this.state === AppState.REBUILDING) {
        const now = Date.now();
        const elapsed = now - this.rebuildStartTime;
        let allDone = true;
        let colorsNeedUpdate = false;

        for (let i = 0; i < count; i++) {
            const v = this.voxels[i];
            const t = this.rebuildTargets[i];
            if (!t) continue;

            if (elapsed < t.delay) {
                allDone = false;
                v.x = t.startX; v.y = t.startY; v.z = t.startZ;
                v.rx = t.startRx; v.ry = t.startRy; v.rz = t.startRz;
                continue;
            }

            const flightElapsed = elapsed - t.delay;
            const progress = Math.min(1.0, flightElapsed / t.flightDuration);

            if (progress < 1.0) {
                allDone = false;
                const ease = 1 - Math.pow(1 - progress, 3);
                const arc = Math.sin(progress * Math.PI) * 5.0;

                v.x = t.startX + (t.targetX - t.startX) * ease;
                v.y = t.startY + (t.targetY - t.startY) * ease + arc * (1 - progress);
                v.z = t.startZ + (t.targetZ - t.startZ) * ease;

                v.rx = t.startRx * (1 - ease);
                v.ry = t.startRy * (1 - ease);
                v.rz = t.startRz * (1 - ease);

                v.color.copy(t.startColor).lerp(t.targetColor, ease);
                this.instanceMesh.setColorAt(i, v.color);
                colorsNeedUpdate = true;
            } else {
                v.x = t.targetX;
                v.y = t.targetY;
                v.z = t.targetZ;
                v.rx = 0; v.ry = 0; v.rz = 0;
                v.isPhysicsActive = false;
                v.color.copy(t.targetColor);
                this.instanceMesh.setColorAt(i, v.color);
                colorsNeedUpdate = true;
            }
        }

        if (colorsNeedUpdate && this.instanceMesh.instanceColor) {
            this.instanceMesh.instanceColor.needsUpdate = true;
        }

        if (allDone) {
            this.state = AppState.STABLE;
            this.hitsCount = 0;
            let minX = Infinity, maxX = -Infinity;
            let minY = Infinity, maxY = -Infinity;
            let minZ = Infinity, maxZ = -Infinity;
            for (let i = 0; i < count; i++) {
                const vx = this.voxels[i];
                if (vx.x < minX) minX = vx.x; if (vx.x > maxX) maxX = vx.x;
                if (vx.y < minY) minY = vx.y; if (vx.y > maxY) maxY = vx.y;
                if (vx.z < minZ) minZ = vx.z; if (vx.z > maxZ) maxZ = vx.z;
            }
            this.modelBounds = { minX, maxX, minY, maxY, minZ, maxZ };
            const centerY = (minY + maxY) / 2;
            this.controls.target.set(0, Math.max(5, centerY), 0);

            this.emitStats();
            this.onStateChange(this.state);
        }
    }
  }

  private hasActivePhysics(): boolean {
    for (let i = 0; i < this.voxels.length; i++) {
      if (this.voxels[i].isPhysicsActive) return true;
    }
    return false;
  }

  private hasActiveDebris(): boolean {
    for (let i = 0; i < this.maxDebrisCount; i++) {
      if (this.debrisParticles[i].active) return true;
    }
    return false;
  }

  private animate() {
    this.animationId = requestAnimationFrame(this.animate);
    this.controls.update();
    this.updatePhysics();
    
    if (this.state !== AppState.STABLE || this.isSmashing || this.isDynamiteActive || this.shockwaveMesh.visible || this.hasActivePhysics() || this.hasActiveDebris()) {
        this.draw();
    }
    
    this.renderer.render(this.scene, this.camera);
  }

  public handleResize() {
      if (this.camera && this.renderer) {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
      }
  }
  
  public setAutoRotate(enabled: boolean) {
    if (this.controls) {
        this.controls.autoRotate = enabled;
    }
  }

  public getJsonData(): string {
      const data = this.voxels.map((v, i) => ({
          id: i,
          x: +v.x.toFixed(2),
          y: +v.y.toFixed(2),
          z: +v.z.toFixed(2),
          c: '#' + v.color.getHexString()
      }));
      return data.length > 5000 ? JSON.stringify(data) : JSON.stringify(data, null, 2);
  }

  public cleanup() {
    cancelAnimationFrame(this.animationId);
    this.container.removeEventListener('pointerdown', this.handlePointerDown.bind(this));
    if (this.container.contains(this.renderer.domElement)) {
        this.container.removeChild(this.renderer.domElement);
    }
    this.renderer.dispose();
  }
}
