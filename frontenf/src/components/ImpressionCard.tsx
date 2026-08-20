import React, { useState } from 'react';
import { getConfidenceTier } from '../utils/theme';
import { FileText, Copy, Check, ShieldCheck, Printer, AlertTriangle } from 'lucide-react';

interface ImpressionCardProps {
  summary: {
    high_confidence: string[];
    low_confidence: string[];
    text: string;
    disclaimer: string;
  };
  highestProb: number;
  highestPathology: string;
  onOpenReport: () => void;
}

export const ImpressionCard: React.FC<ImpressionCardProps> = ({
  summary,
  highestProb,
  highestPathology,
  onOpenReport,
}) => {
  const [copied, setCopied] = useState(false);
  const [verified, setVerified] = useState(false);

  const tier = getConfidenceTier(highestProb);

  const handleCopy = () => {
    const textToCopy = `KNEE-AI RADIOLOGY IMPRESSION:\n${summary.text}\n\nHigh-Confidence Findings: ${summary.high_confidence.join(', ')}\nSecondary Observations: ${summary.low_confidence.join(', ')}\n\n${summary.disclaimer}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden flex flex-col md:flex-row relative shadow-md">
      {/* Vertical Indicator Color Bar corresponding to highest confidence finding */}
      <div
        style={{ backgroundColor: tier.barColor }}
        className="w-full md:w-2 shrink-0 h-2 md:h-auto transition-colors duration-300"
        title={`Highest confidence finding: ${highestPathology} (${(highestProb * 100).toFixed(0)}%)`}
      />

      <div className="p-4 flex-grow flex flex-col gap-3">
        {/* Card Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#21262d] pb-2.5">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#d2bbff]" />
            <h3 className="text-[14px] font-semibold text-[#dfe2eb]">
              Grounded AI Diagnostic Impression
            </h3>
            <span
              style={{ backgroundColor: tier.bgColor, borderColor: tier.borderColor, color: tier.textColor }}
              className="text-[11px] font-mono-data px-2 py-0.5 rounded border"
            >
              Primary: {highestPathology} ({(highestProb * 100).toFixed(0)}%)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#10141a] hover:bg-[#262a31] border border-[#30363d] text-[12px] text-[#ccc3d8] hover:text-white transition-colors"
              title="Copy impression text to clipboard for PACS reporting"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Impression'}</span>
            </button>

            <button
              onClick={onOpenReport}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#7c3aed]/20 hover:bg-[#7c3aed]/30 border border-[#7c3aed]/50 text-[12px] text-[#d2bbff] transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Export Full Report</span>
            </button>
          </div>
        </div>

        {/* Structured Findings Tags */}
        <div className="flex flex-col gap-2">
          {summary.high_confidence.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-[#d2bbff] uppercase tracking-wider">
                Primary Findings (≥ Threshold):
              </span>
              {summary.high_confidence.map((item, idx) => (
                <span
                  key={idx}
                  className="text-[12px] font-mono-data font-semibold bg-[#7c3aed]/20 border border-[#7c3aed] text-white px-2.5 py-0.5 rounded"
                >
                  {item}
                </span>
              ))}
            </div>
          )}

          {summary.low_confidence.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-[#8b949e] uppercase tracking-wider">
                Secondary / Coexisting Signals:
              </span>
              {summary.low_confidence.map((item, idx) => (
                <span
                  key={idx}
                  className="text-[12px] font-mono-data bg-[#10141a] border border-[#30363d] text-[#ccc3d8] px-2 py-0.5 rounded"
                >
                  {item}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Narrative Impression Body */}
        <div className="bg-[#0d1117] border border-[#21262d] rounded p-3 text-[13px] leading-relaxed text-[#dfe2eb]">
          <p>{summary.text}</p>
        </div>

        {/* Radiologist Verification Checklist */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <label className="flex items-center gap-2 text-[12px] text-[#8b949e] cursor-pointer hover:text-[#dfe2eb]">
            <input
              type="checkbox"
              checked={verified}
              onChange={(e) => setVerified(e.target.checked)}
              className="rounded bg-[#0d1117] border-[#30363d] text-[#7c3aed] focus:ring-[#7c3aed] h-4 w-4"
            />
            <span className={verified ? 'text-emerald-400 font-medium' : ''}>
              {verified
                ? '✓ Radiologist Verified — Clinical correlation confirmed'
                : 'Mark as Verified by Reading Physician'}
            </span>
          </label>

          <span className="text-[11px] font-mono-data text-[#8b949e]">
            Algorithm: KNEE-AI Multi-Head ViT v2.4.1
          </span>
        </div>
      </div>
    </section>
  );
};
