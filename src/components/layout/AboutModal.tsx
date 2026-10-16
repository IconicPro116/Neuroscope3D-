import React from 'react';
import { X, ShieldAlert, Brain, BookOpen, Layers, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neuro-950/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-2xl bg-neuro-900 border border-neuro-700/80 rounded-2xl shadow-2xl shadow-cyan-950/40 overflow-hidden max-h-[90vh] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-headline"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neuro-800 bg-neuro-950/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h2 id="modal-headline" className="text-base font-semibold text-slate-100">
                About NeuroScope 3D & Scientific Limitations
              </h2>
              <p className="text-xs text-slate-400">Research and educational brain tumor segmentation prototype</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-neuro-800 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="px-6 py-5 overflow-y-auto space-y-6 text-sm text-slate-300">
          {/* Critical Disclaimers */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 space-y-2">
            <div className="flex items-center space-x-2 text-amber-400 font-semibold text-xs tracking-wider uppercase">
              <ShieldAlert className="w-4 h-4" />
              <span>Not a Medical Device or Clinical Tool</span>
            </div>
            <p className="text-xs leading-relaxed text-amber-200/90">
              NeuroScope 3D is developed strictly for computational neuroscience research and educational demonstrations. It has not been approved or cleared by the US FDA, CE mark authorities, or any international regulatory body. 
              <strong> Never use segmentation contours or volumetric numbers for clinical diagnostic purposes, radiotherapy planning, or surgical decision-making.</strong>
            </p>
          </div>

          {/* MRI Modalities Guide */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider flex items-center space-x-2">
              <Layers className="w-4 h-4" />
              <span>Required MRI Sequences (BraTS Standard)</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 rounded-lg bg-neuro-850 border border-neuro-800">
                <span className="font-semibold text-white block mb-0.5">T1-Weighted (T1)</span>
                <span className="text-slate-400 leading-normal">
                  Provides high-resolution anatomical structure and gray/white matter contrast.
                </span>
              </div>
              <div className="p-3 rounded-lg bg-neuro-850 border border-neuro-800">
                <span className="font-semibold text-white block mb-0.5">T1Gd (Contrast-Enhanced T1)</span>
                <span className="text-slate-400 leading-normal">
                  Post-gadolinium administration. Highlights active blood-brain barrier disruption and enhancing margins.
                </span>
              </div>
              <div className="p-3 rounded-lg bg-neuro-850 border border-neuro-800">
                <span className="font-semibold text-white block mb-0.5">T2-Weighted (T2)</span>
                <span className="text-slate-400 leading-normal">
                  Sensitive to water content, defining boundary differences and deep brain tissue architecture.
                </span>
              </div>
              <div className="p-3 rounded-lg bg-neuro-850 border border-neuro-800">
                <span className="font-semibold text-white block mb-0.5">FLAIR (Fluid-Attenuated Inversion Recovery)</span>
                <span className="text-slate-400 leading-normal">
                  Suppresses cerebrospinal fluid signals to clearly demarcate peritumoral edema and whole tumour extent.
                </span>
              </div>
            </div>
          </div>

          {/* Sub-region Definitions */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider flex items-center space-x-2">
              <BookOpen className="w-4 h-4" />
              <span>Tumour Sub-Region Hierarchy</span>
            </h3>
            <div className="p-3.5 rounded-xl bg-neuro-850 border border-neuro-800 space-y-2 text-xs">
              <div className="flex items-center space-x-3">
                <span className="w-3 h-3 rounded-full bg-amber-400 flex-shrink-0" />
                <div>
                  <strong className="text-white">Whole Tumour (WT):</strong> Includes Necrotic Core + Peritumoral Edema + Enhancing Tissue (NCR + ED + ET).
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className="w-3 h-3 rounded-full bg-red-500 flex-shrink-0" />
                <div>
                  <strong className="text-white">Tumour Core (TC):</strong> Dense active core excluding vasogenic edema (NCR + ET).
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className="w-3 h-3 rounded-full bg-cyan-400 flex-shrink-0" />
                <div>
                  <strong className="text-white">Enhancing Tumour (ET):</strong> Active contrast-enhancing tissue with neovascularization (BraTS Label 4).
                </div>
              </div>
            </div>
          </div>

          {/* Known Limitations */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Known Technical Limitations</span>
            </h3>
            <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-400">
              <li>Input volumes must be co-registered and resampled to an isotropic 1.0 mm³ grid.</li>
              <li>Trained on adult supratentorial glioma MRI scans; performance on pediatric or metastatic cases is untested.</li>
              <li>Skull stripping or motion artifact flaws can introduce false-positive edge delineations.</li>
              <li>Volumes are temporarily processed in memory and removed following the retention timeout.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-neuro-800 bg-neuro-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>BraTS 2021 Benchmark Protocol</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium transition-colors"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};
