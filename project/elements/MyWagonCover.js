import { CGFobject } from '../../lib/CGF.js';

const ARCH_SLICES   = 16;
const LENGTH_STACKS = 12;

// Half-cylinder canvas arch lying along +X, baked once at construct time.
// Only the upper half exists (no underside poking below the bed), the front/
// back ends stay open so cargo shows through, and length is tessellated into
// stacks so the cloth shader's wind ripple looks smooth at the apex.
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
    // Each ring sweeps theta 0..π across the arch top in the YZ plane.
    for (let xi = 0; xi <= LENGTH_STACKS; xi++) {
      const xFrac = xi / LENGTH_STACKS;
      const x     = -L / 2 + xFrac * L;
      for (let i = 0; i <= ARCH_SLICES; i++) {
        const theta = (i / ARCH_SLICES) * Math.PI;
        const sy = Math.sin(theta), cz = Math.cos(theta);
        this.vertices.push(x, R * sy, R * cz);
        this.normals.push(0, sy, cz);
        // s = theta/PI, t = length-frac. cloth.vert reads both back out.
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

    // Open mesh — without disabling culling, the canvas interior disappears.
    gl.disable(gl.CULL_FACE);
    super.display();
    gl.enable(gl.CULL_FACE);

    scene.setActiveShader(scene.defaultShader);
  }
}
