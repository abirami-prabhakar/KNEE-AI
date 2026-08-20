import React from 'react';
import { AlertTriangle, Shield, ExternalLink } from 'lucide-react';

interface DisclaimerFooterProps {
  onOpenAlgorithmDoc?: () => void;
}

export const DisclaimerFooter: React.FC<DisclaimerFooterProps> = ({ onOpenAlgorithmDoc }) => {
  return (
    <footer className="bg-[#0a0e14] border-t border-[#f59e0b]/40 fixed bottom-0 w-full z-40 flex flex-col sm:flex-row justify-between items-center py-1.5 px-4 text-[11px] select-none">
      {/* Amber Warning Notice */}
      <div className="flex items-center gap-2 text-[#f59e0b]">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-[#f59e0b]" />
        <p className="font-semibold tracking-tight uppercase">
          CAUTION: Investigational device. For professional radiological use only. AI findings must be verified by a qualified physician.
        </p>
      </div>

      {/* Auxiliary Regulatory Links */}
      <div className="hidden md:flex items-center gap-4 text-[#8b949e] font-mono-data text-[10px]">
        <span className="text-[#484f58]">|</span>
        <span className="text-[#8b949e]">ISO 13485 / FDA SaMD Prototype</span>
        <span className="text-[#484f58]">|</span>
        <button
          onClick={onOpenAlgorithmDoc}
          className="text-[#f59e0b]/80 hover:text-[#f59e0b] hover:underline flex items-center gap-1 cursor-pointer"
        >
          <span>Model Architecture Specs</span>
        </button>
        <span className="text-[#484f58]">|</span>
        <a href="#privacy" onClick={(e) => e.preventDefault()} className="hover:text-[#dfe2eb] hover:underline">
          Privacy Policy
        </a>
        <a href="#terms" onClick={(e) => e.preventDefault()} className="hover:text-[#dfe2eb] hover:underline">
          Terms of Use
        </a>
      </div>
    </footer>
  );
};
