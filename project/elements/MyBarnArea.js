import { CGFobject, CGFappearance } from '../../lib/CGF.js';
import { MyCylinder } from '../geometric/MyCylinder.js';

// Glowing drop-off ring in front of the barn. Idle = yellow; once the wagon
// overlaps the ring, isIntersected flips and it turns green.
export class MyBarnArea extends CGFobject {
  constructor(scene, radius) {
    super(scene);
    this.radius = radius;
    this.aura = new MyCylinder(scene, 32, 1);

    this.idleApp = new CGFappearance(scene);
    this.idleApp.setAmbient(0.3, 0.3, 0.1, 1.0);
    this.idleApp.setDiffuse(0.6, 0.6, 0.2, 0.5);
    this.idleApp.setSpecular(0.1, 0.1, 0.1, 1.0);
    this.idleApp.setEmission(0.4, 0.4, 0.0, 1.0);

    this.activeApp = new CGFappearance(scene);
    this.activeApp.setAmbient(0.1, 0.4, 0.1, 1.0);
    this.activeApp.setDiffuse(0.2, 0.8, 0.2, 0.5);
    this.activeApp.setSpecular(0.1, 0.1, 0.1, 1.0);
    this.activeApp.setEmission(0.0, 0.6, 0.0, 1.0);

    this.isIntersected = false;
  }

  display() {
    const gl = this.scene.gl;
    this.scene.pushMatrix();
    (this.isIntersected ? this.activeApp : this.idleApp).apply();
    this.scene.scale(this.radius, 0.5, this.radius);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    // Skip depth writes so the translucent ring doesn't fight Z with the terrain.
    gl.depthMask(false);
    // CGFcylinder winds CW; show both faces so the ring looks correct from any side.
    gl.disable(gl.CULL_FACE);

    if (this.scene.activeTexture) this.scene.activeTexture.unbind();
    this.aura.display();

    gl.enable(gl.CULL_FACE);
    gl.depthMask(true);
    gl.disable(gl.BLEND);
    this.scene.popMatrix();
  }
}
