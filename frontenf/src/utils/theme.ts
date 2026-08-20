export interface ConfidenceTier {
  label: 'High' | 'Moderate' | 'Low' | 'Negative';
  bgColor: string;
  borderColor: string;
  textColor: string;
  barColor: string;
  badgeBg: string;
}

/**
 * Returns the exact color tokens based on the specification:
 * - High (≥70%): #7c3aed (Deep Violet)
 * - Moderate (40-69%): #c084fc (Orchid)
 * - Low (20-39%): #a78bfa with 0.2 opacity (Muted Violet-Gray)
 * - Negative (<20%): #21262d (Dark Slate)
 */
export function getConfidenceTier(prob: number): ConfidenceTier {
  if (prob >= 0.70) {
    return {
      label: 'High',
      bgColor: 'rgba(124, 58, 237, 0.18)',
      borderColor: '#7c3aed',
      textColor: '#ffffff',
      barColor: '#7c3aed',
      badgeBg: '#7c3aed',
    };
  } else if (prob >= 0.40) {
    return {
      label: 'Moderate',
      bgColor: 'rgba(192, 132, 252, 0.14)',
      borderColor: '#c084fc',
      textColor: '#f3e8ff',
      barColor: '#c084fc',
      badgeBg: '#9333ea',
    };
  } else if (prob >= 0.20) {
    return {
      label: 'Low',
      bgColor: 'rgba(167, 139, 250, 0.08)',
      borderColor: 'rgba(167, 139, 250, 0.35)',
      textColor: '#ccc3d8',
      barColor: '#a78bfa',
      badgeBg: '#6b21a8',
    };
  } else {
    return {
      label: 'Negative',
      bgColor: '#161b22',
      borderColor: '#30363d',
      textColor: '#8b949e',
      barColor: '#21262d',
      badgeBg: '#21262d',
    };
  }
}
