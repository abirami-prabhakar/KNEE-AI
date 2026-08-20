import React from 'react';
import { getConfidenceTier } from '../utils/theme';
import { Target, Zap, ChevronRight } from 'lucide-react';

interface FindingChipsProps {
  findings: Record<string, number>;
  evidenceRanges: Record<string, [number, number]>;
  activeFinding: string;
  onSelectFinding: (finding: string, startSlice: number) => void;
  confidenceThreshold: number;
}

export const FindingChips: React.FC<FindingChipsProps> = ({
  findings,
  evidenceRanges,
  activeFinding,
  onSelectFinding,
  confidenceThreshold,
}) => {
  // Sort findings descending by probability
  const sortedFindings = (Object.entries(findings) as [string, number][]).sort(
    (a, b) => b[1] - a[1]
  );

  return (
    <section className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#21262d] pb-2">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-[#d2bbff]" />
          <h3 className="text-[13px] font-semibold tracking-tight text-[#dfe2eb]">
            Pathology Confidence &amp; Evidence Localization
          </h3>
          <span className="text-[11px] font-mono-data text-[#958da1] bg-[#0d1117] px-2 py-0.5 rounded border border-[#30363d]">
            {sortedFindings.length} Models
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-mono-data text-[#8b949e]">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#7c3aed]" /> High (≥70%)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#c084fc]" /> Moderate (40-69%)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#a78bfa] opacity-60" /> Low (20-39%)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#21262d] border border-[#484f58]" /> &lt;20%
          </span>
        </div>
      </div>

      {/* Grid of 12 Finding Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
        {sortedFindings.map(([pathology, prob]) => {
          const tier = getConfidenceTier(prob);
          const range = evidenceRanges[pathology] || [0, 0];
          const isSelected = activeFinding === pathology;
          const isAboveThreshold = prob >= confidenceThreshold;

          return (
            <button
              key={pathology}
              type="button"
              onClick={() => onSelectFinding(pathology, range[0])}
              style={{
                backgroundColor: isSelected ? 'rgba(124, 58, 237, 0.28)' : tier.bgColor,
                borderColor: isSelected ? '#d2bbff' : tier.borderColor,
                boxShadow: isSelected ? '0 0 0 1px #d2bbff' : 'none',
              }}
              className={`group text-left p-2 rounded border transition-all duration-150 relative overflow-hidden flex flex-col justify-between min-h-[72px] cursor-pointer hover:border-[#d2bbff] hover:brightness-110 active:scale-[0.98]`}
              title={`Click to inspect ${pathology} CAM heatmap & jump to Slice ${range[0]}`}
            >
              {/* Top Row: Pathology Name & Active Indicator */}
              <div className="flex items-start justify-between gap-1">
                <span
                  style={{ color: tier.textColor }}
                  className="text-[12px] font-semibold leading-snug line-clamp-2"
                >
                  {pathology}
                </span>
                {isSelected && (
                  <span className="w-2 h-2 rounded-full bg-[#d2bbff] animate-ping shrink-0 mt-1" />
                )}
              </div>

              {/* Bottom Row: Percentage & Evidence Range Tag */}
              <div className="mt-2 flex items-center justify-between gap-1 pt-1 border-t border-white/5">
                <div className="flex items-baseline gap-1">
                  <span
                    style={{ color: tier.barColor }}
                    className="font-mono-data text-[13px] font-bold"
                  >
                    {(prob * 100).toFixed(0)}%
                  </span>
                  {isAboveThreshold && (
                    <span className="text-[9px] font-mono-data text-[#d2bbff] bg-[#7c3aed]/40 px-1 rounded">
                      POS
                    </span>
                  )}
                </div>

                <div className="flex items-center text-[10px] font-mono-data text-[#958da1] bg-[#0d1117]/80 px-1.5 py-0.5 rounded border border-[#30363d] group-hover:border-[#7c3aed]">
                  <span>IM {range[0]}–{range[1]}</span>
                  <ChevronRight className="w-2.5 h-2.5 ml-0.5 opacity-60" />
                </div>
              </div>

              {/* Progress bar line at bottom */}
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-black/40">
                <div
                  style={{
                    width: `${Math.min(100, Math.max(5, prob * 100))}%`,
                    backgroundColor: tier.barColor,
                  }}
                  className="h-full transition-all duration-300"
                />
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
