export interface SampleStudy {
  id: string;
  name: string;
  patientId: string;
  patientAge: string;
  patientSex: string;
  studyDate: string;
  sequence: string;
  fieldStrength: string;
  numSlices: number;
  sliceThickness: string;
  primaryPathology: string;
  description: string;
}

export interface PredictResponse {
  num_slices: number;
  slices: string[]; // base64 PNG data URLs
  heatmaps: Record<string, string[]>; // pathology name -> array of base64 PNG data URLs
  findings: Record<string, number>; // pathology name -> probability (0.0 to 1.0)
  evidence_ranges: Record<string, [number, number]>; // pathology name -> [startSlice, endSlice]
  summary: {
    high_confidence: string[];
    low_confidence: string[];
    text: string;
    disclaimer: string;
  };
  metadata?: {
    patient_id?: string;
    series?: string;
    study_date?: string;
    matrix?: string;
    tr_te?: string;
    slice_thickness?: string;
  };
}

export type ViewMode = 'dual' | 'split' | 'raw_only' | 'heatmap_only' | 'blend';

export type ColorMap = 'violet' | 'inferno' | 'jet';

export interface WindowLevelPreset {
  name: string;
  window: number;
  level: number;
  description: string;
}

export interface Coordinates {
  x: number;
  y: number;
}
