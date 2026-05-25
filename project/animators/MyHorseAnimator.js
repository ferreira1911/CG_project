import { MyAnimator } from './MyAnimator.js';

// Continuous looped sine bounce + cosine pitch for the harnessed horse —
// rocking-horse motion: nose tilts down as it lands, up as it pushes off.
export class MyHorseAnimator extends MyAnimator {
  constructor(targetHorse, bounceHeight, animDurationSecs) {
    super(0, 2 * Math.PI, animDurationSecs, /*loop*/ true, /*active*/ true);
    this.targetHorse  = targetHorse;
    this.bounceHeight = bounceHeight;
    this.pitchAmount  = 0.12;  // peak pitch tilt (rad)
  }

  movementFunction(time) {
    return this.startVal + (this.endVal - this.startVal) * (time / this.animDurationSecs);
  }

  updatePositionObj() {
    if (!this.targetHorse) return;
    // abs(sin) gives a one-way bounce; cos at the same phase gives the
    // synchronized pitch tilt.
    this.targetHorse.animYOffset    = Math.abs(Math.sin(this.animVal)) * this.bounceHeight;
    this.targetHorse.animPitchOffset = Math.cos(this.animVal) * this.pitchAmount;
  }
}
