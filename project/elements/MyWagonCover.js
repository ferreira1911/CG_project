import { CGFobject } from '../../lib/CGF.js';

const ARCH_SLICES   = 16;
const LENGTH_STACKS = 12;

// Half-cylinder canvas arch lying along +x. Geometry is baked at construct
// time — only the upper half exists (no cylinder bottom poking below the bed)
// and the front/back ends stay open so hay bales show through. Length is
// tessellated into stacks so the cloth shader's wind ripple looks smooth
// rather than chunky.
export class MyWagonCover extends CGFobject {
  constructor(scene, length, radius, texture) {
    super(scene);
    this.length  = length;
    this.radius  = radius;
    this.texture = texture;
    this.initBuffers();
  }

  initBuffers() {
    const L = this.length, R = this.radius;
    this.vertices  = [];
    this.normals   = [];
    this.texCoords = [];
    this.indices   = [];

    const ARCH_VERTS = ARCH_SLICES + 1;

    // Grid of (LENGTH_STACKS+1) length rings × (ARCH_SLICES+1) arch verts.
    // Each ring sweeps theta 0..PI across the arch top in the YZ plane.
    for (let xi = 0; xi <= LENGTH_STACKS; xi++) {
      const xFrac = xi / LENGTH_STACKS;
      const x     = -L / 2 + xFrac * L;
      for (let i = 0; i <= ARCH_SLICES; i++) {
        const theta = (i / ARCH_SLICES) * Math.PI;
        const sy = Math.sin(theta), cz = Math.cos(theta);
        this.vertices.push(x, R * sy, R * cz);
        this.normals.push(0, sy, cz);
        // s = theta/PI, t = length-frac. Cloth shader reads both back out.
        this.texCoords.push(i / ARCH_SLICES, xFrac);
      }
    }

    for (let xi = 0; xi < LENGTH_STACKS; xi++) {
      for (let i = 0; i < ARCH_SLICES; i++) {
        const bl = xi * ARCH_VERTS + i;
        const br = xi * ARCH_VERTS + i + 1;
        const fl = (xi + 1) * ARCH_VERTS + i;
        const fr = (xi + 1) * ARCH_VERTS + i + 1;
        this.indices.push(bl, br, fr);
        this.indices.push(bl, fr, fl);
      }
    }

    this.primitiveType = this.scene.gl.TRIANGLES;
    this.initGLBuffers();
  }

  display() {
    const scene = this.scene;
    const gl    = scene.gl;

    scene.setActiveShader(scene.clothShader);
    if (this.texture) this.texture.bind(0);

    // Open mesh — without culling off, the inside of the canvas disappears.
    gl.disable(gl.CULL_FACE);
    super.display();
    gl.enable(gl.CULL_FACE);

    scene.setActiveShader(scene.defaultShader);
  }
}
