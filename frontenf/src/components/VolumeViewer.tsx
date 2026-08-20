import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ViewMode, WindowLevelPreset, Coordinates } from '../types';
import { getConfidenceTier } from '../utils/theme';
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Crosshair,
  Camera,
  Columns,
  Split,
  Eye,
  Sliders,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';

interface VolumeViewerProps {
  numSlices: number;
  slices: string[]; // base64 images
  heatmaps: Record<string, string[]>; // pathology -> base64 images
  activeFinding: string;
  activeConfidence: number;
  evidenceRange: [number, number];
  activeSlice: number;
  onSliceChange: (slice: number) => void;
  metadata?: {
    patient_id?: string;
    series?: string;
    study_date?: string;
    matrix?: string;
    tr_te?: string;
    slice_thickness?: string;
  };
  windowLevelPreset: WindowLevelPreset;
  heatmapOpacity: number;
}

export const VolumeViewer: React.FC<VolumeViewerProps> = ({
  numSlices,
  slices,
  heatmaps,
  activeFinding,
  activeConfidence,
  evidenceRange,
  activeSlice,
  onSliceChange,
  metadata,
  windowLevelPreset,
  heatmapOpacity,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [fps, setFps] = useState(12);
  const [viewMode, setViewMode] = useState<ViewMode>('dual');
  const [splitPosition, setSplitPosition] = useState(50); // 0% to 100% for curtain split
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [showCrosshair, setShowCrosshair] = useState(false);
  const [crosshairPos, setCrosshairPos] = useState<Coordinates>({ x: 256, y: 256 });
  const [pixelIntensity, setPixelIntensity] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const rawImgRef = useRef<HTMLImageElement>(null);
  const heatmapImgRef = useRef<HTMLImageElement>(null);
  const cineTimerRef = useRef<number | null>(null);

  const currentRawSrc = slices[activeSlice] || '';
  const currentHeatmapList = heatmaps[activeFinding] || [];
  const currentHeatmapSrc = currentHeatmapList[activeSlice] || '';
  const hasHeatmapOnSlice = currentHeatmapSrc && currentHeatmapSrc.trim().length > 0;

  const [startRange, endRange] = evidenceRange;
  const isSliceInEvidence = activeSlice >= startRange && activeSlice <= endRange;
  const tier = getConfidenceTier(activeConfidence);

  // Cine playback loop
  useEffect(() => {
    if (isPlaying && numSlices > 1) {
      cineTimerRef.current = window.setInterval(() => {
        onSliceChange((activeSlice + 1) % numSlices);
      }, 1000 / fps);
    } else if (cineTimerRef.current) {
      clearInterval(cineTimerRef.current);
    }
    return () => {
      if (cineTimerRef.current) clearInterval(cineTimerRef.current);
    };
  }, [isPlaying, fps, activeSlice, numSlices, onSliceChange]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is in an input or select
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        onSliceChange(Math.min(numSlices - 1, activeSlice + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        onSliceChange(Math.max(0, activeSlice - 1));
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      } else if (e.key === 'Home') {
        e.preventDefault();
        onSliceChange(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        onSliceChange(numSlices - 1);
      } else if (e.key === 'c' || e.key === 'C') {
        setShowCrosshair((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSlice, numSlices, onSliceChange]);

  // Wheel zoom / slice navigation
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      // Zoom
      const delta = e.deltaY < 0 ? 0.1 : -0.1;
      setZoom((prev) => Math.max(0.5, Math.min(3.0, prev + delta)));
    } else {
      // Scroll slices
      if (e.deltaY > 0) {
        onSliceChange(Math.min(numSlices - 1, activeSlice + 1));
      } else {
        onSliceChange(Math.max(0, activeSlice - 1));
      }
    }
  };

  // Pan controls
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && (e.altKey || zoom > 1.0)) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    }

    if (showCrosshair && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.round(e.clientX - rect.left);
      const y = Math.round(e.clientY - rect.top);
      setCrosshairPos({ x, y });
      // Calculate simulated HU / signal intensity based on coordinates
      const normX = (x / rect.width) * 512;
      const normY = (y / rect.height) * 512;
      const intensity = Math.round(120 + Math.sin(normX * 0.05) * 40 + Math.cos(normY * 0.05) * 50);
      setPixelIntensity(intensity);
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const resetView = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  const captureSnapshot = () => {
    const link = document.createElement('a');
    link.download = `KNEE_AI_${metadata?.patient_id || 'PATIENT'}_SL_${activeSlice}_${activeFinding.replace(/\s+/g, '_')}.png`;
    link.href = hasHeatmapOnSlice ? currentHeatmapSrc : currentRawSrc;
    link.click();
  };

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className={`flex flex-col bg-[#06080c] border border-[#30363d] rounded-lg overflow-hidden select-none relative ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''
      }`}
    >
      {/* Top PACS Toolbar */}
      <div className="bg-[#161b22] border-b border-[#30363d] px-3 py-2 flex flex-wrap items-center justify-between gap-2 z-20">
        {/* Left: View Mode Switcher */}
        <div className="flex items-center gap-1 bg-[#0d1117] p-0.5 rounded border border-[#30363d]">
          <button
            type="button"
            onClick={() => setViewMode('dual')}
            className={`px-2 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
              viewMode === 'dual'
                ? 'bg-[#7c3aed] text-white'
                : 'text-[#8b949e] hover:text-[#dfe2eb]'
            }`}
            title="Dual-Pane Side-by-Side: Raw Slice | Heatmap"
          >
            <Columns className="w-3 h-3" />
            <span className="hidden sm:inline">Dual-Pane</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('split')}
            className={`px-2 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
              viewMode === 'split'
                ? 'bg-[#7c3aed] text-white'
                : 'text-[#8b949e] hover:text-[#dfe2eb]'
            }`}
            title="Split-Screen Curtain: Drag interactive divider"
          >
            <Split className="w-3 h-3" />
            <span className="hidden sm:inline">Curtain Split</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('blend')}
            className={`px-2 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
              viewMode === 'blend'
                ? 'bg-[#7c3aed] text-white'
                : 'text-[#8b949e] hover:text-[#dfe2eb]'
            }`}
            title="Blended Alpha Overlay"
          >
            <Layers className="w-3 h-3" />
            <span className="hidden sm:inline">Blend Overlay</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('raw_only')}
            className={`px-2 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
              viewMode === 'raw_only'
                ? 'bg-[#7c3aed] text-white'
                : 'text-[#8b949e] hover:text-[#dfe2eb]'
            }`}
            title="Raw Grayscale Only"
          >
            <Eye className="w-3 h-3" />
            <span className="hidden sm:inline">Raw Only</span>
          </button>
        </div>

        {/* Center: Active Pathology & Evidence Callout */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#10141a] border border-[#30363d] text-[12px]">
            <span className="text-[#8b949e]">Target:</span>
            <span style={{ color: tier.barColor }} className="font-semibold">
              {activeFinding}
            </span>
            <span className="font-mono-data text-[11px] bg-[#7c3aed]/20 text-[#d2bbff] px-1 rounded">
              {(activeConfidence * 100).toFixed(0)}%
            </span>
          </div>

          {isSliceInEvidence ? (
            <span className="flex items-center gap-1 text-[11px] font-mono-data bg-[#7c3aed]/25 text-[#d2bbff] px-2 py-1 rounded border border-[#7c3aed]/50 animate-pulse">
              <Sparkles className="w-3 h-3 text-[#d2bbff]" />
              In Evidence Range (IM {startRange}–{endRange})
            </span>
          ) : (
            <span className="text-[11px] font-mono-data text-[#8b949e] bg-[#10141a] px-2 py-1 rounded border border-[#21262d] hidden md:inline-block">
              Evidence Range: IM {startRange}–{endRange}
            </span>
          )}
        </div>

        {/* Right: PACS Viewer Tools */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowCrosshair(!showCrosshair)}
            className={`p-1.5 rounded transition-colors ${
              showCrosshair ? 'bg-[#7c3aed] text-white' : 'hover:bg-[#262a31] text-[#958da1]'
            }`}
            title="Toggle HU / Pixel Coordinate Probe (Key: C)"
          >
            <Crosshair className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setZoom((prev) => Math.min(3.0, prev + 0.25))}
            className="p-1.5 rounded hover:bg-[#262a31] text-[#958da1] hover:text-[#dfe2eb]"
            title="Zoom In (Ctrl + Wheel Up)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setZoom((prev) => Math.max(0.5, prev - 0.25))}
            className="p-1.5 rounded hover:bg-[#262a31] text-[#958da1] hover:text-[#dfe2eb]"
            title="Zoom Out (Ctrl + Wheel Down)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          {zoom !== 1.0 && (
            <button
              type="button"
              onClick={resetView}
              className="text-[11px] font-mono-data text-[#d2bbff] bg-[#7c3aed]/20 px-1.5 py-0.5 rounded border border-[#7c3aed]/40 hover:bg-[#7c3aed]/40"
              title="Reset Zoom & Pan"
            >
              Reset
            </button>
          )}

          <button
            type="button"
            onClick={captureSnapshot}
            className="p-1.5 rounded hover:bg-[#262a31] text-[#958da1] hover:text-[#dfe2eb]"
            title="Save PNG Snapshot"
          >
            <Camera className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1.5 rounded hover:bg-[#262a31] text-[#958da1] hover:text-[#dfe2eb]"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Dual-Pane Viewport Canvas Area */}
      <div className="relative w-full h-[380px] sm:h-[460px] md:h-[500px] flex items-center justify-center bg-black overflow-hidden cursor-crosshair-pacs">
        {/* Four-Corner PACS Overlays (Left Top, Right Top, Left Bottom, Right Bottom) */}
        {/* Top-Left Overlay */}
        <div className="absolute top-2 left-3 z-30 font-mono-data text-[11px] text-[#dfe2eb] drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] pointer-events-none flex flex-col gap-0.5">
          <div className="font-bold text-[#d2bbff]">{metadata?.patient_id || 'PT-89421-K'}</div>
          <div className="text-[#8b949e]">{metadata?.study_date || '2026-08-14'}</div>
          <div className="text-[#ccc3d8]">{metadata?.series || 'SAG T2 FSE FS'}</div>
        </div>

        {/* Top-Right Overlay */}
        <div className="absolute top-2 right-3 z-30 font-mono-data text-[11px] text-[#dfe2eb] text-right drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] pointer-events-none flex flex-col gap-0.5">
          <div className="text-[#d2bbff] font-semibold">KNEE-AI ResNet-ViT</div>
          <div className="text-[#8b949e]">CAM: {activeFinding}</div>
          <div style={{ color: tier.barColor }} className="font-bold">
            CONF: {(activeConfidence * 100).toFixed(1)}%
          </div>
        </div>

        {/* Bottom-Left Overlay */}
        <div className="absolute bottom-2 left-3 z-30 font-mono-data text-[11px] text-[#dfe2eb] drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] pointer-events-none flex flex-col gap-0.5">
          <div className="font-bold text-[#d2bbff]">
            IM: {activeSlice + 1} / {numSlices}
          </div>
          <div className="text-[#8b949e]">Thick: {metadata?.slice_thickness || '3.0 mm'}</div>
          <div className="text-[#8b949e]">FOV: 160 mm</div>
        </div>

        {/* Bottom-Right Overlay */}
        <div className="absolute bottom-2 right-3 z-30 font-mono-data text-[11px] text-[#dfe2eb] text-right drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] pointer-events-none flex flex-col gap-0.5">
          <div className="text-[#ccc3d8]">
            W: {windowLevelPreset.window} L: {windowLevelPreset.level}
          </div>
          <div className="text-[#8b949e]">Zoom: {Math.round(zoom * 100)}%</div>
          <div className="text-[#8b949e]">{isPlaying ? `Cine: ${fps} fps` : 'Static (60Hz)'}</div>
        </div>

        {/* Crosshair probe HUD if active */}
        {showCrosshair && (
          <div className="absolute top-12 left-1/2 -translate-x-1/2 z-30 font-mono-data text-[10px] bg-[#161b22]/90 border border-[#7c3aed] text-[#dfe2eb] px-2.5 py-1 rounded shadow-lg pointer-events-none flex items-center gap-3">
            <span>X: {crosshairPos.x}px</span>
            <span>Y: {crosshairPos.y}px</span>
            <span className="text-[#d2bbff]">Signal Val: {pixelIntensity ?? 142}</span>
          </div>
        )}

        {/* VIEW MODE 1: DUAL-PANE (Side-by-Side) */}
        {viewMode === 'dual' && (
          <div
            style={{
              transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
              transition: isPanning ? 'none' : 'transform 0.05s ease-out',
            }}
            className="w-full h-full grid grid-cols-1 md:grid-cols-2 gap-2 p-2"
          >
            {/* Left Pane: Raw MRI Slice */}
            <div className="relative w-full h-full flex items-center justify-center bg-[#0d1117] rounded border border-[#21262d] overflow-hidden group">
              <img
                ref={rawImgRef}
                src={currentRawSrc}
                alt={`Raw MRI Slice ${activeSlice + 1}`}
                className="max-h-full max-w-full object-contain select-none pointer-events-none"
              />
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur-xs border border-white/10 text-[10px] font-mono-data text-[#8b949e]">
                RAW SLICE (SAG T2 FS)
              </div>
            </div>

            {/* Right Pane: AI Attention Heatmap Overlay */}
            <div className="relative w-full h-full flex items-center justify-center bg-[#0d1117] rounded border border-[#21262d] overflow-hidden group">
              {hasHeatmapOnSlice ? (
                <img
                  ref={heatmapImgRef}
                  src={currentHeatmapSrc}
                  alt={`Heatmap Slice ${activeSlice + 1}`}
                  style={{ opacity: 1 }}
                  className="max-h-full max-w-full object-contain select-none pointer-events-none"
                />
              ) : (
                <div className="relative w-full h-full flex items-center justify-center">
                  <img
                    src={currentRawSrc}
                    alt={`Raw Slice ${activeSlice + 1}`}
                    className="max-h-full max-w-full object-contain opacity-60 grayscale select-none pointer-events-none"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 p-4 text-center">
                    <div className="w-8 h-8 rounded-full bg-[#161b22] border border-[#30363d] flex items-center justify-center mb-2 text-[#8b949e]">
                      <Info className="w-4 h-4" />
                    </div>
                    <span className="text-[12px] font-medium text-[#dfe2eb]">
                      No significant attention on slice
                    </span>
                    <span className="text-[10px] font-mono-data text-[#8b949e] mt-1">
                      Evidence concentrated on IM {startRange}–{endRange}
                    </span>
                  </div>
                </div>
              )}

              <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur-xs border border-white/10 text-[10px] font-mono-data text-[#d2bbff] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#7c3aed]" />
                GRAD-CAM HEATMAP ({activeFinding})
              </div>
            </div>
          </div>
        )}

        {/* VIEW MODE 2: SPLIT-SCREEN CURTAIN */}
        {viewMode === 'split' && (
          <div
            style={{
              transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
              transition: isPanning ? 'none' : 'transform 0.05s ease-out',
            }}
            className="relative w-full h-full max-w-[600px] flex items-center justify-center"
          >
            {/* Base Heatmap image */}
            <img
              src={hasHeatmapOnSlice ? currentHeatmapSrc : currentRawSrc}
              alt="Heatmap Layer"
              className="max-h-full max-w-full object-contain select-none"
            />

            {/* Clipped Raw slice image on left of curtain */}
            <div
              style={{ clipPath: `inset(0 ${100 - splitPosition}% 0 0)` }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <img
                src={currentRawSrc}
                alt="Raw Layer"
                className="max-h-full max-w-full object-contain select-none"
              />
            </div>

            {/* Draggable Divider Handle */}
            <div
              style={{ left: `${splitPosition}%` }}
              className="absolute top-0 bottom-0 w-1 bg-[#7c3aed] cursor-ew-resize z-20 flex items-center justify-center -translate-x-1/2 shadow-[0_0_10px_rgba(124,58,237,0.8)]"
              onMouseDown={(e) => {
                e.stopPropagation();
                const handleDrag = (moveEvent: MouseEvent) => {
                  if (!containerRef.current) return;
                  const rect = containerRef.current.getBoundingClientRect();
                  const newSplit = Math.max(
                    5,
                    Math.min(95, ((moveEvent.clientX - rect.left) / rect.width) * 100)
                  );
                  setSplitPosition(newSplit);
                };
                const handleDragEnd = () => {
                  window.removeEventListener('mousemove', handleDrag);
                  window.removeEventListener('mouseup', handleDragEnd);
                };
                window.addEventListener('mousemove', handleDrag);
                window.addEventListener('mouseup', handleDragEnd);
              }}
            >
              <div className="w-5 h-8 bg-[#161b22] border border-[#d2bbff] rounded flex items-center justify-center text-[10px] text-[#d2bbff]">
                ||
              </div>
            </div>
          </div>
        )}

        {/* VIEW MODE 3: BLEND OVERLAY */}
        {viewMode === 'blend' && (
          <div
            style={{
              transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
              transition: isPanning ? 'none' : 'transform 0.05s ease-out',
            }}
            className="relative w-full h-full max-w-[600px] flex items-center justify-center"
          >
            <img
              src={currentRawSrc}
              alt="Raw MRI Slice"
              className="max-h-full max-w-full object-contain select-none"
            />
            {hasHeatmapOnSlice && (
              <img
                src={currentHeatmapSrc}
                alt="Heatmap Layer"
                style={{ opacity: heatmapOpacity, mixBlendMode: 'screen' }}
                className="absolute inset-0 m-auto max-h-full max-w-full object-contain pointer-events-none"
              />
            )}
          </div>
        )}

        {/* VIEW MODE 4: RAW ONLY */}
        {viewMode === 'raw_only' && (
          <div
            style={{
              transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
              transition: isPanning ? 'none' : 'transform 0.05s ease-out',
            }}
            className="w-full h-full max-w-[600px] flex items-center justify-center"
          >
            <img
              src={currentRawSrc}
              alt="Raw MRI Slice"
              className="max-h-full max-w-full object-contain select-none"
            />
          </div>
        )}
      </div>

      {/* Bottom Interactive Volume Navigation & Slider Bar */}
      <div className="bg-[#161b22] border-t border-[#30363d] p-3 flex flex-col gap-2 z-20">
        {/* Timeline Evidence Indicator Bar */}
        <div className="relative w-full h-3 bg-[#10141a] rounded border border-[#21262d] overflow-hidden flex items-center">
          {/* Highlight Evidence Range Block */}
          <div
            style={{
              left: `${(startRange / Math.max(1, numSlices - 1)) * 100}%`,
              width: `${(Math.max(1, endRange - startRange) / Math.max(1, numSlices - 1)) * 100}%`,
            }}
            className="absolute top-0 bottom-0 bg-[#7c3aed]/40 border-l border-r border-[#d2bbff] flex items-center justify-center"
          >
            <span className="text-[8px] font-mono-data text-[#d2bbff] tracking-tighter truncate px-1">
              {activeFinding} Evidence (IM {startRange}–{endRange})
            </span>
          </div>

          {/* Current Slice Marker Needle */}
          <div
            style={{
              left: `${(activeSlice / Math.max(1, numSlices - 1)) * 100}%`,
            }}
            className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_6px_#fff] -translate-x-1/2 z-10 pointer-events-none"
          />
        </div>

        {/* Master Volume Range Slider & Playback Controls */}
        <div className="flex items-center gap-3">
          {/* Cine Play/Pause */}
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-8 h-8 rounded bg-[#7c3aed] hover:bg-[#6f54bf] text-white flex items-center justify-center shrink-0 transition-colors shadow-sm"
            title={isPlaying ? 'Pause Cine loop (Space)' : 'Play Cine loop (Space)'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>

          {/* Prev Slice Button */}
          <button
            type="button"
            onClick={() => onSliceChange(Math.max(0, activeSlice - 1))}
            disabled={activeSlice <= 0}
            className="w-7 h-7 rounded bg-[#10141a] border border-[#30363d] hover:bg-[#262a31] text-[#958da1] hover:text-[#dfe2eb] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center shrink-0"
            title="Previous Slice (Arrow Left)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Main Diagnostic Slider */}
          <div className="flex-grow flex items-center gap-2">
            <input
              type="range"
              min="0"
              max={numSlices - 1}
              value={activeSlice}
              onChange={(e) => onSliceChange(parseInt(e.target.value, 10))}
              className="diagnostic-slider w-full cursor-pointer"
            />
          </div>

          {/* Next Slice Button */}
          <button
            type="button"
            onClick={() => onSliceChange(Math.min(numSlices - 1, activeSlice + 1))}
            disabled={activeSlice >= numSlices - 1}
            className="w-7 h-7 rounded bg-[#10141a] border border-[#30363d] hover:bg-[#262a31] text-[#958da1] hover:text-[#dfe2eb] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center shrink-0"
            title="Next Slice (Arrow Right)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Slice Counter Readout */}
          <div className="min-w-[80px] text-right font-mono-data text-[12px] bg-[#0d1117] px-2 py-1 rounded border border-[#30363d] text-[#d2bbff]">
            {activeSlice + 1} / {numSlices}
          </div>

          {/* Cine FPS Selector */}
          <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono-data text-[#8b949e]">
            <span>Speed:</span>
            <select
              value={fps}
              onChange={(e) => setFps(parseInt(e.target.value, 10))}
              className="bg-[#0d1117] border border-[#30363d] text-[#dfe2eb] rounded px-1.5 py-0.5 text-[11px] outline-none cursor-pointer"
            >
              <option value="6">6 fps</option>
              <option value="12">12 fps</option>
              <option value="18">18 fps</option>
              <option value="24">24 fps</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
