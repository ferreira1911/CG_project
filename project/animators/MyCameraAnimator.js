import { MyAnimator } from './MyAnimator.js';

// Intro camera drop. Holds at startYOffset for delaySecs, then drops to 0
// over dropDurationSecs with an easeOutCubic so the camera glides into
// place instead of slamming down. Drives scene.introCameraOffset, which the
// follow-cam in MyScene reads to compute its world position.
export class MyCameraAnimator extends MyAnimator {
  constructor(scene, startYOffset, dropDurationSecs, delaySecs = 0) {
    super(startYOffset, 0, dropDurationSecs + delaySecs, /*loop*/ false, /*active*/ false);
    this.scene            = scene;
    this.dropDurationSecs = dropDurationSecs;
    this.delaySecs        = delaySecs;
  }

  movementFunction(time) {
    if (time < this.delaySecs) return this.startVal;

    let t = (time - this.delaySecs) / this.dropDurationSecs;
    t = Math.min(Math.max(t, 0), 1);
    const ease = 1 - Math.pow(1 - t, 3);
    return this.startVal + (this.endVal - this.startVal) * ease;
  }

  updatePositionObj() {
    if (this.scene) this.scene.introCameraOffset = this.animVal;
  }
}
