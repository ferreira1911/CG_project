export class MyAnimator {
    /**
     * @param {number|number[]} startVal - Starting value(s)
     * @param {number|number[]} endVal - Ending value(s)
     * @param {number} animDurationSecs - Duration of the animation in seconds
     * @param {boolean} loop - Whether the animation should loop or stop at the end
     * @param {boolean} active - Whether the animation starts active
     */
    constructor(startVal, endVal, animDurationSecs, loop, active) {
        this.startVal = startVal;
        this.endVal = endVal;
        this.animDurationSecs = animDurationSecs;
        
        // If arrays are passed, we calculate the length element by element in subclasses.
        // For simple numbers, we can calculate it here.
        if (typeof this.endVal === 'number' && typeof this.startVal === 'number') {
            this.length = this.endVal - this.startVal;
        }
        
        this.animVal = this.startVal;
        this.active = active;
        this.loop = loop;
        this.last = 0;
    }

    /**
     * Calculates the current value based on elapsed time.
     * @param {number} time - Elapsed time since animation started (in seconds)
     */
    movementFunction(time) {
        throw new Error('Subclass must implement abstract method: movementFunction');
    }

    /**
     * Applies the current `animVal` to the target object.
     */
    updatePositionObj() {
        throw new Error('Subclass must implement abstract method: updatePositionObj');
    }

    /**
     * Enables the animation.
     * @param {number} timeSinceAppStart - Current app time (in seconds)
     */
    enable(timeSinceAppStart) {
        this.active = true;
        this.last = timeSinceAppStart;
        this.lastIteration = false;
    }

    /**
     * Disables the animation.
     */
    disable() {
        this.active = false;
    }

    /**
     * Called every frame to advance the animation.
     * @param {number} timeSinceAppStart - Current app time (in seconds)
     */
    update(timeSinceAppStart) {
        if (!this.active) return;
        
        let elapsed = timeSinceAppStart - this.last;
        
        if (elapsed > this.animDurationSecs) {
            if (this.loop) {
                // Modulo ensures we don't lose time if framerate drops
                this.last += this.animDurationSecs * Math.floor(elapsed / this.animDurationSecs);
                elapsed = timeSinceAppStart - this.last;
            } else {
                this.animVal = this.endVal;
                this.updatePositionObj();
                this.disable();
                return;
            }
        }
        
        this.animVal = this.movementFunction(elapsed);
        this.updatePositionObj();
    }
}
