/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { 
  Plus, 
  Image as ImageIcon, 
  Trash2, 
  FolderLock, 
  GitBranch, 
  Layers, 
  BringToFront, 
  SendToBack,
  MousePointer,
  GitCommit,
  RefreshCcw,
  Maximize,
  ArrowRight,
  Upload,
  PenTool,
  Eraser,
  Paintbrush
} from 'lucide-react';
import { Project, Asset, Bone, ImageLayer } from '../types';

interface SidebarAssetsProps {
  project: Project;
  selectedBoneId: string | null;
  selectedLayerId: string | null;
  toolMode: 'select' | 'bone' | 'pose' | 'transform' | 'draw' | 'eraser' | 'fill';
  onAddAsset: (asset: Asset) => void;
  onDeleteAsset: (id: string) => void;
  onAddLayerFromAsset: (assetId: string) => void;
  onSelectBone: (id: string | null) => void;
  onSelectLayer: (id: string | null) => void;
  onDeleteBone: (id: string) => void;
  onDeleteLayer: (id: string) => void;
  onChangeToolMode: (mode: 'select' | 'bone' | 'pose' | 'transform' | 'draw' | 'eraser' | 'fill') => void;
  onChangeTab?: (tab: 'assets' | 'inspector') => void;
  penColor?: string;
  penSize?: number;
  onChangePenColor?: (color: string) => void;
  onChangePenSize?: (size: number) => void;
}

export default function SidebarAssets({
  project,
  selectedBoneId,
  selectedLayerId,
  toolMode,
  onAddAsset,
  onDeleteAsset,
  onAddLayerFromAsset,
  onSelectBone,
  onSelectLayer,
  onDeleteBone,
  onDeleteLayer,
  onChangeToolMode,
  onChangeTab,
  penColor = '#ff0000',
  penSize = 5,
  onChangePenColor,
  onChangePenSize,
}: SidebarAssetsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Trigger base64 upload
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.src = dataUrl;
      img.onload = () => {
        // Automatically default size for reasonable positioning
        onAddAsset({
          id: 'ast-' + Date.now(),
          name: file.name.substring(0, file.name.lastIndexOf('.')) || file.name,
          url: dataUrl,
          type: file.type,
          width: Math.min(200, img.width),
          height: Math.min(200, img.height)
        });

        // Feedback alert for user convenience
        if (fileInputRef.current) fileInputRef.current.value = '';
      };
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="w-full h-full bg-[#c1c1c1] overflow-y-auto p-4 flex flex-col gap-6 select-none scrollbar-thin">
      
      {/* 1. Mode/Tool Selector Panel */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">PANEL KONTROL ALAT</label>
        <div className="grid grid-cols-2 gap-1.5">
          {/* Pose Mode */}
          <button
            onClick={() => onChangeToolMode('pose')}
            id="tool-mode-pose"
            className={`flex flex-col items-center gap-1.5 p-2 rounded-xl text-center border transition cursor-pointer ${
              toolMode === 'pose'
                ? 'border-amber-400 bg-amber-50 text-amber-700 shadow-sm font-bold'
                : 'border-gray-200 bg-slate-50/50 text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            }`}
            title="Pose Mode: Putar dan geser sambungan tulang untuk pose"
          >
            <RefreshCcw className="w-4 h-4 text-amber-500 animate-spin-slow" />
            <span className="text-[11px] font-sans">Mode Pose</span>
          </button>

          {/* Create Bone Mode */}
          <button
            onClick={() => onChangeToolMode('bone')}
            id="tool-mode-bone"
            className={`flex flex-col items-center gap-1.5 p-2 rounded-xl text-center border transition cursor-pointer ${
              toolMode === 'bone'
                ? 'border-purple-400 bg-purple-50 text-purple-700 shadow-sm font-bold'
                : 'border-gray-200 bg-slate-50/50 text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            }`}
            title="Bone Mode: Tambahkan persendian tulang baru pada kanvas"
          >
            <GitCommit className="w-4 h-4 text-purple-500" />
            <span className="text-[11px] font-sans">Gambar Tulang</span>
          </button>

          {/* Select Mode */}
          <button
            onClick={() => onChangeToolMode('select')}
            id="tool-mode-select"
            className={`flex flex-col items-center gap-1.5 p-2 rounded-xl text-center border transition cursor-pointer ${
              toolMode === 'select'
                ? 'border-blue-400 bg-blue-50 text-blue-700 shadow-sm font-bold'
                : 'border-gray-200 bg-slate-50/50 text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            }`}
            title="Layer Translation"
          >
            <MousePointer className="w-4 h-4 text-blue-500" />
            <span className="text-[11px] font-sans">Geser Gambar</span>
          </button>

          {/* Transform Layer Mode */}
          <button
            onClick={() => onChangeToolMode('transform')}
            id="tool-mode-transform"
            className={`flex flex-col items-center gap-1.5 p-2 rounded-xl text-center border transition cursor-pointer ${
              toolMode === 'transform'
                ? 'border-teal-400 bg-teal-50 text-teal-700 shadow-sm font-bold'
                : 'border-gray-200 bg-slate-50/50 text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            }`}
            title="Transform Layer Scales"
          >
            <Maximize className="w-4 h-4 text-teal-500" />
            <span className="text-[11px] font-sans">Skala / Putar</span>
          </button>
        </div>
      </div>

      {/* 1.5. Drawing Tools Panel */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">ALAT MENGGAMBAR TANGAN</label>
        <div className="grid grid-cols-3 gap-1.5">
          {/* Draw/Pen Mode */}
          <button
            onClick={() => onChangeToolMode('draw')}
            id="tool-mode-draw"
            className={`flex flex-col items-center gap-1.5 p-2 rounded-xl text-center border transition cursor-pointer ${
              toolMode === 'draw'
                ? 'border-emerald-400 bg-emerald-50 text-emerald-700 shadow-sm font-bold'
                : 'border-gray-200 bg-slate-50/50 text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            }`}
            title="Pulpen: Menggambar bebas di kanvas"
          >
            <PenTool className="w-4 h-4 text-emerald-500" />
            <span className="text-[11px] font-sans">Pulpen</span>
          </button>

          {/* Eraser Mode */}
          <button
            onClick={() => onChangeToolMode('eraser')}
            id="tool-mode-eraser"
            className={`flex flex-col items-center gap-1.5 p-2 rounded-xl text-center border transition cursor-pointer ${
              toolMode === 'eraser'
                ? 'border-rose-400 bg-rose-50 text-rose-700 shadow-sm font-bold'
                : 'border-gray-200 bg-slate-50/50 text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            }`}
            title="Penghapus: Menghapus hasil gambar"
          >
            <Eraser className="w-4 h-4 text-rose-500" />
            <span className="text-[11px] font-sans">Penghapus</span>
          </button>

          {/* Paint Bucket/Fill Mode */}
          <button
            onClick={() => onChangeToolMode('fill')}
            id="tool-mode-fill"
            className={`flex flex-col items-center gap-1.5 p-2 rounded-xl text-center border transition cursor-pointer ${
              toolMode === 'fill'
                ? 'border-indigo-400 bg-indigo-50 text-indigo-700 shadow-sm font-bold'
                : 'border-gray-200 bg-slate-50/50 text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            }`}
            title="Ember Cat: Mewarnai area tertutup"
          >
            <Paintbrush className="w-4 h-4 text-indigo-500" />
            <span className="text-[11px] font-sans">Ember Cat</span>
          </button>
        </div>

        {/* Drawing Settings Panel */}
        {['draw', 'eraser', 'fill'].includes(toolMode) && (
          <div className="bg-white p-3 rounded-xl border border-gray-200 space-y-3 shadow-sm mt-3 text-slate-700">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">PENGATURAN GAMBAR</div>
            
            {/* Color picker (not for eraser) */}
            {toolMode !== 'eraser' && (
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-bold uppercase block">Warna Aktif</label>
                <div className="flex gap-2 items-center">
                  <input 
                    type="color" 
                    value={penColor} 
                    onChange={(e) => onChangePenColor?.(e.target.value)}
                    className="w-8 h-8 rounded border border-gray-300 cursor-pointer p-0 bg-transparent shrink-0"
                  />
                  <div className="flex flex-wrap gap-1">
                    {['#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#f97316', '#8b5cf6'].map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => onChangePenColor?.(color)}
                        style={{ backgroundColor: color }}
                        className={`w-5 h-5 rounded border cursor-pointer transition ${
                          penColor === color ? 'ring-2 ring-slate-800 scale-110' : 'border-gray-200 hover:scale-105'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Size Slider (not for fill) */}
            {toolMode !== 'fill' && (
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
                  <span>Ukuran {toolMode === 'eraser' ? 'Penghapus' : 'Pulpen'}</span>
                  <span className="font-mono text-blue-600">{penSize}px</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="50" 
                  value={penSize} 
                  onChange={(e) => onChangePenSize?.(parseInt(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Asset Uploader Library */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">KUMPULAN ASSET GAMBAR</label>
          <button
            onClick={handleUploadClick}
            id="upload-image-trigger"
            className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 transition"
          >
            <Upload className="w-3 h-3" />
            Unggah Image
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
        </div>

        {/* Assets Grid */}
        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
          {project.assets.length === 0 ? (
            <div className="col-span-2 text-center p-6 border-2 border-dashed border-gray-200 rounded-xl bg-slate-50/55">
              <ImageIcon className="w-6 h-6 text-slate-400 mx-auto animate-pulse" />
              <p className="text-[10px] text-slate-400 mt-1.5">Asset kosong</p>
            </div>
          ) : (
            project.assets.map((asset) => (
              <div 
                key={asset.id}
                id={`asset-card-${asset.id}`}
                onClick={() => {
                  const existingLayer = project.layers.find(l => l.assetId === asset.id);
                  if (existingLayer) {
                    onSelectLayer(existingLayer.id);
                  } else {
                    onAddLayerFromAsset(asset.id);
                  }
                  
                  if (onChangeTab) {
                    onChangeTab('inspector');
                  }
                  
                  // Smoothly scroll and focus the scale (multiplier) slider
                  setTimeout(() => {
                    const scaleSlider = document.getElementById('slider-layer-scale');
                    if (scaleSlider) {
                      scaleSlider.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      scaleSlider.focus();
                      
                      // Flash highlight background
                      const container = scaleSlider.parentElement;
                      if (container) {
                        const originalBg = container.style.backgroundColor;
                        const originalBorder = container.style.borderColor;
                        container.style.transition = 'all 0.4s ease';
                        container.style.backgroundColor = '#ecfdf5';
                        container.style.borderColor = '#34d399';
                        setTimeout(() => {
                          container.style.backgroundColor = originalBg;
                          container.style.borderColor = originalBorder;
                        }, 1800);
                      }
                    }
                  }, 200);
                }}
                className="bg-slate-50 p-2 border border-gray-200 rounded-xl hover:border-blue-400 hover:bg-white transition flex flex-col gap-1.5 shadow-sm cursor-pointer animate-in fade-in zoom-in-95 duration-150"
              >
                {/* Visual rendering thumbnail */}
                <div className="w-full h-16 rounded overflow-hidden flex items-center justify-center bg-white border border-gray-100 shrink-0">
                  <img 
                    src={asset.url} 
                    alt={asset.name} 
                    className={`max-w-full max-h-full object-contain ${
                      asset.id === 'ast-1782210648647' 
                        ? 'bg-[#a92c2c] border-[#472525] border border-solid' 
                        : ''
                    }`} 
                    referrerPolicy="no-referrer" 
                  />
                </div>
                
                {/* Thumbnail Name overlay info */}
                <div className="text-[10px] truncate font-semibold text-slate-700 font-sans px-0.5">
                  {asset.name}
                </div>

                {/* Insertion triggers always visible on mobile and desktop */}
                <div className="flex gap-1 mt-auto">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddLayerFromAsset(asset.id);
                    }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded text-[10px] py-1 shadow-sm transition active:scale-95"
                    title="Pasang sebagai layer di canvas"
                    id={`asset-add-canvas-${asset.id}`}
                  >
                    Pasang
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteAsset(asset.id);
                    }}
                    className="p-1 bg-red-500 hover:bg-red-600 text-white rounded shadow-sm transition active:scale-95"
                    title="Delete Asset"
                    id={`asset-delete-${asset.id}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 3. Skeleton Joint Joints structure (Bones Tree) */}
      <div className="space-y-3 flex-1 flex flex-col min-h-0">
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">STRUKTUR PERSENDIAN</label>
        
        <div className="flex-1 overflow-y-auto space-y-1 pr-1 bg-[#fafafa] p-2.5 rounded-xl border border-gray-200/70 font-mono scrollbar-thin">
          {project.bones.length === 0 ? (
            <div className="text-center py-10">
              <GitBranch className="w-6 h-6 text-slate-300 mx-auto opacity-70 animate-pulse" />
              <p className="text-[10px] text-slate-500 mt-2 leading-relaxed font-sans">
                Belum ada persendian.<br />
                Gunakan <b>Gambar Tulang</b> untuk melukis sendi di Kanvas!
              </p>
            </div>
          ) : (
            project.bones.map((bone) => {
              const isSelected = selectedBoneId === bone.id;
              
              return (
                <div 
                  key={bone.id}
                  id={`bone-row-${bone.id}`}
                  onClick={() => onSelectBone(bone.id)}
                  className={`group flex items-center justify-between p-1.5 px-2.5 rounded-lg border text-xs cursor-pointer transition ${
                    isSelected 
                      ? 'border-amber-400 bg-amber-50 text-amber-800 font-semibold shadow-sm' 
                      : 'border-transparent hover:bg-white text-slate-600 hover:text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span 
                      className="w-2.5 h-2.5 rounded-full border border-white shrink-0 shadow-sm" 
                      style={{ backgroundColor: bone.color }} 
                    />
                    <div className="truncate text-[11px]">
                      {bone.parentId ? (
                        <span className="text-[9px] text-slate-400 font-sans mr-1">└─</span>
                      ) : (
                        <span className="text-[9px] text-blue-500 font-sans mr-1">✦</span>
                      )}
                      {bone.name}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteBone(bone.id);
                      }}
                      className="p-1 text-slate-400 hover:text-red-500 rounded hover:bg-slate-200 transition"
                      title="Hapus Tulang"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 4. Layer Ordering & Attachment Panel (Layers list) */}
      <div className="space-y-3">
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">URUTAN LAPISAN GAMBAR</label>
        
        <div className="space-y-1.5 max-h-48 overflow-y-auto p-1 font-mono">
          {project.layers.length === 0 ? (
            <div className="text-center py-4 bg-slate-50 border border-gray-200/50 rounded-lg text-[10px] text-slate-400">
              Belum ada gambar di kanvas
            </div>
          ) : (
            // listed highest z-index on top
            [...project.layers].sort((a,b)=>b.zIndex - a.zIndex).map((layer) => {
              const isSelected = selectedLayerId === layer.id;
              const boundBone = layer.boneId ? project.bones.find(b => b.id === layer.boneId) : null;

              return (
                <div
                  key={layer.id}
                  id={`layer-row-${layer.id}`}
                  onClick={() => {
                    onSelectLayer(layer.id);
                    
                    if (onChangeTab) {
                      onChangeTab('inspector');
                    }
                    
                    // Smoothly scroll and focus the scale (multiplier) slider
                    setTimeout(() => {
                      const scaleSlider = document.getElementById('slider-layer-scale');
                      if (scaleSlider) {
                        scaleSlider.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        scaleSlider.focus();
                        
                        // Flash highlight background
                        const container = scaleSlider.parentElement;
                        if (container) {
                          const originalBg = container.style.backgroundColor;
                          const originalBorder = container.style.borderColor;
                          container.style.transition = 'all 0.4s ease';
                          container.style.backgroundColor = '#ecfdf5';
                          container.style.borderColor = '#34d399';
                          setTimeout(() => {
                            container.style.backgroundColor = originalBg;
                            container.style.borderColor = originalBorder;
                          }, 1800);
                        }
                      }
                    }, 200);
                  }}
                  className={`p-2 rounded-lg border flex flex-col gap-1 transition cursor-pointer ${
                    isSelected
                      ? 'border-blue-400 bg-blue-50 text-blue-800 shadow-sm font-semibold'
                      : 'border-gray-200/60 hover:bg-slate-50 text-slate-600 hover:text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 truncate">
                      <Layers className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="text-[11px] truncate font-sans font-medium">{layer.name}</span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteLayer(layer.id);
                      }}
                      className="p-0.5 text-slate-400 hover:text-red-500 transition ml-1"
                      title="Hapus dari kanvas"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Attachment indicator line */}
                  <div className="text-[10px] text-slate-500 font-sans flex items-center gap-1.5 bg-white border border-gray-100 p-1 rounded">
                    <GitCommit className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                    <span className="truncate">
                      Skeletal: {boundBone ? (
                        <b className="text-amber-500 font-medium">{boundBone.name}</b>
                      ) : (
                        <span className="text-slate-400">Bebas (Tidak Serikat)</span>
                      )}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
}
