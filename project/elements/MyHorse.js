import { CGFobject, CGFappearance } from '../../lib/CGF.js';
import { CGFobjModel } from '../../lib/extra/CGFobjModel.js';

export class MyHorse extends CGFobject {
  constructor(scene, x, y, z, scale, yaw, texture) {
    super(scene);
    this.model = new CGFobjModel(scene, './resources/Horse/Mesh_Horse.obj');
    this.x = x;
    this.y = y;
    this.z = z;
    this.scale = scale;
    this.yaw = yaw;

    this.appearance = new CGFappearance(scene);
    this.appearance.setAmbient(0.4, 0.4, 0.4, 1.0);
    this.appearance.setDiffuse(0.8, 0.8, 0.8, 1.0);
    this.appearance.setSpecular(0.1, 0.1, 0.1, 1.0);
    this.appearance.setShininess(8.0);
    this.appearance.setTexture(texture);
  }

  display() {
    const gl = this.scene.gl;
    this.appearance.apply();
    // The OBJ has inconsistent face winding — disable culling so back-faced
    // triangles still render.
    gl.disable(gl.CULL_FACE);
    this.scene.pushMatrix();
    this.scene.translate(this.x, this.y, this.z);
    this.scene.rotate(this.yaw, 0, 1, 0);
    this.scene.scale(this.scale, this.scale, this.scale);
    this.model.display();
    this.scene.popMatrix();
    gl.enable(gl.CULL_FACE);
  }
}
