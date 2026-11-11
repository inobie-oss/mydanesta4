/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Project, Asset, Bone, ImageLayer, FrameData } from '../types';

// Crisp, beautiful inline vector assets as Base64/Data URLs to ensure instant loading
export const SAMPLE_ASSETS = {
  head: `data:image/svg+xml;utf8,<svg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="gHead" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23ff9a9e"/><stop offset="100%" stop-color="%23fecfef"/></linearGradient></defs><circle cx="60" cy="60" r="50" fill="url(%23gHead)" stroke="%23ffffff" stroke-width="3"/><circle cx="45" cy="50" r="6" fill="%232d3748"/><circle cx="75" cy="50" r="6" fill="%232d3748"/><ellipse cx="60" cy="68" rx="12" ry="6" fill="%23e53e3e" opacity="0.8"/><circle cx="35" cy="60" r="8" fill="%23ff8da1" opacity="0.5"/><circle cx="85" cy="60" r="8" fill="%23ff8da1" opacity="0.5"/></svg>`,
  
  torso: `data:image/svg+xml;utf8,<svg width="140" height="180" viewBox="0 0 140 180" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="gTorso" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23a1c4fd"/><stop offset="100%" stop-color="%23c2e9fb"/></linearGradient></defs><rect x="20" y="20" width="100" height="140" rx="30" fill="url(%23gTorso)" stroke="%23ffffff" stroke-width="3"/><rect x="40" y="50" width="60" height="50" rx="10" fill="%231a202c" opacity="0.6"/><circle cx="55" cy="75" r="5" fill="%234fd1c5"/><circle cx="70" cy="75" r="5" fill="%23ed64a6"/><circle cx="85" cy="75" r="5" fill="%23ecc94b"/></svg>`,
  
  armLeft: `data:image/svg+xml;utf8,<svg width="50" height="130" viewBox="0 0 50 130" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="gArm" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="%23f6d365"/><stop offset="100%" stop-color="%23fda085"/></linearGradient></defs><rect x="10" y="10" width="30" height="110" rx="15" fill="url(%23gArm)" stroke="%23ffffff" stroke-width="2"/><circle cx="25" cy="25" r="8" fill="%23ffffff" opacity="0.7"/><circle cx="25" cy="105" r="10" fill="%23f6d365"/></svg>`,
  
  armRight: `data:image/svg+xml;utf8,<svg width="50" height="130" viewBox="0 0 50 130" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="gArmR" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="%23f6d365"/><stop offset="100%" stop-color="%23fda085"/></linearGradient></defs><rect x="10" y="10" width="30" height="110" rx="15" fill="url(%23gArmR)" stroke="%23ffffff" stroke-width="2"/><circle cx="25" cy="25" r="8" fill="%23ffffff" opacity="0.7"/><circle cx="25" cy="105" r="10" fill="%23f6d365"/></svg>`,

  legLeft: `data:image/svg+xml;utf8,<svg width="60" height="140" viewBox="0 0 60 140" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="gLeg" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="%2384fab0"/><stop offset="100%" stop-color="%238fd3f4"/></linearGradient></defs><rect x="15" y="10" width="30" height="100" rx="15" fill="url(%23gLeg)" stroke="%23ffffff" stroke-width="2"/><ellipse cx="30" cy="115" rx="20" ry="12" fill="%23319795" stroke="%23ffffff" stroke-width="2"/></svg>`,
  
  legRight: `data:image/svg+xml;utf8,<svg width="60" height="140" viewBox="0 0 60 140" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="gLegR" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="%2384fab0"/><stop offset="100%" stop-color="%238fd3f4"/></linearGradient></defs><rect x="15" y="10" width="30" height="100" rx="15" fill="url(%23gLegR)" stroke="%23ffffff" stroke-width="2"/><ellipse cx="30" cy="115" rx="20" ry="12" fill="%23319795" stroke="%23ffffff" stroke-width="2"/></svg>`,

  star: `data:image/svg+xml;utf8,<svg width="150" height="150" viewBox="0 0 150 150" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="gStar" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23fef08a"/><stop offset="100%" stop-color="%23facc15"/></linearGradient></defs><path d="M 75 10 L 95 55 L 140 60 L 105 92 L 115 138 L 75 115 L 35 138 L 45 92 L 10 60 L 55 55 Z" fill="url(%23gStar)" stroke="%23ffffff" stroke-width="4" stroke-linejoin="round"/><circle cx="55" cy="70" r="6" fill="%231e293b"/><circle cx="95" cy="70" r="6" fill="%231e293b"/><path d="M 65 85 Q 75 95 85 85" stroke="%231e293b" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`,

  sword: `data:image/svg+xml;utf8,<svg width="60" height="180" viewBox="0 0 60 180" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="gBlade" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="%2300f2fe"/><stop offset="100%" stop-color="%234facfe"/></linearGradient></defs><path d="M 23 15 L 37 15 L 35 130 L 25 130 Z" fill="url(%23gBlade)" stroke="%23ffffff" stroke-width="2"/><rect x="15" y="130" width="30" height="10" rx="3" fill="%23718096" stroke="%23ffffff" stroke-width="1.5"/><rect x="25" y="140" width="10" height="30" rx="2" fill="%232d3748"/><circle cx="30" cy="172" r="5" fill="%23ecc94b"/></svg>`
};

const encodeSvg = (rawUrl: string): string => {
  if (rawUrl.startsWith('data:image/svg+xml;utf8,')) {
    const xml = rawUrl.substring('data:image/svg+xml;utf8,'.length);
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(xml);
  }
  return rawUrl;
};

const createAssets = (): Asset[] => [
  { id: 'ast-head', name: 'Cute Head', url: encodeSvg(SAMPLE_ASSETS.head), type: 'image/svg+xml', width: 120, height: 120 },
  { id: 'ast-torso', name: 'Retro Torso', url: encodeSvg(SAMPLE_ASSETS.torso), type: 'image/svg+xml', width: 140, height: 180 },
  { id: 'ast-arm-l', name: 'Arm Left', url: encodeSvg(SAMPLE_ASSETS.armLeft), type: 'image/svg+xml', width: 50, height: 130 },
  { id: 'ast-arm-r', name: 'Arm Right', url: encodeSvg(SAMPLE_ASSETS.armRight), type: 'image/svg+xml', width: 50, height: 130 },
  { id: 'ast-leg-l', name: 'Leg Left', url: encodeSvg(SAMPLE_ASSETS.legLeft), type: 'image/svg+xml', width: 60, height: 140 },
  { id: 'ast-leg-r', name: 'Leg Right', url: encodeSvg(SAMPLE_ASSETS.legRight), type: 'image/svg+xml', width: 60, height: 140 },
  { id: 'ast-star', name: 'Yoshi Star', url: encodeSvg(SAMPLE_ASSETS.star), type: 'image/svg+xml', width: 150, height: 150 },
  { id: 'ast-sword', name: 'Laser Sword', url: encodeSvg(SAMPLE_ASSETS.sword), type: 'image/svg+xml', width: 60, height: 180 },
];

export const getSampleProjects = (): Project[] => {
  const assets = createAssets();

  // Project 1: "The Dancing Bob" (Robot dancing smoothly)
  const p1Bones: Bone[] = [
    { id: 'bone-pelvis', name: 'Pelvis (Root)', parentId: null, length: 15, angle: -90, x: 400, y: 350, color: '#e53e3e' },
    { id: 'bone-torso', name: 'Torso', parentId: 'bone-pelvis', length: 110, angle: 0, x: 0, y: 0, color: '#3182ce' },
    { id: 'bone-head', name: 'Head', parentId: 'bone-torso', length: 50, angle: 0, x: 0, y: 0, color: '#dd6b20' },
    { id: 'bone-arm-l', name: 'Arm Left', parentId: 'bone-torso', length: 85, angle: -110, x: 0, y: 0, color: '#319795' },
    { id: 'bone-arm-r', name: 'Arm Right', parentId: 'bone-torso', length: 85, angle: 110, x: 0, y: 0, color: '#319795' },
    { id: 'bone-leg-l', name: 'Leg Left', parentId: 'bone-pelvis', length: 90, angle: 75, x: 0, y: 0, color: '#805ad5' },
    { id: 'bone-leg-r', name: 'Leg Right', parentId: 'bone-pelvis', length: 90, angle: 105, x: 0, y: 0, color: '#805ad5' },
  ];

  const p1Layers: ImageLayer[] = [
    {
      id: 'layer-torso',
      name: 'Torso Layer',
      assetId: 'ast-torso',
      boneId: 'bone-torso',
      offsetX: 50, // offset positions relative to bone start
      offsetY: -70,
      offsetAngle: 90,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      zIndex: 3
    },
    {
      id: 'layer-head',
      name: 'Head Layer',
      assetId: 'ast-head',
      boneId: 'bone-head',
      offsetX: 40,
      offsetY: -60,
      offsetAngle: 90,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      zIndex: 4
    },
    {
      id: 'layer-arm-l',
      name: 'Arm Left Layer',
      assetId: 'ast-arm-l',
      boneId: 'bone-arm-l',
      offsetX: 10,
      offsetY: -20,
      offsetAngle: 90,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      zIndex: 2
    },
    {
      id: 'layer-arm-r',
      name: 'Arm Right Layer',
      assetId: 'ast-arm-r',
      boneId: 'bone-arm-r',
      offsetX: 10,
      offsetY: -20,
      offsetAngle: 90,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      zIndex: 5
    },
    {
      id: 'layer-leg-l',
      name: 'Leg Left Layer',
      assetId: 'ast-leg-l',
      boneId: 'bone-leg-l',
      offsetX: 15,
      offsetY: -20,
      offsetAngle: 90,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      zIndex: 1
    },
    {
      id: 'layer-leg-r',
      name: 'Leg Right Layer',
      assetId: 'ast-leg-r',
      boneId: 'bone-leg-r',
      offsetX: 15,
      offsetY: -20,
      offsetAngle: 90,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      zIndex: 6
    },
    {
      id: 'layer-sword',
      name: 'Accessory Sword',
      assetId: 'ast-sword',
      boneId: 'bone-arm-r',
      offsetX: 85, // attach to hand/end of right arm
      offsetY: -10,
      offsetAngle: 0,
      scaleX: 0.8,
      scaleY: 0.8,
      opacity: 1,
      zIndex: 7
    }
  ];

  // Let's program 4 awesome keyframes (every 12 frames for a 48-frame loop at 24fps)
  const p1Keyframes: Record<number, FrameData> = {
    0: {
      bones: {
        'bone-pelvis': { x: 400, y: 350, angle: -90, length: 15 },
        'bone-torso': { x: 0, y: 0, angle: 0, length: 110 },
        'bone-head': { x: 0, y: 0, angle: 0, length: 50 },
        'bone-arm-l': { x: 0, y: 0, angle: -120, length: 85 },
        'bone-arm-r': { x: 0, y: 0, angle: 120, length: 85 },
        'bone-leg-l': { x: 0, y: 0, angle: 75, length: 90 },
        'bone-leg-r': { x: 0, y: 0, angle: 105, length: 90 },
      },
      layers: {
        'layer-torso': { offsetX: 50, offsetY: -70, offsetAngle: 90, scaleX: 1, scaleY: 1, opacity: 1 },
        'layer-head': { offsetX: 40, offsetY: -60, offsetAngle: 90, scaleX: 1, scaleY: 1, opacity: 1 },
        'layer-arm-l': { offsetX: 10, offsetY: -25, offsetAngle: 90, scaleX: 1, scaleY: 1, opacity: 1 },
        'layer-arm-r': { offsetX: 10, offsetY: -25, offsetAngle: 90, scaleX: 1, scaleY: 1, opacity: 1 },
        'layer-leg-l': { offsetX: 15, offsetY: -20, offsetAngle: 90, scaleX: 1, scaleY: 1, opacity: 1 },
        'layer-leg-r': { offsetX: 15, offsetY: -20, offsetAngle: 90, scaleX: 1, scaleY: 1, opacity: 1 },
        'layer-sword': { offsetX: 75, offsetY: -15, offsetAngle: -30, scaleX: 0.8, scaleY: 0.8, opacity: 1 }
      }
    },
    12: {
      bones: {
        'bone-pelvis': { x: 400, y: 370, angle: -85, length: 15 }, // Dip down pelvis
        'bone-torso': { x: 0, y: 0, angle: -5, length: 110 },
        'bone-head': { x: 0, y: 0, angle: 10, length: 50 },
        'bone-arm-l': { x: 0, y: 0, angle: -160, length: 85 }, // Raise left arm high
        'bone-arm-r': { x: 0, y: 0, angle: 45, length: 85 },   // Drop right arm
        'bone-leg-l': { x: 0, y: 0, angle: 60, length: 90 },
        'bone-leg-r': { x: 0, y: 0, angle: 120, length: 90 },
      },
      layers: {
        'layer-torso': { offsetX: 50, offsetY: -70, offsetAngle: 90, scaleX: 1, scaleY: 1, opacity: 1 },
        'layer-head': { offsetX: 40, offsetY: -60, offsetAngle: 90, scaleX: 1, scaleY: 1, opacity: 1 },
        'layer-arm-l': { offsetX: 10, offsetY: -25, offsetAngle: 90, scaleX: 1, scaleY: 1, opacity: 1 },
        'layer-arm-r': { offsetX: 10, offsetY: -25, offsetAngle: 90, scaleX: 1, scaleY: 1, opacity: 1 },
        'layer-leg-l': { offsetX: 15, offsetY: -20, offsetAngle: 85, scaleX: 1, scaleY: 1, opacity: 1 },
        'layer-leg-r': { offsetX: 15, offsetY: -20, offsetAngle: 95, scaleX: 1, scaleY: 1, opacity: 1 },
        'layer-sword': { offsetX: 75, offsetY: -15, offsetAngle: 15, scaleX: 0.8, scaleY: 0.8, opacity: 1 }
      }
    },
    24: {
      bones: {
        'bone-pelvis': { x: 400, y: 350, angle: -90, length: 15 },
        'bone-torso': { x: 0, y: 0, angle: 0, length: 110 },
        'bone-head': { x: 0, y: 0, angle: -10, length: 50 },
        'bone-arm-l': { x: 0, y: 0, angle: -120, length: 85 },
        'bone-arm-r': { x: 0, y: 0, angle: 120, length: 85 },
        'bone-leg-l': { x: 0, y: 0, angle: 75, length: 90 },
        'bone-leg-r': { x: 0, y: 0, angle: 105, length: 90 },
      },
      layers: {
        'layer-torso': { offsetX: 50, offsetY: -70, offsetAngle: 90, scaleX: 1, scaleY: 1, opacity: 1 },
        'layer-head': { offsetX: 40, offsetY: -60, offsetAngle: 80, scaleX: 1, scaleY: 1, opacity: 1 },
        'layer-arm-l': { offsetX: 10, offsetY: -25, offsetAngle: 90, scaleX: 1, scaleY: 1, opacity: 1 },
        'layer-arm-r': { offsetX: 10, offsetY: -25, offsetAngle: 90, scaleX: 1, scaleY: 1, opacity: 1 },
        'layer-leg-l': { offsetX: 15, offsetY: -20, offsetAngle: 90, scaleX: 1, scaleY: 1, opacity: 1 },
        'layer-leg-r': { offsetX: 15, offsetY: -20, offsetAngle: 90, scaleX: 1, scaleY: 1, opacity: 1 },
        'layer-sword': { offsetX: 75, offsetY: -15, offsetAngle: -30, scaleX: 0.8, scaleY: 0.8, opacity: 1 }
      }
    },
    36: {
      bones: {
        'bone-pelvis': { x: 410, y: 360, angle: -95, length: 15 }, // Bend right side
        'bone-torso': { x: 0, y: 0, angle: 10, length: 110 },
        'bone-head': { x: 0, y: 0, angle: -20, length: 50 },
        'bone-arm-l': { x: 0, y: 0, angle: -45, length: 85 },  // Drop left arm
        'bone-arm-r': { x: 0, y: 0, angle: 160, length: 85 }, // Raise right arm high
        'bone-leg-l': { x: 0, y: 0, angle: 80, length: 90 },
        'bone-leg-r': { x: 0, y: 0, angle: 115, length: 90 },
      },
      layers: {
        'layer-torso': { offsetX: 50, offsetY: -70, offsetAngle: 90, scaleX: 1, scaleY: 1, opacity: 1 },
        'layer-head': { offsetX: 40, offsetY: -60, offsetAngle: 90, scaleX: 1, scaleY: 1, opacity: 1 },
        'layer-arm-l': { offsetX: 10, offsetY: -25, offsetAngle: 90, scaleX: 1, scaleY: 1, opacity: 1 },
        'layer-arm-r': { offsetX: 10, offsetY: -25, offsetAngle: 90, scaleX: 1, scaleY: 1, opacity: 1 },
        'layer-leg-l': { offsetX: 15, offsetY: -20, offsetAngle: 95, scaleX: 1, scaleY: 1, opacity: 1 },
        'layer-leg-r': { offsetX: 15, offsetY: -20, offsetAngle: 85, scaleX: 1, scaleY: 1, opacity: 1 },
        'layer-sword': { offsetX: 75, offsetY: -15, offsetAngle: -90, scaleX: 0.8, scaleY: 0.8, opacity: 1 }
      }
    },
    48: {
      bones: {
        'bone-pelvis': { x: 400, y: 350, angle: -90, length: 15 },
        'bone-torso': { x: 0, y: 0, angle: 0, length: 110 },
        'bone-head': { x: 0, y: 0, angle: 0, length: 50 },
        'bone-arm-l': { x: 0, y: 0, angle: -120, length: 85 },
        'bone-arm-r': { x: 0, y: 0, angle: 120, length: 85 },
        'bone-leg-l': { x: 0, y: 0, angle: 75, length: 90 },
        'bone-leg-r': { x: 0, y: 0, angle: 105, length: 90 },
      },
      layers: {
        'layer-torso': { offsetX: 50, offsetY: -70, offsetAngle: 90, scaleX: 1, scaleY: 1, opacity: 1 },
        'layer-head': { offsetX: 40, offsetY: -60, offsetAngle: 90, scaleX: 1, scaleY: 1, opacity: 1 },
        'layer-arm-l': { offsetX: 10, offsetY: -25, offsetAngle: 90, scaleX: 1, scaleY: 1, opacity: 1 },
        'layer-arm-r': { offsetX: 10, offsetY: -25, offsetAngle: 90, scaleX: 1, scaleY: 1, opacity: 1 },
        'layer-leg-l': { offsetX: 15, offsetY: -20, offsetAngle: 90, scaleX: 1, scaleY: 1, opacity: 1 },
        'layer-leg-r': { offsetX: 15, offsetY: -20, offsetAngle: 90, scaleX: 1, scaleY: 1, opacity: 1 },
        'layer-sword': { offsetX: 75, offsetY: -15, offsetAngle: -30, scaleX: 0.8, scaleY: 0.8, opacity: 1 }
      }
    }
  };

  const project1: Project = {
    id: 'sample-dancing-robot',
    name: 'Dancing Bob Spec',
    width: 800,
    height: 600,
    fps: 24,
    playbackLength: 48,
    backgroundColor: '#111827', // Deep charcoal
    assets,
    bones: p1Bones,
    layers: p1Layers,
    keyframes: p1Keyframes,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
    updatedAt: new Date().toISOString()
  };


  // Project 2: "Space Star Orbit" (Waving star on elastic bone)
  const p2Bones: Bone[] = [
    { id: 'star-root', name: 'Anchor Point', parentId: null, length: 80, angle: -90, x: 400, y: 400, color: '#f59e0b' },
    { id: 'star-flex', name: 'Flex Bone', parentId: 'star-root', length: 100, angle: 0, x: 0, y: 0, color: '#10b981' }
  ];

  const p2Layers: ImageLayer[] = [
    {
      id: 'layer-star',
      name: 'Star Cap',
      assetId: 'ast-star',
      boneId: 'star-flex',
      offsetX: 40,
      offsetY: -35,
      offsetAngle: 90,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      zIndex: 1
    }
  ];

  const p2Keyframes: Record<number, FrameData> = {
    0: {
      bones: {
        'star-root': { x: 400, y: 380, angle: -90, length: 80 },
        'star-flex': { x: 0, y: 0, angle: 0, length: 100 }
      },
      layers: {
        'layer-star': { offsetX: 40, offsetY: -35, offsetAngle: 90, scaleX: 1, scaleY: 1, opacity: 1 }
      }
    },
    15: {
      bones: {
        'star-root': { x: 400, y: 380, angle: -120, length: 90 }, // stretch left
        'star-flex': { x: 0, y: 0, angle: 30, length: 110 }     // whip double bend
      },
      layers: {
        'layer-star': { offsetX: 40, offsetY: -35, offsetAngle: 110, scaleX: 1.1, scaleY: 0.9, opacity: 1 } // squish
      }
    },
    30: {
      bones: {
        'star-root': { x: 400, y: 380, angle: -90, length: 80 },
        'star-flex': { x: 0, y: 0, angle: 0, length: 100 }
      },
      layers: {
        'layer-star': { offsetX: 40, offsetY: -35, offsetAngle: 90, scaleX: 1, scaleY: 1, opacity: 1 }
      }
    },
    45: {
      bones: {
        'star-root': { x: 400, y: 380, angle: -60, length: 90 },  // stretch right
        'star-flex': { x: 0, y: 0, angle: -30, length: 110 }    // whip back
      },
      layers: {
        'layer-star': { offsetX: 40, offsetY: -35, offsetAngle: 70, scaleX: 1.1, scaleY: 0.9, opacity: 1 }
      }
    },
    60: {
      bones: {
        'star-root': { x: 400, y: 380, angle: -90, length: 80 },
        'star-flex': { x: 0, y: 0, angle: 0, length: 100 }
      },
      layers: {
        'layer-star': { offsetX: 40, offsetY: -35, offsetAngle: 90, scaleX: 1, scaleY: 1, opacity: 1 }
      }
    }
  };

  const project2: Project = {
    id: 'sample-space-star',
    name: 'Retro Star Jumper',
    width: 800,
    height: 600,
    fps: 30,
    playbackLength: 60,
    backgroundColor: '#0f172a', // Dark slate
    assets,
    bones: p2Bones,
    layers: p2Layers,
    keyframes: p2Keyframes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  return [project1, project2];
};
