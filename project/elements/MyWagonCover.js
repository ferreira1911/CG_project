import { CGFobject, CGFappearance } from '../../lib/CGF.js';

const ARCH_SLICES = 16;

// Half-cylinder canvas arch lying along +x. Geometry is baked at construct
// time — only the upper half exists (no cylinder bottom poking below the bed)
// and the front/back ends stay open so hay bales show through.
export class MyWagonCover extends CGFobject {
  constructor(scene, length, radius, texture) {
    super(scene);
    this.length = length;
    this.radius = radius;

    this.appearance = new CGFappearance(scene);
    this.appearance.setAmbient(0.50, 0.48, 0.42, 1.0);
    this.appearance.setDiffuse(0.85, 0.80, 0.72, 1.0);
    this.appearance.setSpecular(0.05, 0.05, 0.05, 1.0);
    this.appearance.setShininess(2.0);
    if (texture) {
      this.appearance.setTexture(texture);
      this.appearance.setTextureWrap('REPEAT', 'REPEAT');
    }

    this.initBuffers();
  }

  initBuffers() {
    const L = this.length, R = this.radius;
    this.vertices  = [];
    this.normals   = [];
    this.texCoords = [];
    this.indices   = [];

    // Two rings (back at x=-L/2, front at x=+L/2). Each ring sweeps half a
    // circle (theta 0..PI) across the arch top in the YZ plane.
    for (let xi = 0; xi <= 1; xi++) {
      const x = -L / 2 + xi * L;
      for (let i = 0; i <= ARCH_SLICES; i++) {
        const theta = (i / ARCH_SLICES) * Math.PI;
        const sy = Math.sin(theta), cz = Math.cos(theta);
        this.vertices.push(x, R * sy, R * cz);
        this.normals.push(0, sy, cz);
        this.texCoords.push(i / ARCH_SLICES, xi);
      }
    }

    const ring0 = 0;
    const ring1 = ARCH_SLICES + 1;
    for (let i = 0; i < ARCH_SLICES; i++) {
      const bl = ring0 + i, br = ring0 + i + 1;
      const fl = ring1 + i, fr = ring1 + i + 1;
      this.indices.push(bl, br, fr);
      this.indices.push(bl, fr, fl);
    }

    this.primitiveType = this.scene.gl.TRIANGLES;
    this.initGLBuffers();
  }

  display() {
    this.appearance.apply();

    const gl = this.scene.gl;
    // Open mesh — without culling off, the inside of the canvas disappears.
    gl.disable(gl.CULL_FACE);
    super.display();
    gl.enable(gl.CULL_FACE);
  }
}
