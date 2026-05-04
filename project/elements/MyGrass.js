import { CGFobject, CGFappearance, CGFshader } from '../../lib/CGF.js';
import { r } from '../utils.js';

const GRASS_COUNT     = 7000;
const GRASS_RANGE     = 200;   
const BLADE_WIDTH     = 3.0;   // patch is wide enough that the tiled texture reads as a strip
const BLADE_HEIGHT    = 1.8;
const TILES_U         = 3;     // how many times grass.png repeats horizontally per patch
const WIND_AMPLITUDE  = 0.2;
const WIND_FREQUENCY  = 1.4;
const PLACEMENT_TRIES = GRASS_COUNT * 5;

// One CGFobject containing every grass clump as cross-quads, baked into a
// single VBO. Wind is a vertex-shader effect; display() is one draw call.
export class MyGrass extends CGFobject {
  constructor(scene, texture, terrain) {
    super(scene);

    this.appearance = new CGFappearance(scene);
    this.appearance.setTexture(texture);
    this.appearance.setTextureWrap('REPEAT', 'CLAMP_TO_EDGE');

    this.shader = new CGFshader(scene.gl, 'shaders/grass.vert', 'shaders/grass.frag');
    this.shader.setUniformsValues({
      uSampler:  0,
      uTime:     0,
      uWindAmp:  WIND_AMPLITUDE,
      uWindFreq: WIND_FREQUENCY,
    });

    this.vertices  = [];
    this.normals   = [];
    this.texCoords = [];
    this.indices   = [];

    const clearance = BLADE_WIDTH * 0.5;
    let placed = 0, tries = 0;
    while (placed < GRASS_COUNT && tries < PLACEMENT_TRIES) {
      tries++;
      const x = r(-GRASS_RANGE, GRASS_RANGE);
      const z = r(-GRASS_RANGE, GRASS_RANGE);
      if (!terrain.isPathClear(x, z, clearance)) continue;
      const y = terrain.heightAt(x, z);
      this._emitClump(x, y, z, Math.random() * Math.PI);
      placed++;
    }

    this.primitiveType = scene.gl.TRIANGLES;
    this.initGLBuffers();
  }

  // Two perpendicular quads centred at (cx, cy, cz). Bottom verts have v=1
  // (root, anchored), top verts have v=0 (tip, swayed by the vertex shader).
  _emitClump(cx, cy, cz, yaw) {
    const halfW = BLADE_WIDTH * 0.5;
    const h = BLADE_HEIGHT;

    for (let q = 0; q < 2; q++) {
      const angle = yaw + q * Math.PI * 0.5;
      const dx = Math.cos(angle) * halfW;
      const dz = Math.sin(angle) * halfW;

      const base = this.vertices.length / 3;
      this.vertices.push(
        cx - dx, cy,     cz - dz,
        cx + dx, cy,     cz + dz,
        cx - dx, cy + h, cz - dz,
        cx + dx, cy + h, cz + dz
      );
      this.normals.push(0, 1, 0,  0, 1, 0,  0, 1, 0,  0, 1, 0);
      this.texCoords.push(
        0,        1,
        TILES_U,  1,
        0,        0,
        TILES_U,  0
      );
      this.indices.push(
        base + 0, base + 1, base + 2,
        base + 1, base + 3, base + 2
      );
    }
  }

  setTime(t) {
    this.shader.setUniformsValues({ uTime: t });
  }

  display() {
    const gl = this.scene.gl;
    this.scene.setActiveShader(this.shader);
    gl.disable(gl.CULL_FACE);
    this.appearance.apply();
    super.display();
    gl.enable(gl.CULL_FACE);
    this.scene.setActiveShader(this.scene.defaultShader);
  }
}
