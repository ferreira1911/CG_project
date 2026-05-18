import { MyAnimator } from './MyAnimator.js';

export class MyTreeAnimator extends MyAnimator {
    /**
     * @param {MyFlora} targetFlora - The tree instance to animate
     * @param {number} duration - Fall duration in seconds
     */
    constructor(targetFlora, duration = 1.2) {
        // Fall from 0 to 90 degrees (Math.PI / 2)
        super(0, Math.PI / 2, duration, false, false);
        this.targetFlora = targetFlora;
    }

    /**
     * Calculates the current fall angle using a quadratic ease-in
     * to simulate gravity (slow start, accelerating fall).
     */
    movementFunction(time) {
        // Normalize time from 0 to 1
        const t = Math.min(1.0, time / this.animDurationSecs);
        // Quadratic ease-in (t^2)
        const easeInQuad = t * t;
        
        return this.startVal + this.length * easeInQuad;
    }

    /**
     * Applies the calculated angle to the tree.
     */
    updatePositionObj() {
        if (this.targetFlora) {
            this.targetFlora.fallAngle = this.animVal;
        }
    }
}
