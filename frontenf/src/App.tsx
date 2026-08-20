/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { PredictResponse, SampleStudy, WindowLevelPreset } from './types';
import { fetchSamples, fetchPredict, DEFAULT_API_BASE_URL, testBackendConnection } from './services/api';
import { SAMPLE_STUDIES } from './services/mriGenerator';
import { preloadAllStudyImages } from './utils/imagePreloader';
import { Header } from './components/Header';
import { ControlsSidebar, WINDOW_LEVEL_PRESETS } from './components/ControlsSidebar';
import { FindingChips } from './components/FindingChips';
import { VolumeViewer } from './components/VolumeViewer';
import { ImpressionCard } from './components/ImpressionCard';
import { DisclaimerFooter } from './components/DisclaimerFooter';
import { ReportModal } from './components/ReportModal';
import { SettingsModal } from './components/SettingsModal';
import { AlgorithmModal } from './components/AlgorithmModal';
import { Layers, Sparkles, Activity, FileArchive } from 'lucide-react';

export default function App() {
  // Configuration State
  const [apiBaseUrl, setApiBaseUrl] = useState<string>(DEFAULT_API_BASE_URL);
  const [isLiveApi, setIsLiveApi] = useState<boolean>(false);
  const [samples, setSamples] = useState<SampleStudy[]>(SAMPLE_STUDIES);

  // Input & Inference Parameters State
  const [inputSource, setInputSource] = useState<'sample' | 'upload'>('sample');
  const [selectedSampleId, setSelectedSampleId] = useState<string>('MR_KNEE_ACL_TEAR_001');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0.5);

  // PACS Display State
  const [windowLevelPreset, setWindowLevelPreset] = useState<WindowLevelPreset>(WINDOW_LEVEL_PRESETS[0]);
  const [heatmapOpacity, setHeatmapOpacity] = useState<number>(0.85);

  // Inference Execution State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [predictData, setPredictData] = useState<PredictResponse | null>(null);

  // Viewer Active Navigation State
  const [activeSlice, setActiveSlice] = useState<number>(14);
  const [activeFinding, setActiveFinding] = useState<string>('ACL injury');

  // Modals
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showAlgorithmModal, setShowAlgorithmModal] = useState<boolean>(false);

  // Check backend and load samples on initial mount
  const checkBackend = useCallback(async () => {
    const { samples: fetchedSamples, isLive } = await fetchSamples(apiBaseUrl);
    setSamples(fetchedSamples);
    setIsLiveApi(isLive);
  }, [apiBaseUrl]);

  useEffect(() => {
    checkBackend();
  }, [checkBackend]);

  // Execute inference pipeline
  const handleRunInference = async () => {
    setIsLoading(true);
    setLoadingStep('Reading DICOM series...');

    try {
      // Step 1: Preprocessing animation
      await new Promise((r) => setTimeout(r, 250));
      setLoadingStep('ResNet-ViT feature extraction...');
      await new Promise((r) => setTimeout(r, 250));
      setLoadingStep('Generating Grad-CAM heatmaps...');

      const result = await fetchPredict(
        {
          sample_id: inputSource === 'sample' ? selectedSampleId : undefined,
          file: inputSource === 'upload' && uploadedFile ? uploadedFile : undefined,
          confidence_threshold: confidenceThreshold,
        },
        apiBaseUrl
      );

      setIsLiveApi(result.isLive);
      setLoadingStep('Preloading slice textures into memory...');

      // Preload all slices and CAM textures for zero-lag 60fps viewer performance
      await preloadAllStudyImages(result.data.slices, result.data.heatmaps);

      setPredictData(result.data);

      // Find top finding
      const sortedFindings = (Object.entries(result.data.findings) as [string, number][]).sort(
        (a, b) => b[1] - a[1]
      );
      const topFinding = sortedFindings[0]?.[0] || 'ACL injury';
      setActiveFinding(topFinding);

      // Jump to initial focal slice of top finding or middle slice
      const topRange = result.data.evidence_ranges[topFinding] || [10, 18];
      const initialSlice = Math.min(
        result.data.num_slices - 1,
        Math.max(0, Math.floor((topRange[0] + topRange[1]) / 2))
      );
      setActiveSlice(initialSlice);
    } catch (err) {
      console.error('Error during abnormality inference:', err);
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  // Select finding from chips
  const handleSelectFinding = (finding: string, startSlice: number) => {
    setActiveFinding(finding);
    if (typeof startSlice === 'number' && predictData) {
      // Jump viewer slider to start of evidence range
      const clamped = Math.max(0, Math.min(predictData.num_slices - 1, startSlice));
      setActiveSlice(clamped);
    }
  };

  // Reset to initial state
  const handleReset = () => {
    setPredictData(null);
    setUploadedFile(null);
    setInputSource('sample');
    setSelectedSampleId('MR_KNEE_ACL_TEAR_001');
    setConfidenceThreshold(0.5);
  };

  // Handle uploaded file
  const handleFileUpload = (file: File) => {
    setUploadedFile(file);
    setInputSource('upload');
  };

  // Calculate highest probability and its finding
  let highestProb = 0;
  let highestPathology = 'No finding';
  if (predictData) {
    const entries = (Object.entries(predictData.findings) as [string, number][]).sort(
      (a, b) => b[1] - a[1]
    );
    if (entries.length > 0) {
      highestPathology = entries[0][0];
      highestProb = entries[0][1];
    }
  }

  const activeEvidenceRange: [number, number] =
    predictData?.evidence_ranges[activeFinding] || [10, 18];
  const activeConfidence = predictData?.findings[activeFinding] ?? 0;
  const currentSample = samples.find((s) => s.id === selectedSampleId);

  return (
    <div className="text-[#dfe2eb] min-h-screen flex flex-col font-sans bg-[#0d1117]">
      {/* Top App Bar */}
      <Header
        apiBaseUrl={apiBaseUrl}
        isLiveApi={isLiveApi}
        onOpenSettings={() => setShowSettingsModal(true)}
        onOpenReport={() => setShowReportModal(true)}
        onReset={handleReset}
        hasResults={!!predictData}
      />

      {/* Main Workspace Area */}
      <main className="flex-grow flex flex-col md:flex-row pb-14">
        {/* Input Sidebar / Panel */}
        <ControlsSidebar
          samples={samples}
          selectedSampleId={selectedSampleId}
          onSelectSampleId={setSelectedSampleId}
          inputSource={inputSource}
          onSelectInputSource={setInputSource}
          uploadedFile={uploadedFile}
          onFileUpload={handleFileUpload}
          confidenceThreshold={confidenceThreshold}
          onThresholdChange={setConfidenceThreshold}
          onRunInference={handleRunInference}
          isLoading={isLoading}
          loadingStep={loadingStep}
          windowLevelPreset={windowLevelPreset.name}
          onSelectPreset={setWindowLevelPreset}
          heatmapOpacity={heatmapOpacity}
          onOpacityChange={setHeatmapOpacity}
        />

        {/* Diagnostic Workspace (Results or Waiting State) */}
        <div className="flex-grow flex flex-col p-4 md:p-6 overflow-y-auto max-h-[calc(100vh-48px-36px)]">
          {predictData ? (
            <div className="max-w-6xl w-full mx-auto flex flex-col gap-5">
              {/* 1. Finding Probability Chips (12 models sorted descending) */}
              <FindingChips
                findings={predictData.findings}
                evidenceRanges={predictData.evidence_ranges}
                activeFinding={activeFinding}
                onSelectFinding={handleSelectFinding}
                confidenceThreshold={confidenceThreshold}
              />

              {/* 2. Synchronized Dual-Pane 3D Volume Viewer */}
              <VolumeViewer
                numSlices={predictData.num_slices}
                slices={predictData.slices}
                heatmaps={predictData.heatmaps}
                activeFinding={activeFinding}
                activeConfidence={activeConfidence}
                evidenceRange={activeEvidenceRange}
                activeSlice={activeSlice}
                onSliceChange={setActiveSlice}
                metadata={predictData.metadata}
                windowLevelPreset={windowLevelPreset}
                heatmapOpacity={heatmapOpacity}
              />

              {/* 3. Grounded Impression Card */}
              <ImpressionCard
                summary={predictData.summary}
                highestProb={highestProb}
                highestPathology={highestPathology}
                onOpenReport={() => setShowReportModal(true)}
              />
            </div>
          ) : (
            /* Waiting for Study Input Empty State Screen */
            <div className="flex-grow flex items-center justify-center p-4">
              <div className="max-w-2xl w-full">
                <div className="border border-[#30363d] bg-[#161b22] rounded-xl p-8 flex flex-col items-center text-center shadow-xl">
                  <div className="w-20 h-20 rounded-full border border-[#4a4455] flex items-center justify-center mb-5 bg-[#1c2026] text-[#d2bbff]">
                    <span className="material-symbols-outlined text-4xl">medical_information</span>
                  </div>

                  <h3 className="text-[22px] font-semibold text-[#dfe2eb] mb-2 tracking-tight">
                    Waiting for Study Input
                  </h3>
                  <p className="text-[14px] text-[#ccc3d8] max-w-md mb-8 leading-relaxed">
                    Select a sample study from the sidebar or upload a DICOM archive to begin AI-assisted volumetric abnormality interpretation of the knee MRI.
                  </p>

                  {/* 3-Step Guided PACS Workflow */}
                  <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 w-full justify-center">
                    <div className="flex flex-col items-center">
                      <div className="w-9 h-9 rounded border border-[#30363d] bg-[#353940] flex items-center justify-center mb-2 font-mono-data text-[13px] font-bold text-white">
                        1
                      </div>
                      <span className="text-[11px] font-bold text-[#958da1] uppercase tracking-wider">
                        Upload / Select
                      </span>
                    </div>

                    <div className="hidden md:block w-12 border-t border-dashed border-[#4a4455]" />

                    <div className="flex flex-col items-center">
                      <div className="w-9 h-9 rounded border border-[#30363d] bg-[#353940] flex items-center justify-center mb-2 font-mono-data text-[13px] font-bold text-white">
                        2
                      </div>
                      <span className="text-[11px] font-bold text-[#958da1] uppercase tracking-wider">
                        Run Inference
                      </span>
                    </div>

                    <div className="hidden md:block w-12 border-t border-dashed border-[#4a4455]" />

                    <div className="flex flex-col items-center">
                      <div className="w-9 h-9 rounded border border-[#30363d] bg-[#353940] flex items-center justify-center mb-2 font-mono-data text-[13px] font-bold text-white">
                        3
                      </div>
                      <span className="text-[11px] font-bold text-[#958da1] uppercase tracking-wider">
                        Review Findings
                      </span>
                    </div>
                  </div>

                  {/* Instant Quick Start CTA */}
                  <div className="mt-8 pt-6 border-t border-[#30363d] w-full flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      onClick={handleRunInference}
                      className="px-5 py-2.5 rounded bg-[#7c3aed] hover:bg-[#6f54bf] text-white font-semibold text-[13px] flex items-center gap-2 transition-colors shadow-md"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Run Inference on {selectedSampleId}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Persistent Amber Disclaimer Footer */}
      <DisclaimerFooter onOpenAlgorithmDoc={() => setShowAlgorithmModal(true)} />

      {/* Diagnostic PDF Report Modal */}
      {predictData && (
        <ReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          predictData={predictData}
          currentSample={currentSample}
          activeFinding={activeFinding}
          activeSlice={activeSlice}
        />
      )}

      {/* Backend & PACS Settings Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        apiBaseUrl={apiBaseUrl}
        onSaveApiBaseUrl={setApiBaseUrl}
        isLiveApi={isLiveApi}
        onRefreshConnection={checkBackend}
      />

      {/* Model Algorithm Specs Modal */}
      <AlgorithmModal
        isOpen={showAlgorithmModal}
        onClose={() => setShowAlgorithmModal(false)}
      />
    </div>
  );
}
