import { MyAnimator } from './MyAnimator.js';

// One-shot bale drop: fast accelerating fall + single bounce at landing.
// startY = wagon-bed height, endY = ground height.
export class MyHayBaleAnimator extends MyAnimator {
  constructor(bale, startY, endY) {
    super(startY, endY, 1.0, /*loop*/ false, /*active*/ false);
    this.bale = bale;
  }

  // 0..0.75: accelerating quadratic (heavy fall).
  // 0.75..1: mini parabola back up, then settles.
  _dropEase(t) {
    if (t < 0.75) {
      const t2 = t / 0.75;
      return t2 * t2;
    }
    const t2 = (t - 0.75) / 0.25;
    return 1.0 - 0.08 * 4.0 * t2 * (1.0 - t2);
  }

  movementFunction(elapsed) {
    const t = Math.min(elapsed / this.animDurationSecs, 1.0);
    return this.startVal + (this.endVal - this.startVal) * this._dropEase(t);
  }

  updatePositionObj() {
    this.bale.renderY = this.animVal;
  }
}
