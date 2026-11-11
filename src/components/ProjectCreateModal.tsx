/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Sparkles, Monitor, AppWindow, RotateCcw, HelpCircle } from 'lucide-react';

interface ProjectCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, width: number, height: number, fps: number, length: number, bg: string) => void;
}

const PRESETS = [
  { name: 'Developer Grid (800 × 600)', width: 800, height: 600, icon: AppWindow },
  { name: 'HD YouTube (1280 × 720)', width: 1280, height: 720, icon: Monitor },
  { name: 'Square Feed (1080 × 1080)', width: 1080, height: 1080, icon: Sparkles },
  { name: 'Vertical Mobile (1080 × 1920)', width: 1080, height: 1920, icon: Monitor },
];

const BG_PRESETS = [
  { label: 'Standard Slate', value: '#1e293b' },
  { label: 'Deep Charcoal', value: '#111827' },
  { label: 'Paper White', value: '#f8fafc' },
  { label: 'Cosmic Purple', value: '#18122B' },
  { label: 'Ocean Calm', value: '#0B2447' },
];

export default function ProjectCreateModal({ isOpen, onClose, onCreate }: ProjectCreateModalProps) {
  const [name, setName] = useState('Project Animasi Baru');
  const [fps, setFps] = useState(24);
  const [length, setLength] = useState(48);
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [customWidth, setCustomWidth] = useState(800);
  const [customHeight, setCustomHeight] = useState(600);
  const [isCustom, setIsCustom] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState('#1e293b');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalWidth = isCustom ? customWidth : PRESETS[selectedPreset].width;
    const finalHeight = isCustom ? customHeight : PRESETS[selectedPreset].height;
    onCreate(name, finalWidth, finalHeight, fps, length, backgroundColor);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div 
        id="create-project-modal"
        className="bg-white border border-gray-200 rounded-2xl w-full max-w-xl text-slate-800 shadow-xl overflow-hidden motion-safe:animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-150 bg-slate-50/80">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-600 rounded-lg text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800 font-sans">Project Editor Baru</h3>
              <p className="text-xs text-slate-500 font-sans">Atur kanvas, resolusi, dan frame rate animasi Anda</p>
            </div>
          </div>
          <button 
            type="button"
            id="close-modal-btn"
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Project Name */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 font-sans">Nama Project</label>
            <input 
              type="text" 
              required
              id="project-name-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 border border-gray-200 focus:border-blue-500 focus:bg-white rounded-lg px-4 py-2 text-slate-800 focus:outline-none transition"
              placeholder="Masukkan nama project..."
            />
          </div>

          {/* Canvas Resolution Config */}
          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 font-sans">Resolusi Kanvas</label>
            
            <div className="grid grid-cols-2 gap-2">
              {PRESETS.map((preset, idx) => {
                const Icon = preset.icon;
                const isSelected = !isCustom && selectedPreset === idx;
                return (
                  <button
                    type="button"
                    key={idx}
                    id={`resolution-preset-${idx}`}
                    onClick={() => {
                      setIsCustom(false);
                      setSelectedPreset(idx);
                    }}
                    className={`flex items-start gap-3 p-3 rounded-lg border text-left transition h-16 ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50/70 text-blue-700' 
                        : 'border-gray-200 bg-white hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mt-0.5 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                    <div>
                      <div className="text-xs font-semibold">{preset.name.split(' (')[0]}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {preset.width} × {preset.height} px
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom Input Toggle */}
            <div className="flex justify-end gap-2 text-xs font-sans">
              <button
                type="button"
                id="custom-resolution-toggle"
                onClick={() => setIsCustom(!isCustom)}
                className={`px-3 py-1.5 rounded-lg border transition ${
                  isCustom
                    ? 'border-blue-500 bg-blue-50 text-blue-600'
                    : 'border-gray-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                {isCustom ? 'Pakai Preset Saja' : 'Gunakan ukuran manual (Custom)'}
              </button>
            </div>

            {isCustom && (
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 border border-gray-200 rounded-xl">
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase">Lebar (px)</label>
                  <input
                    type="number"
                    id="custom-width-input"
                    value={customWidth}
                    onChange={(e) => setCustomWidth(parseInt(e.target.value) || 800)}
                    min={200}
                    max={4000}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 mt-1 font-mono text-xs focus:outline-none focus:border-blue-500 text-slate-700"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase">Tinggi (px)</label>
                  <input
                    type="number"
                    id="custom-height-input"
                    value={customHeight}
                    onChange={(e) => setCustomHeight(parseInt(e.target.value) || 600)}
                    min={200}
                    max={4000}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 mt-1 font-mono text-xs focus:outline-none focus:border-blue-500 text-slate-700"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Canvas Color Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block font-sans">Warna Latar Belakang Kanvas</label>
            <div className="flex items-center gap-3">
              <div className="flex gap-2">
                {[
                  { label: 'Standard Slate', value: '#1e293b' },
                  { label: 'Deep Charcoal', value: '#111827' },
                  { label: 'Paper White', value: '#ffffff' },
                  { label: 'Cosmic Purple', value: '#581c87' },
                  { label: 'Ocean Calm', value: '#0f172a' },
                ].map((bg) => (
                  <button
                    type="button"
                    key={bg.value}
                    id={`bg-preset-${bg.value.replace('#', '')}`}
                    onClick={() => setBackgroundColor(bg.value)}
                    className={`w-8 h-8 rounded-full border-2 transition relative ${
                      backgroundColor === bg.value ? 'border-blue-500 scale-110 shadow-md' : 'border-gray-200'
                    }`}
                    style={{ backgroundColor: bg.value }}
                    title={bg.label}
                  >
                    {backgroundColor === bg.value && (
                      <span className="absolute inset-0 flex items-center justify-center text-[10px] text-white">✓</span>
                    )}
                  </button>
                ))}
              </div>
              <span className="text-xs text-slate-400">atau</span>
              <div className="flex items-center gap-2 bg-slate-50 border border-gray-200 rounded-lg px-2 py-1">
                <input
                  type="color"
                  id="custom-bg-color-picker"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="w-6 h-6 border-0 bg-transparent cursor-pointer rounded-md"
                />
                <input
                  type="text"
                  id="custom-bg-color-text"
                  value={backgroundColor.toUpperCase()}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="bg-transparent border-0 text-xs font-mono text-slate-700 w-20 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* FPS & Timeline Frames selection */}
          <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block font-sans">Kecepatan FPS <span className="font-mono text-blue-600">({fps})</span></label>
              <div className="flex gap-1">
                {[12, 24, 30, 60].map((f) => (
                  <button
                    type="button"
                    key={f}
                    id={`fps-btn-${f}`}
                    onClick={() => setFps(f)}
                    className={`flex-1 py-1.5 text-xs font-mono rounded border transition ${
                      fps === f
                        ? 'border-blue-500 bg-blue-50 text-blue-600'
                        : 'border-gray-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block font-sans">Panjang Animasi <span className="font-mono text-blue-600">({length} frames)</span></label>
              <div className="flex gap-1">
                {[24, 48, 60, 120].map((len) => (
                  <button
                    type="button"
                    key={len}
                    id={`len-btn-${len}`}
                    onClick={() => setLength(len)}
                    className={`flex-1 py-1.5 text-xs font-mono rounded border transition ${
                      length === len
                        ? 'border-blue-500 bg-blue-50 text-blue-600'
                        : 'border-gray-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {len}f
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Navigation */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              id="cancel-create-btn"
              onClick={onClose}
              className="px-4 py-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-lg text-sm transition font-sans"
            >
              Batal
            </button>
            <button
              type="submit"
              id="confirm-create-btn"
              className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500 transition font-sans"
            >
              Konfirmasi & Buat Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
