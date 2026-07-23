/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import * as THREE from 'three';

export enum AppState {
  STABLE = 'STABLE',
  DISMANTLING = 'DISMANTLING',
  REBUILDING = 'REBUILDING'
}

export interface VoxelData {
  x: number;
  y: number;
  z: number;
  color: number;
}

export type ToolType = 'miniHammer' | 'sledgeHammer' | 'megaHammer' | 'dynamite' | 'paintbrush' | 'magnet' | 'explosion';

export type VoxelLayoutStyle = 'cube' | 'beveled' | 'sphere' | 'cylinder' | 'crystal' | 'lego';

export interface VoxelEngineStats {
  intactCount: number;
  totalCount: number;
  hitsCount: number;
  integrityPercent: number;
}

export interface SimulationVoxel {
  id: number;
  x: number;
  y: number;
  z: number;
  color: THREE.Color;
  // Physics state
  vx: number;
  vy: number;
  vz: number;
  rx: number;
  ry: number;
  rz: number;
  rvx: number;
  rvy: number;
  rvz: number;
  isPhysicsActive?: boolean;
}

export interface RebuildTarget {
  startX: number;
  startY: number;
  startZ: number;
  startRx: number;
  startRy: number;
  startRz: number;
  targetX: number;
  targetY: number;
  targetZ: number;
  startColor: THREE.Color;
  targetColor: THREE.Color;
  delay: number;
  flightDuration: number;
}

export interface SavedModel {
  name: string;
  data: VoxelData[];
  baseModel?: string;
}
