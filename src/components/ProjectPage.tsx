/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Tv, 
  HelpCircle, 
  Clapperboard, 
  Sparkles, 
  Cpu, 
  RefreshCcw, 
  Save, 
  History,
  Undo2,
  Redo2,
  Move
} from 'lucide-react';
import { Project, Bone, ImageLayer, FrameData, Asset } from '../types';
import { interpolateFrame } from '../utils/math';
import SidebarAssets from './SidebarAssets';
import CanvasEditor from './CanvasEditor';
import SidebarInspector from './SidebarInspector';
import Timeline from './Timeline';

interface ProjectPageProps {
  project: Project;
  onExit: () => void;
  onSaveProject: (updated: Project) => void;
}

export default function ProjectPage({ project: initialProject, onExit, onSaveProject }: ProjectPageProps) {
  // Sync project configuration
  const [project, setProject] = useState<Project>(initialProject);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(true);
  const [autoKeyframe, setAutoKeyframe] = useState(true);

  // Undo & Redo state machines
  const [undoStack, setUndoStack] = useState<Project[]>([]);
  const [redoStack, setRedoStack] = useState<Project[]>([]);

  const handleStartHistoryAction = () => {
    setUndoStack((prev) => {
      // Avoid pushing identical duplicates
      const last = prev[prev.length - 1];
      if (last && JSON.stringify(last) === JSON.stringify(project)) {
        return prev;
      }
      return [...prev, JSON.parse(JSON.stringify(project))];
    });
    setRedoStack([]); // Clear redo stack on any new user intent change
  };

  // Keep track of latest project state for debounced saving
  const nextProjectRef = useRef<Project | null>(null);
  const saveTimeoutRef = useRef<any>(null);

  // Wrap onSaveProject in a ref to avoid infinite re-renders in unmount cleanup
  const onSaveProjectRef = useRef(onSaveProject);
  useEffect(() => {
    onSaveProjectRef.current = onSaveProject;
  }, [onSaveProject]);

  // Helper to save immediately and cancel pending debounces
  const saveImmediately = (nextProject: Project) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    nextProjectRef.current = nextProject;
    onSaveProjectRef.current(nextProject);
  };

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (nextProjectRef.current) {
        onSaveProjectRef.current(nextProjectRef.current);
      }
    };
  }, []);

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, prev.length - 1));
    setRedoStack((prev) => [...prev, JSON.parse(JSON.stringify(project))]);
    setProject(previous);
    saveImmediately(previous);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, prev.length - 1));
    setUndoStack((prev) => [...prev, JSON.parse(JSON.stringify(project))]);
    setProject(next);
    saveImmediately(next);
  };

  // Keyboard Event shortcuts (Ctrl+Z and Ctrl+Y / Ctrl+Shift+Z)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.hasAttribute('contenteditable')
      ) {
        return;
      }

      const isZ = e.key.toLowerCase() === 'z';
      const isY = e.key.toLowerCase() === 'y';
      const isCmdOrCtrl = e.ctrlKey || e.metaKey;

      if (isCmdOrCtrl && !e.shiftKey && isZ) {
        e.preventDefault();
        handleUndo();
      } else if (
        (isCmdOrCtrl && e.shiftKey && isZ) ||
        (isCmdOrCtrl && isY)
      ) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [undoStack, redoStack, project]);

  // Interface view configurations
  const [selectedBoneId, setSelectedBoneId] = useState<string | null>(null);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [toolMode, setToolMode] = useState<'pose' | 'bone' | 'select' | 'transform' | 'draw' | 'eraser' | 'fill'>('pose');
  const [sidebarActiveTab, setSidebarActiveTab] = useState<'assets' | 'inspector'>('assets');
  const [penColor, setPenColor] = useState<string>('#ff0000');
  const [penSize, setPenSize] = useState<number>(5);

  // Auto-switch tab to inspector index when selecting item, or to assets when empty
  useEffect(() => {
    if (selectedBoneId || selectedLayerId) {
      setSidebarActiveTab('inspector');
    } else {
      setSidebarActiveTab('assets');
    }
  }, [selectedBoneId, selectedLayerId]);

  // Professional animation aids
  const [showOnionSkin, setShowOnionSkin] = useState(true);
  const [onionSkinPrevFrames, setOnionSkinPrevFrames] = useState(2);
  const [showGrid, setShowGrid] = useState(true);

  // Panel positions states
  const [sidebarPos, setSidebarPos] = useState<'left' | 'right' | 'top' | 'bottom'>('left');
  const [timelinePos, setTimelinePos] = useState<'bottom' | 'top' | 'left' | 'right'>('bottom');
  const [activeMenu, setActiveMenu] = useState<'sidebar' | 'timeline' | null>(null);

  const sidebarPositionOptions = [
    { value: 'left', label: 'Panel Kiri (Default)', icon: '⬅️' },
    { value: 'right', label: 'Panel Kanan', icon: '➡️' },
    { value: 'top', label: 'Panel Atas', icon: '⬆️' },
    { value: 'bottom', label: 'Panel Bawah', icon: '⬇️' },
  ];

  const timelinePositionOptions = [
    { value: 'bottom', label: 'Timeline Bawah (Default)', icon: '⬇️' },
    { value: 'top', label: 'Timeline Atas', icon: '⬆️' },
    { value: 'left', label: 'Timeline Kiri', icon: '⬅️' },
    { value: 'right', label: 'Timeline Kanan', icon: '➡️' },
  ];

  // Render video export queues
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  // Dynamic values interpolation for active playback state
  const activeFrameData = interpolateFrame(project.keyframes, currentFrame, project.bones, project.layers);

  // Playback Loop effect hooks
  useEffect(() => {
    let playInterval: NodeJS.Timeout | null = null;

    if (isPlaying) {
      const intervalMs = 1000 / project.fps;
      playInterval = setInterval(() => {
        setCurrentFrame((prev) => {
          const next = prev + 1;
          if (next > project.playbackLength) {
            if (isLooping) {
              return 0; // go back to start
            } else {
              setIsPlaying(false);
              return prev; // hold at end
            }
          }
          return next;
        });
      }, intervalMs);
    }

    return () => {
      if (playInterval) clearInterval(playInterval);
    };
  }, [isPlaying, project.fps, project.playbackLength, isLooping]);

  // Persist project saves to local storage whenever critical properties mutate
  const updateProject = (nextProject: Project) => {
    setProject(nextProject);
    
    // Perform debounced save to parent component (reduces localStorage IO during dragging)
    nextProjectRef.current = nextProject;
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      if (nextProjectRef.current) {
        onSaveProject(nextProjectRef.current);
      }
      saveTimeoutRef.current = null;
    }, 400); // 400ms debounce
  };

  // 1. General Project properties updating
  const handleUpdateProjectMeta = (fields: Partial<Project>) => {
    handleStartHistoryAction();
    updateProject({
      ...project,
      ...fields,
      updatedAt: new Date().toISOString()
    });
  };

  // 2. Bone fields updates
  const handleUpdateBoneMeta = (boneId: string, fields: Partial<Bone>) => {
    handleStartHistoryAction();
    const updatedBones = project.bones.map((b) => (b.id === boneId ? { ...b, ...fields } : b));
    updateProject({
      ...project,
      bones: updatedBones,
      updatedAt: new Date().toISOString()
    });
  };

  // 3. Layer fields updates
  const handleUpdateLayerMeta = (layerId: string, fields: Partial<ImageLayer>) => {
    handleStartHistoryAction();
    const updatedLayers = project.layers.map((l) => (l.id === layerId ? { ...l, ...fields } : l));
    updateProject({
      ...project,
      layers: updatedLayers,
      updatedAt: new Date().toISOString()
    });
  };

  const handleUpdateLayerMetaAndFrame = (layerId: string, layerFields: Partial<ImageLayer>, nextFrameData: FrameData) => {
    handleStartHistoryAction();
    const updatedLayers = project.layers.map((l) => (l.id === layerId ? { ...l, ...layerFields } : l));
    const updatedKeyframes = { ...project.keyframes };
    updatedKeyframes[currentFrame] = nextFrameData;

    updateProject({
      ...project,
      layers: updatedLayers,
      keyframes: updatedKeyframes,
      updatedAt: new Date().toISOString()
    });
  };

  // 4. Update the actual bone/layer joint data on active keyframe
  const handleUpdateFrameState = (nextFrameData: FrameData) => {
    const updatedKeyframes = { ...project.keyframes };
    
    // Always store state on active keyframe. If auto-record is enabled, we create the frame payload
    // on first movement instantly
    updatedKeyframes[currentFrame] = nextFrameData;

    updateProject({
      ...project,
      keyframes: updatedKeyframes,
      updatedAt: new Date().toISOString()
    });
  };

  // 5. Assets uploading triggers
  const handleAddAsset = (newAsset: Asset) => {
    handleStartHistoryAction();
    const nextAssets = [...(project.assets || []), newAsset];
    updateProject({
      ...project,
      assets: nextAssets,
      updatedAt: new Date().toISOString()
    });
  };

  const handleDeleteAsset = (id: string) => {
    handleStartHistoryAction();
    
    // Find layers associated with this asset and purge them from project layers and keyframes
    const layersToPurge = project.layers.filter((l) => l.assetId === id);
    const purgedLayerIds = layersToPurge.map((l) => l.id);
    
    const nextAssets = (project.assets || []).filter((a) => a.id !== id);
    const nextLayers = (project.layers || []).filter((l) => l.assetId !== id);
    
    // Clean keyframes references
    const updatedKeyframes = { ...project.keyframes };
    Object.keys(updatedKeyframes).forEach((kfKey: any) => {
      const frameData = updatedKeyframes[kfKey];
      purgedLayerIds.forEach((lid) => {
        if (frameData.layers && frameData.layers[lid]) {
          delete frameData.layers[lid];
        }
      });
    });

    updateProject({
      ...project,
      assets: nextAssets,
      layers: nextLayers,
      keyframes: updatedKeyframes,
      updatedAt: new Date().toISOString()
    });

    // Reset selected layer if we purged it
    if (selectedLayerId && purgedLayerIds.includes(selectedLayerId)) {
      setSelectedLayerId(null);
    }
  };

  // 6. Creating layer nodes from assets library
  const handleAddLayerFromAsset = (assetId: string) => {
    const asset = project.assets.find((a) => a.id === assetId);
    if (!asset) return;

    handleStartHistoryAction();

    // Create unique layers record
    const layerCount = project.layers.length;
    const newLayer: ImageLayer = {
      id: 'layer-' + Date.now(),
      name: `${asset.name} (L-${layerCount + 1})`,
      assetId,
      boneId: null, // Initial free position placement
      offsetX: Math.round(project.width / 2), // Placement at center of project canvas
      offsetY: Math.round(project.height / 2),
      offsetAngle: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      zIndex: layerCount + 1
    };

    const nextLayers = [...project.layers, newLayer];
    
    // If keyframes are empty or defined, append default state to prevent flicker
    const updatedKeyframes = { ...project.keyframes };
    Object.keys(updatedKeyframes).forEach((kfIndex: any) => {
      const data = updatedKeyframes[kfIndex];
      data.layers[newLayer.id] = {
        offsetX: newLayer.offsetX,
        offsetY: newLayer.offsetY,
        offsetAngle: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1
      };
    });

    updateProject({
      ...project,
      layers: nextLayers,
      keyframes: updatedKeyframes,
      updatedAt: new Date().toISOString()
    });

    // Automatically focus new layer
    setSelectedLayerId(newLayer.id);
    setSelectedBoneId(null);
  };

  // 7. Bone modifications
  const handleAddBone = (newBoneFields: Omit<Bone, 'id'>) => {
    handleStartHistoryAction();
    const newBoneId = 'bone-' + Date.now();
    const finalizedBone: Bone = {
      ...newBoneFields,
      id: newBoneId
    };

    const nextBones = [...project.bones, finalizedBone];

    // Append standard default coordinate to existing keyframes
    const updatedKeyframes = { ...project.keyframes };
    Object.keys(updatedKeyframes).forEach((kfIdx: any) => {
      const frameData = updatedKeyframes[kfIdx];
      frameData.bones[newBoneId] = {
        x: finalizedBone.x,
        y: finalizedBone.y,
        angle: finalizedBone.angle,
        length: finalizedBone.length
      };
    });

    updateProject({
      ...project,
      bones: nextBones,
      keyframes: updatedKeyframes,
      updatedAt: new Date().toISOString()
    });

    // Auto focus newly drafted bones
    setSelectedBoneId(newBoneId);
    setSelectedLayerId(null);
    setToolMode('pose');
  };

  // Deleting joint nodes recursively cascade
  const handleDeleteBone = (id: string) => {
    if (window.confirm('Hapus tulang ini? Semua anak tulang yang bergantung padanya akan dinonaktifkan atau di-unlink.')) {
      handleStartHistoryAction();
      // 1. Remove from configuration list
      const nextBones = project.bones.map((b) => {
        if (b.parentId === id) {
          return { ...b, parentId: null, x: Math.round(project.width / 2), y: Math.round(project.height / 2) }; // Attach to root
        }
        return b;
      }).filter((b) => b.id !== id);

      // 2. Unrig any layers bound to this element
      const nextLayers = project.layers.map((l) => {
        if (l.boneId === id) {
          return { ...l, boneId: null };
        }
        return l;
      });

      // 3. Purge bone references inside keyframes timeline
      const updatedKeyframes = { ...project.keyframes };
      Object.keys(updatedKeyframes).forEach((kf: any) => {
        if (updatedKeyframes[kf] && updatedKeyframes[kf].bones && updatedKeyframes[kf].bones[id]) {
          delete updatedKeyframes[kf].bones[id];
        }
      });

      updateProject({
        ...project,
        bones: nextBones,
        layers: nextLayers,
        keyframes: updatedKeyframes,
        updatedAt: new Date().toISOString()
      });

      if (selectedBoneId === id) setSelectedBoneId(null);
    }
  };

  const handleDeleteLayer = (id: string) => {
    handleStartHistoryAction();
    const nextLayers = project.layers.filter((l) => l.id !== id);
    const updatedKeyframes = { ...project.keyframes };
    Object.keys(updatedKeyframes).forEach((kf: any) => {
      if (updatedKeyframes[kf] && updatedKeyframes[kf].layers && updatedKeyframes[kf].layers[id]) {
        delete updatedKeyframes[kf].layers[id];
      }
    });

    updateProject({
      ...project,
      layers: nextLayers,
      keyframes: updatedKeyframes,
      updatedAt: new Date().toISOString()
    });

    if (selectedLayerId === id) setSelectedLayerId(null);
  };

  // 8. Keyframe Timeline manipulation
  const handleAddKeyframe = () => {
    handleStartHistoryAction();
    const updatedKeyframes = { ...project.keyframes };
    
    // Save current interpolated configurations exactly at current frame index
    updatedKeyframes[currentFrame] = JSON.parse(JSON.stringify(activeFrameData));

    updateProject({
      ...project,
      keyframes: updatedKeyframes,
      updatedAt: new Date().toISOString()
    });
  };

  const handleRemoveKeyframe = () => {
    const updatedKeyframes = { ...project.keyframes };
    if (updatedKeyframes[currentFrame]) {
      handleStartHistoryAction();
      delete updatedKeyframes[currentFrame];
      updateProject({
        ...project,
        keyframes: updatedKeyframes,
        updatedAt: new Date().toISOString()
      });
    }
  };

  const handleClearAllKeyframes = () => {
    handleStartHistoryAction();
    updateProject({
      ...project,
      keyframes: {},
      updatedAt: new Date().toISOString()
    });
  };

  // 9. HIGH FIDELITY EXPORTER: MediaRecorder Canvas capture pipeline
  const handleExportVideo = async () => {
    if (isExporting) return;
    setIsExporting(true);
    setExportProgress(0);

    // Stop active plays
    setIsPlaying(false);

    // Grab target viewport canvas element
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    if (!canvas) {
      setIsExporting(false);
      alert("Kanvas tidak ditemukan di dalam dokumen. Pastikan viewport editor terbuka.");
      return;
    }

    // Capture standard media stream from dynamic canvas element
    const recordFps = project.fps;
    let stream: MediaStream;
    try {
      stream = (canvas as any).captureStream(recordFps);
    } catch (err) {
      setIsExporting(false);
      alert("Browser Anda memblokir perekaman kanvas stream API. Silakan coba buka di tab baru.");
      return;
    }

    // Try various mimeTypes in priority order for MP4 and WebM conversion
    let options = { mimeType: 'video/mp4' };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options = { mimeType: 'video/webm;codecs=vp9' };
    }
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options = { mimeType: 'video/webm;codecs=vp8' };
    }
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options = { mimeType: 'video/webm' };
    }
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options = { mimeType: '' }; // fallback
    }

    const chunks: BlobPart[] = [];
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, options);
    } catch (e) {
      setIsExporting(false);
      alert("Inisialisasi MediaRecorder gagal. Silakan gunakan peramban modern (Chrome/Firefox/Safari).");
      return;
    }

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    recorder.onstop = () => {
      const isMp4 = options.mimeType.includes('mp4');
      const blob = new Blob(chunks, { type: options.mimeType || 'video/webm' });
      const url = URL.createObjectURL(blob);

      // Trigger standard local file download
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = `${project.name.toLowerCase().replace(/\s+/g, '_')}_render.${isMp4 ? 'mp4' : 'webm'}`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(url);

      setIsExporting(false);
    };

    // Begin recording loop
    recorder.start();

    // Reset playhead to initial frame index
    let frameNo = 0;
    const totalFrames = project.playbackLength;

    const recordInterval = setInterval(() => {
      setCurrentFrame(frameNo);
      setExportProgress(Math.floor((frameNo / totalFrames) * 100));

      if (frameNo >= totalFrames) {
        clearInterval(recordInterval);
        // Add a small delay for flushing chunks safely
        setTimeout(() => {
          recorder.stop();
        }, 150);
      } else {
        frameNo++;
      }
    }, 1000 / recordFps);
  };

  return (
    <div id="project-editor-workspace" className="h-screen bg-slate-100 text-slate-800 flex flex-col justify-between font-sans overflow-hidden">
      
      {/* 1. TOP BAR NAVBAR PANEL */}
      <div className="bg-[#c8c8c8] border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0 shadow-sm relative z-10">
        
        {/* Left: Retract return button & name title HUD */}
        <div className="flex items-center gap-4">
          <button
            onClick={onExit}
            id="workspace-back-btn"
            className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            Kembali ke Beranda
          </button>
          
          <div className="h-5 w-px bg-gray-200" />

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-slate-900 font-sans tracking-wide">
                {project.name}
              </h1>
              <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 border border-blue-100 rounded font-bold uppercase tracking-wider font-mono">
                Editor Aktif
              </span>
            </div>
            
            <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-0.5">
              <span>Resolusi: <b className="text-slate-700">{project.width} × {project.height} px</b></span>
              <span>•</span>
              <span>Speed: <b className="text-slate-700">{project.fps} FPS</b></span>
              <span>•</span>
              <span>Frames: <b className="text-slate-700">{currentFrame}/{project.playbackLength}</b></span>
            </div>
          </div>
        </div>

        {/* Right: Operations & high fidelity triggers */}
        <div className="flex items-center gap-2">
          {/* Undo and Redo operations */}
          <div className="flex items-center gap-1 bg-slate-50 border border-gray-200 p-1 rounded-lg">
            <button
              onClick={handleUndo}
              disabled={undoStack.length === 0}
              title="Undo (Ctrl+Z)"
              id="btn-undo-action"
              className="p-1.5 hover:bg-white text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:text-slate-400 rounded-md transition shadow-none hover:shadow-sm"
              style={{ touchAction: 'none' }}
            >
              <Undo2 className="w-4 h-4 text-slate-600" />
            </button>
            <button
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              title="Redo (Ctrl+Y)"
              id="btn-redo-action"
              className="p-1.5 hover:bg-white text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:text-slate-400 rounded-md transition shadow-none hover:shadow-sm"
              style={{ touchAction: 'none' }}
            >
              <Redo2 className="w-4 h-4 text-slate-600" />
            </button>
          </div>

          <button
            onClick={handleExportVideo}
            disabled={isExporting}
            id="btn-trigger-mp4-export"
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold shadow-sm transition"
          >
            <Clapperboard className="w-3.5 h-3.5" />
            Ekspor Video MP4
          </button>
        </div>
      </div>

      {/* 2. DYNAMICALLY POSITIONABLE PANELS CONTAINER */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden relative">
        
        {/* Render timeline at Top if timelinePos === 'top' */}
        {timelinePos === 'top' && (
          <div className="shrink-0 bg-white border-b border-gray-200 relative p-4 z-20 animate-in slide-in-from-top-4 duration-200">
            <Timeline
              project={project}
              currentFrame={currentFrame}
              isPlaying={isPlaying}
              isLooping={isLooping}
              autoKeyframe={autoKeyframe}
              onSelectFrame={setCurrentFrame}
              onTogglePlay={() => setIsPlaying(!isPlaying)}
              onToggleLoop={() => setIsLooping(!isLooping)}
              onToggleAutoKeyframe={() => setAutoKeyframe(!autoKeyframe)}
              onAddKeyframe={handleAddKeyframe}
              onRemoveKeyframe={handleRemoveKeyframe}
              onClearAllKeyframes={handleClearAllKeyframes}
              onTogglePosition={() => setActiveMenu(activeMenu === 'timeline' ? null : 'timeline')}
            />
            {activeMenu === 'timeline' && (
              <div className="absolute right-4 top-16 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-1 py-1.5 animate-in fade-in duration-150">
                <div className="text-[10px] text-slate-400 font-bold px-2 py-1 uppercase tracking-wider border-b border-gray-100 mb-1">
                  Posisi Timeline
                </div>
                {timelinePositionOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setTimelinePos(opt.value as any);
                      setActiveMenu(null);
                    }}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 text-left text-xs font-medium rounded-lg transition ${
                      timelinePos === opt.value
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <span className="text-sm">{opt.icon}</span>
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Middle row workspace containing left sidebar, left timeline, canvas, right sidebar, right timeline */}
        <div className="flex-1 min-h-0 flex overflow-hidden">
          
          {/* Render timeline at Left if timelinePos === 'left' */}
          {timelinePos === 'left' && (
            <div className="w-96 shrink-0 bg-white border-r border-gray-200 relative p-4 flex flex-col min-h-0 overflow-y-auto z-20 animate-in slide-in-from-left-4 duration-200">
              <Timeline
                project={project}
                currentFrame={currentFrame}
                isPlaying={isPlaying}
                isLooping={isLooping}
                autoKeyframe={autoKeyframe}
                onSelectFrame={setCurrentFrame}
                onTogglePlay={() => setIsPlaying(!isPlaying)}
                onToggleLoop={() => setIsLooping(!isLooping)}
                onToggleAutoKeyframe={() => setAutoKeyframe(!autoKeyframe)}
                onAddKeyframe={handleAddKeyframe}
                onRemoveKeyframe={handleRemoveKeyframe}
                onClearAllKeyframes={handleClearAllKeyframes}
                onTogglePosition={() => setActiveMenu(activeMenu === 'timeline' ? null : 'timeline')}
              />
              {activeMenu === 'timeline' && (
                <div className="absolute left-4 top-16 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-1 py-1.5 animate-in fade-in duration-150">
                  <div className="text-[10px] text-slate-400 font-bold px-2 py-1 uppercase tracking-wider border-b border-gray-100 mb-1">
                    Posisi Timeline
                  </div>
                  {timelinePositionOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setTimelinePos(opt.value as any);
                        setActiveMenu(null);
                      }}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 text-left text-xs font-medium rounded-lg transition ${
                        timelinePos === opt.value
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <span className="text-sm">{opt.icon}</span>
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Render sidebar at Left if sidebarPos === 'left' */}
          {sidebarPos === 'left' && (
            <div className="w-80 border-r border-gray-200 bg-white flex flex-col shrink-0 select-none z-10 relative animate-in slide-in-from-left-4 duration-200">
              {/* Tab Selector Segment */}
              <div className="flex bg-slate-50 p-1.5 gap-1 border-b border-gray-200 shrink-0 items-center justify-between">
                <div className="flex gap-1 flex-1">
                  <button
                    onClick={() => setSidebarActiveTab('assets')}
                    className={`flex-1 py-2 px-2 text-[10px] font-bold rounded-lg transition-all duration-150 uppercase tracking-wider ${
                      sidebarActiveTab === 'assets'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    Struktur & Aset
                  </button>
                  <button
                    onClick={() => setSidebarActiveTab('inspector')}
                    className={`flex-1 py-1.5 px-2 text-[10px] font-bold rounded-lg transition-all duration-150 uppercase tracking-wider ${
                      sidebarActiveTab === 'inspector'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    Properti Inspektor
                  </button>
                </div>
                
                {/* Position controller */}
                <div className="relative shrink-0 ml-1.5">
                  <button
                    onClick={() => setActiveMenu(activeMenu === 'sidebar' ? null : 'sidebar')}
                    className="p-1.5 bg-black hover:bg-zinc-800 text-white rounded-lg transition shrink-0"
                    title="Atur Posisi Panel"
                  >
                    <Move className="w-3.5 h-3.5" />
                  </button>
                  {activeMenu === 'sidebar' && (
                    <div className="absolute right-0 mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-1 py-1.5 animate-in fade-in duration-150">
                      <div className="text-[10px] text-slate-400 font-bold px-2 py-1 uppercase tracking-wider border-b border-gray-100 mb-1">
                        Posisi Panel
                      </div>
                      {sidebarPositionOptions.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => {
                            setSidebarPos(opt.value as any);
                            setActiveMenu(null);
                          }}
                          className={`w-full flex items-center gap-2 px-2 py-1.5 text-left text-xs font-medium rounded-lg transition ${
                            sidebarPos === opt.value
                              ? 'bg-blue-50 text-blue-600'
                              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                        >
                          <span className="text-sm">{opt.icon}</span>
                          <span>{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Active Sidebar Component display */}
              <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                {sidebarActiveTab === 'assets' ? (
                  <SidebarAssets
                    project={project}
                    selectedBoneId={selectedBoneId}
                    selectedLayerId={selectedLayerId}
                    toolMode={toolMode}
                    onAddAsset={handleAddAsset}
                    onDeleteAsset={handleDeleteAsset}
                    onAddLayerFromAsset={handleAddLayerFromAsset}
                    onSelectBone={setSelectedBoneId}
                    onSelectLayer={setSelectedLayerId}
                    onDeleteBone={handleDeleteBone}
                    onDeleteLayer={handleDeleteLayer}
                    onChangeToolMode={setToolMode}
                    onChangeTab={setSidebarActiveTab}
                    penColor={penColor}
                    penSize={penSize}
                    onChangePenColor={setPenColor}
                    onChangePenSize={setPenSize}
                  />
                ) : (
                  <SidebarInspector
                    project={project}
                    selectedBoneId={selectedBoneId}
                    selectedLayerId={selectedLayerId}
                    activeFrameData={activeFrameData}
                    showOnionSkin={showOnionSkin}
                    onionSkinPrevFrames={onionSkinPrevFrames}
                    showGrid={showGrid}
                    onUpdateProjectMeta={handleUpdateProjectMeta}
                    onUpdateBoneMeta={handleUpdateBoneMeta}
                    onUpdateLayerMeta={handleUpdateLayerMeta}
                    onUpdateLayerMetaAndFrame={handleUpdateLayerMetaAndFrame}
                    onUpdateActiveFrameData={handleUpdateFrameState}
                    onToggleOnionSkin={() => setShowOnionSkin(!showOnionSkin)}
                    onChangeOnionDepth={setOnionSkinPrevFrames}
                    onToggleGrid={() => setShowGrid(!showGrid)}
                  />
                )}
              </div>
            </div>
          )}

          {/* Central canvas column layout */}
          <div className="flex-1 flex flex-col relative min-h-0">
            
            {/* Render sidebar at Top inside canvas area if sidebarPos === 'top' */}
            {sidebarPos === 'top' && (
              <div className="h-72 w-full border-b border-gray-200 bg-white flex flex-col shrink-0 select-none z-10 relative animate-in slide-in-from-top-4 duration-200">
                {/* Tab Selector Segment */}
                <div className="flex bg-slate-50 p-1.5 gap-1 border-b border-gray-200 shrink-0 items-center justify-between">
                  <div className="flex gap-1 flex-1">
                    <button
                      onClick={() => setSidebarActiveTab('assets')}
                      className={`flex-1 py-2 px-2 text-[10px] font-bold rounded-lg transition-all duration-150 uppercase tracking-wider ${
                        sidebarActiveTab === 'assets'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-105'
                      }`}
                    >
                      Struktur & Aset
                    </button>
                    <button
                      onClick={() => setSidebarActiveTab('inspector')}
                      className={`flex-1 py-1.5 px-2 text-[10px] font-bold rounded-lg transition-all duration-150 uppercase tracking-wider ${
                        sidebarActiveTab === 'inspector'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-105'
                      }`}
                    >
                      Properti Inspektor
                    </button>
                  </div>
                  
                  {/* Position controller */}
                  <div className="relative shrink-0 ml-1.5">
                    <button
                      onClick={() => setActiveMenu(activeMenu === 'sidebar' ? null : 'sidebar')}
                      className="p-1.5 bg-black hover:bg-zinc-800 text-white rounded-lg transition shrink-0"
                      title="Atur Posisi Panel"
                    >
                      <Move className="w-3.5 h-3.5" />
                    </button>
                    {activeMenu === 'sidebar' && (
                      <div className="absolute right-0 mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-1 py-1.5 animate-in fade-in duration-150">
                        <div className="text-[10px] text-slate-400 font-bold px-2 py-1 uppercase tracking-wider border-b border-gray-100 mb-1">
                          Posisi Panel
                        </div>
                        {sidebarPositionOptions.map(opt => (
                          <button
                            key={opt.value}
                            onClick={() => {
                              setSidebarPos(opt.value as any);
                              setActiveMenu(null);
                            }}
                            className={`w-full flex items-center gap-2 px-2 py-1.5 text-left text-xs font-medium rounded-lg transition ${
                              sidebarPos === opt.value
                                ? 'bg-blue-50 text-blue-600'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                            }`}
                          >
                            <span className="text-sm">{opt.icon}</span>
                            <span>{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                  {sidebarActiveTab === 'assets' ? (
                    <SidebarAssets
                      project={project}
                      selectedBoneId={selectedBoneId}
                      selectedLayerId={selectedLayerId}
                      toolMode={toolMode}
                      onAddAsset={handleAddAsset}
                      onDeleteAsset={handleDeleteAsset}
                      onAddLayerFromAsset={handleAddLayerFromAsset}
                      onSelectBone={setSelectedBoneId}
                      onSelectLayer={setSelectedLayerId}
                      onDeleteBone={handleDeleteBone}
                      onDeleteLayer={handleDeleteLayer}
                      onChangeToolMode={setToolMode}
                      onChangeTab={setSidebarActiveTab}
                      penColor={penColor}
                      penSize={penSize}
                      onChangePenColor={setPenColor}
                      onChangePenSize={setPenSize}
                    />
                  ) : (
                    <SidebarInspector
                      project={project}
                      selectedBoneId={selectedBoneId}
                      selectedLayerId={selectedLayerId}
                      activeFrameData={activeFrameData}
                      showOnionSkin={showOnionSkin}
                      onionSkinPrevFrames={onionSkinPrevFrames}
                      showGrid={showGrid}
                      onUpdateProjectMeta={handleUpdateProjectMeta}
                      onUpdateBoneMeta={handleUpdateBoneMeta}
                      onUpdateLayerMeta={handleUpdateLayerMeta}
                      onUpdateLayerMetaAndFrame={handleUpdateLayerMetaAndFrame}
                      onUpdateActiveFrameData={handleUpdateFrameState}
                      onToggleOnionSkin={() => setShowOnionSkin(!showOnionSkin)}
                      onChangeOnionDepth={setOnionSkinPrevFrames}
                      onToggleGrid={() => setShowGrid(!showGrid)}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Central interactive canvas */}
            <div className="flex-1 flex flex-col p-4 bg-[#ececec] relative min-h-0">
              <CanvasEditor
                project={project}
                currentFrame={currentFrame}
                activeFrameData={activeFrameData}
                toolMode={toolMode}
                selectedBoneId={selectedBoneId}
                selectedLayerId={selectedLayerId}
                showOnionSkin={showOnionSkin}
                onionSkinPrevFrames={onionSkinPrevFrames}
                showGrid={showGrid}
                onUpdateFrameState={handleUpdateFrameState}
                onSelectBone={setSelectedBoneId}
                onSelectLayer={setSelectedLayerId}
                onAddBone={handleAddBone}
                onStartHistoryAction={handleStartHistoryAction}
                isExporting={isExporting}
                penColor={penColor}
                penSize={penSize}
              />
            </div>

            {/* Render sidebar at Bottom inside canvas area if sidebarPos === 'bottom' */}
            {sidebarPos === 'bottom' && (
              <div className="h-72 w-full border-t border-gray-200 bg-white flex flex-col shrink-0 select-none z-10 relative animate-in slide-in-from-bottom-4 duration-200">
                {/* Tab Selector Segment */}
                <div className="flex bg-slate-50 p-1.5 gap-1 border-b border-gray-200 shrink-0 items-center justify-between">
                  <div className="flex gap-1 flex-1">
                    <button
                      onClick={() => setSidebarActiveTab('assets')}
                      className={`flex-1 py-2 px-2 text-[10px] font-bold rounded-lg transition-all duration-150 uppercase tracking-wider ${
                        sidebarActiveTab === 'assets'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-105'
                      }`}
                    >
                      Struktur & Aset
                    </button>
                    <button
                      onClick={() => setSidebarActiveTab('inspector')}
                      className={`flex-1 py-1.5 px-2 text-[10px] font-bold rounded-lg transition-all duration-150 uppercase tracking-wider ${
                        sidebarActiveTab === 'inspector'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-105'
                      }`}
                    >
                      Properti Inspektor
                    </button>
                  </div>
                  
                  {/* Position controller */}
                  <div className="relative shrink-0 ml-1.5">
                    <button
                      onClick={() => setActiveMenu(activeMenu === 'sidebar' ? null : 'sidebar')}
                      className="p-1.5 bg-black hover:bg-zinc-800 text-white rounded-lg transition shrink-0"
                      title="Atur Posisi Panel"
                    >
                      <Move className="w-3.5 h-3.5" />
                    </button>
                    {activeMenu === 'sidebar' && (
                      <div className="absolute right-0 bottom-10 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-1 py-1.5 animate-in fade-in duration-150">
                        <div className="text-[10px] text-slate-400 font-bold px-2 py-1 uppercase tracking-wider border-b border-gray-100 mb-1">
                          Posisi Panel
                        </div>
                        {sidebarPositionOptions.map(opt => (
                          <button
                            key={opt.value}
                            onClick={() => {
                              setSidebarPos(opt.value as any);
                              setActiveMenu(null);
                            }}
                            className={`w-full flex items-center gap-2 px-2 py-1.5 text-left text-xs font-medium rounded-lg transition ${
                              sidebarPos === opt.value
                                ? 'bg-blue-50 text-blue-600'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                            }`}
                          >
                            <span className="text-sm">{opt.icon}</span>
                            <span>{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                  {sidebarActiveTab === 'assets' ? (
                    <SidebarAssets
                      project={project}
                      selectedBoneId={selectedBoneId}
                      selectedLayerId={selectedLayerId}
                      toolMode={toolMode}
                      onAddAsset={handleAddAsset}
                      onDeleteAsset={handleDeleteAsset}
                      onAddLayerFromAsset={handleAddLayerFromAsset}
                      onSelectBone={setSelectedBoneId}
                      onSelectLayer={setSelectedLayerId}
                      onDeleteBone={handleDeleteBone}
                      onDeleteLayer={handleDeleteLayer}
                      onChangeToolMode={setToolMode}
                      onChangeTab={setSidebarActiveTab}
                      penColor={penColor}
                      penSize={penSize}
                      onChangePenColor={setPenColor}
                      onChangePenSize={setPenSize}
                    />
                  ) : (
                    <SidebarInspector
                      project={project}
                      selectedBoneId={selectedBoneId}
                      selectedLayerId={selectedLayerId}
                      activeFrameData={activeFrameData}
                      showOnionSkin={showOnionSkin}
                      onionSkinPrevFrames={onionSkinPrevFrames}
                      showGrid={showGrid}
                      onUpdateProjectMeta={handleUpdateProjectMeta}
                      onUpdateBoneMeta={handleUpdateBoneMeta}
                      onUpdateLayerMeta={handleUpdateLayerMeta}
                      onUpdateLayerMetaAndFrame={handleUpdateLayerMetaAndFrame}
                      onUpdateActiveFrameData={handleUpdateFrameState}
                      onToggleOnionSkin={() => setShowOnionSkin(!showOnionSkin)}
                      onChangeOnionDepth={setOnionSkinPrevFrames}
                      onToggleGrid={() => setShowGrid(!showGrid)}
                    />
                  )}
                </div>
              </div>
            )}

          </div>

          {/* Render sidebar at Right if sidebarPos === 'right' */}
          {sidebarPos === 'right' && (
            <div className="w-80 border-l border-gray-200 bg-white flex flex-col shrink-0 select-none z-10 relative animate-in slide-in-from-right-4 duration-200">
              {/* Tab Selector Segment */}
              <div className="flex bg-slate-50 p-1.5 gap-1 border-b border-gray-200 shrink-0 items-center justify-between">
                <div className="flex gap-1 flex-1">
                  <button
                    onClick={() => setSidebarActiveTab('assets')}
                    className={`flex-1 py-2 px-2 text-[10px] font-bold rounded-lg transition-all duration-150 uppercase tracking-wider ${
                      sidebarActiveTab === 'assets'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-105'
                    }`}
                  >
                    Struktur & Aset
                  </button>
                  <button
                    onClick={() => setSidebarActiveTab('inspector')}
                    className={`flex-1 py-1.5 px-2 text-[10px] font-bold rounded-lg transition-all duration-150 uppercase tracking-wider ${
                      sidebarActiveTab === 'inspector'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-105'
                    }`}
                  >
                    Properti Inspektor
                  </button>
                </div>
                
                {/* Position controller */}
                <div className="relative shrink-0 ml-1.5">
                  <button
                    onClick={() => setActiveMenu(activeMenu === 'sidebar' ? null : 'sidebar')}
                    className="p-1.5 bg-black hover:bg-zinc-800 text-white rounded-lg transition shrink-0"
                    title="Atur Posisi Panel"
                  >
                    <Move className="w-3.5 h-3.5" />
                  </button>
                  {activeMenu === 'sidebar' && (
                    <div className="absolute right-0 mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-1 py-1.5 animate-in fade-in duration-150">
                      <div className="text-[10px] text-slate-400 font-bold px-2 py-1 uppercase tracking-wider border-b border-gray-100 mb-1">
                        Posisi Panel
                      </div>
                      {sidebarPositionOptions.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => {
                            setSidebarPos(opt.value as any);
                            setActiveMenu(null);
                          }}
                          className={`w-full flex items-center gap-2 px-2 py-1.5 text-left text-xs font-medium rounded-lg transition ${
                            sidebarPos === opt.value
                              ? 'bg-blue-50 text-blue-600'
                              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                        >
                          <span className="text-sm">{opt.icon}</span>
                          <span>{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Active Sidebar Component display */}
              <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                {sidebarActiveTab === 'assets' ? (
                  <SidebarAssets
                    project={project}
                    selectedBoneId={selectedBoneId}
                    selectedLayerId={selectedLayerId}
                    toolMode={toolMode}
                    onAddAsset={handleAddAsset}
                    onDeleteAsset={handleDeleteAsset}
                    onAddLayerFromAsset={handleAddLayerFromAsset}
                    onSelectBone={setSelectedBoneId}
                    onSelectLayer={setSelectedLayerId}
                    onDeleteBone={handleDeleteBone}
                    onDeleteLayer={handleDeleteLayer}
                    onChangeToolMode={setToolMode}
                    onChangeTab={setSidebarActiveTab}
                    penColor={penColor}
                    penSize={penSize}
                    onChangePenColor={setPenColor}
                    onChangePenSize={setPenSize}
                  />
                ) : (
                  <SidebarInspector
                    project={project}
                    selectedBoneId={selectedBoneId}
                    selectedLayerId={selectedLayerId}
                    activeFrameData={activeFrameData}
                    showOnionSkin={showOnionSkin}
                    onionSkinPrevFrames={onionSkinPrevFrames}
                    showGrid={showGrid}
                    onUpdateProjectMeta={handleUpdateProjectMeta}
                    onUpdateBoneMeta={handleUpdateBoneMeta}
                    onUpdateLayerMeta={handleUpdateLayerMeta}
                    onUpdateLayerMetaAndFrame={handleUpdateLayerMetaAndFrame}
                    onUpdateActiveFrameData={handleUpdateFrameState}
                    onToggleOnionSkin={() => setShowOnionSkin(!showOnionSkin)}
                    onChangeOnionDepth={setOnionSkinPrevFrames}
                    onToggleGrid={() => setShowGrid(!showGrid)}
                  />
                )}
              </div>
            </div>
          )}

          {/* Render timeline at Right if timelinePos === 'right' */}
          {timelinePos === 'right' && (
            <div className="w-96 shrink-0 bg-white border-l border-gray-200 relative p-4 flex flex-col min-h-0 overflow-y-auto z-20 animate-in slide-in-from-right-4 duration-200">
              <Timeline
                project={project}
                currentFrame={currentFrame}
                isPlaying={isPlaying}
                isLooping={isLooping}
                autoKeyframe={autoKeyframe}
                onSelectFrame={setCurrentFrame}
                onTogglePlay={() => setIsPlaying(!isPlaying)}
                onToggleLoop={() => setIsLooping(!isLooping)}
                onToggleAutoKeyframe={() => setAutoKeyframe(!autoKeyframe)}
                onAddKeyframe={handleAddKeyframe}
                onRemoveKeyframe={handleRemoveKeyframe}
                onClearAllKeyframes={handleClearAllKeyframes}
                onTogglePosition={() => setActiveMenu(activeMenu === 'timeline' ? null : 'timeline')}
              />
              {activeMenu === 'timeline' && (
                <div className="absolute right-4 top-16 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-1 py-1.5 animate-in fade-in duration-150">
                  <div className="text-[10px] text-slate-400 font-bold px-2 py-1 uppercase tracking-wider border-b border-gray-100 mb-1">
                    Posisi Timeline
                  </div>
                  {timelinePositionOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setTimelinePos(opt.value as any);
                        setActiveMenu(null);
                      }}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 text-left text-xs font-medium rounded-lg transition ${
                        timelinePos === opt.value
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <span className="text-sm">{opt.icon}</span>
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Render timeline at Bottom if timelinePos === 'bottom' */}
        {timelinePos === 'bottom' && (
          <div className="px-6 pb-6 shrink-0 bg-white border-t border-gray-200 relative z-20 animate-in slide-in-from-bottom-4 duration-200">
            <Timeline
              project={project}
              currentFrame={currentFrame}
              isPlaying={isPlaying}
              isLooping={isLooping}
              autoKeyframe={autoKeyframe}
              onSelectFrame={setCurrentFrame}
              onTogglePlay={() => setIsPlaying(!isPlaying)}
              onToggleLoop={() => setIsLooping(!isLooping)}
              onToggleAutoKeyframe={() => setAutoKeyframe(!autoKeyframe)}
              onAddKeyframe={handleAddKeyframe}
              onRemoveKeyframe={handleRemoveKeyframe}
              onClearAllKeyframes={handleClearAllKeyframes}
              onTogglePosition={() => setActiveMenu(activeMenu === 'timeline' ? null : 'timeline')}
            />
            {activeMenu === 'timeline' && (
              <div className="absolute right-10 bottom-24 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-1 py-1.5 animate-in fade-in duration-150">
                <div className="text-[10px] text-slate-400 font-bold px-2 py-1 uppercase tracking-wider border-b border-gray-100 mb-1">
                  Posisi Timeline
                </div>
                {timelinePositionOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setTimelinePos(opt.value as any);
                      setActiveMenu(null);
                    }}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 text-left text-xs font-medium rounded-lg transition ${
                      timelinePos === opt.value
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <span className="text-sm">{opt.icon}</span>
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Exporter visual modal overlay */}
      {isExporting && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white border border-gray-200 rounded-3xl w-full max-w-md p-8 text-center space-y-6 shadow-2xl animate-in font-sans">
            <div className="w-16 h-16 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-center mx-auto animate-bounce">
              <Clapperboard className="w-8 h-8 text-blue-600" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-slate-800">Sedang Merender Video Animasi...</h3>
              <p className="text-xs text-slate-500">Merangkai frame demi frame kustom menjadi file rekaman MP4</p>
            </div>

            {/* Progress bar info */}
            <div className="space-y-2">
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-gray-200 relative shadow-inner">
                <div 
                  className="bg-blue-600 h-full transition-all duration-100 rounded-full" 
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-xs text-slate-500 font-mono font-bold">
                <span>Rendering: {exportProgress}%</span>
                <span>Frame {currentFrame}/{project.playbackLength}</span>
              </div>
            </div>

            <div className="bg-slate-50 border border-gray-200 rounded-xl p-3.5 text-[10px] text-slate-500 text-left space-y-1.5 leading-relaxed">
              <span className="font-bold text-slate-700 block">💡 INFO PENGEKSPORAN:</span>
              <p>Perekam web akan merekam visual kanvas secara frame-by-frame otomatis. Harap jangan tutup peramban atau keluar dari peranti hingga progress mencapai 100% dan berkas terunduh.</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
