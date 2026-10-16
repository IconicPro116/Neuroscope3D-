import React, { useState, useEffect, useRef } from 'react';
import { JobStage, JobStatusResponse, SegmentationResult, UploadSlotsState } from './types';
import { apiService } from './services/api';
import { SAMPLE_BRATS_CASE } from './utils/sampleData';
import { Header } from './components/layout/Header';
import { AboutModal } from './components/layout/AboutModal';
import { UploadWorkspace } from './components/upload/UploadWorkspace';
import { ProcessingView } from './components/processing/ProcessingView';
import { ResultsPage } from './pages/ResultsPage';

export const App: React.FC = () => {
  // App views: 'upload' | 'processing' | 'results'
  const [currentView, setCurrentView] = useState<'upload' | 'processing' | 'results'>('upload');

  // Backend connectivity state
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  // About modal visibility
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  // Active job and processing pipeline state
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [processingStage, setProcessingStage] = useState<JobStage>('idle');
  const [stageDescription, setStageDescription] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number | null>(null);
  const [processingError, setProcessingError] = useState<string | null>(null);

  // Cached files in case user wants to retry
  const lastSubmittedFiles = useRef<UploadSlotsState | null>(null);

  // Final segmentation result
  const [segmentationResult, setSegmentationResult] = useState<SegmentationResult | null>(null);

  // Polling timer ref
  const pollTimerRef = useRef<number | null>(null);

  // Health check on initial load
  useEffect(() => {
    let isMounted = true;
    const checkConnection = async () => {
      const healthy = await apiService.checkHealth();
      if (isMounted) setIsBackendConnected(healthy);
    };
    checkConnection();
    const interval = window.setInterval(checkConnection, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Cleanup polling timer when unmounting or leaving processing view
  const stopPolling = () => {
    if (pollTimerRef.current !== null) {
      window.clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => stopPolling();
  }, []);

  // Handler: Start segmentation from uploaded files
  const handleStartSegmentation = async (slots: UploadSlotsState) => {
    lastSubmittedFiles.current = slots;
    setProcessingError(null);
    setCurrentView('processing');
    setProcessingStage('receiving_files');
    setStageDescription('Streaming 4 co-registered MRI sequences to inference server...');
    setProgressPercent(null); // Honest: no fake progress percent

    // Check if backend is available
    const healthy = await apiService.checkHealth();
    setIsBackendConnected(healthy);

    if (!healthy) {
      // Backend not running locally
      setProcessingError(
        `Unable to reach AI backend server at ${apiService.getBaseUrl()}. Please ensure the FastAPI server is running with 'uvicorn main:app --reload'. Or, you can explore the Reference Research Case in Demo Mode.`
      );
      setProcessingStage('failed');
      return;
    }

    try {
      if (!slots.t1.file || !slots.t1gd.file || !slots.t2.file || !slots.flair.file) {
        throw new Error('All 4 required MRI modalities must be provided.');
      }

      const job = await apiService.createSegmentationJob({
        t1: slots.t1.file,
        t1gd: slots.t1gd.file,
        t2: slots.t2.file,
        flair: slots.flair.file,
        reference_mask: slots.reference_mask.file,
      });

      setActiveJobId(job.job_id);

      // Start polling backend status
      startJobStatusPolling(job.job_id);
    } catch (err: any) {
      setProcessingStage('failed');
      setProcessingError(err.message || 'Failed to submit segmentation job to backend.');
    }
  };

  // Poll backend job status until complete or failed
  const startJobStatusPolling = (jobId: string) => {
    stopPolling();

    pollTimerRef.current = window.setInterval(async () => {
      try {
        const statusData: JobStatusResponse = await apiService.getJobStatus(jobId);

        setProcessingStage(statusData.stage);
        setStageDescription(statusData.stage_description || '');
        setProgressPercent(statusData.progress_percent ?? null);

        if (statusData.status === 'completed') {
          stopPolling();
          // Fetch final result
          const result = await apiService.getJobResult(jobId);
          setSegmentationResult(result);
          setCurrentView('results');
        } else if (statusData.status === 'failed') {
          stopPolling();
          setProcessingStage('failed');
          setProcessingError(statusData.error || 'Job failed during inference or verification.');
        }
      } catch (err: any) {
        stopPolling();
        setProcessingStage('failed');
        setProcessingError(err.message || 'Lost connection to backend while processing job.');
      }
    }, 1500);
  };

  // Handler: Load verified Reference BraTS Case
  const handleLoadSampleCase = () => {
    stopPolling();
    setProcessingError(null);
    setSegmentationResult(SAMPLE_BRATS_CASE);
    setCurrentView('results');
  };

  // Handler: Start new case / reset session
  const handleStartNewCase = () => {
    stopPolling();
    if (activeJobId && !segmentationResult?.is_sample_case) {
      apiService.deleteJob(activeJobId);
    }
    setActiveJobId(null);
    setSegmentationResult(null);
    setProcessingError(null);
    setProcessingStage('idle');
    lastSubmittedFiles.current = null;
    setCurrentView('upload');
  };

  // Handler: Retry segmentation with last submitted files
  const handleRetryProcessing = () => {
    if (lastSubmittedFiles.current) {
      handleStartSegmentation(lastSubmittedFiles.current);
    } else {
      setCurrentView('upload');
    }
  };

  return (
    <div className="min-h-screen bg-neuro-950 text-slate-100 flex flex-col font-sans">
      {/* Header bar */}
      <Header
        onOpenAbout={() => setIsAboutOpen(true)}
        isBackendConnected={isBackendConnected}
        isSampleMode={segmentationResult?.is_sample_case}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentView === 'upload' && (
          <UploadWorkspace
            onStartSegmentation={handleStartSegmentation}
            onLoadSampleCase={handleLoadSampleCase}
            isBackendConnected={isBackendConnected}
          />
        )}

        {currentView === 'processing' && (
          <ProcessingView
            stage={processingStage}
            stageDescription={stageDescription}
            progressPercent={progressPercent}
            error={processingError}
            onRetry={handleRetryProcessing}
            onCancel={() => {
              stopPolling();
              setCurrentView('upload');
            }}
          />
        )}

        {currentView === 'results' && segmentationResult && (
          <ResultsPage
            result={segmentationResult}
            onStartNewCase={handleStartNewCase}
            isBackendConnected={isBackendConnected}
          />
        )}
      </main>

      {/* About & Limitations Modal */}
      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />
    </div>
  );
};

export default App;
