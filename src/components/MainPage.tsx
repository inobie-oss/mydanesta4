/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  Sparkles, 
  Tv, 
  Calendar, 
  Monitor, 
  Flame, 
  Heart, 
  Copy, 
  Cpu, 
  Clapperboard,
  MousePointerClick
} from 'lucide-react';
import { Project } from '../types';
import { getAbsoluteBones, getAbsoluteLayerTransform, degToRad, interpolateFrame } from '../utils/math';

interface MainPageProps {
  projects: Project[];
  onOpenProject: (id: string) => void;
  onAddProjectClick: () => void;
  onDuplicateProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
}

export default function MainPage({
  projects,
  onOpenProject,
  onAddProjectClick,
  onDuplicateProject,
  onDeleteProject,
}: MainPageProps) {
  
  // Calculate total statistics
  const totalProjects = projects.length;
  const totalBones = projects.reduce((acc, p) => acc + p.bones.length, 0);
  const totalAssets = projects.reduce((acc, p) => acc + p.assets.length, 0);

  return (
    <div id="homepage-root" className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans select-none pb-12">
      
      {/* 1. Header Hero Banner */}
      <div className="bg-white border-b border-gray-200 shadow-sm relative overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/20 via-sky-50/10 to-transparent pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-wrap items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-2xl font-bold text-blue-600 tracking-tight">
                mydanest
              </span>
              <span className="text-[10px] font-mono tracking-widest uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200/50">
                v1.2.0-PRO
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-2 max-w-lg leading-relaxed">
              Software pembuat animasi 2D skeletal (tulang) berbasis web. Rigging gambar transparent dengan persendian dinamis, keyframe interpolasi visual, dan ekspor langsung menjadi file video MP4 berkualitas tinggi.
            </p>
          </div>

          <button
            onClick={onAddProjectClick}
            id="homepage-create-btn"
            className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150"
          >
            <Plus className="w-4 h-4 text-white stroke-[2.5]" />
            Buat Project Baru
          </button>
        </div>
      </div>

      {/* 2. Main content grids split */}
      <div className="max-w-7xl mx-auto w-full px-6 grid grid-cols-1 lg:grid-cols-4 gap-8 mt-8 flex-1">
        
        {/* Left Side: Stats and tips */}
        <div className="space-y-6 lg:col-span-1">
          {/* Quick Metrics Cards */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">STRUKTUR STATISTIK</h3>
            
            <div className="space-y-3 font-mono">
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-gray-100">
                <span className="text-xs text-slate-500 font-medium">Total Project</span>
                <span className="text-sm font-bold text-blue-600">{totalProjects}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-gray-100">
                <span className="text-xs text-slate-500 font-medium">Total Asset Gambar</span>
                <span className="text-sm font-bold text-emerald-600">{totalAssets}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-gray-100">
                <span className="text-xs text-slate-500 font-medium">Total Persendian</span>
                <span className="text-sm font-bold text-amber-600">{totalBones}</span>
              </div>
            </div>
          </div>

          {/* Guidelines info */}
          <div id="quick-guides" className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3.5 shadow-sm">
            <h4 className="text-xs font-bold text-slate-700 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-500" />
              <span>Panduan Cepat Rigging</span>
            </h4>
            <ul className="text-[11px] text-slate-600 space-y-2.5 list-disc list-inside leading-relaxed">
              <li>
                <b>Buat Tulang:</b> Aktifkan tool melukis tulang dan seret melintasi gambar untuk membuat sendi.
              </li>
              <li>
                <b>Metode Rigging:</b> Pilih layer gambar lalu ikat (bind) langsung ke tulang yang sesuai melalui panel kanan.
              </li>
              <li>
                <b>Gerakan Keyframe:</b> Geser slider timeline ke frame tertentu, buat pose tulang, dan kuncian keyframe tersimpan!
              </li>
              <li>
                <b>Ekspor MP4:</b> Klik tombol ekspor untuk merekam frame-by-frame otomatis dan men-download video Anda.
              </li>
            </ul>
          </div>
        </div>

        {/* Right Side: Projects grid section */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Clapperboard className="w-4 h-4 text-slate-400" />
              <span>Semua Project Anda ({projects.length})</span>
            </h2>
          </div>

          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 border-2 border-dashed border-gray-200 rounded-3xl bg-white text-center space-y-4 shadow-sm">
              <div className="p-4 bg-blue-50 rounded-full border border-blue-100">
                <Plus className="w-8 h-8 text-blue-600 animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-800 font-sans">Daftar Project Kosong</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm font-sans">
                  Anda belum memiliki project desain saat ini. Klik tombol di atas untuk memulai kanvas rigging kustom Anda pertama kali!
                </p>
              </div>
              <button
                onClick={onAddProjectClick}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition"
              >
                Buat Project Sekarang
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {projects.map((project) => (
                <ProjectThumbnailCard 
                  key={project.id}
                  project={project}
                  onOpenProject={onOpenProject}
                  onDuplicateProject={onDuplicateProject}
                  onDeleteProject={onDeleteProject}
                />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// Separate Mini loop drawing renderer for each individual project card
function ProjectThumbnailCard({ 
  project, 
  onOpenProject, 
  onDuplicateProject, 
  onDeleteProject 
}: { 
  key?: string;
  project: Project;
  onOpenProject: (id: string) => void;
  onDuplicateProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameId = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;
    const maxFrames = project.playbackLength || 60;
    const images: Record<string, HTMLImageElement> = {};
    let active = true;

    // Load images for thumbnail loop
    let loadedCount = 0;
    const assets = project.assets || [];

    const startDrawLoop = () => {
      const render = () => {
        if (!active) return;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Solid background
        ctx.fillStyle = project.backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Fetch interpolation data at specific loop frame
        const data = requireInterpolatedFrame(project, frame);
        const absBones = getAbsoluteBones(project.bones, data.bones);

        ctx.save();
        // Scale project resolution down to thumbnail card size
        const scale = Math.min(canvas.width / project.width, canvas.height / project.height);
        ctx.scale(scale, scale);

        // Centers the scaled content inside the card viewport
        const dx = (project.width - (canvas.width / scale)) / 2;
        const dy = (project.height - (canvas.height / scale)) / 2;
        ctx.translate(-dx, -dy);

        // Render layers
        project.layers
          .slice()
          .sort((a,b)=>a.zIndex - b.zIndex)
          .forEach((layer) => {
            const layerState = data.layers[layer.id] || {
              offsetX: layer.offsetX,
              offsetY: layer.offsetY,
              offsetAngle: layer.offsetAngle,
              scaleX: layer.scaleX,
              scaleY: layer.scaleY,
              opacity: layer.opacity
            };
            const transform = getAbsoluteLayerTransform(layer, layerState, absBones);
            const img = images[layer.assetId];
            if (img) {
              ctx.save();
              ctx.globalAlpha = layerState.opacity;
              ctx.translate(transform.x, transform.y);
              ctx.rotate(degToRad(transform.angle));
              ctx.scale(layerState.scaleX, layerState.scaleY);
              ctx.drawImage(img, -img.width / 2, -img.height / 2, img.width, img.height);
              ctx.restore();
            }
          });

        // Render sleek bone wedges
        Object.values(absBones).forEach((bone) => {
          ctx.beginPath();
          ctx.moveTo(bone.startX, bone.startY);
          ctx.lineTo(bone.endX, bone.endY);
          ctx.strokeStyle = bone.color;
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(bone.startX, bone.startY, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
        });

        ctx.restore();

        // Accumulate sequence
        frame = (frame + 1) % maxFrames;
        animFrameId.current = requestAnimationFrame(render);
      };

      render();
    };

    if (assets.length === 0) {
      startDrawLoop();
    } else {
      assets.forEach((asset) => {
        const img = new Image();
        if (asset.url && !asset.url.startsWith('data:')) {
          img.crossOrigin = 'anonymous';
        }
        img.src = asset.url;
        img.onload = () => {
          images[asset.id] = img;
          loadedCount++;
          if (loadedCount === assets.length) {
            startDrawLoop();
          }
        };
        img.onerror = () => {
          loadedCount++;
          if (loadedCount === assets.length) {
            startDrawLoop();
          }
        };
      });
    }

    return () => {
      active = false;
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [project]);

  // Interpolation helper for non-blocking thumbnail player loops
  const requireInterpolatedFrame = (proj: Project, fNo: number) => {
    return interpolateFrame(proj.keyframes, fNo, proj.bones, proj.layers);
  };

  return (
    <div 
      id={`project-card-${project.id}`}
      className="bg-white border border-gray-200 rounded-2xl p-4 hover:border-blue-400 transition flex flex-col justify-between group h-[310px] shadow-sm hover:shadow"
    >
      {/* 1. Miniature loop canvas preview */}
      <div className="relative w-full h-40 bg-slate-50 rounded-xl overflow-hidden border border-gray-100 flex items-center justify-center">
        <canvas 
          ref={canvasRef} 
          width={280} 
          height={160} 
          className="w-full h-full object-contain pointer-events-none"
        />
        
        {/* Playback Badge */}
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-white/90 text-[9px] font-mono font-medium text-blue-600 border border-gray-200 flex items-center gap-1 shadow-sm">
          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping" />
          <span>live loop</span>
        </div>

        {/* Dimension indicator badge */}
        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-white/90 text-[8px] font-mono text-slate-500 border border-gray-100">
          {project.width} × {project.height}
        </div>
      </div>

      {/* 2. Project Metadata block */}
      <div className="mt-3.5 space-y-1">
        <h4 className="text-sm font-bold text-slate-800 truncate group-hover:text-blue-600 transition-colors">
          {project.name}
        </h4>
        
        <div className="flex items-center gap-3 text-[10px] text-slate-500">
          <span className="flex items-center gap-1">
            <Monitor className="w-3 h-3 text-slate-400" />
            {project.fps} FPS
          </span>
          <span className="flex items-center gap-1">
            <Tv className="w-3 h-3 text-slate-400" />
            {project.playbackLength} frames
          </span>
          {project.updatedAt && (
            <span className="flex items-center gap-1 font-mono text-slate-400">
              <Calendar className="w-3 h-3 text-slate-400" />
              {new Date(project.updatedAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {/* 3. Action Buttons section */}
      <div className="flex gap-2 border-t border-gray-100 pt-3 mt-3">
        <button
          onClick={() => onOpenProject(project.id)}
          id={`project-open-${project.id}`}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg py-2 transition text-center shadow-sm"
        >
          Buka Project
        </button>
        <button
          onClick={() => onDuplicateProject(project.id)}
          id={`project-duplicate-${project.id}`}
          className="p-2 bg-slate-100 hover:bg-slate-200 hover:text-blue-600 text-slate-500 rounded-lg transition"
          title="Duplikat Project"
        >
          <Copy className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            if (window.confirm(`Hapus project "${project.name}"? Tindakan ini permanen.`)) {
              onDeleteProject(project.id);
            }
          }}
          id={`project-delete-${project.id}`}
          className="p-2 bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-500 rounded-lg transition"
          title="Hapus Project"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
