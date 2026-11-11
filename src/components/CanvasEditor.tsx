/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from 'react';
import { 
  getAbsoluteBones, 
  getAbsoluteLayerTransform, 
  radToDeg, 
  degToRad, 
  AbsoluteBone,
  interpolateFrame
} from '../utils/math';
import { Project, Bone, ImageLayer, FrameData, Asset } from '../types';
import { 
  Move, 
  GitCommit, 
  RotateCw, 
  Maximize, 
  ZoomIn, 
  ZoomOut, 
  Grid, 
  Eye, 
  RefreshCcw, 
  MousePointerClick,
  PenTool,
  Eraser,
  Paintbrush
} from 'lucide-react';

function getDistanceToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number) {
  const l2 = Math.hypot(x2 - x1, y2 - y1) ** 2;
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
}

interface CanvasEditorProps {
  project: Project;
  currentFrame: number;
  activeFrameData: FrameData;
  toolMode: 'select' | 'bone' | 'pose' | 'transform' | 'draw' | 'eraser' | 'fill';
  selectedBoneId: string | null;
  selectedLayerId: string | null;
  showOnionSkin: boolean;
  onionSkinPrevFrames: number;
  showGrid: boolean;
  onUpdateFrameState: (updated: FrameData) => void;
  onSelectBone: (id: string | null) => void;
  onSelectLayer: (id: string | null) => void;
  onAddBone: (bone: Omit<Bone, 'id'>) => void;
  onStartHistoryAction?: () => void;
  isExporting?: boolean;
  penColor?: string;
  penSize?: number;
}

export default function CanvasEditor({
  project,
  currentFrame,
  activeFrameData,
  toolMode,
  selectedBoneId,
  selectedLayerId,
  showOnionSkin,
  onionSkinPrevFrames = 2,
  showGrid,
  onUpdateFrameState,
  onSelectBone,
  onSelectLayer,
  onAddBone,
  onStartHistoryAction,
  isExporting = false,
  penColor = '#ff0000',
  penSize = 5,
}: CanvasEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Viewport Zoom & Pan
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Multi-touch tracking values for pinch-to-zoom and pan gestures
  const touchStateRef = useRef<{
    initialDist: number;
    initialZoom: number;
    initialPanX: number;
    initialPanY: number;
    initialCenterX: number;
    initialCenterY: number;
    isMultiTouch: boolean;
  }>({
    initialDist: 0,
    initialZoom: 1,
    initialPanX: 0,
    initialPanY: 0,
    initialCenterX: 0,
    initialCenterY: 0,
    isMultiTouch: false
  });

  // Mouse Interaction Drag States
  const [dragAction, setDragAction] = useState<{
    type: 'bone-rotate' | 'bone-translate' | 'layer-transform' | 'layer-scale' | 'bone-create-preview' | 'none';
    boneId?: string;
    layerId?: string;
    startMouseX: number;
    startMouseY: number;
    initialValue?: any; // initial angle / offsets / etc.
  }>({ type: 'none', startMouseX: 0, startMouseY: 0 });

  // Creation preview (BONE Mode)
  const [boneCreationPreview, setBoneCreationPreview] = useState<{
    parentId: string | null;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  } | null>(null);

  // Image cache
  const [imageCache, setImageCache] = useState<Record<string, HTMLImageElement>>({});

  // --- FITUR MENGGAMBAR TANGAN (PULPEN, PENGHAPUS & EMBER CAT) ---
  const [isDrawing, setIsDrawing] = useState(false);
  const drawingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentDrawingImgRef = useRef<HTMLImageElement | null>(null);
  const currentDrawingSrcRef = useRef<string | null>(null);

  const getDrawingCanvas = () => {
    if (!drawingCanvasRef.current) {
      drawingCanvasRef.current = document.createElement('canvas');
    }
    const canvas = drawingCanvasRef.current;
    if (canvas.width !== project.width || canvas.height !== project.height) {
      canvas.width = project.width;
      canvas.height = project.height;
    }
    return canvas;
  };

  // Sync offscreen drawing canvas with keyframe drawings
  useEffect(() => {
    const src = activeFrameData?.drawing;
    const canvas = getDrawingCanvas();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!src) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      currentDrawingImgRef.current = null;
      currentDrawingSrcRef.current = null;
      drawCanvas();
      return;
    }

    if (currentDrawingSrcRef.current === src) return;

    currentDrawingSrcRef.current = src;
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      currentDrawingImgRef.current = img;
      drawCanvas();
    };
    img.src = src;
  }, [activeFrameData?.drawing, project.width, project.height, currentFrame]);

  // Flood fill algorithm
  const performFloodFill = (canvas: HTMLCanvasElement, startX: number, startY: number, fillColor: string) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    if (startX < 0 || startX >= width || startY < 0 || startY >= height) return;

    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    // Helper to parse hex to rgb
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
        a: 255
      } : { r: 0, g: 0, b: 0, a: 255 };
    };

    const fillRgba = hexToRgb(fillColor);
    const targetIdx = (startY * width + startX) * 4;
    const startR = data[targetIdx];
    const startG = data[targetIdx+1];
    const startB = data[targetIdx+2];
    const startA = data[targetIdx+3];

    // Check if clicked pixel is already the target fill color
    if (startR === fillRgba.r && startG === fillRgba.g && startB === fillRgba.b && startA === fillRgba.a) {
      return;
    }

    const colorMatch = (idx: number) => {
      return (
        Math.abs(data[idx] - startR) < 15 &&
        Math.abs(data[idx+1] - startG) < 15 &&
        Math.abs(data[idx+2] - startB) < 15 &&
        Math.abs(data[idx+3] - startA) < 15
      );
    };

    const queue: [number, number][] = [[startX, startY]];

    while (queue.length > 0) {
      const [cx, cy] = queue.pop()!;
      let lx = cx;
      while (lx >= 0 && colorMatch((cy * width + lx) * 4)) {
        lx--;
      }
      lx++;

      let rx = cx;
      while (rx < width && colorMatch((cy * width + rx) * 4)) {
        rx++;
      }
      rx--;

      for (let x = lx; x <= rx; x++) {
        const idx = (cy * width + x) * 4;
        data[idx] = fillRgba.r;
        data[idx+1] = fillRgba.g;
        data[idx+2] = fillRgba.b;
        data[idx+3] = fillRgba.a;
      }

      let scanAbove = false;
      let scanBelow = false;
      for (let x = lx; x <= rx; x++) {
        if (cy > 0) {
          const idxAbove = ((cy - 1) * width + x) * 4;
          const matchAbove = colorMatch(idxAbove);
          if (matchAbove && !scanAbove) {
            queue.push([x, cy - 1]);
            scanAbove = true;
          } else if (!matchAbove) {
            scanAbove = false;
          }
        }

        if (cy < height - 1) {
          const idxBelow = ((cy + 1) * width + x) * 4;
          const matchBelow = colorMatch(idxBelow);
          if (matchBelow && !scanBelow) {
            queue.push([x, cy + 1]);
            scanBelow = true;
          } else if (!matchBelow) {
            scanBelow = false;
          }
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
  };

  const saveDrawingState = (canvas: HTMLCanvasElement) => {
    onStartHistoryAction?.();
    const dataUrl = canvas.toDataURL('image/png');
    onUpdateFrameState({
      ...activeFrameData,
      drawing: dataUrl
    });
  };

  // Centering viewport automatically on load
  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setPanX((rect.width - project.width) / 2);
      setPanY((rect.height - project.height) / 2);
    }
  }, [project.id]);

  // Preload project assets into Image Cache
  useEffect(() => {
    const cache: Record<string, HTMLImageElement> = {};
    let loadedCount = 0;
    const assets = project.assets || [];

    if (assets.length === 0) {
      setImageCache({});
      return;
    }

    assets.forEach((asset) => {
      const img = new Image();
      if (asset.url && !asset.url.startsWith('data:')) {
        img.crossOrigin = 'anonymous';
      }
      img.src = asset.url;
      img.onload = () => {
        cache[asset.id] = img;
        loadedCount++;
        if (loadedCount === assets.length) {
          setImageCache({ ...cache });
        }
      };
      // fallback in case of load failure to keep app running
      img.onerror = () => {
        loadedCount++;
        if (loadedCount === assets.length) {
          setImageCache({ ...cache });
        }
      };
    });
  }, [project.assets]);

  // Redraw when assets, frame data, selection, or onion skin triggers change
  useEffect(() => {
    drawCanvas();
  }, [
    project, 
    currentFrame, 
    activeFrameData, 
    selectedBoneId, 
    selectedLayerId, 
    imageCache, 
    zoom, 
    panX, 
    panY, 
    showGrid, 
    showOnionSkin,
    toolMode,
    isExporting
  ]);

  // Desktop active Wheel zoom & pan centered on cursor position (with passive: false to prevent default window/viewport scroll)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      
      const zoomFactor = 1.08;
      let nextZoom = zoom;
      if (e.deltaY < 0) {
        nextZoom = Math.min(4, zoom * zoomFactor);
      } else {
        nextZoom = Math.max(0.25, zoom / zoomFactor);
      }

      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Adjust coordinate offsets so translation points remain locked under the mouse pointer
      const dx = mouseX - panX;
      const dy = mouseY - panY;

      setPanX(mouseX - dx * (nextZoom / zoom));
      setPanY(mouseY - dy * (nextZoom / zoom));
      setZoom(nextZoom);
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [zoom, panX, panY]);

  // Core drawing method
  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Render transparent workspace bounds boundary or pattern under target canvas
    // First paint standard outer border area
    ctx.save();

    // Fill the actual project canvas area
    ctx.fillStyle = project.backgroundColor;
    ctx.fillRect(0, 0, project.width, project.height);

    // Draw subtle grid texture overlay on custom canvas if requested
    if (showGrid && !isExporting) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < project.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, project.height);
        ctx.stroke();
      }
      for (let y = 0; y < project.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(project.width, y);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Step 1: Render ONION SKINNING layers if enabled
    if (showOnionSkin && !isExporting) {
      // Paint at most 2 previous keyframes
      const baseBones = project.bones;
      const baseLayers = project.layers;
      const step = 4; // draw frame relative offset

      for (let skinFrame = Math.max(0, currentFrame - step * onionSkinPrevFrames); skinFrame < currentFrame; skinFrame += step) {
        const opacityRatio = 0.15 + (skinFrame / currentFrame) * 0.1; // older frames are fainter
        const skinData = requireInterpolatedFrame(skinFrame);
        const skinAbsBones = getAbsoluteBones(baseBones, skinData.bones);

        // Render images at skinFrame
        baseLayers
          .slice()
          .sort((a,b) => a.zIndex - b.zIndex)
          .forEach((layer) => {
            const layerState = skinData.layers[layer.id] || {
              offsetX: layer.offsetX,
              offsetY: layer.offsetY,
              offsetAngle: layer.offsetAngle,
              scaleX: layer.scaleX,
              scaleY: layer.scaleY,
              opacity: layer.opacity
            };
            const transform = getAbsoluteLayerTransform(layer, layerState, skinAbsBones);
            const img = imageCache[layer.assetId];
            if (img) {
              ctx.save();
              ctx.globalAlpha = layerState.opacity * opacityRatio * 0.4;
              ctx.translate(transform.x, transform.y);
              ctx.rotate(degToRad(transform.angle));
              ctx.scale(layerState.scaleX, layerState.scaleY);
              ctx.drawImage(img, -img.width / 2, -img.height / 2, img.width, img.height);
              ctx.restore();
            }
          });

        // Render skin bones
        Object.values(skinAbsBones).forEach((bone) => {
          drawSingleBoneWedge(ctx, bone, 'rgba(100, 116, 139, 0.4)', false, true);
        });
      }
    }

    // Prepare current frame's absolute bone data
    const absBones = getAbsoluteBones(project.bones, activeFrameData.bones);

    // Step 2: Render Image Layers
    project.layers
      .slice()
      .sort((a, b) => a.zIndex - b.zIndex)
      .forEach((layer) => {
        const isSelected = selectedLayerId === layer.id;
        const layerState = {
          offsetX: 0,
          offsetY: 0,
          offsetAngle: 0,
          scaleX: 1,
          scaleY: 1,
          opacity: 1,
          ...(layer || {}),
          ...((activeFrameData && activeFrameData.layers && activeFrameData.layers[layer.id]) || {})
        };

        const transform = getAbsoluteLayerTransform(layer, layerState, absBones);
        const img = imageCache[layer.assetId];

        if (img) {
          ctx.save();
          ctx.globalAlpha = layerState.opacity;
          ctx.translate(transform.x, transform.y);
          ctx.rotate(degToRad(transform.angle));

          // Draw image first (with scale)
          ctx.save();
          ctx.scale(layerState.scaleX, layerState.scaleY);
          ctx.drawImage(img, -img.width / 2, -img.height / 2, img.width, img.height);
          ctx.restore();

          // Draw selection bounding rectangle & touch-friendly scale handles without scale distortion
          if (isSelected && !isExporting) {
            const w = img.width * Math.abs(layerState.scaleX);
            const h = img.height * Math.abs(layerState.scaleY);

            ctx.strokeStyle = '#2563eb';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 4]);
            ctx.strokeRect(-w / 2, -h / 2, w, h);
            ctx.setLineDash([]);
            
            // Draw 1 single, touch-friendly circular corner scale handle (perfect for finger dragging)
            const handleRadius = 11; // touch-friendly 22px diameter
            const c = { x: w / 2, y: h / 2 }; // Bottom-Right Corner

            // White glow under-layer for contrast
            ctx.beginPath();
            ctx.arc(c.x, c.y, handleRadius + 2, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.fill();

            // Handle main background
            ctx.beginPath();
            ctx.arc(c.x, c.y, handleRadius, 0, Math.PI * 2);
            ctx.fillStyle = '#2563eb';
            ctx.fill();
            
            // White ring border
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2.5;
            ctx.stroke();

            // Inner solid white dot
            ctx.beginPath();
            ctx.arc(c.x, c.y, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
          }

          ctx.restore();
        } else {
          // Fallback placeholder box
          ctx.save();
          ctx.translate(transform.x, transform.y);
          ctx.rotate(degToRad(transform.angle));
          ctx.fillStyle = 'rgba(100, 116, 139, 0.4)';
          ctx.fillRect(-40, -40, 80, 80);
          ctx.strokeStyle = '#ffffff';
          ctx.strokeRect(-40, -40, 80, 80);
          ctx.fillStyle = '#ffffff';
          ctx.font = '10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(layer.name, 0, 4);
          ctx.restore();
        }
      });

    // Step 2.5: Render Hand Drawings
    if (drawingCanvasRef.current) {
      ctx.drawImage(drawingCanvasRef.current, 0, 0);
    }

    // Step 3: Render Skeletal Bones & Controllers
    if (!isExporting) {
      // Draw connection lines for shifted child bones
      Object.values(absBones).forEach((bone) => {
        if (bone.parentId) {
          const parentAbs = absBones[bone.parentId];
          if (parentAbs) {
            const dist = Math.hypot(bone.startX - parentAbs.endX, bone.startY - parentAbs.endY);
            if (dist > 1) {
              ctx.save();
              ctx.strokeStyle = '#f59e0b'; // Amber-500
              ctx.lineWidth = 1.5;
              ctx.setLineDash([4, 4]); // dashed line
              ctx.beginPath();
              ctx.moveTo(parentAbs.endX, parentAbs.endY);
              ctx.lineTo(bone.startX, bone.startY);
              ctx.stroke();

              // Draw small connector pins at parent's tip and child's start
              ctx.beginPath();
              ctx.arc(parentAbs.endX, parentAbs.endY, 3, 0, Math.PI * 2);
              ctx.arc(bone.startX, bone.startY, 3, 0, Math.PI * 2);
              ctx.fillStyle = '#f59e0b';
              ctx.fill();
              ctx.restore();
            }
          }
        }
      });

      // First, draw bones connections as tapered Spine-style wedges
      Object.values(absBones).forEach((bone) => {
        const isSelected = selectedBoneId === bone.id;
        drawSingleBoneWedge(ctx, bone, bone.color, isSelected, false);
      });

      // Draw actual node circles for active joints and endpoints
      Object.values(absBones).forEach((bone) => {
        const isSelected = selectedBoneId === bone.id;

        // Bone Base joint node (circle at start element)
        ctx.beginPath();
        ctx.arc(bone.startX, bone.startY, 7, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? '#ffffff' : '#334155';
        ctx.strokeStyle = isSelected ? '#fbbf24' : '#ffffff';
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();

        // Core joint pin center
        ctx.beginPath();
        ctx.arc(bone.startX, bone.startY, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = bone.parentId ? '#818cf8' : '#34d399'; // Blue for nested, Green for Main Anchors
        ctx.fill();

        // Bone Tip endpoint (circle at structural termination)
        ctx.beginPath();
        ctx.arc(bone.endX, bone.endY, 5, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? '#fbbf24' : '#1e293b';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.fill();
        ctx.stroke();
      });

      // Render creation drag lines in real time (BONE DRAW Mode)
      if (toolMode === 'bone' && boneCreationPreview) {
        ctx.save();
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(boneCreationPreview.startX, boneCreationPreview.startY);
        ctx.lineTo(boneCreationPreview.endX, boneCreationPreview.endY);
        ctx.stroke();

        // Destination endpoint
        ctx.beginPath();
        ctx.arc(boneCreationPreview.endX, boneCreationPreview.endY, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#e9d5ff';
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
    }

    ctx.restore(); // Restore panning state
  };

  // Internal interpolation helper for onion skinning
  const requireInterpolatedFrame = (frameNo: number): FrameData => {
    return interpolateFrame(project.keyframes, frameNo, project.bones, project.layers);
  };

  // Bone renderer geometry
  const drawSingleBoneWedge = (
    ctx: CanvasRenderingContext2D, 
    bone: AbsoluteBone, 
    color: string, 
    isSelected: boolean,
    isOlderOnion: boolean = false
  ) => {
    const angle = Math.atan2(bone.endY - bone.startY, bone.endX - bone.startX);
    const len = bone.length;
    const width = Math.max(5, len * 0.08); // dynamic bone belly diameter

    ctx.save();
    ctx.translate(bone.startX, bone.startY);
    ctx.rotate(angle);

    // Spine 3D block wedge polygon shape
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(len * 0.18, -width);
    ctx.lineTo(len, 0);
    ctx.lineTo(len * 0.18, width);
    ctx.closePath();

    if (isOlderOnion) {
      ctx.fillStyle = 'rgba(148, 163, 184, 0.05)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();
    } else {
      ctx.fillStyle = isSelected ? 'rgba(234, 179, 8, 0.15)' : color + '20'; // 12% translucent fill
      ctx.fill();
      
      ctx.strokeStyle = isSelected ? '#f59e0b' : color;
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.stroke();
    }

    ctx.restore();
  };

  // Convert raw screen coordinates (clientX/clientY) to localized Canvas coordinate spaces
  const screenToCanvasCoords = (e: { clientX: number; clientY: number }) => {
    const container = containerRef.current;
    if (!container) return { x: 0, y: 0 };
    const rect = container.getBoundingClientRect();
    
    // Position within container bounding element
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;

    // Apply zoom and panning offsets to translate back to pure canvas space [0, project.width]
    const x = (rawX - panX) / zoom;
    const y = (rawY - panY) / zoom;

    return { x, y };
  };

  // Canvas MouseDown router
  const handleMouseDown = (e: React.MouseEvent) => {
    // If middle mouse click or Space key held down is active, process view panning
    if (e.button === 1 || e.shiftKey || isPanning) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panX, y: e.clientY - panY });
      return;
    }

    if (e.button !== 0) return; // Right clicking ignored

    const coords = screenToCanvasCoords(e);

    // Drawing Tool Interaction Mode Clicks
    if (['draw', 'eraser', 'fill'].includes(toolMode)) {
      setIsDrawing(true);
      const canvas = getDrawingCanvas();
      const ctx = canvas.getContext('2d');
      if (ctx) {
        if (toolMode === 'fill') {
          performFloodFill(canvas, Math.round(coords.x), Math.round(coords.y), penColor);
          saveDrawingState(canvas);
          setIsDrawing(false);
        } else {
          ctx.beginPath();
          ctx.moveTo(coords.x, coords.y);
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.lineWidth = penSize;
          if (toolMode === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
          } else {
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = penColor;
          }
          // Dot drawing for simple clicks
          ctx.lineTo(coords.x, coords.y);
          ctx.stroke();
          drawCanvas();
        }
      }
      return;
    }

    const tolerance = Math.max(16, 22 / zoom);

    const absBones = getAbsoluteBones(project.bones, activeFrameData.bones);

    // 1. Tool BONE creation mode clicks
    if (toolMode === 'bone') {
      // Find near joint node (start/end) of existing bones to select/focus it
      let clickedExistingJointId: string | null = null;
      for (const bone of Object.values(absBones)) {
        const dstToEnd = Math.hypot(coords.x - bone.endX, coords.y - bone.endY);
        const dstToStart = Math.hypot(coords.x - bone.startX, coords.y - bone.startY);
        if (dstToEnd < tolerance + 4 || dstToStart < tolerance + 4) {
          clickedExistingJointId = bone.id;
          break;
        }
      }

      if (clickedExistingJointId) {
        // They clicked/selected an existing joint's node circle!
        onSelectBone(clickedExistingJointId);
        onSelectLayer(null);
        setDragAction({ type: 'none', startMouseX: 0, startMouseY: 0 });
        return;
      }

      // If they clicked on empty canvas space while bone mode is active, they want to CREATE a bone!
      onStartHistoryAction?.();

      let parentId: string | null = null;
      let startX = coords.x;
      let startY = coords.y;

      // If a bone is already selected, the new bone connects to it as a child!
      if (selectedBoneId) {
        const parentAbs = absBones[selectedBoneId];
        if (parentAbs) {
          parentId = selectedBoneId;
          startX = parentAbs.endX;
          startY = parentAbs.endY;
        }
      }

      if (!parentId) {
        // Create root bone starting at clicked position, pointing upwards
        setDragAction({
          type: 'bone-create-preview',
          startMouseX: coords.x,
          startMouseY: coords.y,
          initialValue: { parentId: null, startX: coords.x, startY: coords.y }
        });

        setBoneCreationPreview({
          parentId: null,
          startX: coords.x,
          startY: coords.y,
          endX: coords.x,
          endY: coords.y - 50 // point up by 50px
        });
      } else {
        // Create connecting/child bone from parent's end node to clicked position
        setDragAction({
          type: 'bone-create-preview',
          startMouseX: coords.x,
          startMouseY: coords.y,
          initialValue: { parentId, startX, startY }
        });

        setBoneCreationPreview({
          parentId,
          startX,
          startY,
          endX: coords.x,
          endY: coords.y
        });
      }
      return;
    }

    // 1.5 Prioritize currently selected bone's joints first
    if (selectedBoneId && absBones[selectedBoneId]) {
      const selBone = absBones[selectedBoneId];
      const distStart = Math.hypot(coords.x - selBone.startX, coords.y - selBone.startY);
      const distEnd = Math.hypot(coords.x - selBone.endX, coords.y - selBone.endY);

      if (distStart < tolerance) {
        const targetBone = project.bones.find(b => b.id === selBone.id);
        if (targetBone && targetBone.parentId) {
          // If this bone has a parent, dragging its start joint should rotate the parent!
          const parentBone = project.bones.find(b => b.id === targetBone.parentId);
          const parentAbs = absBones[targetBone.parentId];
          if (parentBone && parentAbs) {
            onSelectBone(parentBone.id);
            onSelectLayer(null);
            onStartHistoryAction?.();

            const currentParentData = activeFrameData.bones[parentBone.id] || {
              x: parentAbs.startX,
              y: parentAbs.startY,
              angle: radToDeg(parentAbs.absAngle),
              length: parentAbs.length
            };

            setDragAction({
              type: 'bone-rotate',
              boneId: parentBone.id,
              startMouseX: coords.x,
              startMouseY: coords.y,
              initialValue: {
                startX: parentAbs.startX,
                startY: parentAbs.startY,
                initialAngle: currentParentData.angle,
                initialLength: currentParentData.length
              }
            });
            return;
          }
        }

        onSelectBone(selBone.id);
        onSelectLayer(null);

        onStartHistoryAction?.();

        const currentBData = activeFrameData.bones[selBone.id] || {
          x: targetBone ? targetBone.x : selBone.startX,
          y: targetBone ? targetBone.y : selBone.startY,
          angle: targetBone ? targetBone.angle : radToDeg(selBone.absAngle)
        };
        setDragAction({
          type: 'bone-translate',
          boneId: selBone.id,
          startMouseX: coords.x,
          startMouseY: coords.y,
          initialValue: {
            initialX: currentBData.x,
            initialY: currentBData.y
          }
        });
        return;
      }

      if (distEnd < tolerance) {
        onSelectBone(selBone.id);
        onSelectLayer(null);

        onStartHistoryAction?.();

        const currentBoneData = activeFrameData.bones[selBone.id] || { x: selBone.startX, y: selBone.startY, angle: radToDeg(selBone.absAngle), length: selBone.length };

        setDragAction({
          type: 'bone-rotate',
          boneId: selBone.id,
          startMouseX: coords.x,
          startMouseY: coords.y,
          initialValue: {
            startX: selBone.startX,
            startY: selBone.startY,
            initialAngle: currentBoneData.angle,
            initialLength: currentBoneData.length
          }
        });
        return;
      }
    }

    // 2. Select/Pose Bone Join Testing
    // Check hit test on Joint Tip endpoints (to rotate nested child bones)
    for (const bone of Object.values(absBones)) {
      const distEnd = Math.hypot(coords.x - bone.endX, coords.y - bone.endY);
      if (distEnd < tolerance) {
        onSelectBone(bone.id);
        onSelectLayer(null); // Deselect layers inside Bone selection

        onStartHistoryAction?.();

        const currentBoneData = activeFrameData.bones[bone.id] || { x: bone.startX, y: bone.startY, angle: radToDeg(bone.absAngle), length: bone.length };

        setDragAction({
          type: 'bone-rotate',
          boneId: bone.id,
          startMouseX: coords.x,
          startMouseY: coords.y,
          initialValue: {
            startX: bone.startX,
            startY: bone.startY,
            initialAngle: currentBoneData.angle,
            initialLength: currentBoneData.length
          }
        });
        return;
      }
    }

    // Check click on base anchor joints (to translate Root / absolute pivots)
    for (const bone of Object.values(absBones)) {
      const distStart = Math.hypot(coords.x - bone.startX, coords.y - bone.startY);
      if (distStart < tolerance) {
        const targetBone = project.bones.find(b => b.id === bone.id);
        if (targetBone && targetBone.parentId) {
          // If this bone has a parent, dragging its start joint should rotate the parent!
          const parentBone = project.bones.find(b => b.id === targetBone.parentId);
          const parentAbs = absBones[targetBone.parentId];
          if (parentBone && parentAbs) {
            onSelectBone(parentBone.id);
            onSelectLayer(null);
            onStartHistoryAction?.();

            const currentParentData = activeFrameData.bones[parentBone.id] || {
              x: parentAbs.startX,
              y: parentAbs.startY,
              angle: radToDeg(parentAbs.absAngle),
              length: parentAbs.length
            };

            setDragAction({
              type: 'bone-rotate',
              boneId: parentBone.id,
              startMouseX: coords.x,
              startMouseY: coords.y,
              initialValue: {
                startX: parentAbs.startX,
                startY: parentAbs.startY,
                initialAngle: currentParentData.angle,
                initialLength: currentParentData.length
              }
            });
            return;
          }
        }

        onSelectBone(bone.id);
        onSelectLayer(null);

        onStartHistoryAction?.();

        const currentBData = activeFrameData.bones[bone.id] || {
          x: targetBone ? targetBone.x : bone.startX,
          y: targetBone ? targetBone.y : bone.startY,
          angle: targetBone ? targetBone.angle : radToDeg(bone.absAngle)
        };
        setDragAction({
          type: 'bone-translate',
          boneId: bone.id,
          startMouseX: coords.x,
          startMouseY: coords.y,
          initialValue: {
            initialX: currentBData.x,
            initialY: currentBData.y
          }
        });
        return;
      }
    }

    // Check hit test on the bone BODY (the wedge between start and end joints)
    // We only do this if we haven't already hit a joint circle.
    for (const bone of Object.values(absBones)) {
      const distToBody = getDistanceToSegment(coords.x, coords.y, bone.startX, bone.startY, bone.endX, bone.endY);
      if (distToBody < tolerance + 2) {
        onSelectBone(bone.id);
        onSelectLayer(null);
        onStartHistoryAction?.();

        const targetBone = project.bones.find(b => b.id === bone.id);
        const currentBData = activeFrameData.bones[bone.id] || {
          x: targetBone ? targetBone.x : 0,
          y: targetBone ? targetBone.y : 0,
          angle: targetBone ? targetBone.angle : radToDeg(bone.absAngle),
          length: targetBone ? targetBone.length : bone.length
        };

        setDragAction({
          type: 'bone-translate',
          boneId: bone.id,
          startMouseX: coords.x,
          startMouseY: coords.y,
          initialValue: {
            initialX: currentBData.x,
            initialY: currentBData.y
          }
        });
        return;
      }
    }

     // 2.5 Optional: Selected Layer Corner Handles scaling click check first
    if (selectedLayerId) {
      const selectedLayer = project.layers.find(l => l.id === selectedLayerId);
      if (selectedLayer && !selectedLayer.boneId) {
        const state = {
          offsetX: 0,
          offsetY: 0,
          offsetAngle: 0,
          scaleX: 1,
          scaleY: 1,
          opacity: 1,
          ...(selectedLayer || {}),
          ...((activeFrameData && activeFrameData.layers && activeFrameData.layers[selectedLayer.id]) || {})
        };
        const trans = getAbsoluteLayerTransform(selectedLayer, state, absBones);
        const imageAsset = project.assets.find(a => a.id === selectedLayer.assetId);
        if (imageAsset) {
          const img = imageCache[selectedLayer.assetId];
          const realW = img ? img.width : (imageAsset.width || 100);
          const realH = img ? img.height : (imageAsset.height || 100);
          const halfW = realW / 2;
          const halfH = realH / 2;
          
          const dx = coords.x - trans.x;
          const dy = coords.y - trans.y;
          const rad = degToRad(-trans.angle);
          const localX = dx * Math.cos(rad) - dy * Math.sin(rad);
          const localY = dx * Math.sin(rad) + dy * Math.cos(rad);

          // The single bottom-right control handle in local space
          const w = halfW * 2 * Math.abs(state.scaleX);
          const h = halfH * 2 * Math.abs(state.scaleY);
          const corner = { cx: w / 2, cy: h / 2 }; // Bottom-Right

          // Check if click was close to the scaling handle (generous touch tolerance: 28px for mobile and desktop control)
          const hitTolerance = 28;
          const dist = Math.hypot(localX - corner.cx, localY - corner.cy);

          if (dist <= hitTolerance) {
            onStartHistoryAction?.();
            setDragAction({
              type: 'layer-scale',
              layerId: selectedLayer.id,
              startMouseX: coords.x,
              startMouseY: coords.y,
              initialValue: {
                initialScaleX: state.scaleX,
                initialScaleY: state.scaleY,
                initialLocalDist: Math.hypot(localX, localY) || 1
              }
            });
            return;
          }
        }
      }
    }

    // 3. Transform layer clicks
    // Select layers by hit testing order layer rectangles starting from top layer (highest visual z-Index)
    const sortedLayers = [...project.layers].sort((a,b) => b.zIndex - a.zIndex);
    for (const layer of sortedLayers) {
      const state = {
        offsetX: 0,
        offsetY: 0,
        offsetAngle: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        ...(layer || {}),
        ...((activeFrameData && activeFrameData.layers && activeFrameData.layers[layer.id]) || {})
      };

      const trans = getAbsoluteLayerTransform(layer, state, absBones);
      
      // Calculate simple click bounding check
      const imageAsset = project.assets.find(a => a.id === layer.assetId);
      if (imageAsset) {
        const img = imageCache[layer.assetId];
        const realW = img ? img.width : (imageAsset.width || 100);
        const realH = img ? img.height : (imageAsset.height || 100);
        const halfW = (realW / 2) * Math.abs(state.scaleX);
        const halfH = (realH / 2) * Math.abs(state.scaleY);

        // Vector project mouse clicked relative to layer center rotated coordinates
        const dx = coords.x - trans.x;
        const dy = coords.y - trans.y;
        const rad = degToRad(-trans.angle); // inverse rotate click to align with local aabb
        const localX = dx * Math.cos(rad) - dy * Math.sin(rad);
        const localY = dx * Math.sin(rad) + dy * Math.cos(rad);

        if (localX >= -halfW && localX <= halfW && localY >= -halfH && localY <= halfH) {
          onSelectLayer(layer.id);
          onSelectBone(null);

          onStartHistoryAction?.();

          setDragAction({
            type: 'layer-transform',
            layerId: layer.id,
            startMouseX: coords.x,
            startMouseY: coords.y,
            initialValue: {
              initialOffsetX: state.offsetX,
              initialOffsetY: state.offsetY,
              initialOffsetAngle: state.offsetAngle,
              initialScaleX: state.scaleX,
              initialScaleY: state.scaleY
            }
          });
          return;
        }
      }
    }

    // Clicked empty workspace canvas - we preserve active selections to prevent accidental deselections 
    // when dragging or tapping on mobile devices (keeping the user focused on the inspector and multiplier slider).
    // if (onSelectBone) onSelectBone(null);
    // if (onSelectLayer) onSelectLayer(null);
  };

  // Canvas MouseMove processing
  const handleMouseMove = (e: React.MouseEvent) => {
    // 1. Process panning viewport
    if (isPanning) {
      setPanX(e.clientX - panStart.x);
      setPanY(e.clientY - panStart.y);
      return;
    }

    if (isDrawing && ['draw', 'eraser'].includes(toolMode)) {
      const coords = screenToCanvasCoords(e);
      const canvas = getDrawingCanvas();
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();
        drawCanvas();
      }
      return;
    }

    if (dragAction.type === 'none') return;

    const coords = screenToCanvasCoords(e);
    const absBones = getAbsoluteBones(project.bones, activeFrameData.bones);

    // 2. Bone rotate/joint flex calculations (end joint dragged)
    if (dragAction.type === 'bone-rotate' && dragAction.boneId) {
      const boneId = dragAction.boneId;
      const targetBone = project.bones.find(b => b.id === boneId);
      if (targetBone?.followGravity) {
        return; // Ignore rotation when gravity is active
      }
      const val = dragAction.initialValue;

      // calculate angle relative to bone's absolute start point
      const dx = coords.x - val.startX;
      const dy = coords.y - val.startY;

      let newAbsAngleRad = Math.atan2(dy, dx);
      let newLength = Math.hypot(dx, dy);

      // limit length to minimum of 10px
      newLength = Math.max(10, newLength);

      let targetAngleDeg = radToDeg(newAbsAngleRad);

      if (targetBone?.parentId) {
        // subtract the parent's absolute angle to convert back to LOCAL bone angle
        const parentAbs = absBones[targetBone.parentId];
        if (parentAbs) {
          targetAngleDeg = targetAngleDeg - radToDeg(parentAbs.absAngle);
        }
      }

      // wrap angle around [-180, 180]
      targetAngleDeg = ((targetAngleDeg + 180) % 360) - 180;
      if (targetAngleDeg < -180) targetAngleDeg += 360;

      // Propagation updates on active keyframe
      const updatedBones = { ...activeFrameData.bones };
      const currentBone = updatedBones[boneId] || { x: targetBone?.x || 0, y: targetBone?.y || 0, angle: targetBone?.angle || 0, length: targetBone?.length || 50 };

      updatedBones[boneId] = {
        ...currentBone,
        angle: parseFloat(targetAngleDeg.toFixed(1))
      };

      onUpdateFrameState({
        ...activeFrameData,
        bones: updatedBones
      });
    }

    // 3. Absolute root bone dragging
    if (dragAction.type === 'bone-translate' && dragAction.boneId) {
      const boneId = dragAction.boneId;
      const val = dragAction.initialValue;

      const deltaX = coords.x - dragAction.startMouseX;
      const deltaY = coords.y - dragAction.startMouseY;

      const updatedBones = { ...activeFrameData.bones };
      const boneInfo = project.bones.find(b => b.id === boneId);
      const currentBone = updatedBones[boneId] || { x: boneInfo?.x || 0, y: boneInfo?.y || 0, angle: boneInfo?.angle || 0, length: boneInfo?.length || 50 };

      updatedBones[boneId] = {
        ...currentBone,
        x: Math.round(val.initialX + deltaX),
        y: Math.round(val.initialY + deltaY)
      };

      onUpdateFrameState({
        ...activeFrameData,
        bones: updatedBones
      });
    }

    // 4. Transform Image offset Layer positioning
    if (dragAction.type === 'layer-transform' && dragAction.layerId) {
      const layerId = dragAction.layerId;
      const val = dragAction.initialValue;
      const targetLayer = project.layers.find(l => l.id === layerId);

      if (targetLayer) {
        const updatedLayers = { ...(activeFrameData?.layers || {}) };
        const baseState = updatedLayers[layerId] || {
          offsetX: targetLayer.offsetX,
          offsetY: targetLayer.offsetY,
          offsetAngle: targetLayer.offsetAngle,
          scaleX: targetLayer.scaleX,
          scaleY: targetLayer.scaleY,
          opacity: targetLayer.opacity
        };

        const deltaX = coords.x - dragAction.startMouseX;
        const deltaY = coords.y - dragAction.startMouseY;

        if (toolMode === 'transform') {
          // If in scale/rotation tool, calculate distance offsets to adjust scale and angle offset manually
          const imageAsset = project.assets.find(a => a.id === targetLayer.assetId);
          const baseWidth = imageAsset?.width || 100;
          
          const currentDist = Math.hypot(coords.x - dragAction.startMouseX, coords.y - dragAction.startMouseY);
          const scaleChange = currentDist / baseWidth;
          const isGrowing = coords.x > dragAction.startMouseX;

          const finalScale = Math.max(0.1, val.initialScaleX + (isGrowing ? scaleChange : -scaleChange));

          updatedLayers[layerId] = {
            ...baseState,
            scaleX: parseFloat(finalScale.toFixed(2)),
            scaleY: parseFloat(finalScale.toFixed(2)),
            offsetAngle: parseFloat(((val.initialOffsetAngle + deltaX * 0.4) % 360).toFixed(1))
          };
        } else {
          // Traditional translation drag Offset
          // If layer is bound to a bone, the translation occurs along the bone's rotational coordinate frame
          if (targetLayer.boneId && absBones[targetLayer.boneId]) {
            const bone = absBones[targetLayer.boneId];
            const cos = Math.cos(-bone.absAngle);
            const sin = Math.sin(-bone.absAngle);

            // Project mouse delta into local rotated bone fields
            const localDeltaX = deltaX * cos - deltaY * sin;
            const localDeltaY = deltaX * sin + deltaY * cos;

            updatedLayers[layerId] = {
              ...baseState,
              offsetX: Math.round(val.initialOffsetX + localDeltaX),
              offsetY: Math.round(val.initialOffsetY + localDeltaY)
            };
          } else {
            // Absolute on-canvas placement
            updatedLayers[layerId] = {
              ...baseState,
              offsetX: Math.round(val.initialOffsetX + deltaX),
              offsetY: Math.round(val.initialOffsetY + deltaY)
            };
          }
        }

        onUpdateFrameState({
          ...activeFrameData,
          layers: updatedLayers
        });
      }
    }

    // 4.5 Transform Image scaling by corner handle dragging
    if (dragAction.type === 'layer-scale' && dragAction.layerId) {
      const layerId = dragAction.layerId;
      const val = dragAction.initialValue;
      const targetLayer = project.layers.find(l => l.id === layerId);

      if (targetLayer) {
        const updatedLayers = { ...(activeFrameData?.layers || {}) };
        const baseState = updatedLayers[layerId] || {
          offsetX: targetLayer.offsetX,
          offsetY: targetLayer.offsetY,
          offsetAngle: targetLayer.offsetAngle,
          scaleX: targetLayer.scaleX,
          scaleY: targetLayer.scaleY,
          opacity: targetLayer.opacity
        };

        const transform = getAbsoluteLayerTransform(targetLayer, baseState, absBones);

        // Calculate current mouse distance from the layer center (transform.x, transform.y)
        const dx = coords.x - transform.x;
        const dy = coords.y - transform.y;
        
        // Use local scale coordinates (hypot)
        const rad = degToRad(-transform.angle);
        const localX = dx * Math.cos(rad) - dy * Math.sin(rad);
        const localY = dx * Math.sin(rad) + dy * Math.cos(rad);
        const currentLocalDist = Math.hypot(localX, localY);

        const initialLocalDist = val.initialLocalDist || 1;
        const scaleRatio = currentLocalDist / initialLocalDist;

        // Scale proportionally and limit range between 0.05x and 10x
        const nextScaleX = Math.max(0.05, Math.min(10, val.initialScaleX * scaleRatio));
        const nextScaleY = Math.max(0.05, Math.min(10, val.initialScaleY * scaleRatio));

        updatedLayers[layerId] = {
          ...baseState,
          scaleX: parseFloat(nextScaleX.toFixed(2)),
          scaleY: parseFloat(nextScaleY.toFixed(2))
        };

        onUpdateFrameState({
          ...activeFrameData,
          layers: updatedLayers
        });
      }
    }

    // 5. Creation feedback (BONE Mode)
    if (dragAction.type === 'bone-create-preview' && boneCreationPreview) {
      setBoneCreationPreview({
        ...boneCreationPreview,
        endX: coords.x,
        endY: coords.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);

    if (isDrawing) {
      setIsDrawing(false);
      const canvas = getDrawingCanvas();
      saveDrawingState(canvas);
      return;
    }
    if (dragAction.type === 'bone-create-preview' && boneCreationPreview) {
      let { parentId, startX, startY, endX, endY } = boneCreationPreview;
      
      let dx = endX - startX;
      let dy = endY - startY;
      let len = Math.hypot(dx, dy);

      // Support simple clicking: if dragging distance is tiny or zero, default length to 50, pointing up
      if (len <= 15) {
        len = 50;
        dx = 0;
        dy = -50;
      }

      let angleDeg = radToDeg(Math.atan2(dy, dx));

      // Deduce local offset angle if nested
      if (parentId) {
        const absBones = getAbsoluteBones(project.bones, activeFrameData.bones);
        const parentAbs = absBones[parentId];
        if (parentAbs) {
          angleDeg = angleDeg - radToDeg(parentAbs.absAngle);
        }
      }

      // create new bone record
      const boneIndex = project.bones.length + 1;
      const colorPalette = ['#e53e3e', '#3182ce', '#319795', '#d69e2e', '#805ad5', '#ecc94b', '#48bb78'];
      const randomColor = colorPalette[boneIndex % colorPalette.length];

      onAddBone({
        name: `Tulang_Baru_${boneIndex}`,
        parentId,
        length: Math.round(len),
        angle: parseFloat((((angleDeg + 180) % 360) - 180).toFixed(1)),
        x: parentId ? 0 : Math.round(startX),
        y: parentId ? 0 : Math.round(startY),
        color: randomColor
      });

      setBoneCreationPreview(null);
    }

    setDragAction({ type: 'none', startMouseX: 0, startMouseY: 0 });
  };

  // Multi-Touch Gestures for Pinch-to-zoom & Two-Finger Panning
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;

      touchStateRef.current = {
        initialDist: dist,
        initialZoom: zoom,
        initialPanX: panX,
        initialPanY: panY,
        initialCenterX: centerX,
        initialCenterY: centerY,
        isMultiTouch: true
      };
      setIsPanning(true);
      if (e.cancelable) {
        e.preventDefault();
      }
    } else if (e.touches.length === 1) {
      touchStateRef.current.isMultiTouch = false;
      const touch = e.touches[0];
      
      const mockMouseEvent = {
        button: 0,
        clientX: touch.clientX,
        clientY: touch.clientY,
        shiftKey: false,
        preventDefault: () => {},
        stopPropagation: () => {},
      } as unknown as React.MouseEvent;

      handleMouseDown(mockMouseEvent);
      if (e.cancelable) {
        e.preventDefault();
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && touchStateRef.current.isMultiTouch) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;

      const { initialDist, initialZoom, initialPanX, initialPanY, initialCenterX, initialCenterY } = touchStateRef.current;

      let nextZoom = initialZoom;
      if (initialDist > 0) {
        const ratio = dist / initialDist;
        nextZoom = Math.min(4, Math.max(0.25, initialZoom * ratio));
      }

      const dx = centerX - initialCenterX;
      const dy = centerY - initialCenterY;

      setZoom(nextZoom);
      setPanX(initialPanX + dx);
      setPanY(initialPanY + dy);

      if (e.cancelable) {
        e.preventDefault();
      }
    } else if (e.touches.length === 1 && !touchStateRef.current.isMultiTouch) {
      const touch = e.touches[0];
      const mockMouseEvent = {
        clientX: touch.clientX,
        clientY: touch.clientY,
        preventDefault: () => {},
        stopPropagation: () => {},
      } as unknown as React.MouseEvent;

      handleMouseMove(mockMouseEvent);
      if (e.cancelable) {
        e.preventDefault();
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStateRef.current.isMultiTouch) {
      if (e.touches.length < 2) {
        touchStateRef.current.isMultiTouch = false;
        setIsPanning(false);
      }
    } else {
      handleMouseUp();
    }
    if (e.cancelable) {
      e.preventDefault();
    }
  };

  const resetViewport = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setZoom(1);
      setPanX((rect.width - project.width) / 2);
      setPanY((rect.height - project.height) / 2);
    }
  };

  return (
    <div 
      className="flex-1 flex flex-col min-h-0 bg-white border border-gray-200 rounded-2xl relative overflow-hidden group select-none shadow-sm"
    >
      {/* Viewport Control Bar */}
      <div className="absolute top-4 left-4 flex gap-2 z-10">
        <div className="bg-white/95 border border-gray-200 rounded-lg p-1 flex gap-1 shadow-md backdrop-blur">
          <button
            onClick={() => setZoom(Math.max(0.25, zoom - 0.25))}
            className="p-1 px-1.5 text-slate-500 hover:text-slate-800 transition rounded hover:bg-slate-50"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono font-medium text-slate-700 flex items-center justify-center min-w-16">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(Math.min(4, zoom + 0.25))}
            className="p-1 px-1.5 text-slate-500 hover:text-slate-800 transition rounded hover:bg-slate-50"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={resetViewport}
            className="p-1 px-1.5 text-slate-400 hover:text-slate-800 transition rounded hover:bg-slate-50 border-l border-gray-150 ml-1"
            title="Reset View"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-white/95 border border-gray-200 rounded-lg p-1 px-2.5 flex items-center gap-1.5 text-xs text-slate-600 shadow-md backdrop-blur">
          <Grid className={`w-3.5 h-3.5 ${showGrid ? 'text-blue-500' : 'text-slate-400'}`} />
          <span>Grid: <b>{showGrid ? 'Aktif' : 'Nonaktif'}</b></span>
        </div>

        {showOnionSkin && (
          <div className="bg-white/95 border border-gray-200 rounded-lg p-1 px-2.5 flex items-center gap-1.5 text-xs text-slate-600 shadow-md backdrop-blur">
            <Eye className="w-3.5 h-3.5 text-amber-500" />
            <span>Onion Skin: <b>Aktif (-{onionSkinPrevFrames}f)</b></span>
          </div>
        )}
      </div>

      <div className="absolute top-4 right-4 flex gap-1 z-10 bg-white/95 border border-gray-200 rounded-lg p-1 shadow-md backdrop-blur text-xs">
        <div className="px-2 py-1 text-slate-600 flex items-center gap-2">
          {toolMode === 'select' && (
            <>
              <Move className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
              <span>Geser & Atur Gambar</span>
            </>
          )}
          {toolMode === 'bone' && (
            <>
              <GitCommit className="w-3.5 h-3.5 text-purple-500 animate-bounce" />
              <span className="text-purple-600 font-medium">Hubungkan Tulang: Klik dan Seret</span>
            </>
          )}
          {toolMode === 'pose' && (
            <>
              <RefreshCcw className="w-3.5 h-3.5 text-amber-500 animate-spin-slow" />
              <span className="text-amber-600 font-medium">Mode Pose: Putar Persendian (Bones)</span>
            </>
          )}
          {toolMode === 'transform' && (
            <>
              <Maximize className="w-3.5 h-3.5 text-teal-500" />
              <span className="text-teal-600 font-medium">Mode Skala & Putar Gambar</span>
            </>
          )}
          {toolMode === 'draw' && (
            <>
              <PenTool className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
              <span className="text-emerald-600 font-medium">Mode Pulpen: Gambar Bebas</span>
            </>
          )}
          {toolMode === 'eraser' && (
            <>
              <Eraser className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
              <span className="text-rose-600 font-medium">Mode Penghapus: Hapus Hasil Gambar</span>
            </>
          )}
          {toolMode === 'fill' && (
            <>
              <Paintbrush className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
              <span className="text-indigo-600 font-medium">Mode Ember Cat: Mewarnai Area</span>
            </>
          )}
        </div>
      </div>

      {/* Main Canvas Node Viewport */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-hidden relative cursor-crosshair bg-[#d0d0d0]"
        style={{ touchAction: 'none', width: '100%' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        <canvas
          ref={canvasRef}
          width={project.width}
          height={project.height}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: project.width,
            height: project.height,
            transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
            transformOrigin: '0 0',
          }}
          className="pointer-events-none rounded transition-shadow shadow-2xl border border-slate-900/15"
        />
        
        {/* Panning hotkey instruction helper */}
        <div className="absolute bottom-4 left-4 text-[10px] text-slate-500 bg-white/80 border border-gray-200/80 p-2 rounded-lg backdrop-blur shadow-sm">
          💡 Tips: Geser layar menggunakan <b>Tombol Shift + Tarik mouse</b> atau <b>Gunakan Roda Tengah Tikus</b>
        </div>
      </div>
    </div>
  );
}
