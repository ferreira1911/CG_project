import { CGFobject } from '../../lib/CGF.js';

// Unit circle in the XY plane, normal facing +Z. Triangle fan from a center
// vertex out to `slices` perimeter points. UVs map the bounding [-1,1] square
// to [0,1] so a square texture (e.g. wheel face) wraps cleanly to the disc.
export class MyCircle extends CGFobject {
  constructor(scene, slices = 24) {
    super(scene);
    this.slices = slices;
    this.initBuffers();
  }

  initBuffers() {
    this.vertices  = [0, 0, 0];
    this.normals   = [0, 0, 1];
    this.texCoords = [0.5, 0.5];
    this.indices   = [];

    for (let i = 0; i <= this.slices; i++) {
      const theta = (i / this.slices) * 2 * Math.PI;
      const x = Math.cos(theta);
      const y = Math.sin(theta);
      this.vertices.push(x, y, 0);
      this.normals.push(0, 0, 1);
      this.texCoords.push(x * 0.5 + 0.5, -y * 0.5 + 0.5);
    }

    for (let i = 1; i <= this.slices; i++) {
      this.indices.push(0, i, i + 1);
    }

    this.primitiveType = this.scene.gl.TRIANGLES;
    this.initGLBuffers();
  }
}
