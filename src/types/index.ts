export type ModalityType = 't1' | 't1gd' | 't2' | 'flair' | 'reference_mask';

export interface ModalityFile {
  file: File | null;
  name: string;
  size: number;
  status: 'not_selected' | 'selected' | 'uploading' | 'validating' | 'valid' | 'invalid';
  errorMessage?: string;
  suggestedModality?: ModalityType;
  dimensions?: [number, number, number];
  voxelSpacing?: [number, number, number];
}

export interface UploadSlotsState {
  t1: ModalityFile;
  t1gd: ModalityFile;
  t2: ModalityFile;
  flair: ModalityFile;
  reference_mask: ModalityFile;
}

export type JobStage =
  | 'idle'
  | 'receiving_files'
  | 'validating_geometry'
  | 'preprocessing_volumes'
  | 'running_inference'
  | 'restoring_coordinates'
  | 'verifying_segmentation'
  | 'preparing_outputs'
  | 'completed'
  | 'failed';

export interface JobStatusResponse {
  job_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  stage: JobStage;
  stage_description: string;
  progress_percent?: number | null; // Honesty: null when not available
  error?: string | null;
  validation_details?: Record<string, string>;
}

export interface RegionVolume {
  id: 'wt' | 'tc' | 'et' | 'ed' | 'ncr';
  name: string;
  fullName: string;
  volume_ml: number;
  voxel_count: number;
  description: string;
  color: string;
  visible: boolean;
  opacity: number;
}

export interface IntegrityCheckItem {
  id: string;
  category: 'input' | 'spatial' | 'output' | 'evaluation';
  label: string;
  status: 'passed' | 'warning' | 'failed' | 'not_evaluated';
  details: string;
}

export interface EvaluationMetric {
  metric: string;
  value: number;
  ci_lower?: number;
  ci_upper?: number;
  description: string;
}

export interface SegmentationResult {
  job_id: string;
  is_sample_case?: boolean;
  sample_label?: string;
  created_at: string;
  dimensions: [number, number, number];
  voxel_spacing_mm: [number, number, number];
  affine: number[][];
  origin_mm: [number, number, number];
  orientation_codes: string; // e.g. "RAS" or "LPS"
  volumes: {
    wt: RegionVolume;
    tc: RegionVolume;
    et: RegionVolume;
    ed?: RegionVolume;
    ncr?: RegionVolume;
  };
  integrity_checks: IntegrityCheckItem[];
  model_info: {
    name: string;
    version: string;
    license: string;
    architecture: string;
    training_dataset: string;
    training_cases_count: number;
    preprocessing: string;
    provenance_hash?: string;
    known_limitations: string[];
  };
  evaluation_evidence: {
    dataset_name: string;
    held_out_cases_count: number;
    metrics: {
      dice_wt: EvaluationMetric;
      dice_tc: EvaluationMetric;
      dice_et: EvaluationMetric;
      sens_wt: EvaluationMetric;
      sens_tc: EvaluationMetric;
      sens_et: EvaluationMetric;
    };
  };
  reference_comparison?: {
    has_reference: boolean;
    dice_wt?: number;
    dice_tc?: number;
    dice_et?: number;
    notes?: string;
  };
  download_urls: {
    mask_nifti: string;
    report_pdf: string;
    mesh_obj?: string;
  };
}

export interface CoordinatesState {
  // Physical world coordinates in millimetres
  world: [number, number, number];
  // Voxel indices in volume coordinate grid [x, y, z]
  voxel: [number, number, number];
}
