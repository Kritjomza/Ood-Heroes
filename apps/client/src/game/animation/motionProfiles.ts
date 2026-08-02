export type MotionProfileName = 'light' | 'normal' | 'heavy' | 'jelly' | 'floating' | 'boss';

export type MotionProfile = {
  baseMoveSpeed: number;
  idleBobPixels: number;
  idleScaleAmplitude: number;
  idleDurationMs: number;
  walkBobPixels: number;
  walkScaleAmplitude: number;
  walkTiltDegrees: number;
  walkCyclesPerSecond: number;
};

export const MOTION_PROFILES: Record<MotionProfileName, MotionProfile> = {
  light: { baseMoveSpeed: 125, idleBobPixels: 1.5, idleScaleAmplitude: 0.01, idleDurationMs: 1300, walkBobPixels: 3.5, walkScaleAmplitude: 0.03, walkTiltDegrees: 3.5, walkCyclesPerSecond: 3.6 },
  normal: { baseMoveSpeed: 120, idleBobPixels: 1.5, idleScaleAmplitude: 0.01, idleDurationMs: 1400, walkBobPixels: 3, walkScaleAmplitude: 0.026, walkTiltDegrees: 2.5, walkCyclesPerSecond: 3.2 },
  heavy: { baseMoveSpeed: 100, idleBobPixels: 0.7, idleScaleAmplitude: 0.006, idleDurationMs: 1600, walkBobPixels: 1.6, walkScaleAmplitude: 0.022, walkTiltDegrees: 1.2, walkCyclesPerSecond: 2.4 },
  jelly: { baseMoveSpeed: 112, idleBobPixels: 1.3, idleScaleAmplitude: 0.018, idleDurationMs: 1450, walkBobPixels: 2.8, walkScaleAmplitude: 0.05, walkTiltDegrees: 2, walkCyclesPerSecond: 3 },
  floating: { baseMoveSpeed: 115, idleBobPixels: 2.2, idleScaleAmplitude: 0.004, idleDurationMs: 1700, walkBobPixels: 2.6, walkScaleAmplitude: 0.012, walkTiltDegrees: 1.5, walkCyclesPerSecond: 2.7 },
  boss: { baseMoveSpeed: 70, idleBobPixels: 0.5, idleScaleAmplitude: 0.004, idleDurationMs: 1900, walkBobPixels: 1, walkScaleAmplitude: 0.012, walkTiltDegrees: 0.8, walkCyclesPerSecond: 1.8 },
};
