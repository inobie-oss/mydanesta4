/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Asset {
  id: string;
  name: string;
  url: string; // base64 string or original URL
  type: string; // e.g., 'image/png'
  width: number;
  height: number;
}

export interface Bone {
  id: string;
  name: string;
  parentId: string | null;
  length: number;
  angle: number; // angle in degrees relative to parent (or absolute if root)
  x: number; // start x (for root bones, this is absolute. For children, relative offset if desired, but default is starting exactly at parent's end)
  y: number; // start y (for root bones, this is absolute)
  color: string; // visual helper color
  followGravity?: boolean;
}

export interface ImageLayer {
  id: string;
  name: string;
  assetId: string;
  boneId: string | null; // attached bone
  offsetX: number; // position offset relative to bone start (or absolute x if no parent)
  offsetY: number; // position offset relative to bone start (or absolute y if no parent)
  offsetAngle: number; // rotation offset relative to bone (or absolute rotation if no parent)
  scaleX: number;
  scaleY: number;
  opacity: number;
  zIndex: number;
}

// Stores the animated parameters for a specific frame for bones and optionally layers
export interface FrameData {
  bones: Record<string, { x: number; y: number; angle: number; length: number }>;
  layers: Record<string, { offsetX: number; offsetY: number; offsetAngle: number; scaleX: number; scaleY: number; opacity: number }>;
  drawing?: string; // Base64 PNG representation of custom canvas drawing
}

export interface Project {
  id: string;
  name: string;
  width: number;
  height: number;
  fps: number;
  playbackLength: number; // total frames, e.g., 60 or 120
  backgroundColor: string;
  assets: Asset[];
  bones: Bone[];
  layers: ImageLayer[];
  keyframes: Record<number, FrameData>; // frameIndex (integer) -> data
  createdAt: string;
  updatedAt: string;
}
