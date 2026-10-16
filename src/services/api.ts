import { JobStatusResponse, SegmentationResult } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface CreateJobPayload {
  t1: File;
  t1gd: File;
  t2: File;
  flair: File;
  reference_mask?: File | null;
}

export class ApiError extends Error {
  status?: number;
  details?: any;

  constructor(message: string, status?: number, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

/**
 * Service to interact with the Python FastAPI backend
 */
export const apiService = {
  getBaseUrl(): string {
    return API_BASE_URL;
  },

  /**
   * Check if backend service is currently reachable
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(3500)
      });
      return response.ok;
    } catch {
      return false;
    }
  },

  /**
   * Submit 4 MRI modality volumes + optional reference mask to start segmentation
   */
  async createSegmentationJob(payload: CreateJobPayload): Promise<{ job_id: string; status: string }> {
    const formData = new FormData();
    formData.append('t1', payload.t1);
    formData.append('t1gd', payload.t1gd);
    formData.append('t2', payload.t2);
    formData.append('flair', payload.flair);

    if (payload.reference_mask) {
      formData.append('reference_mask', payload.reference_mask);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/jobs`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let errMessage = `Server returned status ${response.status} (${response.statusText})`;
        let errDetails = null;
        try {
          const data = await response.json();
          if (data.detail) {
            errMessage = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
            errDetails = data.detail;
          }
        } catch {
          // non-JSON response
        }
        throw new ApiError(errMessage, response.status, errDetails);
      }

      return await response.json();
    } catch (err: any) {
      if (err instanceof ApiError) throw err;
      throw new ApiError(
        err.message || 'Failed to connect to the backend server. Please verify the backend is running at ' + API_BASE_URL,
        0
      );
    }
  },

  /**
   * Fetch current job processing status and stage
   */
  async getJobStatus(jobId: string): Promise<JobStatusResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/jobs/${encodeURIComponent(jobId)}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });

      if (!response.ok) {
        throw new ApiError(`Failed to fetch job status: ${response.statusText}`, response.status);
      }

      return await response.json();
    } catch (err: any) {
      if (err instanceof ApiError) throw err;
      throw new ApiError(err.message || 'Error communicating with job status endpoint', 0);
    }
  },

  /**
   * Fetch final segmentation results, measurements, spatial verification and model provenance
   */
  async getJobResult(jobId: string): Promise<SegmentationResult> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/jobs/${encodeURIComponent(jobId)}/result`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });

      if (!response.ok) {
        throw new ApiError(`Failed to retrieve segmentation result: ${response.statusText}`, response.status);
      }

      return await response.json();
    } catch (err: any) {
      if (err instanceof ApiError) throw err;
      throw new ApiError(err.message || 'Error retrieving segmentation results', 0);
    }
  },

  /**
   * Download the original-grid segmentation NIfTI (.nii.gz)
   */
  async downloadMask(jobId: string, filename = `neuroscope_${jobId}_seg.nii.gz`): Promise<void> {
    const url = `${API_BASE_URL}/api/jobs/${encodeURIComponent(jobId)}/mask`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new ApiError(`Failed to download mask file (${response.statusText})`, response.status);
    }
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 1000);
  },

  /**
   * Download the clinical research PDF report
   */
  async downloadReport(jobId: string, filename = `neuroscope_${jobId}_report.pdf`): Promise<void> {
    const url = `${API_BASE_URL}/api/jobs/${encodeURIComponent(jobId)}/report`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new ApiError(`Failed to download report PDF (${response.statusText})`, response.status);
    }
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 1000);
  },

  /**
   * Request backend to clean up temporary case files
   */
  async deleteJob(jobId: string): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/api/jobs/${encodeURIComponent(jobId)}`, {
        method: 'DELETE',
      });
    } catch (e) {
      console.warn('Backend cleanup request warning (backend TTL will safely auto-expire):', e);
    }
  }
};
