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

    // Pitch tilt during gallop. Z is the horse's lateral axis since it
    // faces +X locally, so a Z-rotation reads as nose-up/nose-down.
    const pitchOffset = this.animPitchOffset || 0;
    if (pitchOffset !== 0) this.scene.rotate(pitchOffset, 0, 0, 1);

    this.scene.scale(this.scale, this.scale, this.scale);
    this.scene.translate(0, this.footOffset, 0);
    this.model.display();

    this.scene.popMatrix();
    gl.enable(gl.CULL_FACE);
  }
}
