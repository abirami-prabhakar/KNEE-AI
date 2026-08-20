import React from 'react';
import { X, Activity, Brain, Shield, Database } from 'lucide-react';

interface AlgorithmModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AlgorithmModal: React.FC<AlgorithmModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-[#dfe2eb]">
        <div className="bg-[#10141a] border-b border-[#30363d] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-[#d2bbff]" />
            <h3 className="text-[16px] font-semibold text-white">Model Architecture &amp; Clinical Validation</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-[#262a31] text-[#958da1]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex flex-col gap-5 text-[13px]">
          <div>
            <h4 className="text-[14px] font-semibold text-[#d2bbff] mb-1">Architecture Overview</h4>
            <p className="text-[#ccc3d8] leading-relaxed">
              KNEE-AI is a multi-slice deep convolutional vision transformer (ResNet50-ViT) network trained on multi-planar knee MRI volumes (Sagittal T2 FS, Coronal PD FS, Axial T1). The model extracts slice-level feature representations and applies volumetric multi-head cross-attention to produce calibrated abnormality probabilities and Grad-CAM spatial localization heatmaps.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#10141a] p-3 rounded border border-[#21262d]">
              <span className="text-[11px] font-mono-data text-[#8b949e] uppercase">ACL Tear ROC-AUC</span>
              <div className="text-[20px] font-bold font-mono-data text-[#d2bbff] mt-0.5">0.965</div>
              <span className="text-[10px] text-[#8b949e]">Sensitivity 93.4% • Specificity 95.1%</span>
            </div>
            <div className="bg-[#10141a] p-3 rounded border border-[#21262d]">
              <span className="text-[11px] font-mono-data text-[#8b949e] uppercase">Meniscus Tear ROC-AUC</span>
              <div className="text-[20px] font-bold font-mono-data text-[#c084fc] mt-0.5">0.928</div>
              <span className="text-[10px] text-[#8b949e]">Sensitivity 89.2% • Specificity 91.8%</span>
            </div>
          </div>

          <div>
            <h4 className="text-[14px] font-semibold text-[#d2bbff] mb-1">12 Clinical Pathology Classes</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono-data text-[11px]">
              {[
                'ACL injury',
                'Medial meniscus tear',
                'Lateral meniscus tear',
                'Bone contusion',
                'Joint effusion',
                'MCL injury',
                'LCL injury',
                'PCL injury',
                'Patellar tendinitis',
                'Quadriceps tendinitis',
                'Osteochondral defect',
                "Popliteal cyst (Baker's)",
              ].map((name, i) => (
                <div key={i} className="p-2 rounded bg-[#0d1117] border border-[#30363d] text-[#dfe2eb]">
                  • {name}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#0d1117] p-4 rounded border border-[#30363d] text-[11px] text-[#8b949e] flex flex-col gap-1">
            <span className="font-semibold text-[#ccc3d8]">Data Preprocessing &amp; Slice Harmonization:</span>
            <span>All volumes are interpolated to isotropic 512×512 resolution with N4 bias field correction, intensity normalization to [0, 1], and Grad-CAM spatial backpropagation on layer4.conv2.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
