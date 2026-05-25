import { MyAnimator } from './MyAnimator.js';

// One-shot tree fall from upright (0 rad) to flat on the ground (π/2),
// using a quadratic ease-in so the fall accelerates like gravity.
export class MyTreeAnimator extends MyAnimator {
  constructor(targetFlora, duration = 1.2) {
    super(0, Math.PI / 2, duration, /*loop*/ false, /*active*/ false);
    this.targetFlora = targetFlora;
  }

  movementFunction(time) {
    const t = Math.min(1.0, time / this.animDurationSecs);
    return this.startVal + this.length * (t * t);
  }

  updatePositionObj() {
    if (this.targetFlora) this.targetFlora.fallAngle = this.animVal;
  }
}
