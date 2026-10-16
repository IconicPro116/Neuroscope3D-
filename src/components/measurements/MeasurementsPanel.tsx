import React from 'react';
import { RegionVolume, SegmentationResult } from '../../types';
import { formatVolume } from '../../utils/coordinates';
import { Activity, BarChart3, Info, Box } from 'lucide-react';

interface MeasurementsPanelProps {
  result: SegmentationResult;
}

export const MeasurementsPanel: React.FC<MeasurementsPanelProps> = ({ result }) => {
  const { volumes, voxel_spacing_mm } = result;

  // Single voxel volume in mL: (dx * dy * dz) / 1000
  const voxelVolumeMm3 = voxel_spacing_mm[0] * voxel_spacing_mm[1] * voxel_spacing_mm[2];
  const voxelVolumeMl = voxelVolumeMm3 / 1000;

  const displayList = [
    {
      region: volumes.wt,
      colorBorder: 'border-amber-500/50',
      colorBg: 'bg-amber-950/20',
      colorBadge: 'bg-amber-500 text-neuro-950',
      textColor: 'text-amber-400',
      tag: 'NCR + ED + ET',
    },
    {
      region: volumes.tc,
      colorBorder: 'border-red-500/50',
      colorBg: 'bg-red-950/20',
      colorBadge: 'bg-red-500 text-white',
      textColor: 'text-red-400',
      tag: 'NCR + ET',
    },
    {
      region: volumes.et,
      colorBorder: 'border-cyan-500/50',
      colorBg: 'bg-cyan-950/20',
      colorBadge: 'bg-cyan-400 text-neuro-950',
      textColor: 'text-cyan-400',
      tag: 'Active Rim (Label 4)',
    },
  ];

  return (
    <div className="bg-neuro-900 rounded-2xl border border-neuro-800 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-neuro-800">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">Tumour Volumetric Analysis</h3>
            <p className="text-[11px] text-slate-400">
              Voxel integral calculated on original coordinate grid ({voxelVolumeMm3.toFixed(2)} mm³ / voxel)
            </p>
          </div>
        </div>
        <span className="text-[11px] font-mono text-cyan-300 bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.5 rounded">
          Physical Metric (mL)
        </span>
      </div>

      {/* 3 Metric Cards: WT, TC, ET */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {displayList.map(({ region, colorBorder, colorBg, colorBadge, textColor, tag }) => (
          <div
            key={region.id}
            className={`p-4 rounded-xl border ${colorBorder} ${colorBg} flex flex-col justify-between space-y-3 relative overflow-hidden`}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="font-bold text-xs text-white block">
                  {region.fullName} ({region.name})
                </span>
                <span className="text-[10px] font-mono text-slate-400 mt-0.5 block">
                  {tag}
                </span>
              </div>
              <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded ${colorBadge}`}>
                {region.name}
              </span>
            </div>

            {/* Estimated Volume in mL */}
            <div>
              <div className="text-2xl font-extrabold font-mono tracking-tight text-white">
                {formatVolume(region.volume_ml)}
              </div>
              <div className="text-[11px] font-mono text-slate-400 mt-0.5 flex items-center space-x-2">
                <span>{region.voxel_count.toLocaleString()} voxels</span>
                <span>•</span>
                <span>{(region.volume_ml * 1000).toFixed(0)} mm³</span>
              </div>
            </div>

            {/* Region description / explanation */}
            <p className="text-[11px] text-slate-400 leading-snug border-t border-neuro-800/60 pt-2">
              {region.description}
            </p>
          </div>
        ))}
      </div>

      {/* Physics / Volume Method disclosure */}
      <div className="p-3 rounded-xl bg-neuro-950 border border-neuro-850 flex items-start space-x-2 text-[11px] text-slate-400">
        <Info className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
        <span className="leading-relaxed">
          <strong>Volume calculation methodology:</strong> Computed via discrete summation V = N_voxels × (Δx · Δy · Δz) × 10⁻³, preserving the exact patient voxel spacing ({voxel_spacing_mm.map(s => s.toFixed(1)).join('×')} mm) rather than an assumed 1.0 mm³ unit.
        </span>
      </div>
    </div>
  );
};
