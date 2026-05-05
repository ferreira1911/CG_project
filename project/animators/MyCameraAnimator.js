import { MyAnimator } from './MyAnimator.js';

export class MyCameraAnimator extends MyAnimator {
    /**
     * @param {Object} scene - The MyScene instance
     * @param {number} startYOffset - How high up the camera starts
     * @param {number} animDurationSecs - Duration of the drop animation
     */
    constructor(scene, startYOffset, animDurationSecs) {
        // Interpolate from startYOffset down to 0, no looping, starts active
        super(startYOffset, 0, animDurationSecs, false, true);
        this.scene = scene;
    }

    movementFunction(time) {
        // We override the default linear movement with an "easeOutCubic" curve
        // This makes the camera start fast and slow down smoothly as it reaches the wagon
        let t = time / this.animDurationSecs;
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
