import { CGFobject } from '../../lib/CGF.js';
import { r } from '../utils.js';

const CLUMP_COUNT_PER_PATCH = 6000;
const BLADES_PER_CLUMP      = 3;
const BLADE_WIDTH           = 0.10;
const BLADE_HEIGHT          = 1.1;
const PLACEMENT_TRIES       = CLUMP_COUNT_PER_PATCH * 5;
const VERTS_PER_CLUMP       = BLADES_PER_CLUMP * 5;  // 2 base + 2 mid + 1 tip
const INDICES_PER_CLUMP     = BLADES_PER_CLUMP * 9;  // quad (6) + tip tri (3)

// One MyGrass instance = one square patch of grass, baked at construct time
// into a single interleaved buffer set so the whole patch renders in a single
// draw call. Per-blade variation is encoded into aGrassInfo (color/phase/
// stiffness/dryness) for the grass shader to consume.
export class MyGrass extends CGFobject {
  constructor(scene, shader, terrain, patchCx = 0, patchCz = 0, patchSize = 200) {
    super(scene);

    this.shader = shader;
    this.cx = patchCx;
    this.cz = patchCz;

    const totalVertices = CLUMP_COUNT_PER_PATCH * VERTS_PER_CLUMP;
    const totalIndices  = CLUMP_COUNT_PER_PATCH * INDICES_PER_CLUMP;

    this.vertices  = new Float32Array(totalVertices * 3);
    this.normals   = new Float32Array(totalVertices * 3);
    this.localYs   = new Float32Array(totalVertices);
    this.grassInfo = new Float32Array(totalVertices * 4);  // (colorVar, phase, stiffness, dryness)
    this.indices   = new Uint16Array(totalIndices);

    this.vIdx = 0;
    this.iIdx = 0;

    this._placeClumps(terrain, patchCx, patchCz, patchSize);

    this.primitiveType = scene.gl.TRIANGLES;
    this.initGLBuffers();

    this._createAuxBuffers();
  }

  _placeClumps(terrain, patchCx, patchCz, patchSize) {
    const halfSize = patchSize / 2;
    const scene = this.scene;
    let placed = 0, tries = 0;

    while (placed < CLUMP_COUNT_PER_PATCH && tries < PLACEMENT_TRIES) {
      tries++;
      const x = r(patchCx - halfSize, patchCx + halfSize);
      const z = r(patchCz - halfSize, patchCz + halfSize);

      // Circular map cutoff and per-blade rejection: paths, rocks, bales,
      // tree zones, flower clusters all veto via MyScene.isGrassSpawnBlocked.
      if (x * x + z * z > 148.5 * 148.5) continue;
      if (!terrain.isPathClearFast(x, z)) continue;
      if (scene.isGrassSpawnBlocked && scene.isGrassSpawnBlocked(x, z)) continue;

      const dryness = this._computeDryness(x, z);
      this._emitClump(x, terrain.heightAt(x, z), z, Math.random() * Math.PI * 2, dryness);
      placed++;
    }
  }

  // 3-octave sin/cos noise; gating above 1.1 produces sparse organic dry
  // patches rather than uniform falloff.
  _computeDryness(x, z) {
    const nx1 = x * 0.04, nz1 = z * 0.04;
    const nx2 = x * 0.09, nz2 = z * 0.07;
    const nx3 = x * 0.15, nz3 = z * 0.13;

    const noiseVal =
        Math.sin(nx1 + nz1) * Math.cos(nx1 - nz1) * 1.0 +
        Math.sin(nx2) * Math.cos(nz2 + nx2) * 0.5 +
        Math.sin(nx3 - nz3) * 0.25;

    if (noiseVal <= 1.1) return 0;
    let dryness = Math.min(1.0, (noiseVal - 1.1) / 0.4);
    // Per-blade jitter so the dry patch edges fade rather than cut sharply.
    return Math.max(0, Math.min(1, dryness + r(-0.15, 0.15)));
  }

  _createAuxBuffers() {
    const gl = this.scene.gl;
    this.localYBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.localYBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.localYs, gl.STATIC_DRAW);

    this.grassInfoBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.grassInfoBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.grassInfo, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  _emitClump(cx, cy, cz, baseYaw, dryness) {
    const colorVar = r(-0.15, 0.15);
    const phase    = r(0, Math.PI * 2);

    for (let i = 0; i < BLADES_PER_CLUMP; i++) {
      const yaw = baseYaw + i * (Math.PI * 2 / BLADES_PER_CLUMP) + r(-0.5, 0.5);
      const offsetX = Math.cos(yaw) * r(0.0, 0.15);
      const offsetZ = Math.sin(yaw) * r(0.0, 0.15);

      const halfW     = BLADE_WIDTH * r(0.4, 0.9);
      const h         = BLADE_HEIGHT * r(0.7, 1.3);
      const bend      = h * r(0.2, 0.5);
      const stiffness = r(0.7, 1.3);

      const bx = cx + offsetX;
      const bz = cz + offsetZ;
      const by = cy + r(-0.05, 0.05);

      const sideX = Math.cos(yaw);
      const sideZ = Math.sin(yaw);
      const forwardX = -Math.sin(yaw);
      const forwardZ =  Math.cos(yaw);

      // Three rows of vertices per blade: wide base, narrowed bent mid, single tip.
      const p0x = bx - sideX * halfW, p0y = by, p0z = bz - sideZ * halfW;
      const p1x = bx + sideX * halfW, p1y = by, p1z = bz + sideZ * halfW;

      const midHalfW = halfW * 0.6;
      const midH     = h * 0.55;
      const midBend  = bend * 0.25;
      const p2x = bx - sideX * midHalfW + forwardX * midBend, p2y = by + midH, p2z = bz - sideZ * midHalfW + forwardZ * midBend;
      const p3x = bx + sideX * midHalfW + forwardX * midBend, p3y = by + midH, p3z = bz + sideZ * midHalfW + forwardZ * midBend;

      const p4x = bx + forwardX * bend, p4y = by + h, p4z = bz + forwardZ * bend;

      // Face normals — quad face is base→mid, tip face is mid→tip. Mid row
      // uses the average so shading is continuous at the bend.
      let nx1 = (p1y - p0y)*(p2z - p0z) - (p1z - p0z)*(p2y - p0y);
      let ny1 = (p1z - p0z)*(p2x - p0x) - (p1x - p0x)*(p2z - p0z);
      let nz1 = (p1x - p0x)*(p2y - p0y) - (p1y - p0y)*(p2x - p0x);
      let len1 = Math.hypot(nx1, ny1, nz1) || 1;
      nx1 /= len1; ny1 /= len1; nz1 /= len1;

      let nx2 = (p3y - p2y)*(p4z - p2z) - (p3z - p2z)*(p4y - p2y);
      let ny2 = (p3z - p2z)*(p4x - p2x) - (p3x - p2x)*(p4z - p2z);
      let nz2 = (p3x - p2x)*(p4y - p2y) - (p3y - p2y)*(p4x - p2x);
      let len2 = Math.hypot(nx2, ny2, nz2) || 1;
      nx2 /= len2; ny2 /= len2; nz2 /= len2;

      let nMidX = nx1 + nx2, nMidY = ny1 + ny2, nMidZ = nz1 + nz2;
      let lenMid = Math.hypot(nMidX, nMidY, nMidZ) || 1;
      nMidX /= lenMid; nMidY /= lenMid; nMidZ /= lenMid;

      const baseIdx = this.vIdx / 3;
      const v = this.vIdx;

      this.vertices[v]    = p0x; this.vertices[v+1]  = p0y; this.vertices[v+2]  = p0z;
      this.vertices[v+3]  = p1x; this.vertices[v+4]  = p1y; this.vertices[v+5]  = p1z;
      this.normals[v]     = nx1; this.normals[v+1]   = ny1; this.normals[v+2]   = nz1;
      this.normals[v+3]   = nx1; this.normals[v+4]   = ny1; this.normals[v+5]   = nz1;
      this.localYs[baseIdx]   = 0;
      this.localYs[baseIdx+1] = 0;

      this.vertices[v+6]  = p2x; this.vertices[v+7]  = p2y; this.vertices[v+8]  = p2z;
      this.vertices[v+9]  = p3x; this.vertices[v+10] = p3y; this.vertices[v+11] = p3z;
      this.normals[v+6]   = nMidX; this.normals[v+7]  = nMidY; this.normals[v+8]  = nMidZ;
      this.normals[v+9]   = nMidX; this.normals[v+10] = nMidY; this.normals[v+11] = nMidZ;
      this.localYs[baseIdx+2] = midH;
      this.localYs[baseIdx+3] = midH;

      this.vertices[v+12] = p4x; this.vertices[v+13] = p4y; this.vertices[v+14] = p4z;
      this.normals[v+12]  = nx2; this.normals[v+13]  = ny2; this.normals[v+14]  = nz2;
      this.localYs[baseIdx+4] = h;

      const vGrass = baseIdx * 4;
      for (let k = 0; k < 5; k++) {
        this.grassInfo[vGrass + k*4]     = colorVar;
        this.grassInfo[vGrass + k*4 + 1] = phase;
        this.grassInfo[vGrass + k*4 + 2] = stiffness;
        this.grassInfo[vGrass + k*4 + 3] = dryness;
      }

      const idx = this.iIdx;
      this.indices[idx]   = baseIdx;     this.indices[idx+1] = baseIdx + 1; this.indices[idx+2] = baseIdx + 2;
      this.indices[idx+3] = baseIdx + 1; this.indices[idx+4] = baseIdx + 3; this.indices[idx+5] = baseIdx + 2;
      this.indices[idx+6] = baseIdx + 2; this.indices[idx+7] = baseIdx + 3; this.indices[idx+8] = baseIdx + 4;

      this.vIdx += 15;
      this.iIdx += 9;
    }
  }

  displayShared() {
    const gl = this.scene.gl;
    const localYAttrib    = this.shader.attributes.aLocalY;
    const grassInfoAttrib = this.shader.attributes.aGrassInfo;

    if (localYAttrib != null) {
      gl.enableVertexAttribArray(localYAttrib);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.localYBuffer);
      gl.vertexAttribPointer(localYAttrib, 1, gl.FLOAT, false, 0, 0);
    }
    if (grassInfoAttrib != null) {
      gl.enableVertexAttribArray(grassInfoAttrib);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.grassInfoBuffer);
      gl.vertexAttribPointer(grassInfoAttrib, 4, gl.FLOAT, false, 0, 0);
    }

    this.drawElements(this.primitiveType);

    if (localYAttrib != null)    gl.disableVertexAttribArray(localYAttrib);
    if (grassInfoAttrib != null) gl.disableVertexAttribArray(grassInfoAttrib);
  }
}
