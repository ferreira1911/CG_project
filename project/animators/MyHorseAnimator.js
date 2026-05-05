import { MyAnimator } from './MyAnimator.js';

export class MyHorseAnimator extends MyAnimator {
    /**
     * @param {Object} targetHorse - The horse object to animate
     * @param {number} bounceHeight - Max height of the bounce (e.g. 0.5)
     * @param {number} animDurationSecs - How fast one full bounce takes (e.g. 1.0)
     */
    constructor(targetHorse, bounceHeight, animDurationSecs) {
        // startVal = 0, endVal = 2*PI (one full sine wave)
        super(0, 2 * Math.PI, animDurationSecs, true, true);
        this.targetHorse = targetHorse;
        this.bounceHeight = bounceHeight;
        this.pitchAmount = 0.12; // Max pitch tilt (radians)
    }

    movementFunction(time) {
        // Linearly map elapsed time to an angle between 0 and 2*PI
        return this.startVal + (this.endVal - this.startVal) * (time / this.animDurationSecs);
    }

    updatePositionObj() {
        if (this.targetHorse) {
            // Apply sine wave bounce to the horse's custom Y offset property
            this.targetHorse.animYOffset = Math.abs(Math.sin(this.animVal)) * this.bounceHeight;
            
            // Add a pitch tilt synchronized with the bounce (cosine wave)
            // This gives a "rocking horse" motion (nose down when landing, up when taking off)
            this.targetHorse.animPitchOffset = Math.cos(this.animVal) * this.pitchAmount;
        }
    }
}
