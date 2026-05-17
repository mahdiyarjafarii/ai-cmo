import { StepEvent, StepStatus } from "../types/index.js";

export interface StreamMessage {
  type: "progress" | "error" | "complete" | "step";
  message: string;
  timestamp: string;
  id?: string;
  status?: StepStatus;
  detail?: string;
  data?: Record<string, unknown>;
}

export interface StreamingAnalysis {
  id: string;
  listeners: Set<(message: StreamMessage) => void>;
  isComplete: boolean;
  error: string | null;
}

class AnalysisStreamManager {
  private analyses = new Map<string, StreamingAnalysis>();

  createAnalysis(id: string): StreamingAnalysis {
    const analysis: StreamingAnalysis = {
      id,
      listeners: new Set(),
      isComplete: false,
      error: null,
    };
    this.analyses.set(id, analysis);
    return analysis;
  }

  getAnalysis(id: string): StreamingAnalysis | undefined {
    return this.analyses.get(id);
  }

  subscribe(
    id: string,
    listener: (message: StreamMessage) => void
  ): () => void {
    const analysis = this.analyses.get(id);
    if (!analysis) {
      return () => {};
    }

    analysis.listeners.add(listener);

    return () => {
      analysis.listeners.delete(listener);
    };
  }

  emit(id: string, message: StreamMessage): void {
    const analysis = this.analyses.get(id);
    if (!analysis) {
      return;
    }

    analysis.listeners.forEach((listener) => {
      try {
        listener(message);
      } catch (error) {
        console.error("Error in stream listener:", error);
      }
    });
  }

  complete(id: string, withError?: string): void {
    const analysis = this.analyses.get(id);
    if (!analysis) {
      return;
    }

    analysis.isComplete = true;
    if (withError) {
      analysis.error = withError;
    }
  }

  isComplete(id: string): boolean {
    return this.analyses.get(id)?.isComplete ?? false;
  }

  clear(id: string): void {
    this.analyses.delete(id);
  }
}

export const streamManager = new AnalysisStreamManager();

export function emitProgress(analysisId: string, message: string): void {
  streamManager.emit(analysisId, {
    type: "progress",
    message,
    timestamp: new Date().toISOString(),
  });
}

export function emitError(analysisId: string, message: string): void {
  streamManager.emit(analysisId, {
    type: "error",
    message,
    timestamp: new Date().toISOString(),
  });
}

export function emitComplete(
  analysisId: string,
  data?: Record<string, unknown>
): void {
  streamManager.emit(analysisId, {
    type: "complete",
    message: "Analysis completed",
    timestamp: new Date().toISOString(),
    data,
  });
}

export function emitStep(
  analysisId: string,
  step: { id: string; message: string; status: StepStatus; detail?: string }
): void {
  streamManager.emit(analysisId, {
    type: "step",
    id: step.id,
    message: step.message,
    status: step.status,
    detail: step.detail,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Creates a step emitter bound to a specific analysisId.
 * Returns a function that can be called with step updates.
 */
export type StepEmitter = (
  id: string,
  message: string,
  status: StepStatus,
  detail?: string
) => void;

export function createStepEmitter(analysisId: string): StepEmitter {
  return (id, message, status, detail) => {
    emitStep(analysisId, { id, message, status, detail });
  };
}

export type { StepEvent };
