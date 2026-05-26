import { CGFobject, CGFappearance } from '../../lib/CGF.js';
import { CGFobjModel } from '../../lib/extra/CGFobjModel.js';
import { groundOffset } from '../utils.js';

export class MyHorse extends CGFobject {
  constructor(scene, x, y, z, scale, yaw, texture) {
    super(scene);
    this.model = new CGFobjModel(scene, './resources/Horse/Mesh_Horse.obj');
    this.x = x; this.y = y; this.z = z;
    this.scale = scale;
    this.yaw = yaw;

    this.appearance = new CGFappearance(scene);
    this.appearance.setAmbient(0.7, 0.7, 0.7, 1.0);
    this.appearance.setDiffuse(0.9, 0.9, 0.9, 1.0);
    this.appearance.setSpecular(0.1, 0.1, 0.1, 1.0);
    this.appearance.setShininess(8.0);
    this.appearance.setTexture(texture);
    this.appearance.setTextureWrap('REPEAT', 'REPEAT');
  }

  display() {
    if (!this.model.ready) return;
    // Compute once on first ready frame — model vertices don't change.
    if (this.footOffset === undefined) this.footOffset = groundOffset(this.model.vertices);

    const gl = this.scene.gl;
    this.appearance.apply();

    // The OBJ has inconsistent triangle winding; double-side it so no
    // surface gets culled. Cost is fine — only one horse is drawn.
    gl.disable(gl.CULL_FACE);
    this.scene.pushMatrix();

    const yOffset = this.animYOffset || 0;
    this.scene.translate(this.x, this.y + yOffset, this.z);
    this.scene.rotate(this.yaw, 0, 1, 0);

    // The OBJ model has its nose along object +Z (proven by the wagon's
    // yaw + π/2 alignment), so X is the lateral axis (pitch) and Z is the
    // forward axis (roll/sway).
    const bodyRoll  = this.bodyRoll  || 0;
    const bodyPitch = this.bodyPitch || 0;
    if (bodyRoll  !== 0) this.scene.rotate(bodyRoll,  0, 0, 1);
    if (bodyPitch !== 0) this.scene.rotate(bodyPitch, 1, 0, 0);

    // Gallop bounce: cos at the same phase as the Y bounce. Around +Z
    // (forward axis) this reads as a rocking-horse sway rather than a
    // nose-up/nose-down pitch — close enough for the gallop loop.
    const pitchOffset = this.animPitchOffset || 0;
    if (pitchOffset !== 0) this.scene.rotate(pitchOffset, 0, 0, 1);

    this.scene.scale(this.scale, this.scale, this.scale);
    this.scene.translate(0, this.footOffset, 0);
    this.model.display();

    this.scene.popMatrix();
    gl.enable(gl.CULL_FACE);
  }
}
