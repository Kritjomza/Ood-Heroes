import { MOTION_PROFILES, type MotionProfileName } from './motionProfiles';

export { MOTION_PROFILES, type MotionProfileName } from './motionProfiles';
export type HorizontalFacing = 'left' | 'right';
export type MotionMode = 'idle' | 'walking';

export type SingleSpriteMotionState = {
  profile: MotionProfileName;
  facing: HorizontalFacing;
  flipX: boolean;
  mode: MotionMode;
  phaseOffset: number;
  lastMovingAt: number;
  speed: number;
  visualX: number;
  visualY: number;
  scaleX: number;
  scaleY: number;
  angle: number;
  shadowScale: number;
  shadowAlpha: number;
  rootOffsetX: 0;
  rootOffsetY: 0;
};

export type MotionSample = { velocityX: number; velocityY: number; nowMs: number };
export const FACING_VELOCITY_THRESHOLD = 4;
export const MOVEMENT_SPEED_THRESHOLD = 4;
export const IDLE_DELAY_MS = 120;

export function createMotionState(
  profile: MotionProfileName = 'normal',
  facing: HorizontalFacing = 'right',
  phaseOffset = 0,
): SingleSpriteMotionState {
  return {
    profile,
    facing,
    flipX: facing === 'left',
    mode: 'idle',
    phaseOffset,
    lastMovingAt: 0,
    speed: 0,
    visualX: 0,
    visualY: 0,
    scaleX: 1,
    scaleY: 1,
    angle: 0,
    shadowScale: 1,
    shadowAlpha: 0.28,
    rootOffsetX: 0,
    rootOffsetY: 0,
  };
}

export function updateSingleSpriteMotion(
  state: SingleSpriteMotionState,
  sample: MotionSample,
): SingleSpriteMotionState {
  const profile = MOTION_PROFILES[state.profile];
  const speed = Math.hypot(sample.velocityX, sample.velocityY);
  const moving = speed > MOVEMENT_SPEED_THRESHOLD;
  const facing = sample.velocityX > FACING_VELOCITY_THRESHOLD
    ? 'right'
    : sample.velocityX < -FACING_VELOCITY_THRESHOLD
      ? 'left'
      : state.facing;
  const lastMovingAt = moving ? sample.nowMs : state.lastMovingAt;
  const mode: MotionMode = moving || sample.nowMs - lastMovingAt < IDLE_DELAY_MS ? 'walking' : 'idle';
  const seconds = sample.nowMs / 1000;
  let phase: number;
  let visualY: number;
  let scaleX: number;
  let scaleY: number;
  let angle: number;
  if (mode === 'walking') {
    const ratio = Math.min(1.5, speed / profile.baseMoveSpeed);
    phase = (seconds * profile.walkCyclesPerSecond * Math.max(0.35, ratio) + state.phaseOffset) * Math.PI * 2;
    const wave = Math.sin(phase);
    const lift = Math.abs(wave);
    visualY = -lift * profile.walkBobPixels;
    scaleX = 1 + wave * profile.walkScaleAmplitude;
    scaleY = 1 - wave * profile.walkScaleAmplitude;
    angle = Math.sin(phase) * profile.walkTiltDegrees * (facing === 'left' ? -1 : 1);
  } else {
    phase = (sample.nowMs / profile.idleDurationMs + state.phaseOffset) * Math.PI * 2;
    const wave = Math.sin(phase);
    visualY = -Math.abs(wave) * profile.idleBobPixels;
    scaleX = 1 + wave * profile.idleScaleAmplitude;
    scaleY = 1 - wave * profile.idleScaleAmplitude;
    angle = 0;
  }
  const liftRatio = Math.min(1, Math.abs(visualY) / Math.max(1, profile.walkBobPixels));
  return {
    ...state,
    facing,
    flipX: facing === 'left',
    mode,
    lastMovingAt,
    speed,
    visualX: 0,
    visualY,
    scaleX,
    scaleY,
    angle,
    shadowScale: 1 - liftRatio * 0.08,
    shadowAlpha: 0.28 - liftRatio * 0.05,
    rootOffsetX: 0,
    rootOffsetY: 0,
  };
}

export type MotionTarget = {
  setPosition(x: number, y: number): unknown;
  setScale(x: number, y?: number): unknown;
  setAngle(angle: number): unknown;
  setFlipX(value: boolean): unknown;
};
export type ShadowTarget = { setScale(x: number, y?: number): unknown; setAlpha(value: number): unknown };

export class SingleSpriteMotionController {
  private state: SingleSpriteMotionState;
  constructor(
    private readonly visual: MotionTarget,
    private readonly shadow: ShadowTarget,
    profile: MotionProfileName = 'normal',
    facing: HorizontalFacing = 'right',
    phaseOffset = 0,
  ) {
    this.state = createMotionState(profile, facing, phaseOffset);
  }

  update(sample: MotionSample) {
    this.state = updateSingleSpriteMotion(this.state, sample);
    this.visual.setPosition(this.state.visualX, this.state.visualY);
    this.visual.setScale(this.state.scaleX, this.state.scaleY);
    this.visual.setAngle(this.state.angle);
    this.visual.setFlipX(this.state.flipX);
    this.shadow.setScale(this.state.shadowScale, this.state.shadowScale);
    this.shadow.setAlpha(this.state.shadowAlpha);
    return this.state;
  }

  snapshot() {
    return this.state;
  }
}
