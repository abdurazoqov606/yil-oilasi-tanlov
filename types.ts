
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import * as THREE from 'three';

// State of the voxel simulation used to control physics and UI states
export enum AppState {
  STABLE = 'STABLE',
  DISMANTLING = 'DISMANTLING',
  REBUILDING = 'REBUILDING'
}

// Basic voxel data structure for model generation and storage formats
export interface VoxelData {
  x: number;
  y: number;
  z: number;
  color: number;
}

// Internal voxel structure used during active physics simulation in VoxelEngine
export interface SimulationVoxel {
  id: number;
  x: number;
  y: number;
  z: number;
  color: THREE.Color;
  vx: number;
  vy: number;
  vz: number;
  rx: number;
  ry: number;
  rz: number;
  rvx: number;
  rvy: number;
  rvz: number;
}

// Target positioning and timing data for rebuilding animations
export interface RebuildTarget {
  x: number;
  y: number;
  z: number;
  delay: number;
  isRubble?: boolean;
}

// Container for saved user creations, custom prompts, or model presets
export interface SavedModel {
  name: string;
  data: VoxelData[];
}

// Types for Telegram Auth Flow
export interface TelegramSession {
  phoneNumber: string;
  isAuthorized: boolean;
  botStatus: 'online' | 'offline' | 'syncing';
  lastMessage?: string;
}
