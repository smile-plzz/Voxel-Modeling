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

  // --- Hammer & Impact Animation Props ---
  private hammerGroup: THREE.Group;
  private shockwaveMesh: THREE.Mesh;
  private sparkParticles: THREE.Points;
  private sparkGeom: THREE.BufferGeometry;
  private sparkPositions: Float32Array;
  private sparkVelocities: Float32Array;
  
  private isSmashing: boolean = false;
  private smashProgress: number = 0;
  private smashStartPoint = new THREE.Vector3();
  private smashTargetPoint = new THREE.Vector3();
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

    // Create Hammer Mesh & FX
    this.hammerGroup = this.createHammerMesh();
    this.scene.add(this.hammerGroup);

    this.shockwaveMesh = this.createShockwaveRing();
    this.scene.add(this.shockwaveMesh);

    const sparkObj = this.createSparkParticles();
    this.sparkParticles = sparkObj.points;
    this.sparkGeom = sparkObj.geom;
    this.sparkPositions = sparkObj.positions;
    this.sparkVelocities = sparkObj.velocities;
    this.scene.add(this.sparkParticles);

    // Click Raycaster Listener for Interactive Hammering
    this.container.addEventListener('pointerdown', this.handlePointerDown.bind(this));

    this.animate = this.animate.bind(this);
    this.animate();
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
    const pCount = 120;
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(pCount * 3);
    const velocities = new Float32Array(pCount * 3);

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xfcb316,
      size: 1.2,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending
    });

    const points = new THREE.Points(geom, mat);
    points.visible = false;
    return { points, geom, positions, velocities };
  }

  private handlePointerDown(e: MouseEvent) {
    if (this.state !== AppState.STABLE || this.isSmashing || !this.instanceMesh) return;

    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObject(this.instanceMesh);

    if (intersects.length > 0) {
      const hitPoint = intersects[0].point;
      this.dismantle(hitPoint);
    }
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
        c.offsetHSL(0, 0, (Math.random() * 0.08) - 0.04);

        this.voxels[i] = {
            id: i,
            x: v.x, y: v.y, z: v.z, color: c,
            vx: 0, vy: 0, vz: 0, rx: 0, ry: 0, rz: 0,
            rvx: 0, rvy: 0, rvz: 0
        };
    }

    this.modelBounds = { minX, maxX, minY, maxY, minZ, maxZ };

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
    
    this.instanceMesh.castShadow = count <= 80000;
    this.instanceMesh.receiveShadow = true;

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

  /**
   * Initiates the 3D Voxel Hammer Smash Animation!
   */
  public dismantle(customHitPoint?: THREE.Vector3) {
    if (this.state !== AppState.STABLE || this.isSmashing) return;

    // Pick target hit point
    const hitPoint = customHitPoint || new THREE.Vector3(
      (this.modelBounds.minX + this.modelBounds.maxX) / 2,
      this.modelBounds.maxY,
      (this.modelBounds.minZ + this.modelBounds.maxZ) / 2
    );

    this.smashTargetPoint.copy(hitPoint);
    this.smashStartPoint.set(
      hitPoint.x - 12,
      hitPoint.y + 28,
      hitPoint.z + 15
    );

    this.isSmashing = true;
    this.smashProgress = 0;
    this.hammerGroup.position.copy(this.smashStartPoint);
    this.hammerGroup.rotation.set(-Math.PI / 4, Math.PI / 4, Math.PI / 3);
    this.hammerGroup.scale.set(1.5, 1.5, 1.5);
    this.hammerGroup.visible = true;
  }

  private triggerExplosionAt(impact: THREE.Vector3) {
    this.state = AppState.DISMANTLING;
    this.onStateChange(this.state);

    const count = this.voxels.length;
    for (let i = 0; i < count; i++) {
        const v = this.voxels[i];
        const dx = v.x - impact.x;
        const dy = v.y - impact.y;
        const dz = v.z - impact.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) + 0.1;

        // Radial blast force proportional to distance from impact
        const force = Math.max(0.4, 4.5 / (1 + dist * 0.08));
        v.vx = (dx / dist) * force + (Math.random() - 0.5) * 0.5;
        v.vy = Math.max(0.3, (dy / dist) * force) + Math.random() * 0.9;
        v.vz = (dz / dist) * force + (Math.random() - 0.5) * 0.5;

        v.rvx = (Math.random() - 0.5) * 0.4;
        v.rvy = (Math.random() - 0.5) * 0.4;
        v.rvz = (Math.random() - 0.5) * 0.4;
    }

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

      this.sparkVelocities[idx] = (Math.random() - 0.5) * 1.8;
      this.sparkVelocities[idx + 1] = Math.random() * 1.8 + 0.5;
      this.sparkVelocities[idx + 2] = (Math.random() - 0.5) * 1.8;
    }
    this.sparkGeom.attributes.position.needsUpdate = true;
    (this.sparkParticles.material as THREE.PointsMaterial).opacity = 1.0;
    this.sparkParticles.visible = true;

    // Camera Shake Impact
    this.cameraShakeIntensity = 1.2;
  }

  public rebuild(targetModel: VoxelData[]) {
    if (this.state === AppState.REBUILDING) return;

    const count = this.voxels.length;
    const mappings: RebuildTarget[] = new Array(count);

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
            const h = Math.max(0, (target.y - CONFIG.FLOOR_Y) / 20);
            mappings[chosenIndex] = {
                x: target.x, y: target.y, z: target.z,
                delay: h * 600
            };
        }
    });

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
    // --- Hammer Animation Loop ---
    if (this.isSmashing) {
      this.smashProgress += 0.08;
      
      if (this.smashProgress < 0.6) {
        // Cocking back & accelerating down
        const t = this.smashProgress / 0.6;
        const easeT = t * t * t; // Cubic acceleration
        this.hammerGroup.position.lerpVectors(this.smashStartPoint, this.smashTargetPoint, easeT);
        this.hammerGroup.rotation.x = -Math.PI / 4 + easeT * (Math.PI / 2);
      } else if (this.smashProgress < 0.65 && this.state === AppState.STABLE) {
        // IMPACT MOMENT!
        this.hammerGroup.position.copy(this.smashTargetPoint);
        this.triggerExplosionAt(this.smashTargetPoint);
      } else if (this.smashProgress >= 1.0) {
        // Recoil & fade out hammer
        this.isSmashing = false;
        this.hammerGroup.visible = false;
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
      const pCount = 120;
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

    // --- Camera Shake ---
    if (this.cameraShakeIntensity > 0) {
      this.camera.position.x += (Math.random() - 0.5) * this.cameraShakeIntensity;
      this.camera.position.y += (Math.random() - 0.5) * this.cameraShakeIntensity;
      this.cameraShakeIntensity *= 0.88;
      if (this.cameraShakeIntensity < 0.02) this.cameraShakeIntensity = 0;
    }

    // --- Voxel Dismantling Physics ---
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
    
    if (this.state !== AppState.STABLE || this.isSmashing || this.shockwaveMesh.visible) {
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
