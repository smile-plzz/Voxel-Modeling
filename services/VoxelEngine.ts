/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { AppState, SimulationVoxel, RebuildTarget, VoxelData } from '../types';
import { CONFIG } from '../utils/voxelConstants';

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
  private animationId: number = 0;

  constructor(
    container: HTMLElement, 
    onStateChange: (state: AppState) => void,
    onCountChange: (count: number) => void
  ) {
    this.container = container;
    this.onStateChange = onStateChange;
    this.onCountChange = onCountChange;

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

    this.animate = this.animate.bind(this);
    this.animate();
  }

  public loadInitialModel(data: VoxelData[]) {
    this.createVoxels(data);
    this.onCountChange(this.voxels.length);
    this.state = AppState.STABLE;
    this.onStateChange(this.state);
  }

  private createVoxels(data: VoxelData[]) {
    // Clear existing
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
        // Slight color variation for realism
        c.offsetHSL(0, 0, (Math.random() * 0.08) - 0.04);

        this.voxels[i] = {
            id: i,
            x: v.x, y: v.y, z: v.z, color: c,
            vx: 0, vy: 0, vz: 0, rx: 0, ry: 0, rz: 0,
            rvx: 0, rvy: 0, rvz: 0
        };
    }

    // Adjust camera target & position based on bounding box
    const maxDim = Math.max(maxX - minX, maxY - minY, maxZ - minZ, 10);
    const centerY = (minY + maxY) / 2;
    this.controls.target.set(0, Math.max(5, centerY), 0);
    const camDist = Math.max(40, maxDim * 1.25);
    this.camera.position.set(camDist * 0.6, camDist * 0.6, camDist * 0.9);

    const geometry = new THREE.BoxGeometry(CONFIG.VOXEL_SIZE - 0.04, CONFIG.VOXEL_SIZE - 0.04, CONFIG.VOXEL_SIZE - 0.04);
    const material = new THREE.MeshStandardMaterial({ roughness: 0.75, metalness: 0.1 });
    
    this.instanceMesh = new THREE.InstancedMesh(geometry, material, count);
    this.instanceMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    
    // Shadows enabled for up to 80,000 blocks for 60fps performance
    this.instanceMesh.castShadow = count <= 80000;
    this.instanceMesh.receiveShadow = true;

    // Set colors once on startup
    for (let i = 0; i < count; i++) {
        this.instanceMesh.setColorAt(i, this.voxels[i].color);
    }
    if (this.instanceMesh.instanceColor) {
        this.instanceMesh.instanceColor.needsUpdate = true;
    }

    this.scene.add(this.instanceMesh);
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

  public dismantle() {
    if (this.state !== AppState.STABLE) return;
    this.state = AppState.DISMANTLING;
    this.onStateChange(this.state);

    const count = this.voxels.length;
    for (let i = 0; i < count; i++) {
        const v = this.voxels[i];
        v.vx = (Math.random() - 0.5) * 0.9;
        v.vy = Math.random() * 0.6;
        v.vz = (Math.random() - 0.5) * 0.9;
        v.rvx = (Math.random() - 0.5) * 0.25;
        v.rvy = (Math.random() - 0.5) * 0.25;
        v.rvz = (Math.random() - 0.5) * 0.25;
    }
  }

  /**
   * Fast O(N) Color-bucket matching for rebuilds
   * Supports 250,000+ blocks seamlessly without UI stutter!
   */
  public rebuild(targetModel: VoxelData[]) {
    if (this.state === AppState.REBUILDING) return;

    const count = this.voxels.length;
    const mappings: RebuildTarget[] = new Array(count);

    // Group available voxel indices by exact color hex
    const colorBuckets = new Map<number, number[]>();
    for (let i = 0; i < count; i++) {
        const hex = this.voxels[i].color.getHex();
        let bucket = colorBuckets.get(hex);
        if (!bucket) {
            bucket = [];
            colorBuckets.set(hex, bucket);
        }
        bucket.push(i);
    }

    const used = new Uint8Array(count);

    targetModel.forEach(target => {
        let chosenIndex = -1;
        // 1. Try exact color match first
        const bucket = colorBuckets.get(target.color);
        if (bucket && bucket.length > 0) {
            chosenIndex = bucket.pop()!;
            used[chosenIndex] = 1;
        } else {
            // 2. Fallback: take from any available bucket
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
            const h = Math.max(0, (target.y - CONFIG.FLOOR_Y) / 20);
            mappings[chosenIndex] = {
                x: target.x, y: target.y, z: target.z,
                delay: h * 600
            };
        }
    });

    // Leftover voxels become rubble on floor
    for (let i = 0; i < count; i++) {
        if (!mappings[i]) {
            mappings[i] = {
                x: this.voxels[i].x, y: this.voxels[i].y, z: this.voxels[i].z,
                isRubble: true, delay: 0
            };
        }
    }

    this.rebuildTargets = mappings;
    this.rebuildStartTime = Date.now();
    this.state = AppState.REBUILDING;
    this.onStateChange(this.state);
  }

  private updatePhysics() {
    if (this.state === AppState.DISMANTLING) {
        const count = this.voxels.length;
        const floorY = CONFIG.FLOOR_Y + 0.5;

        for (let i = 0; i < count; i++) {
            const v = this.voxels[i];
            v.vy -= 0.025; // Gravity
            v.x += v.vx; v.y += v.vy; v.z += v.vz;
            v.rx += v.rvx; v.ry += v.rvy; v.rz += v.rvz;

            // Floor bounce
            if (v.y < floorY) {
                v.y = floorY;
                v.vy *= -0.5; v.vx *= 0.9; v.vz *= 0.9;
                v.rvx *= 0.8; v.rvy *= 0.8; v.rvz *= 0.8;
            }
        }
    } else if (this.state === AppState.REBUILDING) {
        const now = Date.now();
        const elapsed = now - this.rebuildStartTime;
        let allDone = true;
        const count = this.voxels.length;
        const speed = 0.14;

        for (let i = 0; i < count; i++) {
            const v = this.voxels[i];
            const t = this.rebuildTargets[i];
            if (!t || t.isRubble) continue;

            if (elapsed < t.delay) {
                allDone = false;
                continue;
            }

            v.x += (t.x - v.x) * speed;
            v.y += (t.y - v.y) * speed;
            v.z += (t.z - v.z) * speed;
            v.rx += (0 - v.rx) * speed;
            v.ry += (0 - v.ry) * speed;
            v.rz += (0 - v.rz) * speed;

            // Check if reached target
            const dx = t.x - v.x;
            const dy = t.y - v.y;
            const dz = t.z - v.z;
            if (dx * dx + dy * dy + dz * dz > 0.01) {
                allDone = false;
            } else {
                v.x = t.x; v.y = t.y; v.z = t.z;
                v.rx = 0; v.ry = 0; v.rz = 0;
            }
        }

        if (allDone) {
            this.state = AppState.STABLE;
            this.onStateChange(this.state);
        }
    }
  }

  private animate() {
    this.animationId = requestAnimationFrame(this.animate);
    this.controls.update();
    this.updatePhysics();
    
    // Only update GPU instance matrix when position/rotation actually changes
    if (this.state !== AppState.STABLE) {
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
      // Use compact JSON for large voxel counts
      return data.length > 5000 ? JSON.stringify(data) : JSON.stringify(data, null, 2);
  }

  public cleanup() {
    cancelAnimationFrame(this.animationId);
    if (this.container.contains(this.renderer.domElement)) {
        this.container.removeChild(this.renderer.domElement);
    }
    this.renderer.dispose();
  }
}
