/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  ChevronLeft, 
  ChevronRight, 
  Key, 
  Trash2, 
  Layers, 
  FolderPlus, 
  GitCommit, 
  Zap,
  Move
} from 'lucide-react';
import { Project, FrameData } from '../types';

interface TimelineProps {
  project: Project;
  currentFrame: number;
  isPlaying: boolean;
  isLooping: boolean;
  autoKeyframe: boolean;
  onSelectFrame: (frame: number) => void;
  onTogglePlay: () => void;
  onToggleLoop: () => void;
  onToggleAutoKeyframe: () => void;
  onAddKeyframe: () => void;
  onRemoveKeyframe: () => void;
  onClearAllKeyframes: () => void;
  onTogglePosition?: (e: React.MouseEvent) => void;
}

export default function Timeline({
  project,
  currentFrame,
  isPlaying,
  isLooping,
  autoKeyframe,
  onSelectFrame,
  onTogglePlay,
  onToggleLoop,
  onToggleAutoKeyframe,
  onAddKeyframe,
  onRemoveKeyframe,
  onClearAllKeyframes,
  onTogglePosition,
}: TimelineProps) {
  const rulerRef = useRef<HTMLDivElement>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);

  // Total play frames count
  const maxFrames = project.playbackLength;

  // Process clicking/scrubbing to set specific frames on Ruler space
  const calculateFrameFromEvent = (e: React.MouseEvent | MouseEvent) => {
    if (!rulerRef.current) return 0;
    const rect = rulerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    
    // Constraint bounds
    const targetFrame = Math.max(0, Math.min(maxFrames, Math.round(percentage * maxFrames)));
    return targetFrame;
  };

  const handleRulerMouseDown = (e: React.MouseEvent) => {
    const frame = calculateFrameFromEvent(e);
    onSelectFrame(frame);
    setIsScrubbing(true);
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isScrubbing) {
        const frame = calculateFrameFromEvent(e);
        onSelectFrame(frame);
      }
    };

    const handleGlobalMouseUp = () => {
      setIsScrubbing(false);
    };

    if (isScrubbing) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isScrubbing]);

  // Read frames that currently contain custom Keyframes
  const keyframedFrames = Object.keys(project.keyframes).map(Number).sort((a,b)=>a-b);

  const isCurrentFrameKeyframe = project.keyframes[currentFrame] !== undefined;

  return (
    <div className="bg-[#dce3e2] border border-gray-200 rounded-2xl p-4 flex flex-col gap-4 shadow-sm min-h-60 shrink-0 select-none">
      {/* Playback Controls & Frame State HUD */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-3 bg-[#c6c6c6] p-2.5 rounded-xl">
        {/* Left: Standard Play/Pause Buttons */}
        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-gray-200/65">
          <button
            onClick={() => onSelectFrame(0)}
            className="p-1 text-slate-400 hover:text-slate-700 transition rounded"
            title="Kembali ke Awal (0)"
            id="timeline-to-start"
          >
            <Square className="w-4 h-4 fill-slate-400/20" />
          </button>
          <button
            onClick={() => onSelectFrame(Math.max(0, currentFrame - 1))}
            className="p-1 text-slate-400 hover:text-slate-700 transition rounded"
            title="Kembali 1 Frame"
            id="timeline-prev-frame"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <button
            onClick={onTogglePlay}
            id="timeline-play-pause"
            className={`p-2 rounded-full transition flex items-center justify-center ${
              isPlaying 
                ? 'bg-amber-500 text-slate-900 hover:bg-amber-400 animate-pulse' 
                : 'bg-blue-600 text-white hover:bg-blue-500'
            }`}
            title={isPlaying ? 'Pause' : 'Putar Animasi'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-slate-950" />
            ) : (
              <Play className="w-4 h-4 fill-white ml-0.5" />
            )}
          </button>

          <button
            onClick={() => onSelectFrame(Math.min(maxFrames, currentFrame + 1))}
            className="p-1 text-slate-400 hover:text-slate-700 transition rounded"
            title="Maju 1 Frame"
            id="timeline-next-frame"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          
          <div className="h-5 w-px bg-gray-200 mx-1" />

          {/* Loop Mode checkbox */}
          <button
            onClick={onToggleLoop}
            id="timeline-loop-toggle"
            className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
              isLooping 
                ? 'bg-blue-50 text-blue-600 border border-blue-200' 
                : 'text-slate-500 border border-gray-200 hover:bg-slate-50'
            }`}
          >
            {isLooping ? 'Looping Aktif' : 'Sekali Putar'}
          </button>
        </div>

        {/* Center: Current Frame counter HUD info */}
        <div className="flex items-center gap-4 bg-[#5f87b1] px-4 py-1.5 rounded-lg border border-gray-200/65">
          <div className="text-center font-sans">
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">FRAME</div>
            <div className="text-sm font-mono text-amber-600 font-bold">
              {currentFrame} <span className="text-slate-400">/</span> {maxFrames}
            </div>
          </div>
          <div className="h-6 w-px bg-gray-200" />
          <div className="text-center font-sans">
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">WAKTU</div>
            <div className="text-sm font-mono text-slate-700 font-bold">
              {(currentFrame / project.fps).toFixed(2)}s
            </div>
          </div>
          <div className="h-6 w-px bg-gray-200" />
          <div className="text-center font-sans">
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">FPS</div>
            <div className="text-xs font-mono font-medium text-slate-500 bg-[#c1c1c1] px-1.5 py-0.5 rounded border border-gray-200 mt-0.5">
              {project.fps} Hz
            </div>
          </div>
        </div>

        {/* Right: Keyframing Operations Panel */}
        <div className="flex items-center gap-1.5 font-sans">
          {/* Auto record toggle */}
          <button
            type="button"
            id="timeline-autokey-toggle"
            onClick={onToggleAutoKeyframe}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition ${
              autoKeyframe
                ? 'border-red-300 bg-red-50 text-red-600 font-bold'
                : 'border-gray-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
            title="Auto-Keyframe: Setiap gerakan langsung merekam keyframe baru"
          >
            <Zap className={`w-3.5 h-3.5 ${autoKeyframe ? 'text-red-500 fill-red-500/20 animate-bounce' : 'text-slate-400'}`} />
            <span>Auto Rekam</span>
          </button>

          {/* Manual insert keyframe */}
          <button
            type="button"
            id="timeline-add-keyframe"
            onClick={onAddKeyframe}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium border transition ${
              isCurrentFrameKeyframe
                ? 'bg-amber-500 border-amber-600 text-slate-950 hover:bg-amber-400'
                : 'border-gray-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>{isCurrentFrameKeyframe ? 'Simpan Posisi Baru' : 'Instal Keyframe'}</span>
          </button>

          {/* Remove keyframe */}
          <button
            type="button"
            id="timeline-remove-keyframe"
            onClick={onRemoveKeyframe}
            disabled={!isCurrentFrameKeyframe}
            className="p-1.5 text-slate-400 hover:text-red-500 disabled:opacity-30 disabled:hover:text-slate-400 transition hover:bg-slate-50 rounded-lg"
            title="Hapus Keyframe di Frame Ini"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            id="timeline-clear-all"
            onClick={() => {
              if (window.confirm('Yakin ingin membersihkan semua timeline keyframe? Animasi Anda akan di-reset.')) {
                onClearAllKeyframes();
              }
            }}
            className="px-2.5 py-1.5 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
            title="Format Seluruh Keyframes"
          >
            Bersihkan
          </button>

          {onTogglePosition && (
            <button
              type="button"
              id="timeline-position-toggle"
              onClick={onTogglePosition}
              className="p-2 bg-black hover:bg-zinc-800 text-white rounded-lg transition shrink-0"
              title="Atur Posisi Timeline"
            >
              <Move className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Grid Ruler Tracks */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-2">
        {/* Playhead Slider ruler bar */}
        <div className="flex items-center">
          {/* Metadata title column spacer */}
          <div className="w-48 text-right pr-4 text-xs font-semibold text-blue-600 select-none uppercase tracking-wider">
            Penggaris Frame
          </div>

          {/* Relative wrapper for dragging ruler head */}
          <div 
            ref={rulerRef}
            onMouseDown={handleRulerMouseDown}
            className="flex-1 h-8 bg-[#5c8dbc] border border-gray-200 rounded-lg relative cursor-pointer group"
          >
            {/* Draw tick intervals dynamically */}
            <div className="absolute inset-0 flex justify-between pointer-events-none select-none text-[9px] text-slate-400 font-mono px-1">
              {Array.from({ length: maxFrames + 1 }).map((_, fIndex) => {
                const isHeading = fIndex % 5 === 0;
                return (
                  <div 
                    key={fIndex} 
                    className="flex flex-col items-center justify-between h-full py-1"
                    style={{ width: `${100 / (maxFrames + 1)}%` }}
                  >
                    <span className={isHeading ? 'text-slate-600 font-bold' : 'text-transparent'}>
                      {isHeading ? fIndex : '.'}
                    </span>
                    <div className={`w-0.5 rounded-full ${isHeading ? 'h-2.5 bg-gray-300' : 'h-1 bg-gray-200'}`} />
                  </div>
                );
              })}
            </div>

            {/* Render little yellow indicators for frames with custom Keyframes */}
            {keyframedFrames.map((kfFrame) => {
              const leftPercent = (kfFrame / maxFrames) * 100;
              return (
                <button
                  key={kfFrame}
                  type="button"
                  id={`kf-indicator-${kfFrame}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectFrame(kfFrame);
                  }}
                  className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rotate-45 bg-amber-400 border border-white rounded-sm hover:bg-amber-300 hover:scale-125 transition z-10 shadow-sm"
                  style={{ left: `calc(${leftPercent}% - 5px)` }}
                  title={`Keyframe at frame ${kfFrame}`}
                />
              );
            })}

            {/* Current red frame playhead handle */}
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none"
              style={{ left: `${(currentFrame / maxFrames) * 100}%` }}
            >
              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow flex items-center justify-center font-mono text-[8px] text-white select-none">
                🔻
              </div>
            </div>
          </div>
        </div>

        {/* Individual Tracks rows (collapsed view details) */}
        <div className="space-y-1 opacity-85 hover:opacity-100 transition-opacity">
          {/* 1. Track representation for all Bones collectively */}
          <div className="flex items-center py-1 font-sans">
            <div className="w-48 pr-4 flex items-center justify-end gap-1.5 text-slate-500 text-xs font-semibold">
              <GitCommit className="w-3.5 h-3.5 text-blue-500" />
              <span>Skeletal Bones</span>
            </div>
            <div className="flex-1 h-3.5 bg-slate-50 rounded border border-gray-200/60 relative pointer-events-none">
              {keyframedFrames.map((kfFrame) => {
                const kfData = project.keyframes[kfFrame];
                // Check if any bone has custom values keyframed in this frame
                const hasBoneKeyed = kfData && Object.keys(kfData.bones).length > 0;
                if (!hasBoneKeyed) return null;
                const leftPercent = (kfFrame / maxFrames) * 100;
                return (
                  <div
                    key={kfFrame}
                    className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rotate-45 bg-amber-500/85 rounded-sm"
                    style={{ left: `calc(${leftPercent}% - 4px)` }}
                  />
                );
              })}
            </div>
          </div>

          {/* 2. Track representation for all Images collectively */}
          <div className="flex items-center py-1 font-sans">
            <div className="w-48 pr-4 flex items-center justify-end gap-1.5 text-slate-500 text-xs font-semibold">
              <Layers className="w-3.5 h-3.5 text-emerald-500" />
              <span>Gambar Import</span>
            </div>
            <div className="flex-1 h-3.5 bg-slate-50 rounded border border-gray-200/60 relative pointer-events-none">
              {keyframedFrames.map((kfFrame) => {
                const kfData = project.keyframes[kfFrame];
                const hasLayerKeyed = kfData && Object.keys(kfData.layers).length > 0;
                if (!hasLayerKeyed) return null;
                const leftPercent = (kfFrame / maxFrames) * 100;
                return (
                  <div
                    key={kfFrame}
                    className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rotate-45 bg-emerald-500/85 rounded-sm"
                    style={{ left: `calc(${leftPercent}% - 4px)` }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
