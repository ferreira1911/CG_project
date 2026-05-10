import { MyAnimator } from './MyAnimator.js';

/**
 * MyHayBaleAnimator
 * Plays a "drop" animation that moves the bale from the wagon bed height
 * down to the ground, with a bounce ease so it lands with a thump.
 *
 * Usage:
 *   const anim = new MyHayBaleAnimator(bale, bedHeight, groundY);
 *   anim.enable(scene.time);
 *   // call anim.update(scene.time) every frame
 */
export class MyHayBaleAnimator extends MyAnimator {
    /**
     * @param {MyHayBale} bale       - The bale object to animate
     * @param {number}    startY     - Y position when released (wagon bed height)
     * @param {number}    endY       - Y position on the ground
     */
    constructor(bale, startY, endY) {
        super(startY, endY, 1.0, false, false);
        this.bale = bale;
    }

    // Fast fall with a single satisfying bounce at landing.
    _dropEase(t) {
        if (t < 0.75) {
            // Main fall: accelerating quadratic (feels heavy)
            const t2 = t / 0.75;
            return t2 * t2;
        } else {
            // Single bounce: mini parabola back up then settles
            const t2 = (t - 0.75) / 0.25;
            return 1.0 - 0.08 * 4.0 * t2 * (1.0 - t2);
        }
    }

    movementFunction(elapsed) {
        const t    = Math.min(elapsed / this.animDurationSecs, 1.0);
        const ease = this._dropEase(t);
        return this.startVal + (this.endVal - this.startVal) * ease;
    }

    updatePositionObj() {
        this.bale.renderY = this.animVal;
    }
}
