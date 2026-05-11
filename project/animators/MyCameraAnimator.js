import { MyAnimator } from './MyAnimator.js';

export class MyCameraAnimator extends MyAnimator {
    /**
     * @param {Object} scene - The MyScene instance
     * @param {number} startYOffset - How high up the camera starts
     * @param {number} dropDurationSecs - Duration of the actual drop animation
     * @param {number} delaySecs - How long to hold the initial height before dropping
     */
    constructor(scene, startYOffset, dropDurationSecs, delaySecs = 0) {
        // Total active time of this animator is the delay plus the drop time
        super(startYOffset, 0, dropDurationSecs + delaySecs, false, true);
        this.scene = scene;
        this.dropDurationSecs = dropDurationSecs;
        this.delaySecs = delaySecs;
    }

    movementFunction(time) {
        // If we are still in the delay phase, hold the start value
        if (time < this.delaySecs) {
            return this.startVal;
        }

        // We override the default linear movement with an "easeOutCubic" curve
        // This makes the camera start fast and slow down smoothly as it reaches the wagon
        let t = (time - this.delaySecs) / this.dropDurationSecs;
        t = Math.min(Math.max(t, 0), 1); // Clamp between 0 and 1
        const ease = 1 - Math.pow(1 - t, 3);
        
        return this.startVal + (this.endVal - this.startVal) * ease;
    }

    updatePositionObj() {
        if (this.scene) {
            // We expose the current height offset to the scene
            this.scene.introCameraOffset = this.animVal;
        }
    }
}
