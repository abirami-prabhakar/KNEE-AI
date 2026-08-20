import React, { useRef, useState } from 'react';
import { SampleStudy, WindowLevelPreset } from '../types';
import { UploadCloud, FileArchive, CheckCircle2, Sliders, ChevronDown, ChevronUp, Database, Info } from 'lucide-react';

interface ControlsSidebarProps {
  samples: SampleStudy[];
  selectedSampleId: string;
  onSelectSampleId: (id: string) => void;
  inputSource: 'sample' | 'upload';
  onSelectInputSource: (source: 'sample' | 'upload') => void;
  uploadedFile: File | null;
  onFileUpload: (file: File) => void;
  confidenceThreshold: number;
  onThresholdChange: (val: number) => void;
  onRunInference: () => void;
  isLoading: boolean;
  loadingStep: string;
  windowLevelPreset: string;
  onSelectPreset: (preset: WindowLevelPreset) => void;
  heatmapOpacity: number;
  onOpacityChange: (val: number) => void;
}

export const WINDOW_LEVEL_PRESETS: WindowLevelPreset[] = [
  { name: 'Default (T2 FS)', window: 350, level: 180, description: 'Optimized for fluid & cartilage contrast' },
  { name: 'Bone Detail', window: 600, level: 250, description: 'High contrast trabecular bone & cortex' },
  { name: 'Soft Tissue', window: 280, level: 120, description: 'Cruciate ligaments & tendon morphology' },
  { name: 'Fluid Inversion', window: 200, level: 220, description: 'Max sensitivity for joint effusion' },
];

export const ControlsSidebar: React.FC<ControlsSidebarProps> = ({
  samples,
  selectedSampleId,
  onSelectSampleId,
  inputSource,
  onSelectInputSource,
  uploadedFile,
  onFileUpload,
  confidenceThreshold,
  onThresholdChange,
  onRunInference,
  isLoading,
  loadingStep,
  windowLevelPreset,
  onSelectPreset,
  heatmapOpacity,
  onOpacityChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const currentSample = samples.find((s) => s.id === selectedSampleId) || samples[0];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      onFileUpload(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileUpload(e.target.files[0]);
    }
  };

  return (
    <aside className="w-full md:w-[320px] shrink-0 bg-[#161b22] border-b md:border-b-0 md:border-r border-[#30363d] p-4 flex flex-col gap-5 overflow-y-auto md:h-[calc(100vh-48px-36px)]">
      {/* Header Info */}
      <div className="text-center md:text-left">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded bg-[#7c3aed]/15 border border-[#7c3aed]/50 flex items-center justify-center text-[#d2bbff] shrink-0">
            <span className="material-symbols-outlined text-3xl">radiology</span>
          </div>
          <div>
            <h1 className="font-semibold text-[16px] leading-tight text-[#dfe2eb]">
              MRI Abnormality Detection
            </h1>
            <p className="text-[11px] text-[#958da1] mt-0.5">Version 2.4.1 (Investigational)</p>
          </div>
        </div>
      </div>

      {/* Input Source Toggle */}
      <section className="flex flex-col gap-3">
        <h2 className="text-[11px] font-bold tracking-wider text-[#958da1] uppercase">
          Data Input Source
        </h2>
        <div className="grid grid-cols-2 gap-2 bg-[#0d1117] p-1 rounded border border-[#30363d]">
          <button
            type="button"
            onClick={() => onSelectInputSource('sample')}
            className={`py-1.5 px-3 rounded text-[12px] font-medium transition-colors flex items-center justify-center gap-1.5 ${
              inputSource === 'sample'
                ? 'bg-[#7c3aed] text-white shadow-sm'
                : 'text-[#8b949e] hover:text-[#dfe2eb]'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Sample Study</span>
          </button>
          <button
            type="button"
            onClick={() => onSelectInputSource('upload')}
            className={`py-1.5 px-3 rounded text-[12px] font-medium transition-colors flex items-center justify-center gap-1.5 ${
              inputSource === 'upload'
                ? 'bg-[#7c3aed] text-white shadow-sm'
                : 'text-[#8b949e] hover:text-[#dfe2eb]'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Upload DICOM</span>
          </button>
        </div>

        {/* Sample Dropdown */}
        {inputSource === 'sample' && (
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] text-[#8b949e]">Select MRI Knee Volume</label>
            <select
              value={selectedSampleId}
              onChange={(e) => onSelectSampleId(e.target.value)}
              className="w-full bg-[#0d1117] border border-[#30363d] rounded text-[12px] font-mono-data text-[#dfe2eb] p-2 focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] outline-none h-10 transition-colors cursor-pointer"
            >
              {samples.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            {currentSample && (
              <p className="text-[11px] text-[#958da1] bg-[#10141a] p-2 rounded border border-[#21262d] italic">
                {currentSample.description}
              </p>
            )}
          </div>
        )}

        {/* Upload Dropzone */}
        {inputSource === 'upload' && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border border-dashed rounded bg-[#10141a] hover:bg-[#1c2026] transition-all p-5 flex flex-col items-center justify-center text-center cursor-pointer min-h-[120px] ${
              isDragging ? 'border-[#7c3aed] bg-[#7c3aed]/10' : 'border-[#30363d]'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".zip,.dcm,.dicom,.tar.gz"
              className="hidden"
            />
            {uploadedFile ? (
              <div className="flex flex-col items-center gap-1">
                <FileArchive className="w-7 h-7 text-[#c084fc] mb-1" />
                <span className="text-[12px] font-medium text-[#dfe2eb] max-w-[240px] truncate">
                  {uploadedFile.name}
                </span>
                <span className="text-[10px] font-mono-data text-[#8b949e]">
                  {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for Inference
                </span>
              </div>
            ) : (
              <>
                <span className="material-symbols-outlined text-[#958da1] text-3xl mb-1">
                  upload_file
                </span>
                <span className="text-[12px] text-[#ccc3d8] font-medium">
                  Drag &amp; drop DICOM ZIP here
                </span>
                <span className="text-[10px] font-bold text-[#8b949e] uppercase tracking-wider mt-1">
                  OR CLICK TO BROWSE ARCHIVE
                </span>
              </>
            )}
          </div>
        )}
      </section>

      {/* Inference Parameters */}
      <section className="flex flex-col gap-3">
        <h2 className="text-[11px] font-bold tracking-wider text-[#958da1] uppercase">
          Inference Parameters
        </h2>

        <div>
          <div className="flex justify-between items-end mb-1.5">
            <span className="text-[12px] text-[#dfe2eb]">Confidence Threshold</span>
            <span className="text-[14px] font-bold font-mono-data text-[#d2bbff] bg-[#7c3aed]/20 px-2 py-0.5 rounded border border-[#7c3aed]/40">
              {confidenceThreshold.toFixed(2)}
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={confidenceThreshold}
            onChange={(e) => onThresholdChange(parseFloat(e.target.value))}
            className="diagnostic-slider w-full cursor-pointer"
          />

          <div className="flex justify-between mt-1 text-[10px] font-mono-data text-[#8b949e]">
            <span>0.00 (High Sensitivity)</span>
            <span>1.00 (High Specificity)</span>
          </div>
        </div>
      </section>

      {/* Advanced PACS Display Controls */}
      <section className="border-t border-[#30363d] pt-3">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between text-[11px] font-bold tracking-wider text-[#958da1] uppercase hover:text-[#dfe2eb] transition-colors"
        >
          <span className="flex items-center gap-1">
            <Sliders className="w-3.5 h-3.5" />
            PACS &amp; CAM Controls
          </span>
          {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showAdvanced && (
          <div className="flex flex-col gap-3 mt-3">
            {/* Heatmap Opacity */}
            <div>
              <div className="flex justify-between text-[11px] text-[#8b949e] mb-1">
                <span>Heatmap Blend Opacity</span>
                <span className="font-mono-data text-[#d2bbff]">{Math.round(heatmapOpacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={heatmapOpacity}
                onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
                className="diagnostic-slider w-full cursor-pointer"
              />
            </div>

            {/* Window/Level Preset Selector */}
            <div>
              <label className="text-[11px] text-[#8b949e] block mb-1.5">Window / Level Presets</label>
              <div className="grid grid-cols-2 gap-1.5">
                {WINDOW_LEVEL_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => onSelectPreset(preset)}
                    className={`p-1.5 rounded text-[11px] font-medium border text-left transition-colors truncate ${
                      windowLevelPreset === preset.name
                        ? 'bg-[#7c3aed]/20 border-[#7c3aed] text-[#d2bbff]'
                        : 'bg-[#10141a] border-[#30363d] text-[#8b949e] hover:border-[#4a4455] hover:text-[#dfe2eb]'
                    }`}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* DICOM Metadata Summary */}
      {currentSample && (
        <section className="bg-[#10141a] border border-[#21262d] rounded p-2.5 flex flex-col gap-1 text-[11px]">
          <div className="flex items-center gap-1 text-[#8b949e] font-semibold mb-0.5">
            <Info className="w-3 h-3 text-[#c084fc]" />
            <span>Study Parameters</span>
          </div>
          <div className="flex justify-between font-mono-data text-[#8b949e]">
            <span>Patient:</span>
            <span className="text-[#dfe2eb]">{currentSample.patientId} ({currentSample.patientAge}, {currentSample.patientSex})</span>
          </div>
          <div className="flex justify-between font-mono-data text-[#8b949e]">
            <span>Sequence:</span>
            <span className="text-[#dfe2eb] truncate max-w-[170px]">{currentSample.sequence}</span>
          </div>
          <div className="flex justify-between font-mono-data text-[#8b949e]">
            <span>Tesla / Thick:</span>
            <span className="text-[#dfe2eb]">{currentSample.fieldStrength.split(' ')[0]} / {currentSample.sliceThickness}</span>
          </div>
        </section>
      )}

      {/* Action Button */}
      <div className="mt-auto pt-2">
        <button
          onClick={onRunInference}
          disabled={isLoading}
          className={`w-full bg-[#7c3aed] hover:bg-[#6f54bf] active:bg-[#5a00c6] text-white font-semibold text-[14px] h-12 rounded flex items-center justify-center gap-2 transition-all shadow-md ${
            isLoading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:shadow-lg'
          }`}
        >
          {isLoading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span className="text-[13px]">{loadingStep || 'Processing MRI Volume...'}</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[20px]">psychiatry</span>
              <span>Run Abnormality Inference</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};
