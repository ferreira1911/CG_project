import { CGFobject } from '../../lib/CGF.js';

// 2D downward-pointing arrow (head + shaft) drawn over each haybale to guide
// the player. The arrow shader spins, bobs, and pulses it.
export class MyArrow extends CGFobject {
  constructor(scene) {
    super(scene);
    this.initBuffers();
  }

  initBuffers() {
    this.vertices = [
      // Front face (+Z)
       0.0, 0.0, 0,  // 0: tip
       0.5, 0.8, 0,  // 1: head right
      -0.5, 0.8, 0,  // 2: head left
       0.2, 0.8, 0,  // 3: shaft bottom right
      -0.2, 0.8, 0,  // 4: shaft bottom left
       0.2, 1.8, 0,  // 5: shaft top right
      -0.2, 1.8, 0,  // 6: shaft top left

      // Back face (-Z) — duplicated so per-face normals can differ.
       0.0, 0.0, 0,  // 7
       0.5, 0.8, 0,  // 8
      -0.5, 0.8, 0,  // 9
       0.2, 0.8, 0,  // 10
      -0.2, 0.8, 0,  // 11
       0.2, 1.8, 0,  // 12
      -0.2, 1.8, 0,  // 13
    ];

    this.normals = [
      0,0,1, 0,0,1, 0,0,1, 0,0,1, 0,0,1, 0,0,1, 0,0,1,
      0,0,-1, 0,0,-1, 0,0,-1, 0,0,-1, 0,0,-1, 0,0,-1, 0,0,-1,
    ];

    this.indices = [
      // Front head, then front shaft quad.
       0,  1,  2,
       3,  5,  4,
       4,  5,  6,
      // Back head + back shaft (reversed winding).
       7,  9,  8,
      10, 11, 12,
      11, 13, 12,
    ];

    this.primitiveType = this.scene.gl.TRIANGLES;
    this.initGLBuffers();
  }

  display() {
    this.scene.pushMatrix();
    this.scene.scale(0.8, 0.8, 0.8);
    super.display();
    this.scene.popMatrix();
  }
}
