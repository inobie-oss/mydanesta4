/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  SlidersHorizontal, 
  GitCommit, 
  Layers, 
  Maximize, 
  Eye, 
  ChevronRight, 
  Plus, 
  RotateCcw, 
  Settings, 
  Grid,
  Paintbrush
} from 'lucide-react';
import { Project, Bone, ImageLayer, FrameData } from '../types';
import { getAbsoluteBones, getAbsoluteLayerTransform, radToDeg } from '../utils/math';

interface SidebarInspectorProps {
  project: Project;
  selectedBoneId: string | null;
  selectedLayerId: string | null;
  activeFrameData: FrameData;
  showOnionSkin: boolean;
  onionSkinPrevFrames: number;
  showGrid: boolean;
  onUpdateProjectMeta: (fields: Partial<Project>) => void;
  onUpdateBoneMeta: (boneId: string, fields: Partial<Bone>) => void;
  onUpdateLayerMeta: (layerId: string, fields: Partial<ImageLayer>) => void;
  onUpdateLayerMetaAndFrame?: (layerId: string, layerFields: Partial<ImageLayer>, nextFrameData: FrameData) => void;
  onUpdateActiveFrameData: (updated: FrameData) => void;
  onToggleOnionSkin: () => void;
  onChangeOnionDepth: (depth: number) => void;
  onToggleGrid: () => void;
}

export default function SidebarInspector({
  project,
  selectedBoneId,
  selectedLayerId,
  activeFrameData,
  showOnionSkin,
  onionSkinPrevFrames,
  showGrid,
  onUpdateProjectMeta,
  onUpdateBoneMeta,
  onUpdateLayerMeta,
  onUpdateLayerMetaAndFrame,
  onUpdateActiveFrameData,
  onToggleOnionSkin,
  onChangeOnionDepth,
  onToggleGrid,
}: SidebarInspectorProps) {
  
  // Find selected active items
  const selectedBone = project.bones.find((b) => b.id === selectedBoneId);
  const selectedLayer = project.layers.find((l) => l.id === selectedLayerId);

  // Read current active keyframe parameters for these items
  const activeBoneState = selectedBoneId ? activeFrameData.bones[selectedBoneId] || {
    x: selectedBone?.x || 0,
    y: selectedBone?.y || 0,
    angle: selectedBone?.angle || 0,
    length: selectedBone?.length || 50
  } : null;

  const activeLayerState = selectedLayerId ? activeFrameData.layers[selectedLayerId] || {
    offsetX: selectedLayer?.offsetX || 0,
    offsetY: selectedLayer?.offsetY || 0,
    offsetAngle: selectedLayer?.offsetAngle || 0,
    scaleX: selectedLayer?.scaleX || 1,
    scaleY: selectedLayer?.scaleY || 1,
    opacity: selectedLayer?.opacity || 1
  } : null;

  // Layer ordering actions
  const adjustZIndex = (delta: number) => {
    if (!selectedLayer) return;
    const currentZ = selectedLayer.zIndex;
    onUpdateLayerMeta(selectedLayer.id, { zIndex: Math.max(0, currentZ + delta) });
  };

  // Helper to check if bone targetId is descendant of boneId (recursive parent cycle protection)
  const wouldCreateCycle = (boneId: string, potentialParentId: string): boolean => {
    let currentId: string | null = potentialParentId;
    while (currentId) {
      if (currentId === boneId) return true;
      const parentBone = project.bones.find((b) => b.id === currentId);
      currentId = parentBone ? parentBone.parentId : null;
    }
    return false;
  };

  return (
    <div className="w-full h-full bg-[#c1c1c1] p-4 overflow-y-auto flex flex-col gap-6 select-none scrollbar-thin">
      
      {/* HEADER SECTION */}
      <div className="flex items-center gap-1.5 border-b border-gray-100 pb-3">
        <SlidersHorizontal className="w-4 h-4 text-blue-600" />
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">PROPERTI INSPEKTOR</h4>
      </div>

      {/* CASE A: BONE INSPECTOR */}
      {selectedBone && activeBoneState && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-xl">
            <GitCommit className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <h5 className="text-[11px] font-bold text-amber-800 leading-none">BONE INSPECTOR</h5>
              <p className="text-[9px] text-slate-500 font-mono mt-1">{selectedBone.id}</p>
            </div>
          </div>

          {/* Bone Name */}
          <div className="space-y-1.5 font-sans">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Nama Sendi (Bone)</label>
            <input 
              type="text" 
              value={selectedBone.name}
              onChange={(e) => onUpdateBoneMeta(selectedBone.id, { name: e.target.value })}
              className="w-full bg-slate-50 border border-gray-200 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition"
              id="inp-bone-name"
            />
          </div>

          {/* Parent Bone Bind */}
          <div className="space-y-1.5 font-sans">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Induk Hubungan (Parent)</label>
            <select
              value={selectedBone.parentId || ''}
              id="select-bone-parent"
              onChange={(e) => onUpdateBoneMeta(selectedBone.id, { parentId: e.target.value || null })}
              className="w-full bg-slate-50 border border-gray-200 rounded px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white transition"
            >
              <option value="">(Tidak ada - Root Bone)</option>
              {project.bones
                .filter((b) => b.id !== selectedBone.id && !wouldCreateCycle(selectedBone.id, b.id)) // Cannot parent to itself or to descendants
                .map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Angle slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-bold text-slate-500">
              <span className="uppercase">Rotasi Sudut (Angle)</span>
              <span className="font-mono text-amber-600 font-bold">
                {selectedBone.followGravity ? '90° (Gravitasi)' : `${activeBoneState.angle}°`}
              </span>
            </div>
            <input 
              type="range"
              min="-180"
              max="180"
              step="0.5"
              value={selectedBone.followGravity ? 90 : activeBoneState.angle}
              id="slider-bone-angle"
              disabled={!!selectedBone.followGravity}
              onChange={(e) => {
                const angle = parseFloat(e.target.value);
                const updatedBones = { ...activeFrameData.bones };
                updatedBones[selectedBone.id] = {
                  ...activeBoneState,
                  angle
                };
                onUpdateActiveFrameData({
                  ...activeFrameData,
                  bones: updatedBones
                });
              }}
              className="w-full accent-amber-500 disabled:opacity-50"
            />
            <div className="flex justify-between text-[8px] font-mono text-slate-400">
              <span>-180°</span>
              <span>0°</span>
              <span>180°</span>
            </div>
          </div>

          {/* Length slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-bold text-slate-500">
              <span className="uppercase">Panjang Tulang (Length)</span>
              <span className="font-mono text-amber-600 font-bold">{activeBoneState.length} px</span>
            </div>
            <input 
              type="range"
              min="10"
              max="300"
              value={activeBoneState.length}
              id="slider-bone-length"
              onChange={(e) => {
                const length = parseInt(e.target.value);
                const updatedBones = { ...activeFrameData.bones };
                updatedBones[selectedBone.id] = {
                  ...activeBoneState,
                  length
                };
                onUpdateActiveFrameData({
                  ...activeFrameData,
                  bones: updatedBones
                });
              }}
              className="w-full accent-amber-500"
            />
            <div className="flex justify-between text-[8px] font-mono text-slate-400">
              <span>10px</span>
              <span>300px</span>
            </div>
          </div>

          {/* Bone Marker Color */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase block">Warna Penanda Tulang</label>
            <div className="flex gap-1.5 flex-wrap">
              {['#e53e3e', '#3182ce', '#319795', '#dd6b20', '#805ad5', '#ecc94b', '#48bb78', '#f472b6'].map((color) => (
                <button
                  type="button"
                  key={color}
                  id={`btn-bone-color-${color.replace('#', '')}`}
                  onClick={() => onUpdateBoneMeta(selectedBone.id, { color })}
                  className={`w-6 h-6 rounded-full border border-gray-200 shrink-0 transition ${
                    selectedBone.color === color ? 'ring-2 ring-blue-500 scale-110' : ''
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Absolute root / relative offset coordinates control */}
          <div className="bg-slate-50 p-3 rounded-lg border border-gray-150 space-y-2 font-mono text-[10px]">
            <span className="text-slate-600 text-xs font-sans uppercase font-bold tracking-wide block mb-1">
              {selectedBone.parentId ? "Koordinat Offset (Anak)" : "Koordinat Pusat (Root)"}
            </span>
            <div className="grid grid-cols-2 gap-2 text-slate-700">
              <div className="bg-white border border-gray-100 px-2 py-1.5 rounded flex justify-between">
                <span className="text-emerald-600 font-bold">X:</span>
                <span>{activeBoneState.x}px</span>
              </div>
              <div className="bg-white border border-gray-100 px-2 py-1.5 rounded flex justify-between">
                <span className="text-emerald-600 font-bold">Y:</span>
                <span>{activeBoneState.y}px</span>
              </div>
            </div>
          </div>

          {/* FITUR GRAVITASI TULANG */}
          <div className="space-y-2 border-t border-gray-200 pt-3">
            <label className="text-[10px] font-bold text-slate-600 uppercase block">Fitur Gravitasi Tulang</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="btn-bone-gravity-on"
                onClick={() => onUpdateBoneMeta(selectedBone.id, { followGravity: true })}
                className={`px-3 py-2 rounded text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer border ${
                  selectedBone.followGravity
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
              >
                🌍 Ikuti Gravity
              </button>
              <button
                type="button"
                id="btn-bone-gravity-off"
                onClick={() => onUpdateBoneMeta(selectedBone.id, { followGravity: false })}
                className={`px-3 py-2 rounded text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer border ${
                  !selectedBone.followGravity
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
              >
                ⚙️ Sesuaikan
              </button>
            </div>
            <p className="text-[9px] text-slate-500 leading-normal font-sans">
              {selectedBone.followGravity 
                ? "Aktif: Sendi ditarik gravitasi bumi ke arah bawah (90°)." 
                : "Manual: Bebas atur sudut persendian ini ke pose apa pun."}
            </p>
          </div>
        </div>
      )}

      {/* CASE B: IMAGE LAYER INSPECTOR */}
      {selectedLayer && activeLayerState && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-100 rounded-xl">
            <Layers className="w-5 h-5 text-blue-600 shrink-0" />
            <div>
              <h5 className="text-[11px] font-bold text-blue-800 leading-none">IMAGE LAYER INSPECTOR</h5>
              <p className="text-[9px] text-slate-500 font-mono mt-1">{selectedLayer.id}</p>
            </div>
          </div>

          {/* Layer Name */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Nama Layer</label>
            <input 
              type="text" 
              value={selectedLayer.name}
              onChange={(e) => onUpdateLayerMeta(selectedLayer.id, { name: e.target.value })}
              className="w-full bg-slate-50 border border-gray-200 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition"
              id="inp-layer-name"
            />
          </div>

          {/* Skeletal Rig/Bind attachment */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-600 uppercase block tracking-wide text-amber-600">
              🔗 RIGGING KE TULANG (BIND BONE)
            </label>
            <select
              value={selectedLayer.boneId || ''}
              id="select-layer-bone"
              onChange={(e) => {
                const targetBoneId = e.target.value || null;
                
                // Get absolute coordinates before applying the new attach target
                const absBones = getAbsoluteBones(project.bones, activeFrameData.bones);
                const currentAbsTransform = getAbsoluteLayerTransform(selectedLayer, activeLayerState, absBones);
                
                let newOffsetX = currentAbsTransform.x;
                let newOffsetY = currentAbsTransform.y;
                let newOffsetAngle = currentAbsTransform.angle;

                if (targetBoneId && absBones[targetBoneId]) {
                  const bone = absBones[targetBoneId];
                  const cos = Math.cos(bone.absAngle);
                  const sin = Math.sin(bone.absAngle);

                  const dx = currentAbsTransform.x - bone.startX;
                  const dy = currentAbsTransform.y - bone.startY;

                  // Rotate inverse to transform world coordinates back to bone local coordinates
                  newOffsetX = Math.round(dx * cos + dy * sin);
                  newOffsetY = Math.round(-dx * sin + dy * cos);
                  newOffsetAngle = Math.round(currentAbsTransform.angle - radToDeg(bone.absAngle));

                  // Keep within normal degrees limit
                  newOffsetAngle = ((newOffsetAngle + 180) % 360) - 180;
                  if (newOffsetAngle < -180) newOffsetAngle += 360;
                }

                const updatedLayers = { ...activeFrameData.layers };
                updatedLayers[selectedLayer.id] = {
                  ...activeLayerState,
                  offsetX: newOffsetX,
                  offsetY: newOffsetY,
                  offsetAngle: newOffsetAngle
                };
                const nextFrameData = {
                  ...activeFrameData,
                  layers: updatedLayers
                };

                if (onUpdateLayerMetaAndFrame) {
                  onUpdateLayerMetaAndFrame(selectedLayer.id, {
                    boneId: targetBoneId,
                    offsetX: newOffsetX,
                    offsetY: newOffsetY,
                    offsetAngle: newOffsetAngle
                  }, nextFrameData);
                } else {
                  onUpdateLayerMeta(selectedLayer.id, {
                    boneId: targetBoneId,
                    offsetX: newOffsetX,
                    offsetY: newOffsetY,
                    offsetAngle: newOffsetAngle
                  });
                  onUpdateActiveFrameData(nextFrameData);
                }
              }}
              className="w-full bg-slate-50 border border-amber-200 rounded px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-amber-500 font-semibold transition"
            >
              <option value="">(Bebas - Tidak di-rig ke tulang)</option>
              {project.bones.map((b) => (
                <option key={b.id} value={b.id}>
                  🦴 {b.name}
                </option>
              ))}
            </select>
            <div className="flex flex-col gap-1.5 mt-1.5">
              <button
                type="button"
                id="btn-auto-bind"
                onClick={() => {
                  if (project.bones.length === 0) return;
                  const absBones = getAbsoluteBones(project.bones, activeFrameData.bones);
                  const currentAbsTransform = getAbsoluteLayerTransform(selectedLayer, activeLayerState, absBones);
                  
                  let nearestBoneId: string | null = null;
                  let minDistance = Infinity;
                  
                  Object.values(absBones).forEach((bone) => {
                    const dist = Math.hypot(currentAbsTransform.x - bone.startX, currentAbsTransform.y - bone.startY);
                    if (dist < minDistance) {
                      minDistance = dist;
                      nearestBoneId = bone.id;
                    }
                  });

                  if (nearestBoneId) {
                    const bone = absBones[nearestBoneId];
                    const cos = Math.cos(bone.absAngle);
                    const sin = Math.sin(bone.absAngle);

                    const dx = currentAbsTransform.x - bone.startX;
                    const dy = currentAbsTransform.y - bone.startY;

                    const newOffsetX = Math.round(dx * cos + dy * sin);
                    const newOffsetY = Math.round(-dx * sin + dy * cos);
                    let newOffsetAngle = Math.round(currentAbsTransform.angle - radToDeg(bone.absAngle));

                    newOffsetAngle = ((newOffsetAngle + 180) % 360) - 180;
                    if (newOffsetAngle < -180) newOffsetAngle += 360;

                    const updatedLayers = { ...activeFrameData.layers };
                    updatedLayers[selectedLayer.id] = {
                      ...activeLayerState,
                      offsetX: newOffsetX,
                      offsetY: newOffsetY,
                      offsetAngle: newOffsetAngle
                    };
                    const nextFrameData = {
                      ...activeFrameData,
                      layers: updatedLayers
                    };

                    if (onUpdateLayerMetaAndFrame) {
                      onUpdateLayerMetaAndFrame(selectedLayer.id, {
                        boneId: nearestBoneId,
                        offsetX: newOffsetX,
                        offsetY: newOffsetY,
                        offsetAngle: newOffsetAngle
                      }, nextFrameData);
                    } else {
                      onUpdateLayerMeta(selectedLayer.id, {
                        boneId: nearestBoneId,
                        offsetX: newOffsetX,
                        offsetY: newOffsetY,
                        offsetAngle: newOffsetAngle
                      });
                      onUpdateActiveFrameData(nextFrameData);
                    }
                  }
                }}
                className="w-full bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded px-2 py-1.5 text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
              >
                🎯 Ikat ke Tulang Terdekat (Presisi)
              </button>
              
              {selectedLayer.boneId && (
                <button
                  type="button"
                  id="btn-reset-offset"
                  onClick={() => {
                    const updatedLayers = { ...activeFrameData.layers };
                    updatedLayers[selectedLayer.id] = {
                      ...activeLayerState,
                      offsetX: 0,
                      offsetY: 0,
                      offsetAngle: 0
                    };
                    onUpdateActiveFrameData({
                      ...activeFrameData,
                      layers: updatedLayers
                    });
                  }}
                  className="w-full bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 rounded px-2 py-1.5 text-[11px] font-semibold transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  📍 Luruskan ke Pangkal (Reset Offset 0,0)
                </button>
              )}
            </div>
            <p className="text-[9px] text-slate-400 leading-normal mt-1">
              Atau pilih manual dari opsi di atas. Saat diikat, gambar akan langsung terkunci ke sendi tulang yang dipilih dan bergerak/berputar sejajar dengannya di kanvas!
            </p>
          </div>

          {/* Translation offsets X/Y */}
          <div className="bg-slate-50 p-3 rounded-lg border border-gray-200/80 space-y-3">
            <span className="text-slate-500 text-[10px] font-sans uppercase font-bold tracking-wide block mb-1">
              {selectedLayer.boneId ? 'Sumbu Offset Terkait Tulang' : 'Koordinat Canvas Absolut'}
            </span>
            
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                <span>GESER HORISONTAL (X-OFFSET)</span>
                <span className="font-mono text-blue-600">{activeLayerState.offsetX} px</span>
              </div>
              <input 
                type="range"
                min="-200"
                max="200"
                value={activeLayerState.offsetX}
                id="slider-layer-offsetx"
                onChange={(e) => {
                  const offsetX = parseInt(e.target.value);
                  const updatedLayers = { ...activeFrameData.layers };
                  updatedLayers[selectedLayer.id] = {
                    ...activeLayerState,
                    offsetX
                  };
                  onUpdateActiveFrameData({
                    ...activeFrameData,
                    layers: updatedLayers
                  });
                }}
                className="w-full accent-blue-600"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                <span>GESER VERTIKAL (Y-OFFSET)</span>
                <span className="font-mono text-blue-600">{activeLayerState.offsetY} px</span>
              </div>
              <input 
                type="range"
                min="-200"
                max="200"
                value={activeLayerState.offsetY}
                id="slider-layer-offsety"
                onChange={(e) => {
                  const offsetY = parseInt(e.target.value);
                  const updatedLayers = { ...activeFrameData.layers };
                  updatedLayers[selectedLayer.id] = {
                    ...activeLayerState,
                    offsetY
                  };
                  onUpdateActiveFrameData({
                    ...activeFrameData,
                    layers: updatedLayers
                  });
                }}
                className="w-full accent-blue-600"
              />
            </div>
          </div>

          {/* Scale dimension slider */}
          <div className="bg-slate-50 p-3 rounded-lg border border-gray-200/80 space-y-4">
            <span className="text-slate-500 text-[10px] font-sans uppercase font-bold tracking-wide block">
              Ukuran & Refleksi Gambar (Scale)
            </span>

            {/* Horizontal Scale Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-bold text-slate-500">
                <span className="uppercase flex items-center gap-1">↔️ Lebar / Horisontal (Scale X)</span>
                <span className="font-mono text-blue-600 font-bold">{(activeLayerState.scaleX * 100).toFixed(0)}%</span>
              </div>
              <input 
                type="range"
                min="-2.5"
                max="2.5"
                step="0.05"
                value={activeLayerState.scaleX}
                id="slider-layer-scale"
                onChange={(e) => {
                  const scaleX = parseFloat(e.target.value);
                  const updatedLayers = { ...activeFrameData.layers };
                  updatedLayers[selectedLayer.id] = {
                    ...activeLayerState,
                    scaleX
                  };
                  onUpdateActiveFrameData({
                    ...activeFrameData,
                    layers: updatedLayers
                  });
                }}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="flex justify-between text-[8px] font-mono text-slate-400">
                <span>-250% (Kiri)</span>
                <span>0%</span>
                <span>250% (Kanan)</span>
              </div>
            </div>

            {/* Vertical Scale Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-bold text-slate-500">
                <span className="uppercase flex items-center gap-1">↕️ Tinggi / Vertikal (Scale Y)</span>
                <span className="font-mono text-blue-600 font-bold">{(activeLayerState.scaleY * 100).toFixed(0)}%</span>
              </div>
              <input 
                type="range"
                min="-2.5"
                max="2.5"
                step="0.05"
                value={activeLayerState.scaleY}
                id="slider-layer-scale-y"
                onChange={(e) => {
                  const scaleY = parseFloat(e.target.value);
                  const updatedLayers = { ...activeFrameData.layers };
                  updatedLayers[selectedLayer.id] = {
                    ...activeLayerState,
                    scaleY
                  };
                  onUpdateActiveFrameData({
                    ...activeFrameData,
                    layers: updatedLayers
                  });
                }}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="flex justify-between text-[8px] font-mono text-slate-400">
                <span>-250% (Bawah)</span>
                <span>0%</span>
                <span>250% (Atas)</span>
              </div>
            </div>

            {/* Quick Mirror / Flip Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                id="btn-flip-x"
                onClick={() => {
                  const updatedLayers = { ...activeFrameData.layers };
                  updatedLayers[selectedLayer.id] = {
                    ...activeLayerState,
                    scaleX: parseFloat((-activeLayerState.scaleX).toFixed(2))
                  };
                  onUpdateActiveFrameData({
                    ...activeFrameData,
                    layers: updatedLayers
                  });
                }}
                className="bg-white hover:bg-slate-100 border border-gray-200 text-[10px] py-1.5 px-2 rounded font-semibold text-slate-700 flex items-center justify-center gap-1 cursor-pointer transition active:scale-95"
              >
                <span>🔄 Mirror Kiri/Kanan</span>
              </button>
              <button
                type="button"
                id="btn-flip-y"
                onClick={() => {
                  const updatedLayers = { ...activeFrameData.layers };
                  updatedLayers[selectedLayer.id] = {
                    ...activeLayerState,
                    scaleY: parseFloat((-activeLayerState.scaleY).toFixed(2))
                  };
                  onUpdateActiveFrameData({
                    ...activeFrameData,
                    layers: updatedLayers
                  });
                }}
                className="bg-white hover:bg-slate-100 border border-gray-200 text-[10px] py-1.5 px-2 rounded font-semibold text-slate-700 flex items-center justify-center gap-1 cursor-pointer transition active:scale-95"
              >
                <span>🔄 Mirror Atas/Bawah</span>
              </button>
            </div>
          </div>

          {/* Opacity level slider */}
          <div className="space-y-2.5">
            <div className="flex justify-between text-[10px] font-bold text-slate-500">
              <span className="uppercase">TRANSPARANSI (OPACITY)</span>
              <span className="font-mono text-blue-600 font-bold">{(activeLayerState.opacity * 100).toFixed(0)}%</span>
            </div>
            <input 
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={activeLayerState.opacity}
              id="slider-layer-opacity"
              onChange={(e) => {
                const opacity = parseFloat(e.target.value);
                const updatedLayers = { ...activeFrameData.layers };
                updatedLayers[selectedLayer.id] = {
                  ...activeLayerState,
                  opacity
                };
                onUpdateActiveFrameData({
                  ...activeFrameData,
                  layers: updatedLayers
                });
              }}
              className="w-full accent-blue-600"
            />
          </div>

          {/* Layer Ordering Position (Bring forward / send backward) */}
          <div className="space-y-2 border-t border-gray-100 pt-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">TUMPukan LAYER (Z-INDEX)</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => adjustZIndex(-1)}
                id="btn-layer-backward"
                className="flex-1 bg-slate-50 border border-gray-200 hover:bg-slate-100 text-slate-600 rounded px-2.5 py-1.5 text-xs text-center font-medium transition"
              >
                Kirim Belakang
              </button>
              <div className="bg-slate-50 border border-gray-200 px-3.5 py-1.5 text-xs font-mono font-bold text-blue-600 rounded">
                [{selectedLayer.zIndex}]
              </div>
              <button
                type="button"
                onClick={() => adjustZIndex(1)}
                id="btn-layer-forward"
                className="flex-1 bg-slate-50 border border-gray-200 hover:bg-slate-100 text-slate-600 rounded px-2.5 py-1.5 text-xs text-center font-medium transition"
              >
                Bawa Depan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CASE C: EMPTY STATE - GENERAL CANVAS SETTINGS */}
      {!selectedBone && !selectedLayer && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 p-2 bg-slate-50 border border-gray-200 rounded-xl">
            <Settings className="w-5 h-5 text-slate-500 shrink-0" />
            <div>
              <h5 className="text-[11px] font-bold text-slate-700 leading-none">PREFERENSI PROJECT</h5>
              <p className="text-[9px] text-slate-500 font-mono mt-1">Pengaturan Utama</p>
            </div>
          </div>

          {/* Edit Project Name */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Nama Project</label>
            <input 
              type="text" 
              value={project.name}
              onChange={(e) => onUpdateProjectMeta({ name: e.target.value })}
              className="w-full bg-slate-50 border border-gray-200 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition font-medium"
              id="inp-project-name"
            />
          </div>

          {/* Project Resolution Info (non-editable read only for safety, since we set it in modal) */}
          <div className="bg-slate-50 p-3 rounded-lg border border-gray-200/80 uppercase font-mono space-y-1.5 text-[10px]">
            <span className="text-slate-500 text-[9px] block">Resolusi Kanvas Saat ini</span>
            <div className="flex justify-between text-slate-700 font-bold text-xs font-sans">
              <span>{project.width} × {project.height} px</span>
              <span className="text-[10px] font-mono text-slate-400 lowercase">({(project.width/project.height).toFixed(2)} ratio)</span>
            </div>
          </div>

          {/* Custom canvas color picker */}
          <div className="space-y-2 font-sans">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Warna Latar Belakang</label>
            <div className="flex items-center gap-2.5 bg-slate-50 p-2 rounded border border-gray-200">
              <input 
                type="color" 
                value={project.backgroundColor}
                onChange={(e) => onUpdateProjectMeta({ backgroundColor: e.target.value })}
                className="w-6 h-6 border-0 bg-transparent cursor-pointer rounded-md"
              />
              <span className="text-xs font-mono font-medium text-slate-600">{project.backgroundColor.toUpperCase()}</span>
            </div>
          </div>

          {/* ONION SKINNING TOGGLE OPTIONS */}
          <div className="space-y-3.5 border-t border-gray-100 pt-4">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">FITUR ANIMATOR PROFESIONAL</span>
            
            {/* Onion skinning trigger toggle */}
            <div className="flex items-center justify-between bg-slate-50/50 p-2.5 border border-gray-200/80 rounded-xl">
              <div className="flex items-center gap-2">
                <Paintbrush className="w-4 h-4 text-amber-500" />
                <div>
                  <div className="text-xs font-semibold text-slate-700">Onion Skinning</div>
                  <div className="text-[9px] text-slate-500 mt-0.5 font-sans">Bayangan frame sebelumnya</div>
                </div>
              </div>
              <button
                type="button"
                id="btn-toggle-onionskin"
                onClick={onToggleOnionSkin}
                className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  showOnionSkin ? 'bg-blue-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    showOnionSkin ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {showOnionSkin && (
              <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-gray-200/80 transition-all">
                <div className="flex justify-between text-[10px] font-bold text-slate-500">
                  <span>Jumlah Bayangan (Onion Depth)</span>
                  <span className="font-mono text-amber-600">{onionSkinPrevFrames} frames</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="4"
                  step="1"
                  value={onionSkinPrevFrames}
                  id="slider-onion-depth"
                  onChange={(e) => onChangeOnionDepth(parseInt(e.target.value) || 2)}
                  className="w-full accent-amber-500"
                />
              </div>
            )}

            {/* Grid display toggle */}
            <div className="flex items-center justify-between bg-slate-50/50 p-2.5 border border-gray-200/80 rounded-xl">
              <div className="flex items-center gap-2">
                <Grid className="w-4 h-4 text-emerald-500" />
                <div>
                  <div className="text-xs font-semibold text-slate-700">Tampilkan Grid</div>
                  <div className="text-[9px] text-slate-500 mt-0.5 font-sans">Bantuan presisi melukis</div>
                </div>
              </div>
              <button
                type="button"
                id="btn-toggle-canvasgrid"
                onClick={onToggleGrid}
                className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  showGrid ? 'bg-blue-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    showGrid ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Quick info selection help box */}
          <div className="p-3 bg-slate-50 border border-gray-200/60 rounded-xl text-[10px] text-slate-500 leading-normal font-sans">
            💡 <b>Bantuan Cepat:</b> Klik pada elemen gambar atau bundaran persendian langsung di dalam Kanvas untuk membuka opsi detail penyesuaian khusus di panel ini!
          </div>
        </div>
      )}

    </div>
  );
}
