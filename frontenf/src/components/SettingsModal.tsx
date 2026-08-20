import React, { useState } from 'react';
import { testBackendConnection } from '../services/api';
import { X, Server, CheckCircle2, AlertCircle, RefreshCw, Save } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiBaseUrl: string;
  onSaveApiBaseUrl: (url: string) => void;
  isLiveApi: boolean;
  onRefreshConnection: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  apiBaseUrl,
  onSaveApiBaseUrl,
  isLiveApi,
  onRefreshConnection,
}) => {
  if (!isOpen) return null;

  const [urlInput, setUrlInput] = useState(apiBaseUrl);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'fail' | null>(null);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    const ok = await testBackendConnection(urlInput.trim());
    setTesting(false);
    setTestResult(ok ? 'success' : 'fail');
  };

  const handleSave = () => {
    onSaveApiBaseUrl(urlInput.trim());
    onRefreshConnection();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl max-w-md w-full p-6 shadow-2xl text-[#dfe2eb]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#30363d] mb-4">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-[#d2bbff]" />
            <h3 className="text-[16px] font-semibold text-white">Backend &amp; PACS Configuration</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-[#262a31] text-[#958da1]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-[12px] font-medium text-[#ccc3d8] block mb-1.5">
              FastAPI Inference Server URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="http://localhost:8000"
                className="w-full bg-[#0d1117] border border-[#30363d] rounded p-2 text-[13px] font-mono-data text-white focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] outline-none"
              />
              <button
                type="button"
                onClick={handleTest}
                disabled={testing}
                className="px-3 py-2 bg-[#1c2026] hover:bg-[#262a31] border border-[#30363d] rounded text-[12px] text-[#d2bbff] transition-colors shrink-0 flex items-center gap-1"
              >
                {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Ping'}
              </button>
            </div>
            <span className="text-[11px] text-[#8b949e] mt-1 block">
              Default endpoint: <code className="text-[#d2bbff]">http://localhost:8000</code>
            </span>
          </div>

          {/* Test Status Banner */}
          {testResult === 'success' && (
            <div className="p-3 bg-emerald-950/30 border border-emerald-500/50 rounded flex items-center gap-2 text-emerald-400 text-[12px]">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Backend connection verified! FastAPI endpoints responding.</span>
            </div>
          )}

          {testResult === 'fail' && (
            <div className="p-3 bg-[#10141a] border border-[#30363d] rounded flex flex-col gap-1 text-[12px] text-[#ccc3d8]">
              <div className="flex items-center gap-2 text-[#c084fc] font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>FastAPI backend not detected at {urlInput}</span>
              </div>
              <span className="text-[11px] text-[#8b949e]">
                No worries — KNEE-AI automatically utilizes its built-in high-resolution clinical MRI synthesizer with 12 calibrated pathologies and CAM maps.
              </span>
            </div>
          )}

          {/* Current Status */}
          <div className="p-3 rounded bg-[#10141a] border border-[#21262d] text-[12px] flex items-center justify-between">
            <span className="text-[#8b949e]">Active Inference Engine:</span>
            <span className="font-mono-data font-semibold text-[#d2bbff]">
              {isLiveApi ? 'FastAPI Live Backend' : 'Client Clinical Engine (Active)'}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-3 border-t border-[#30363d]">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded bg-[#10141a] hover:bg-[#262a31] border border-[#30363d] text-[13px] text-[#ccc3d8] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded bg-[#7c3aed] hover:bg-[#6f54bf] text-white text-[13px] font-medium flex items-center gap-1.5 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Apply &amp; Save</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
