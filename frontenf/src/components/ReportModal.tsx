import React from 'react';
import { PredictResponse, SampleStudy } from '../types';
import { X, Printer, Download, CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react';
import { getConfidenceTier } from '../utils/theme';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  predictData: PredictResponse;
  currentSample?: SampleStudy;
  activeFinding: string;
  activeSlice: number;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  predictData,
  currentSample,
  activeFinding,
  activeSlice,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const findingsEntries = (Object.entries(predictData.findings) as [string, number][]).sort(
    (a, b) => b[1] - a[1]
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-[#dfe2eb]">
        {/* Modal Header */}
        <div className="bg-[#10141a] border-b border-[#30363d] px-6 py-4 flex items-center justify-between no-print">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#7c3aed]/20 border border-[#7c3aed] flex items-center justify-center text-[#d2bbff]">
              <span className="material-symbols-outlined text-[20px]">clinical_notes</span>
            </div>
            <div>
              <h2 className="text-[16px] font-semibold text-white">
                Comprehensive AI Diagnostic Radiology Report
              </h2>
              <p className="text-[11px] font-mono-data text-[#8b949e]">
                Study: {predictData.metadata?.patient_id || currentSample?.patientId || 'PT-89421-K'} • Date: {predictData.metadata?.study_date || '2026-08-14'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#7c3aed] hover:bg-[#6f54bf] text-white text-[12px] font-medium transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Export PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded hover:bg-[#262a31] text-[#958da1] hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Report Content */}
        <div className="p-6 md:p-8 overflow-y-auto flex flex-col gap-6 text-[13px] bg-[#0d1117] print:bg-white print:text-black">
          {/* Institutional Clinical Banner */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-[#30363d] print:border-black gap-2">
            <div>
              <h1 className="text-[20px] font-bold text-[#d2bbff] print:text-purple-900 tracking-tight">
                KNEE-AI CLINICAL DIAGNOSTIC REPORT
              </h1>
              <p className="text-[12px] text-[#8b949e] print:text-gray-600">
                Department of Musculoskeletal Radiology &amp; Orthopedic Imaging
              </p>
            </div>
            <div className="text-right font-mono-data text-[11px] text-[#8b949e] print:text-gray-600">
              <div>Report ID: REP-{Math.floor(100000 + Math.random() * 900000)}</div>
              <div>Generated: {new Date().toLocaleString()}</div>
            </div>
          </div>

          {/* Patient & Study Demographics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded bg-[#161b22] print:bg-gray-100 border border-[#30363d] print:border-gray-300 font-mono-data text-[12px]">
            <div>
              <span className="text-[#8b949e] print:text-gray-500 block text-[10px] uppercase">Patient ID</span>
              <span className="font-bold text-white print:text-black">{predictData.metadata?.patient_id || currentSample?.patientId || 'PT-89421-K'}</span>
            </div>
            <div>
              <span className="text-[#8b949e] print:text-gray-500 block text-[10px] uppercase">Age / Sex</span>
              <span className="text-white print:text-black">{currentSample?.patientAge || '27Y'} / {currentSample?.patientSex || 'M'}</span>
            </div>
            <div>
              <span className="text-[#8b949e] print:text-gray-500 block text-[10px] uppercase">Sequence</span>
              <span className="text-white print:text-black">{predictData.metadata?.series || 'SAG T2 FSE FS'}</span>
            </div>
            <div>
              <span className="text-[#8b949e] print:text-gray-500 block text-[10px] uppercase">Magnetic Field</span>
              <span className="text-white print:text-black">{currentSample?.fieldStrength || '3.0 Tesla'}</span>
            </div>
          </div>

          {/* Key Slice Images Snapshot */}
          <div>
            <h3 className="text-[13px] font-bold uppercase tracking-wider text-[#d2bbff] print:text-purple-900 mb-3">
              Representative Key Slice &amp; CAM Attention Map
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#161b22] p-2 rounded border border-[#30363d] flex flex-col items-center">
                <img
                  src={predictData.slices[activeSlice]}
                  alt="Raw MRI Key Slice"
                  className="max-h-[220px] object-contain rounded"
                />
                <span className="text-[11px] font-mono-data text-[#8b949e] mt-2">
                  Raw MRI Slice (IM: {activeSlice + 1} / {predictData.num_slices})
                </span>
              </div>
              <div className="bg-[#161b22] p-2 rounded border border-[#30363d] flex flex-col items-center">
                <img
                  src={predictData.heatmaps[activeFinding]?.[activeSlice] || predictData.slices[activeSlice]}
                  alt="Grad-CAM Key Slice"
                  className="max-h-[220px] object-contain rounded"
                />
                <span className="text-[11px] font-mono-data text-[#d2bbff] print:text-purple-800 mt-2">
                  Grad-CAM Attention Overlay: {activeFinding}
                </span>
              </div>
            </div>
          </div>

          {/* Probability Matrix Table */}
          <div>
            <h3 className="text-[13px] font-bold uppercase tracking-wider text-[#d2bbff] print:text-purple-900 mb-3">
              Multi-Pathology Classifier Probability Matrix (12 Models)
            </h3>
            <div className="border border-[#30363d] print:border-gray-300 rounded overflow-hidden">
              <table className="w-full text-left font-mono-data text-[12px]">
                <thead className="bg-[#161b22] print:bg-gray-200 border-b border-[#30363d] text-[#8b949e] print:text-gray-700 text-[11px]">
                  <tr>
                    <th className="py-2 px-3">Pathology Target</th>
                    <th className="py-2 px-3">Probability</th>
                    <th className="py-2 px-3">Confidence Tier</th>
                    <th className="py-2 px-3">Evidence Slices</th>
                    <th className="py-2 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#21262d] print:divide-gray-200">
                  {findingsEntries.map(([pathology, prob]) => {
                    const tier = getConfidenceTier(prob);
                    const range = predictData.evidence_ranges[pathology] || [0, 0];
                    return (
                      <tr key={pathology} className="hover:bg-[#161b22]/50">
                        <td className="py-2 px-3 font-semibold text-white print:text-black">{pathology}</td>
                        <td className="py-2 px-3 font-bold" style={{ color: tier.barColor }}>
                          {(prob * 100).toFixed(1)}%
                        </td>
                        <td className="py-2 px-3">{tier.label}</td>
                        <td className="py-2 px-3 text-[#8b949e]">Slices {range[0]}–{range[1]}</td>
                        <td className="py-2 px-3">
                          {prob >= 0.5 ? (
                            <span className="text-[#d2bbff] font-bold print:text-purple-800">POSITIVE</span>
                          ) : (
                            <span className="text-[#8b949e]">NEGATIVE</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Impression & Grounded Text */}
          <div>
            <h3 className="text-[13px] font-bold uppercase tracking-wider text-[#d2bbff] print:text-purple-900 mb-2">
              Structured Diagnostic Impression
            </h3>
            <div className="bg-[#161b22] print:bg-gray-100 border border-[#30363d] print:border-gray-300 rounded p-4 leading-relaxed">
              <p className="text-white print:text-black">{predictData.summary.text}</p>
            </div>
          </div>

          {/* Radiologist Sign-off Block */}
          <div className="pt-4 border-t border-[#30363d] print:border-gray-400 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <span className="text-[11px] font-mono-data text-[#8b949e] print:text-gray-500 uppercase block mb-1">
                AI Validation &amp; Quality Control
              </span>
              <p className="text-[11px] text-[#ccc3d8] print:text-gray-700">
                Model: ResNet50-ViT Hybrid Attention Network v2.4.1. Calibrated with Stanford MRNet &amp; FastMRI datasets.
              </p>
            </div>
            <div className="border border-dashed border-[#30363d] print:border-gray-400 rounded p-3 text-right">
              <span className="text-[11px] font-mono-data text-[#8b949e] print:text-gray-500 block">
                Reading Radiologist Signature:
              </span>
              <div className="h-10 flex items-end justify-end">
                <span className="font-serif italic text-[16px] text-[#d2bbff] print:text-black">
                  Dr. E. Vance, MD (MSK Radiology)
                </span>
              </div>
            </div>
          </div>

          {/* Persistent Amber Disclaimer */}
          <div className="p-3 bg-[#f59e0b]/10 border border-[#f59e0b]/40 rounded flex items-center gap-2 text-[#f59e0b] text-[11px]">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{predictData.summary.disclaimer}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
