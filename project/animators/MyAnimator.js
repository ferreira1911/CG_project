// Base animator. Subclasses provide:
//   movementFunction(elapsed)  — given elapsed seconds, return the current value
//   updatePositionObj()        — apply this.animVal to the animated object
//
// Lifecycle: construct in either enabled or disabled state; enable(time)
// resets the start clock so resumption never time-skips; update(time) ticks
// the current value and either loops, holds the end value (non-loop), or
// disables.
export class MyAnimator {
  constructor(startVal, endVal, animDurationSecs, loop, active) {
    this.startVal         = startVal;
    this.endVal           = endVal;
    this.animDurationSecs = animDurationSecs;

    // Cached numeric length for scalar animators; vector subclasses compute
    // their own per-component length.
    if (typeof this.endVal === 'number' && typeof this.startVal === 'number') {
      this.length = this.endVal - this.startVal;
    }

    this.animVal = this.startVal;
    this.active  = active;
    this.loop    = loop;
    this.last    = 0;
  }

  movementFunction(time) {
    throw new Error('Subclass must implement movementFunction');
  }

  updatePositionObj() {
    throw new Error('Subclass must implement updatePositionObj');
  }

  enable(timeSinceAppStart) {
    this.active = true;
    this.last   = timeSinceAppStart;
    this.lastIteration = false;
  }

  disable() {
    this.active = false;
  }

  update(timeSinceAppStart) {
    if (!this.active) return;

    let elapsed = timeSinceAppStart - this.last;
    if (elapsed > this.animDurationSecs) {
      if (this.loop) {
        // Modulo-advance so a long pause (e.g. tab in background) doesn't
        // accumulate drift on top of the cycle.
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
