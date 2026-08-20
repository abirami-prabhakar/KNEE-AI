import { PredictResponse, SampleStudy } from '../types';

export const SAMPLE_STUDIES: SampleStudy[] = [
  {
    id: 'MR_KNEE_ACL_TEAR_001',
    name: 'MR_KNEE_ACL_TEAR_001 (Complete ACL Tear & Lateral Contusion)',
    patientId: 'PT-89421-K',
    patientAge: '27Y',
    patientSex: 'M',
    studyDate: '2026-08-14',
    sequence: 'SAG T2 FSE FS (Fat-Suppressed)',
    fieldStrength: '3.0 Tesla (Siemens MAGNETOM)',
    numSlices: 24,
    sliceThickness: '3.0 mm',
    primaryPathology: 'ACL injury',
    description: 'High-energy pivoting sports injury. Suspected acute anterior cruciate ligament rupture with pivot-shift bone marrow edema.',
  },
  {
    id: 'MR_KNEE_MENISCUS_002',
    name: 'MR_KNEE_MENISCUS_002 (Medial Meniscus Posterior Horn Tear)',
    patientId: 'PT-63109-M',
    patientAge: '43Y',
    patientSex: 'F',
    studyDate: '2026-08-18',
    sequence: 'SAG PD FSE / COR T2 FS',
    fieldStrength: '3.0 Tesla (GE SIGNA Premier)',
    numSlices: 24,
    sliceThickness: '3.0 mm',
    primaryPathology: 'Medial meniscus tear',
    description: 'Mechanical joint line clicking and localized medial tenderness. Complex tear extending to inferior articular surface.',
  },
  {
    id: 'MR_KNEE_LATERAL_003',
    name: 'MR_KNEE_LATERAL_003 (Lateral Meniscus & Osteochondral Defect)',
    patientId: 'PT-41278-L',
    patientAge: '35Y',
    patientSex: 'M',
    studyDate: '2026-08-19',
    sequence: 'SAG T2 FSE / AX T1',
    fieldStrength: '3.0 Tesla (Philips Ingenia)',
    numSlices: 24,
    sliceThickness: '3.0 mm',
    primaryPathology: 'Lateral meniscus tear',
    description: 'Lateral joint pain, locking episode during marathon training with focal femoral condyle cartilage fissuring.',
  },
  {
    id: 'MR_KNEE_EFFUSION_004',
    name: 'MR_KNEE_EFFUSION_004 (Large Joint Effusion & Popliteal Cyst)',
    patientId: 'PT-90455-E',
    patientAge: '56Y',
    patientSex: 'F',
    studyDate: '2026-08-12',
    sequence: 'SAG T2 FSE FS / COR STIR',
    fieldStrength: '1.5 Tesla (Siemens Sola)',
    numSlices: 24,
    sliceThickness: '3.5 mm',
    primaryPathology: 'Joint effusion',
    description: 'Tense suprapatellar fullness and posterior popliteal tightness with voluminous Baker cyst.',
  },
  {
    id: 'MR_KNEE_MULTILIG_005',
    name: 'MR_KNEE_MULTILIG_005 (Complex ACL + MCL Grade III Tear)',
    patientId: 'PT-77312-C',
    patientAge: '31Y',
    patientSex: 'M',
    studyDate: '2026-08-17',
    sequence: 'SAG T2 FSE FS / COR PD FS',
    fieldStrength: '3.0 Tesla (Siemens MAGNETOM)',
    numSlices: 24,
    sliceThickness: '3.0 mm',
    primaryPathology: 'ACL injury',
    description: 'High-speed motor vehicle collision. Severe valgus stress injury with medial collateral ligament disruption.',
  },
  {
    id: 'MR_KNEE_NORMAL_006',
    name: 'MR_KNEE_NORMAL_006 (Negative / Normal Joint Morphology)',
    patientId: 'PT-10024-N',
    patientAge: '22Y',
    patientSex: 'F',
    studyDate: '2026-08-15',
    sequence: 'SAG T2 FSE FS',
    fieldStrength: '3.0 Tesla (GE Architect)',
    numSlices: 24,
    sliceThickness: '3.0 mm',
    primaryPathology: 'None',
    description: 'Baseline pre-draft athletic screening. Intact cruciate ligaments, symmetric menisci, preserved articular cartilage.',
  },
];

// Helper to draw realistic Knee MRI Sagittal slice on an offscreen HTML5 canvas
function generateSliceCanvas(sliceIdx: number, totalSlices: number, pathologyCase: string): HTMLCanvasElement {
  const width = 512;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Background - Dark MRI gradient and noise
  ctx.fillStyle = '#06080c';
  ctx.fillRect(0, 0, width, height);

  // Add subtle MRI background field noise / scanner grain
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 8;
    data[i] = Math.max(0, Math.min(255, data[i] + noise));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
  }
  ctx.putImageData(imgData, 0, 0);

  // Calculate slice position along lateral-to-medial progression (0 = extreme lateral, 12 = intercondylar notch, 23 = extreme medial)
  const normSlice = sliceIdx / (totalSlices - 1); // 0.0 to 1.0
  const isNotch = Math.abs(sliceIdx - 12) <= 4; // Cruciate ligaments (ACL/PCL) are in intercondylar notch (slices 9-16)
  const isMedial = sliceIdx <= 9; // Medial compartment
  const isLateral = sliceIdx >= 14; // Lateral compartment

  // 1. Surrounding Subcutaneous Fat & Muscle contour
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(256, 260, 200 - Math.abs(sliceIdx - 12) * 2, 230, 0, 0, Math.PI * 2);
  const muscleGrad = ctx.createRadialGradient(256, 260, 40, 256, 260, 220);
  muscleGrad.addColorStop(0, '#222831');
  muscleGrad.addColorStop(0.6, '#181e26');
  muscleGrad.addColorStop(0.9, '#303844'); // Subcutaneous fat high signal
  muscleGrad.addColorStop(1, '#0e1218');
  ctx.fillStyle = muscleGrad;
  ctx.fill();
  ctx.restore();

  // 2. Femoral Condyle (Upper Bone)
  ctx.save();
  ctx.beginPath();
  const femurX = 240 + (sliceIdx - 12) * 2;
  const femurY = 170;
  const femurR = 90 - Math.abs(sliceIdx - 12) * 2.2;
  ctx.arc(femurX, femurY, Math.max(30, femurR), Math.PI * 0.8, Math.PI * 2.2);
  ctx.lineTo(femurX - 50, 40);
  ctx.lineTo(femurX + 50, 40);
  ctx.closePath();

  // Femur bone marrow gradient
  const femurGrad = ctx.createRadialGradient(femurX, femurY - 20, 15, femurX, femurY, femurR);
  // If bone contusion pathology and in lateral compartment / notch
  const hasFemurContusion = (pathologyCase.includes('ACL') || pathologyCase.includes('EFFUSION') || pathologyCase.includes('MULTILIG')) && sliceIdx >= 8 && sliceIdx <= 15;
  if (hasFemurContusion) {
    femurGrad.addColorStop(0, '#757c88');
    femurGrad.addColorStop(0.4, '#a0aab8'); // Bright hyperintense edema signal in T2 FS!
    femurGrad.addColorStop(0.8, '#4a515c');
    femurGrad.addColorStop(1, '#1e222a'); // Dark cortical bone rim
  } else {
    femurGrad.addColorStop(0, '#424853');
    femurGrad.addColorStop(0.7, '#2b3038');
    femurGrad.addColorStop(1, '#111419'); // Cortical bone rim
  }
  ctx.fillStyle = femurGrad;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#181b20';
  ctx.stroke();
  ctx.restore();

  // 3. Tibial Plateau (Lower Bone)
  ctx.save();
  ctx.beginPath();
  const tibiaX = 245 + (sliceIdx - 12) * 1.5;
  const tibiaY = 360;
  ctx.moveTo(tibiaX - 90, tibiaY - 40);
  ctx.quadraticCurveTo(tibiaX, tibiaY - 35, tibiaX + 90, tibiaY - 40);
  ctx.lineTo(tibiaX + 65, 480);
  ctx.lineTo(tibiaX - 65, 480);
  ctx.closePath();

  const tibiaGrad = ctx.createRadialGradient(tibiaX, tibiaY + 30, 20, tibiaX, tibiaY, 110);
  const hasTibiaContusion = (pathologyCase.includes('ACL') || pathologyCase.includes('MULTILIG')) && sliceIdx >= 10 && sliceIdx <= 16;
  if (hasTibiaContusion) {
    tibiaGrad.addColorStop(0, '#6d7582');
    tibiaGrad.addColorStop(0.5, '#9aa5b4'); // High signal T2 marrow edema
    tibiaGrad.addColorStop(0.9, '#383e47');
    tibiaGrad.addColorStop(1, '#13161a');
  } else {
    tibiaGrad.addColorStop(0, '#3e444e');
    tibiaGrad.addColorStop(0.7, '#262a30');
    tibiaGrad.addColorStop(1, '#101316');
  }
  ctx.fillStyle = tibiaGrad;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#15181c';
  ctx.stroke();
  ctx.restore();

  // 4. Patella (Kneecap) & Patellar Tendon (Anterior side on middle/anterior slices)
  if (sliceIdx >= 8 && sliceIdx <= 18) {
    ctx.save();
    // Patella
    ctx.beginPath();
    const patellaX = 390;
    const patellaY = 180;
    ctx.ellipse(patellaX, patellaY, 28, 48, 0.2, 0, Math.PI * 2);
    const patellaGrad = ctx.createRadialGradient(patellaX, patellaY, 5, patellaX, patellaY, 35);
    patellaGrad.addColorStop(0, '#4b525d');
    patellaGrad.addColorStop(0.8, '#2d333b');
    patellaGrad.addColorStop(1, '#14171a');
    ctx.fillStyle = patellaGrad;
    ctx.fill();
    ctx.strokeStyle = '#181c20';
    ctx.stroke();

    // Patellar Tendon (connecting patella to tibial tuberosity)
    ctx.beginPath();
    ctx.moveTo(380, 225);
    ctx.quadraticCurveTo(370, 290, 325, 345);
    ctx.lineWidth = 9;
    if (pathologyCase.includes('PATELLAR') || (pathologyCase.includes('MULTILIG') && sliceIdx >= 11 && sliceIdx <= 15)) {
      ctx.strokeStyle = '#727a86'; // Hyperintense tendon edema
    } else {
      ctx.strokeStyle = '#1c1f24'; // Normal low signal tendon
    }
    ctx.stroke();

    // Quadriceps tendon (superior)
    ctx.beginPath();
    ctx.moveTo(385, 135);
    ctx.quadraticCurveTo(375, 90, 340, 45);
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#1d2127';
    ctx.stroke();
    ctx.restore();
  }

  // 5. Joint Fluid / Synovial Effusion in Suprapatellar Pouch
  const hasEffusion = pathologyCase.includes('EFFUSION') || pathologyCase.includes('ACL') || pathologyCase.includes('MULTILIG');
  if (hasEffusion && sliceIdx >= 4 && sliceIdx <= 20) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(350, 140);
    ctx.quadraticCurveTo(340, 100, 300, 110);
    ctx.quadraticCurveTo(320, 150, 345, 160);
    ctx.closePath();
    ctx.fillStyle = '#b0bac7'; // Very bright high-signal T2 fluid!
    ctx.globalAlpha = 0.85;
    ctx.fill();
    ctx.restore();
  }

  // 6. Articular Cartilage on Femur & Tibia
  ctx.save();
  ctx.beginPath();
  ctx.arc(femurX, femurY, femurR + 3, Math.PI * 0.45, Math.PI * 0.95);
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#687280'; // Intermediate gray cartilage
  ctx.stroke();

  // Osteochondral defect fissure if LATERAL case
  if (pathologyCase.includes('LATERAL') && sliceIdx >= 11 && sliceIdx <= 15) {
    ctx.beginPath();
    ctx.arc(femurX + 15, femurY + femurR - 2, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#c5cfdc'; // High T2 signal fluid filling defect
    ctx.fill();
  }
  ctx.restore();

  // 7. Cruciate Ligaments (ACL & PCL) in Intercondylar Notch (Slices 9–16)
  if (isNotch) {
    ctx.save();
    const isAclTorn = pathologyCase.includes('ACL') || pathologyCase.includes('MULTILIG');
    
    // ACL (Anterior Cruciate Ligament) runs obliquely from posterosuperior to anteroinferior
    if (sliceIdx >= 10 && sliceIdx <= 17) {
      ctx.beginPath();
      if (isAclTorn) {
        // Disrupted, wavy, high-signal mass of edema in mid-substance
        ctx.moveTo(215, 230);
        ctx.quadraticCurveTo(240, 270, 260, 260);
        ctx.lineWidth = 14;
        ctx.strokeStyle = '#9ca6b5'; // Hyperintense fluid/hemorrhage replaces dark taught fibers
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(245, 265, 12, 0, Math.PI * 2);
        ctx.fillStyle = '#b3bdcd';
        ctx.fill();
      } else {
        // Intact, taught, low-signal (black) ACL band
        ctx.moveTo(210, 220);
        ctx.lineTo(285, 315);
        ctx.lineWidth = 8;
        ctx.strokeStyle = '#121417';
        ctx.stroke();
      }
    }

    // PCL (Posterior Cruciate Ligament) - robust dark hockey-stick band
    if (sliceIdx >= 9 && sliceIdx <= 14) {
      ctx.beginPath();
      ctx.moveTo(270, 210);
      ctx.quadraticCurveTo(210, 240, 230, 325);
      ctx.lineWidth = 9;
      ctx.strokeStyle = '#131518';
      ctx.stroke();
    }
    ctx.restore();
  }

  // 8. Menisci (Anterior and Posterior Horns) - Characteristic Dark Bow-Tie / Triangles
  if (isMedial || isLateral) {
    ctx.save();
    // Anterior Horn
    const antX = 315;
    const antY = 310;
    ctx.beginPath();
    ctx.moveTo(antX, antY);
    ctx.lineTo(antX + 22, antY + 12);
    ctx.lineTo(antX, antY + 18);
    ctx.closePath();
    ctx.fillStyle = '#101215';
    ctx.fill();

    // Posterior Horn (High risk for tears)
    const postX = 175;
    const postY = 310;
    ctx.beginPath();
    ctx.moveTo(postX, postY);
    ctx.lineTo(postX - 26, postY + 14);
    ctx.lineTo(postX, postY + 20);
    ctx.closePath();

    const isMedialTorn = (pathologyCase.includes('MENISCUS') || pathologyCase.includes('ACL')) && sliceIdx >= 6 && sliceIdx <= 12;
    const isLateralTorn = pathologyCase.includes('LATERAL') && sliceIdx >= 14 && sliceIdx <= 20;

    if ((isMedial && isMedialTorn) || (isLateral && isLateralTorn)) {
      ctx.fillStyle = '#181b20';
      ctx.fill();
      // Linear hyperintensity contacting articular margin (Grade 3 tear)
      ctx.beginPath();
      ctx.moveTo(postX - 8, postY + 2);
      ctx.lineTo(postX - 18, postY + 16);
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#a8b3c2'; // High T2 signal tear cleft
      ctx.stroke();
    } else {
      ctx.fillStyle = '#101215';
      ctx.fill();
    }
    ctx.restore();
  }

  // 9. Popliteal Cyst (Baker's Cyst) in posterior medial compartment
  if (pathologyCase.includes('EFFUSION') && sliceIdx >= 16 && sliceIdx <= 22) {
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(120, 270, 24, 45, -0.3, 0, Math.PI * 2);
    ctx.fillStyle = '#a9b4c4';
    ctx.globalAlpha = 0.9;
    ctx.fill();
    ctx.restore();
  }

  // Subtle DICOM grid overlay watermark
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
  ctx.lineWidth = 1;
  ctx.strokeRect(16, 16, width - 32, height - 32);

  return canvas;
}

// Generate Grad-CAM Attention Heatmap overlay canvas
function generateHeatmapCanvas(
  rawCanvas: HTMLCanvasElement,
  sliceIdx: number,
  pathology: string,
  evidenceRange: [number, number],
  confidence: number
): HTMLCanvasElement {
  const width = rawCanvas.width;
  const height = rawCanvas.height;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // First draw the raw slice underneath
  ctx.drawImage(rawCanvas, 0, 0);

  // Check if this slice is within the evidence range
  const [start, end] = evidenceRange;
  const inRange = sliceIdx >= start && sliceIdx <= end && confidence >= 0.20;

  if (!inRange) {
    // If no attention, return raw slice (the caller will recognize or show message)
    return canvas;
  }

  // Calculate slice-specific intensity factor (peak in middle of evidence range)
  const rangeMid = (start + end) / 2;
  const rangeSpan = Math.max(1, (end - start) / 2);
  const distFromMid = Math.abs(sliceIdx - rangeMid) / rangeSpan;
  const sliceIntensity = Math.max(0.15, Math.cos((distFromMid * Math.PI) / 2) * confidence);

  // Define lesion coordinates based on pathology
  let focalX = 250;
  let focalY = 265;
  let radius = 65;

  if (pathology.includes('ACL')) {
    focalX = 245;
    focalY = 265;
    radius = 55;
  } else if (pathology.includes('Medial meniscus')) {
    focalX = 175;
    focalY = 312;
    radius = 45;
  } else if (pathology.includes('Lateral meniscus')) {
    focalX = 180;
    focalY = 310;
    radius = 45;
  } else if (pathology.includes('Bone contusion')) {
    focalX = 240;
    focalY = 210;
    radius = 70;
  } else if (pathology.includes('Joint effusion')) {
    focalX = 330;
    focalY = 135;
    radius = 75;
  } else if (pathology.includes('MCL')) {
    focalX = 120;
    focalY = 280;
    radius = 50;
  } else if (pathology.includes('LCL')) {
    focalX = 380;
    focalY = 290;
    radius = 50;
  } else if (pathology.includes('PCL')) {
    focalX = 240;
    focalY = 250;
    radius = 50;
  } else if (pathology.includes('Patellar tendinitis')) {
    focalX = 360;
    focalY = 260;
    radius = 45;
  } else if (pathology.includes('Quadriceps')) {
    focalX = 370;
    focalY = 110;
    radius = 45;
  } else if (pathology.includes('Osteochondral')) {
    focalX = 250;
    focalY = 260;
    radius = 40;
  } else if (pathology.includes('Popliteal')) {
    focalX = 125;
    focalY = 270;
    radius = 60;
  }

  // Draw smooth Grad-CAM Attention Heatmap
  ctx.save();
  ctx.globalCompositeOperation = 'screen';

  // Multi-tier radial gradient (Deep violet to orchid to cyan/yellow core)
  const grad = ctx.createRadialGradient(focalX, focalY, 0, focalX, focalY, radius);
  grad.addColorStop(0, `rgba(235, 100, 255, ${0.9 * sliceIntensity})`);
  grad.addColorStop(0.25, `rgba(168, 85, 247, ${0.8 * sliceIntensity})`);
  grad.addColorStop(0.55, `rgba(124, 58, 237, ${0.65 * sliceIntensity})`);
  grad.addColorStop(0.85, `rgba(76, 29, 149, ${0.3 * sliceIntensity})`);
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(focalX, focalY, radius, 0, Math.PI * 2);
  ctx.fill();

  // Add sharp contour ring for high confidence lesions
  if (confidence >= 0.70 && sliceIntensity >= 0.5) {
    ctx.beginPath();
    ctx.arc(focalX, focalY, radius * 0.45, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 220, 255, ${0.7 * sliceIntensity})`;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
  }

  ctx.restore();

  return canvas;
}

// Generate the complete PredictResponse object for a sample study or uploaded file
export function generateSynthesizedPredictResponse(sampleId: string = 'MR_KNEE_ACL_TEAR_001', threshold: number = 0.5): PredictResponse {
  const sample = SAMPLE_STUDIES.find((s) => s.id === sampleId) || SAMPLE_STUDIES[0];
  const numSlices = sample.numSlices;

  // Generate 12 clinical findings and evidence ranges according to the case
  let findings: Record<string, number> = {};
  let evidenceRanges: Record<string, [number, number]> = {
    'ACL injury': [10, 18],
    'Medial meniscus tear': [6, 12],
    'Bone contusion': [8, 15],
    'Joint effusion': [4, 20],
    'Lateral meniscus tear': [14, 20],
    'MCL injury': [1, 5],
    'LCL injury': [19, 23],
    'PCL injury': [9, 13],
    'Patellar tendinitis': [11, 16],
    'Quadriceps tendinitis': [10, 14],
    'Osteochondral defect': [11, 15],
    "Popliteal cyst (Baker's)": [16, 22],
  };

  let narrativeText = '';

  if (sample.id === 'MR_KNEE_ACL_TEAR_001') {
    findings = {
      'ACL injury': 0.91,
      'Medial meniscus tear': 0.74,
      'Bone contusion': 0.68,
      'Joint effusion': 0.52,
      'Lateral meniscus tear': 0.31,
      'MCL injury': 0.18,
      'LCL injury': 0.12,
      'PCL injury': 0.08,
      'Patellar tendinitis': 0.07,
      'Quadriceps tendinitis': 0.05,
      'Osteochondral defect': 0.04,
      "Popliteal cyst (Baker's)": 0.03,
    };
    narrativeText =
      'Sagittal T2-weighted MRI demonstrates complete disruption of the anterior cruciate ligament fibers in the mid-substance with hyperintense fluid signal and non-visualization of intact fibers across slices 10–18. Associated pivot-shift kissing bone marrow contusion pattern localized to the posterior lateral tibial plateau and lateral femoral condyle (slices 8–15). Concurrent grade 3 oblique tear of the posterior horn of the medial meniscus (slices 6–12) and moderate joint effusion.';
  } else if (sample.id === 'MR_KNEE_MENISCUS_002') {
    findings = {
      'Medial meniscus tear': 0.94,
      'Joint effusion': 0.62,
      'Osteochondral defect': 0.45,
      'Bone contusion': 0.32,
      'ACL injury': 0.14,
      'Lateral meniscus tear': 0.11,
      "Popliteal cyst (Baker's)": 0.09,
      'MCL injury': 0.08,
      'Patellar tendinitis': 0.06,
      'PCL injury': 0.04,
      'LCL injury': 0.03,
      'Quadriceps tendinitis': 0.02,
    };
    narrativeText =
      'Sagittal and coronal sequences demonstrate a complex tear involving the posterior horn and body of the medial meniscus extending to the inferior articular surface (slices 6–12). Mild adjacent chondral thinning along the weight-bearing medial femoral condyle. Moderate reactive joint effusion.';
  } else if (sample.id === 'MR_KNEE_LATERAL_003') {
    findings = {
      'Lateral meniscus tear': 0.88,
      'Osteochondral defect': 0.72,
      'Joint effusion': 0.48,
      'Bone contusion': 0.29,
      'Patellar tendinitis': 0.21,
      'LCL injury': 0.15,
      'ACL injury': 0.12,
      'Medial meniscus tear': 0.09,
      "Popliteal cyst (Baker's)": 0.06,
      'PCL injury': 0.05,
      'MCL injury': 0.04,
      'Quadriceps tendinitis': 0.03,
    };
    narrativeText =
      'Focal radial tear through the anterior-to-middle junction of the lateral meniscus (slices 14–20). Coexisting grade III full-thickness focal cartilage fissure and subchondral microcyst along the lateral femoral condyle (slices 11–15). Mild reactive synovitis.';
  } else if (sample.id === 'MR_KNEE_EFFUSION_004') {
    findings = {
      'Joint effusion': 0.96,
      "Popliteal cyst (Baker's)": 0.87,
      'Medial meniscus tear': 0.44,
      'Bone contusion': 0.22,
      'Patellar tendinitis': 0.19,
      'MCL injury': 0.11,
      'ACL injury': 0.09,
      'Lateral meniscus tear': 0.07,
      'Osteochondral defect': 0.06,
      'Quadriceps tendinitis': 0.05,
      'PCL injury': 0.03,
      'LCL injury': 0.02,
    };
    narrativeText =
      'Marked distention of the suprapatellar bursal pouch with voluminous high-signal T2 fluid effusion (slices 4–20). Well-defined, lobulated fluid collection tracking between the medial head of gastrocnemius and semimembranosus tendon consistent with a prominent Baker cyst measuring 4.2 cm (slices 16–22).';
  } else if (sample.id === 'MR_KNEE_MULTILIG_005') {
    findings = {
      'ACL injury': 0.95,
      'MCL injury': 0.89,
      'Bone contusion': 0.84,
      'Joint effusion': 0.78,
      'Medial meniscus tear': 0.69,
      'PCL injury': 0.38,
      'Lateral meniscus tear': 0.24,
      'Patellar tendinitis': 0.18,
      'LCL injury': 0.14,
      'Osteochondral defect': 0.12,
      "Popliteal cyst (Baker's)": 0.08,
      'Quadriceps tendinitis': 0.06,
    };
    narrativeText =
      'High-grade complex multi-ligamentous knee disruption. Complete rupture of the mid-substance ACL (slices 10–18) accompanied by grade III diffuse tear and edema of the superficial and deep medial collateral ligament fibers (slices 1–5). Extensive kissing marrow contusion of the lateral compartment and large hemarthrosis.';
  } else {
    // Normal / Control
    findings = {
      'Joint effusion': 0.14,
      'Patellar tendinitis': 0.09,
      'ACL injury': 0.06,
      'Medial meniscus tear': 0.05,
      'Lateral meniscus tear': 0.04,
      'Bone contusion': 0.03,
      'MCL injury': 0.03,
      'LCL injury': 0.02,
      'PCL injury': 0.02,
      'Osteochondral defect': 0.01,
      "Popliteal cyst (Baker's)": 0.01,
      'Quadriceps tendinitis': 0.01,
    };
    narrativeText =
      'Intact anterior and posterior cruciate ligaments with normal low-signal taut fiber trajectories. Medial and lateral menisci demonstrate normal morphology and triangular low signal without surface-extending tears. Normal articular cartilage thickness, no bone marrow contusion or significant joint effusion.';
  }

  // Generate slice images and heatmaps
  const sliceCanvasList: HTMLCanvasElement[] = [];
  const slices: string[] = [];
  const heatmaps: Record<string, string[]> = {};

  // Initialize heatmap arrays
  for (const pathology of Object.keys(findings)) {
    heatmaps[pathology] = [];
  }

  // Render raw slices
  for (let i = 0; i < numSlices; i++) {
    const rawCanvas = generateSliceCanvas(i, numSlices, sample.id);
    sliceCanvasList.push(rawCanvas);
    slices.push(rawCanvas.toDataURL('image/png'));
  }

  // Render heatmaps for each pathology
  for (const [pathology, conf] of Object.entries(findings)) {
    const range = evidenceRanges[pathology] || [10, 18];
    for (let i = 0; i < numSlices; i++) {
      const rawCanvas = sliceCanvasList[i];
      const heatmapCanvas = generateHeatmapCanvas(rawCanvas, i, pathology, range, conf);
      // If outside range, we can provide raw or empty string according to contract
      if (i >= range[0] && i <= range[1] && conf >= 0.20) {
        heatmaps[pathology].push(heatmapCanvas.toDataURL('image/png'));
      } else {
        heatmaps[pathology].push(''); // Empty string signals no significant attention on slice
      }
    }
  }

  // Classify high vs low confidence summary
  const high_confidence: string[] = [];
  const low_confidence: string[] = [];

  for (const [pathology, prob] of Object.entries(findings)) {
    const percentStr = `${pathology} (${(prob * 100).toFixed(1)}%)`;
    if (prob >= threshold) {
      high_confidence.push(percentStr);
    } else if (prob >= 0.20) {
      low_confidence.push(percentStr);
    }
  }

  return {
    num_slices: numSlices,
    slices,
    heatmaps,
    findings,
    evidence_ranges: evidenceRanges,
    summary: {
      high_confidence,
      low_confidence,
      text: narrativeText,
      disclaimer: '⚠️ AI-assisted output for research/prototype purposes. Not a medical diagnosis.',
    },
    metadata: {
      patient_id: sample.patientId,
      series: sample.sequence,
      study_date: sample.studyDate,
      matrix: '512 x 512',
      tr_te: 'TR: 2850 ms / TE: 85 ms',
      slice_thickness: sample.sliceThickness,
    },
  };
}
