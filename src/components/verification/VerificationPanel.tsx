import React, { useState } from 'react';
import { SegmentationResult, IntegrityCheckItem } from '../../types';
import { ShieldCheck, CheckCircle2, AlertTriangle, HelpCircle, XCircle, ChevronDown, ChevronUp, Cpu, Database, Award, Info, Lock } from 'lucide-react';

interface VerificationPanelProps {
  result: SegmentationResult;
}

export const VerificationPanel: React.FC<VerificationPanelProps> = ({ result }) => {
  const [activeTab, setActiveTab] = useState<'integrity' | 'evaluation' | 'provenance'>('integrity');
  const [showModelDetails, setShowModelDetails] = useState(false);

  const { integrity_checks, model_info, evaluation_evidence, reference_comparison } = result;

  // Group integrity checks by category
  const inputChecks = integrity_checks.filter(c => c.category === 'input');
  const spatialChecks = integrity_checks.filter(c => c.category === 'spatial');
  const outputChecks = integrity_checks.filter(c => c.category === 'output');
  const evaluationChecks = integrity_checks.filter(c => c.category === 'evaluation');

  const renderStatusBadge = (status: IntegrityCheckItem['status']) => {
    switch (status) {
      case 'passed':
        return (
          <span className="inline-flex items-center text-emerald-400 text-xs font-mono font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-400" />
            Passed
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center text-amber-400 text-xs font-mono font-medium">
            <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-400" />
            Warning
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center text-red-400 text-xs font-mono font-medium">
            <XCircle className="w-3.5 h-3.5 mr-1 text-red-400" />
            Failed
          </span>
        );
      case 'not_evaluated':
      default:
        return (
          <span className="inline-flex items-center text-slate-500 text-xs font-mono">
            <HelpCircle className="w-3.5 h-3.5 mr-1 text-slate-500" />
            Not Evaluated
          </span>
        );
    }
  };

  return (
    <div className="bg-neuro-900 rounded-2xl border border-neuro-800 p-5 space-y-5">
      {/* Header and Category Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neuro-800">
        <div>
          <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Verification & Trust Audit</span>
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Transparent reporting of structural integrity, held-out model metrics, and biological limitations.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center space-x-1 bg-neuro-950 p-1 rounded-xl border border-neuro-800 text-xs">
          <button
            onClick={() => setActiveTab('integrity')}
            className={`px-3 py-1 rounded-lg font-medium transition-colors ${
              activeTab === 'integrity'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Integrity Checks
          </button>
          <button
            onClick={() => setActiveTab('evaluation')}
            className={`px-3 py-1 rounded-lg font-medium transition-colors ${
              activeTab === 'evaluation'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Benchmark Evidence
          </button>
          <button
            onClick={() => setActiveTab('provenance')}
            className={`px-3 py-1 rounded-lg font-medium transition-colors ${
              activeTab === 'provenance'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Model Provenance
          </button>
        </div>
      </div>

      {/* Tab 1: Integrity Checks */}
      {activeTab === 'integrity' && (
        <div className="space-y-4 animate-fade-in">
          {/* Important Scientific Notice */}
          <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-800/40 text-cyan-300 text-xs flex items-start space-x-2.5">
            <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
            <span className="leading-snug">
              <strong>Distinction between Geometry and Biological Accuracy:</strong> Correct spatial orientation and passing voxel checks confirm that file headers align properly, but they do not prove clinical ground-truth. Case-specific accuracy is only evaluated when an expert reference mask is uploaded.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Input & Spatial Integrity */}
            <div className="space-y-2.5 p-3.5 rounded-xl bg-neuro-950/60 border border-neuro-850">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                1. Input & Spatial Geometry Checks
              </span>
              <div className="space-y-2">
                {[...inputChecks, ...spatialChecks].map(check => (
                  <div key={check.id} className="p-2.5 rounded-lg bg-neuro-900 border border-neuro-800 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200">{check.label}</span>
                      {renderStatusBadge(check.status)}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">{check.details}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Output File & Nesting Integrity */}
            <div className="space-y-2.5 p-3.5 rounded-xl bg-neuro-950/60 border border-neuro-850">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                2. Output File & Nesting Verification
              </span>
              <div className="space-y-2">
                {[...outputChecks, ...evaluationChecks].map(check => (
                  <div key={check.id} className="p-2.5 rounded-lg bg-neuro-900 border border-neuro-800 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200">{check.label}</span>
                      {renderStatusBadge(check.status)}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">{check.details}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Held-Out Benchmark Evidence */}
      {activeTab === 'evaluation' && (
        <div className="space-y-4 animate-fade-in">
          <div className="p-4 rounded-xl bg-neuro-950 border border-neuro-850 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-200 block">
                  {evaluation_evidence.dataset_name}
                </span>
                <span className="text-[11px] text-slate-400">
                  Evaluated on {evaluation_evidence.held_out_cases_count} multi-institutional held-out test cases
                </span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-neuro-850 text-cyan-400 border border-neuro-800">
                Held-Out Benchmark
              </span>
            </div>

            {/* Benchmark metrics table */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-lg bg-neuro-900 border border-neuro-800 space-y-1">
                <span className="text-[10px] uppercase font-mono text-amber-400 font-bold block">
                  Whole Tumour (WT)
                </span>
                <div className="text-xl font-bold font-mono text-white">
                  Dice: {evaluation_evidence.metrics.dice_wt.value.toFixed(3)}
                </div>
                <div className="text-[11px] text-slate-400">
                  95% CI: [{evaluation_evidence.metrics.dice_wt.ci_lower?.toFixed(3)} – {evaluation_evidence.metrics.dice_wt.ci_upper?.toFixed(3)}]
                </div>
                <div className="text-[11px] text-slate-400 pt-1 border-t border-neuro-800">
                  Sensitivity: {evaluation_evidence.metrics.sens_wt.value.toFixed(3)}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-neuro-900 border border-neuro-800 space-y-1">
                <span className="text-[10px] uppercase font-mono text-red-400 font-bold block">
                  Tumour Core (TC)
                </span>
                <div className="text-xl font-bold font-mono text-white">
                  Dice: {evaluation_evidence.metrics.dice_tc.value.toFixed(3)}
                </div>
                <div className="text-[11px] text-slate-400">
                  95% CI: [{evaluation_evidence.metrics.dice_tc.ci_lower?.toFixed(3)} – {evaluation_evidence.metrics.dice_tc.ci_upper?.toFixed(3)}]
                </div>
                <div className="text-[11px] text-slate-400 pt-1 border-t border-neuro-800">
                  Sensitivity: {evaluation_evidence.metrics.sens_tc.value.toFixed(3)}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-neuro-900 border border-neuro-800 space-y-1">
                <span className="text-[10px] uppercase font-mono text-cyan-400 font-bold block">
                  Enhancing Tumour (ET)
                </span>
                <div className="text-xl font-bold font-mono text-white">
                  Dice: {evaluation_evidence.metrics.dice_et.value.toFixed(3)}
                </div>
                <div className="text-[11px] text-slate-400">
                  95% CI: [{evaluation_evidence.metrics.dice_et.ci_lower?.toFixed(3)} – {evaluation_evidence.metrics.dice_et.ci_upper?.toFixed(3)}]
                </div>
                <div className="text-[11px] text-slate-400 pt-1 border-t border-neuro-800">
                  Sensitivity: {evaluation_evidence.metrics.sens_et.value.toFixed(3)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Model Provenance & Architecture */}
      {activeTab === 'provenance' && (
        <div className="space-y-4 animate-fade-in text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-neuro-950 border border-neuro-850 space-y-1.5">
              <span className="text-slate-400 block font-mono text-[10px] uppercase">Model Architecture</span>
              <span className="font-semibold text-slate-200 block">{model_info.name} (v{model_info.version})</span>
              <p className="text-slate-400 text-[11px]">{model_info.architecture}</p>
            </div>

            <div className="p-3 rounded-xl bg-neuro-950 border border-neuro-850 space-y-1.5">
              <span className="text-slate-400 block font-mono text-[10px] uppercase">Training Provenance</span>
              <span className="font-semibold text-slate-200 block">{model_info.training_dataset}</span>
              <p className="text-slate-400 text-[11px]">{model_info.training_cases_count} annotated cases | {model_info.license}</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-neuro-950 border border-neuro-850 space-y-1.5">
            <span className="text-slate-400 block font-mono text-[10px] uppercase">Input Preprocessing Requirements</span>
            <p className="text-slate-300 text-[11px] leading-relaxed">{model_info.preprocessing}</p>
            {model_info.provenance_hash && (
              <span className="font-mono text-[10px] text-slate-500 block pt-1">
                Weights Hash: {model_info.provenance_hash}
              </span>
            )}
          </div>

          <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-800/40 space-y-1.5 text-amber-200">
            <span className="text-amber-400 font-semibold block text-[11px] uppercase tracking-wider">
              Documented Model Limitations
            </span>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-200/90">
              {model_info.known_limitations.map((lim, i) => (
                <li key={i}>{lim}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
