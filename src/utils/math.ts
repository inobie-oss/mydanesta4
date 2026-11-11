/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Bone, ImageLayer, FrameData, Project } from '../types';

export interface AbsoluteBone {
  id: string;
  name: string;
  parentId: string | null;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  absAngle: number; // in radians
  length: number;
  color: string;
}

// Convert degrees to radians
export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

// Convert radians to degrees
export function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

// Recursively compute absolute positions of all bones
export function getAbsoluteBones(
  bones: Bone[],
  boneState: Record<string, { x: number; y: number; angle: number; length: number }>
): Record<string, AbsoluteBone> {
  const absolute: Record<string, AbsoluteBone> = {};
  const visited = new Set<string>();
  const visiting = new Set<string>();

  function resolve(boneId: string) {
    if (visited.has(boneId)) return;
    if (visiting.has(boneId)) {
      // Cycle detected! Ignore parent relationship to prevent infinite recursion
      return;
    }
    const bone = bones.find((b) => b.id === boneId);
    if (!bone) return;

    visiting.add(boneId);

    const state = boneState[boneId] || { x: bone.x, y: bone.y, angle: bone.angle, length: bone.length };

    let startX = state.x;
    let startY = state.y;
    let absAngle = bone.followGravity ? degToRad(90) : degToRad(state.angle);

    if (bone.parentId) {
      resolve(bone.parentId);
      const parentAbs = absolute[bone.parentId];
      if (parentAbs) {
        startX = parentAbs.endX + (state.x || 0);
        startY = parentAbs.endY + (state.y || 0);
        absAngle = bone.followGravity ? degToRad(90) : (parentAbs.absAngle + degToRad(state.angle));
      }
    }

    const endX = startX + state.length * Math.cos(absAngle);
    const endY = startY + state.length * Math.sin(absAngle);

    absolute[boneId] = {
      id: bone.id,
      name: bone.name,
      parentId: bone.parentId,
      startX,
      startY,
      endX,
      endY,
      absAngle,
      length: state.length,
      color: bone.color,
    };
    visited.add(boneId);
    visiting.delete(boneId);
  }

  bones.forEach((b) => resolve(b.id));
  return absolute;
}

// Interpolate standard values
export function lerp(start: number, end: number, amt: number): number {
  return (1 - amt) * start + amt * end;
}

// Linearly interpolate angles smoothly, resolving wrap around
export function lerpAngle(start: number, end: number, amt: number): number {
  const difference = ((end - start + 180) % 360) - 180;
  return start + (difference < -180 ? difference + 360 : difference) * amt;
}

// Get interpolated frame data for any arbitrary frame
export function interpolateFrame(
  keyframes: Record<number, FrameData>,
  frame: number,
  baseBones: Bone[],
  baseLayers: ImageLayer[]
): FrameData {
  // Convert keyframe keys to numbers
  const frameKeys = Object.keys(keyframes)
    .map(Number)
    .sort((a, b) => a - b);

  // Helper to fallback to base project configurations
  const getBaseState = (): FrameData => {
    const bones: FrameData['bones'] = {};
    const layers: FrameData['layers'] = {};
    baseBones.forEach((b) => {
      bones[b.id] = { x: b.x, y: b.y, angle: b.angle, length: b.length };
    });
    baseLayers.forEach((l) => {
      layers[l.id] = {
        offsetX: l.offsetX,
        offsetY: l.offsetY,
        offsetAngle: l.offsetAngle,
        scaleX: l.scaleX,
        scaleY: l.scaleY,
        opacity: l.opacity,
      };
    });
    return { bones, layers };
  };

  // Find the drawing from the closest preceding keyframe that has one
  let activeDrawing: string | undefined = undefined;
  const drawingKeys = Object.keys(keyframes)
    .map(Number)
    .filter(k => keyframes[k] && keyframes[k].drawing)
    .sort((a, b) => a - b);

  if (drawingKeys.length > 0) {
    const prevDrawingKeys = drawingKeys.filter(k => k <= frame);
    if (prevDrawingKeys.length > 0) {
      activeDrawing = keyframes[prevDrawingKeys[prevDrawingKeys.length - 1]].drawing;
    } else {
      activeDrawing = keyframes[drawingKeys[0]].drawing;
    }
  }

  if (frameKeys.length === 0) {
    return { ...getBaseState(), drawing: activeDrawing };
  }

  // Exact match
  if (keyframes[frame]) {
    // Merge keyframe data over base state in case some bones are missing in that frame
    const base = getBaseState();
    return {
      bones: { ...base.bones, ...keyframes[frame].bones },
      layers: { ...base.layers, ...keyframes[frame].layers },
      drawing: keyframes[frame].drawing || activeDrawing
    };
  }

  // If frame is before the first keyframe, return first keyframe
  if (frame <= frameKeys[0]) {
    const base = getBaseState();
    const firstKey = keyframes[frameKeys[0]];
    return {
      bones: { ...base.bones, ...firstKey.bones },
      layers: { ...base.layers, ...firstKey.layers },
      drawing: activeDrawing
    };
  }

  // If frame is after the last keyframe, return last keyframe
  if (frame >= frameKeys[frameKeys.length - 1]) {
    const base = getBaseState();
    const lastKey = keyframes[frameKeys[frameKeys.length - 1]];
    return {
      bones: { ...base.bones, ...lastKey.bones },
      layers: { ...base.layers, ...lastKey.layers },
      drawing: activeDrawing
    };
  }

  // Otherwise interpolate between surrounding keyframes
  let prevFrame = frameKeys[0];
  let nextFrame = frameKeys[frameKeys.length - 1];

  for (let i = 0; i < frameKeys.length; i++) {
    if (frameKeys[i] < frame) {
      prevFrame = frameKeys[i];
    }
    if (frameKeys[i] > frame) {
      nextFrame = frameKeys[i];
      break;
    }
  }

  const prevData = keyframes[prevFrame];
  const nextData = keyframes[nextFrame];
  const t = (frame - prevFrame) / (nextFrame - prevFrame);

  const base = getBaseState();
  const interpBones: FrameData['bones'] = {};
  const interpLayers: FrameData['layers'] = {};

  // Interpolate bones
  baseBones.forEach((b) => {
    const prevBone = prevData.bones[b.id] || { x: b.x, y: b.y, angle: b.angle, length: b.length };
    const nextBone = nextData.bones[b.id] || { x: b.x, y: b.y, angle: b.angle, length: b.length };

    interpBones[b.id] = {
      x: lerp(prevBone.x, nextBone.x, t),
      y: lerp(prevBone.y, nextBone.y, t),
      angle: lerpAngle(prevBone.angle, nextBone.angle, t),
      length: lerp(prevBone.length, nextBone.length, t),
    };
  });

  // Interpolate layers
  baseLayers.forEach((l) => {
    const prevLayer = prevData.layers[l.id] || {
      offsetX: l.offsetX,
      offsetY: l.offsetY,
      offsetAngle: l.offsetAngle,
      scaleX: l.scaleX,
      scaleY: l.scaleY,
      opacity: l.opacity,
    };
    const nextLayer = nextData.layers[l.id] || {
      offsetX: l.offsetX,
      offsetY: l.offsetY,
      offsetAngle: l.offsetAngle,
      scaleX: l.scaleX,
      scaleY: l.scaleY,
      opacity: l.opacity,
    };

    interpLayers[l.id] = {
      offsetX: lerp(prevLayer.offsetX, nextLayer.offsetX, t),
      offsetY: lerp(prevLayer.offsetY, nextLayer.offsetY, t),
      offsetAngle: lerpAngle(prevLayer.offsetAngle, nextLayer.offsetAngle, t),
      scaleX: lerp(prevLayer.scaleX, nextLayer.scaleX, t),
      scaleY: lerp(prevLayer.scaleY, nextLayer.scaleY, t),
      opacity: lerp(prevLayer.opacity, nextLayer.opacity, t),
    };
  });

  return { bones: interpBones, layers: interpLayers, drawing: activeDrawing };
}

// Calculate on-canvas absolute coordinate for image layered onto a bone
export function getAbsoluteLayerTransform(
  layer: ImageLayer,
  state: { offsetX: number; offsetY: number; offsetAngle: number; scaleX: number; scaleY: number },
  absoluteBones: Record<string, AbsoluteBone>
) {
  if (!layer.boneId || !absoluteBones[layer.boneId]) {
    // If not attached to a bone, offsetX and offsetY are absolute coordinates
    return {
      x: state.offsetX,
      y: state.offsetY,
      angle: state.offsetAngle,
    };
  }

  const bone = absoluteBones[layer.boneId];
  const cos = Math.cos(bone.absAngle);
  const sin = Math.sin(bone.absAngle);

  // Rotate layer offsets by the absolute bone angle, then translate to bone start
  const x = bone.startX + state.offsetX * cos - state.offsetY * sin;
  const y = bone.startY + state.offsetX * sin + state.offsetY * cos;
  const angle = radToDeg(bone.absAngle) + state.offsetAngle;

  return { x, y, angle };
}
