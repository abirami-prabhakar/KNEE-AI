import { PredictResponse, SampleStudy } from '../types';
import { generateSynthesizedPredictResponse, SAMPLE_STUDIES } from './mriGenerator';

export const DEFAULT_API_BASE_URL = 'http://localhost:8000';

export interface PredictPayload {
  sample_id?: string;
  file?: File;
  confidence_threshold: number;
}

export async function fetchSamples(apiBaseUrl: string = DEFAULT_API_BASE_URL): Promise<{ samples: SampleStudy[]; isLive: boolean }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const response = await fetch(`${apiBaseUrl}/api/samples`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      // If API returns array of strings or simple objects, normalize to SampleStudy
      if (Array.isArray(data)) {
        const normalized: SampleStudy[] = data.map((item, idx) => {
          if (typeof item === 'string') {
            const existing = SAMPLE_STUDIES.find((s) => s.id === item);
            if (existing) return existing;
            return {
              id: item,
              name: item,
              patientId: `PT-${1000 + idx}`,
              patientAge: '35Y',
              patientSex: idx % 2 === 0 ? 'M' : 'F',
              studyDate: new Date().toISOString().split('T')[0],
              sequence: 'SAG T2 FSE',
              fieldStrength: '3.0 Tesla',
              numSlices: 24,
              sliceThickness: '3.0 mm',
              primaryPathology: item.includes('ACL') ? 'ACL injury' : 'Medial meniscus tear',
              description: `DICOM study from server: ${item}`,
            };
          }
          return item;
        });
        return { samples: normalized.length > 0 ? normalized : SAMPLE_STUDIES, isLive: true };
      }
    }
  } catch {
    // Backend offline / timed out; using client clinical engine
  }

  return { samples: SAMPLE_STUDIES, isLive: false };
}

export async function fetchPredict(
  payload: PredictPayload,
  apiBaseUrl: string = DEFAULT_API_BASE_URL
): Promise<{ data: PredictResponse; isLive: boolean; error?: string }> {
  try {
    const formData = new FormData();
    if (payload.sample_id) {
      formData.append('sample_id', payload.sample_id);
    }
    if (payload.file) {
      formData.append('file', payload.file);
    }
    formData.append('confidence_threshold', payload.confidence_threshold.toString());

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(`${apiBaseUrl}/api/predict`, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const json: PredictResponse = await response.json();
      return { data: json, isLive: true };
    } else {
      const errorText = await response.text();
      console.warn(`Server responded with ${response.status}: ${errorText}. Falling back to clinical simulator.`);
    }
  } catch (err) {
    console.info('Backend unreachable, generating diagnostic predictions via clinical MRI engine.', err);
  }

  // Graceful fallback to client clinical MRI procedural synthesizer
  const sampleId = payload.sample_id || 'MR_KNEE_ACL_TEAR_001';
  const synthesized = generateSynthesizedPredictResponse(sampleId, payload.confidence_threshold);
  return { data: synthesized, isLive: false };
}

export async function testBackendConnection(apiBaseUrl: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${apiBaseUrl}/api/samples`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return res.ok;
  } catch {
    return false;
  }
}
