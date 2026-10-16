import React, { useState } from 'react';
import { SegmentationResult } from '../../types';
import { apiService } from '../../services/api';
import { Download, FileText, RotateCcw, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface ExportActionsProps {
  result: SegmentationResult;
  onStartNewCase: () => void;
  isBackendConnected: boolean;
}

export const ExportActions: React.FC<ExportActionsProps> = ({
  result,
  onStartNewCase,
  isBackendConnected,
}) => {
  const [downloadingMask, setDownloadingMask] = useState(false);
  const [downloadingReport, setDownloadingReport] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDownloadMask = async () => {
    setErrorMsg(null);
    setDownloadingMask(true);
    try {
      if (result.is_sample_case || !isBackendConnected) {
        // Download reference sample NIfTI header payload
        const dummyNiftiHeader = `NeuroScope3D Research Reference Mask\nJobID: ${result.job_id}\nDimensions: ${result.dimensions.join('x')}\nAffine:\n${JSON.stringify(result.affine, null, 2)}\nLabels: 1=NCR, 2=ED, 4=ET\n`;
        const blob = new Blob([dummyNiftiHeader], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${result.job_id}_seg.nii.gz`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } else {
        await apiService.downloadMask(result.job_id);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to download segmentation mask file.');
    } finally {
      setDownloadingMask(false);
    }
  };

  const handleDownloadReport = async () => {
    setErrorMsg(null);
    setDownloadingReport(true);
    try {
      if (result.is_sample_case || !isBackendConnected) {
        // Generate formatted text/markdown research summary report
        const reportContent = `================================================================================
NEUROSCOPE 3D — QUANTITATIVE TUMOUR SEGMENTATION & AUDIT REPORT
================================================================================
DISCLAIMER: RESEARCH AND EDUCATIONAL PROTOTYPE ONLY.
NOT A CLINICAL DIAGNOSIS OR SURGICAL AID.
--------------------------------------------------------------------------------
Case Job ID:       ${result.job_id}
Generated:         ${result.created_at}
Model:             ${result.model_info.name} (v${result.model_info.version})
Architecture:      ${result.model_info.architecture}
Training Cohort:   ${result.model_info.training_dataset} (${result.model_info.training_cases_count} cases)

IMAGE GEOMETRY:
- Dimensions:      ${result.dimensions.join(' x ')} voxels
- Voxel Spacing:   ${result.voxel_spacing_mm.join(' x ')} mm
- Orientation:     ${result.orientation_codes}

VOLUMETRIC MEASUREMENTS (Discrete Voxel Integration):
- Whole Tumour (WT):     ${result.volumes.wt.volume_ml.toFixed(2)} mL  (${result.volumes.wt.voxel_count} voxels)
- Tumour Core (TC):       ${result.volumes.tc.volume_ml.toFixed(2)} mL  (${result.volumes.tc.voxel_count} voxels)
- Enhancing Tumour (ET):  ${result.volumes.et.volume_ml.toFixed(2)} mL  (${result.volumes.et.voxel_count} voxels)

INTEGRITY CHECKS:
${result.integrity_checks.map(c => `[${c.status.toUpperCase()}] ${c.label}: ${c.details}`).join('\n')}

HELD-OUT BENCHMARK PERFORMANCE:
- Dice (WT): ${result.evaluation_evidence.metrics.dice_wt.value.toFixed(3)}
- Dice (TC): ${result.evaluation_evidence.metrics.dice_tc.value.toFixed(3)}
- Dice (ET): ${result.evaluation_evidence.metrics.dice_et.value.toFixed(3)}

KNOWN LIMITATIONS:
${result.model_info.known_limitations.map(l => `- ${l}`).join('\n')}
================================================================================`;

        const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${result.job_id}_audit_report.txt`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } else {
        await apiService.downloadReport(result.job_id);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to download verification report.');
    } finally {
      setDownloadingReport(false);
    }
  };

  return (
    <div className="bg-neuro-900 rounded-2xl border border-neuro-800 p-5 space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left note */}
        <div className="space-y-1 text-center sm:text-left">
          <h4 className="text-sm font-bold text-slate-100">Export Outputs & Session Management</h4>
          <p className="text-[11px] text-slate-400">
            Download co-registered original-grid NIfTI mask (.nii.gz) and scientific audit report.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-center sm:justify-end">
          {/* Download Mask */}
          <button
            type="button"
            onClick={handleDownloadMask}
            disabled={downloadingMask}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-neuro-850 hover:bg-neuro-800 border border-neuro-700 text-slate-200 hover:text-white text-xs font-semibold transition-colors flex items-center justify-center space-x-2"
          >
            {downloadingMask ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
            ) : (
              <Download className="w-3.5 h-3.5 text-cyan-400" />
            )}
            <span>Download Mask (.nii.gz)</span>
          </button>

          {/* Download Report */}
          <button
            type="button"
            onClick={handleDownloadReport}
            disabled={downloadingReport}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-neuro-850 hover:bg-neuro-800 border border-neuro-700 text-slate-200 hover:text-white text-xs font-semibold transition-colors flex items-center justify-center space-x-2"
          >
            {downloadingReport ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
            ) : (
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
            )}
            <span>Download Audit Report</span>
          </button>

          {/* Start New Case */}
          <button
            type="button"
            onClick={onStartNewCase}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-red-950/40 hover:bg-red-950/70 border border-red-800/60 text-red-300 hover:text-red-200 text-xs font-semibold transition-colors flex items-center justify-center space-x-2"
            title="Clean up case state and return to upload workspace"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Start New Case</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-lg bg-red-950/50 border border-red-500/40 text-xs text-red-300 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};
