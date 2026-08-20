import React from 'react';
import { Activity, Settings, FileText, RefreshCw, Layers } from 'lucide-react';

interface HeaderProps {
  apiBaseUrl: string;
  isLiveApi: boolean;
  onOpenSettings: () => void;
  onOpenReport: () => void;
  onReset: () => void;
  hasResults: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  apiBaseUrl,
  isLiveApi,
  onOpenSettings,
  onOpenReport,
  onReset,
  hasResults,
}) => {
  return (
    <header className="bg-[#181c22] border-b border-[#30363d] sticky top-0 z-40 flex justify-between items-center w-full px-4 h-12 select-none">
      {/* Brand & Logo */}
      <div className="flex items-center gap-3 cursor-pointer" onClick={onReset} title="Reset to initial state">
        <div className="w-8 h-8 rounded bg-[#7c3aed]/20 border border-[#7c3aed] flex items-center justify-center text-[#d2bbff]">
          <span className="material-symbols-outlined text-[20px]">clinical_notes</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-bold text-[18px] tracking-tight text-[#d2bbff]">KNEE-AI</span>
          <span className="text-[11px] font-mono-data text-[#958da1] tracking-wider hidden sm:inline-block">
            PACS v2.4.1
          </span>
        </div>
      </div>

      {/* Center Status / Connection */}
      <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded bg-[#10141a] border border-[#30363d] text-[12px]">
        <div
          className={`w-2 h-2 rounded-full ${
            isLiveApi ? 'bg-emerald-400 animate-pulse' : 'bg-[#c084fc]'
          }`}
        />
        <span className="text-[#8b949e]">Backend:</span>
        <span className="font-mono-data text-[#dfe2eb] truncate max-w-[180px]">
          {isLiveApi ? apiBaseUrl : 'Clinical Engine (Active)'}
        </span>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        {hasResults && (
          <button
            onClick={onOpenReport}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#1c2026] hover:bg-[#262a31] border border-[#30363d] text-[12px] font-medium text-[#d2bbff] transition-colors"
            title="Generate and Export Clinical Radiology Report"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Diagnostic Report</span>
          </button>
        )}

        <button
          onClick={onReset}
          className="p-1.5 rounded hover:bg-[#262a31] text-[#958da1] hover:text-[#dfe2eb] transition-colors"
          title="Reset Study / Clear"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenSettings}
          className="flex items-center gap-1.5 p-1.5 rounded hover:bg-[#262a31] text-[#958da1] hover:text-[#dfe2eb] transition-colors"
          title="Configure API Endpoint & PACS Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
