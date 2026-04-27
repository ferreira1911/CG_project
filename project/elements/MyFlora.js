import { CGFobject, CGFappearance } from '../../lib/CGF.js';

const CYLINDER_SLICES = 8;

// Holds a pre-built vertex/normal/index/UV array as a single CGFobject.
// One draw call regardless of how many primitives went into it.
class BakedMesh extends CGFobject {
  constructor(scene, vertices, normals, indices, texCoords) {
    super(scene);
    this.vertices = vertices;
    this.normals = normals;
    this.indices = indices;
    if (texCoords) this.texCoords = texCoords;
    this.primitiveType = scene.gl.TRIANGLES;
    this.initGLBuffers();
  }
}

export class MyFlora extends CGFobject {
  /**
   * @param scene
   * @param x, y, z: World position of the trunk base
   * @param scale: Overall scale multiplier for the whole plant
   * @param depth: How many times the branches split
   * @param angle: Branch split angle in degrees
   * @param trunkLength: Height of the bottom branch
   * @param lengthDecay: How much shorter the next branch gets (e.g., 0.75)
   * @param initialThickness: Trunk thickness
   * @param thicknessDecay: How much thinner the next branch gets (e.g., 0.6)
   * @param angleJitter: Max random branch-angle deviation, in degrees
   * @param petalCount: Number of petals per flower
   * @param petalSize: Petal size as a multiplier of the tip-branch length (e.g. 1.5)
   * @param petalTilt: Petal upward tilt in degrees (0 = flat, 90 = vertical)
   * @param petalJitter: ±fraction applied to per-petal size and tilt (e.g., 0.3 = ±30%)
   * @param petalTexture: CGFtexture for the petals, or null
   * @param seed: Per-instance seed; same seed → same shape every frame
   */
  constructor(scene,
              x, y, z, scale,
              depth, angle, trunkLength, lengthDecay,
              initialThickness, thicknessDecay, angleJitter,
              petalCount, petalSize, petalTilt, petalJitter,
              petalTexture,
              seed) {
    super(scene);

    this.x = x; this.y = y; this.z = z;
    this.scale = scale;

    this.maxDepth = depth;
    this.angle = angle * (Math.PI / 180);
    this.trunkLength = trunkLength;
    this.lengthDecay = lengthDecay;
    this.initialThickness = initialThickness;
    this.thicknessDecay = thicknessDecay;
    this.angleJitter = angleJitter * (Math.PI / 180);

    this.petalCount = petalCount;
    this.petalSize = petalSize;
    this.petalTilt = petalTilt * (Math.PI / 180);
    this.petalJitter = petalJitter;

    this.seed = seed;

    this.initMaterials();

    if (petalTexture) {
      this.petalAppearance.setTexture(petalTexture);
      this.petalAppearance.setTextureWrap('REPEAT', 'REPEAT');
    }

    // Bake the entire L-system into two static meshes (branches, petals).
    // After this, display() is two draw calls regardless of recursion depth.
    this._bv = []; this._bn = []; this._bi = [];
    this._pv = []; this._pn = []; this._pi = []; this._pu = [];
    this._mat = mat4.create();
    this._matStack = [];
    this.randCounter = 0;

    this._bake(this.maxDepth, this.trunkLength, this.initialThickness);

    this.branchMesh = new BakedMesh(this.scene, this._bv, this._bn, this._bi);
    this.petalMesh = this._pi.length > 0
      ? new BakedMesh(this.scene, this._pv, this._pn, this._pi, this._pu)
      : null;

    this._bv = this._bn = this._bi = null;
    this._pv = this._pn = this._pi = this._pu = null;
    this._mat = null;
    this._matStack = null;
  }

  initMaterials() {
    // Branches: green stem material, no texture
    this.branchAppearance = new CGFappearance(this.scene);
    this.branchAppearance.setAmbient(0.10, 0.30, 0.10, 1.0);
    this.branchAppearance.setDiffuse(0.20, 0.55, 0.20, 1.0);
    this.branchAppearance.setSpecular(0.05, 0.10, 0.05, 1.0);
    this.branchAppearance.setShininess(8.0);

    // Petals: white-ish base so the texture's colour is preserved when applied
    this.petalAppearance = new CGFappearance(this.scene);
    this.petalAppearance.setAmbient(0.6, 0.6, 0.6, 1.0);
    this.petalAppearance.setDiffuse(1.0, 1.0, 1.0, 1.0);
    this.petalAppearance.setSpecular(0.2, 0.2, 0.2, 1.0);
    this.petalAppearance.setShininess(20.0);
  }

  // Deterministic pseudo-random in [0,1) keyed by (seed, call index).
  rand() {
    this.randCounter++;
    const x = Math.sin(this.randCounter * 12.9898 + this.seed * 78.233) * 43758.5453;
    return x - Math.floor(x);
  }

  // ---- Manual matrix stack used during baking ----
  _push() { this._matStack.push(mat4.clone(this._mat)); }
  _pop()  { this._mat = this._matStack.pop(); }
  _translate(x, y, z) { mat4.translate(this._mat, this._mat, [x, y, z]); }
  _rotateX(r) { mat4.rotateX(this._mat, this._mat, r); }
  _rotateY(r) { mat4.rotateY(this._mat, this._mat, r); }
  _rotateZ(r) { mat4.rotateZ(this._mat, this._mat, r); }
  _scale(x, y, z) { mat4.scale(this._mat, this._mat, [x, y, z]); }

  // Inverse-transpose of the upper-left 3x3 of this._mat (column-major mat3).
  // Inlined because the CGF gl-matrix bundle is missing mat3.fromMat4 etc.
  _normalMatrix() {
    const m = this._mat;
    const a = m[0], b = m[4], c = m[8];
    const d = m[1], e = m[5], f = m[9];
    const g = m[2], h = m[6], i = m[10];
    const det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
    const k = det !== 0 ? 1 / det : 0;
    return [
      (e * i - f * h) * k,
      (c * h - b * i) * k,
      (b * f - c * e) * k,
      (f * g - d * i) * k,
      (a * i - c * g) * k,
      (c * d - a * f) * k,
      (d * h - e * g) * k,
      (b * g - a * h) * k,
      (a * e - b * d) * k,
    ];
  }

  _txPos(lx, ly, lz, out) {
    const m = this._mat;
    out[0] = m[0] * lx + m[4] * ly + m[8]  * lz + m[12];
    out[1] = m[1] * lx + m[5] * ly + m[9]  * lz + m[13];
    out[2] = m[2] * lx + m[6] * ly + m[10] * lz + m[14];
  }

  _txNorm(nm, nx, ny, nz, out) {
    const x = nm[0] * nx + nm[3] * ny + nm[6] * nz;
    const y = nm[1] * nx + nm[4] * ny + nm[7] * nz;
    const z = nm[2] * nx + nm[5] * ny + nm[8] * nz;
    const len = Math.hypot(x, y, z) || 1;
    out[0] = x / len; out[1] = y / len; out[2] = z / len;
  }

  // Emit one cylinder (8 slices, 1 stack, y=0..1) under the current matrix.
  // Mirrors MyCylinder(scene, 8, 1).
  _emitCylinder() {
    const nm = this._normalMatrix();
    const base = this._bv.length / 3;
    const tmp = [0, 0, 0];
    for (let s = 0; s <= 1; s++) {
      for (let i = 0; i <= CYLINDER_SLICES; i++) {
        const a = (i / CYLINDER_SLICES) * Math.PI * 2;
        const lx = Math.cos(a), lz = Math.sin(a);
        this._txPos(lx, s, lz, tmp);
        this._bv.push(tmp[0], tmp[1], tmp[2]);
        this._txNorm(nm, lx, 0, lz, tmp);
        this._bn.push(tmp[0], tmp[1], tmp[2]);
      }
    }
    const ring = CYLINDER_SLICES + 1;
    for (let i = 0; i < CYLINDER_SLICES; i++) {
      const cur = base + i, nxt = cur + 1;
      const top = cur + ring, topNext = top + 1;
      this._bi.push(cur, nxt, top, nxt, topNext, top);
    }
  }

  // Emit one double-sided quad (matches MyQuad: -0.5..0.5 in XY, both faces).
  _emitQuad() {
    const nm = this._normalMatrix();
    const base = this._pv.length / 3;
    const localPos = [
      -0.5, -0.5, 0,   0.5, -0.5, 0,   -0.5, 0.5, 0,   0.5, 0.5, 0,
      -0.5, -0.5, 0,   0.5, -0.5, 0,   -0.5, 0.5, 0,   0.5, 0.5, 0,
    ];
    const localNor = [
      0, 0,  1,  0, 0,  1,  0, 0,  1,  0, 0,  1,
      0, 0, -1,  0, 0, -1,  0, 0, -1,  0, 0, -1,
    ];
    const uvs = [0,1, 1,1, 0,0, 1,0, 0,1, 1,1, 0,0, 1,0];
    const tmp = [0, 0, 0];
    for (let i = 0; i < 8; i++) {
      this._txPos(localPos[i*3], localPos[i*3+1], localPos[i*3+2], tmp);
      this._pv.push(tmp[0], tmp[1], tmp[2]);
      this._txNorm(nm, localNor[i*3], localNor[i*3+1], localNor[i*3+2], tmp);
      this._pn.push(tmp[0], tmp[1], tmp[2]);
      this._pu.push(uvs[i*2], uvs[i*2+1]);
    }
    this._pi.push(
      base + 0, base + 1, base + 2,
      base + 1, base + 3, base + 2,
      base + 6, base + 5, base + 4,
      base + 6, base + 7, base + 5
    );
  }

  // Same recursion shape as the old drawBranch, but emits geometry into
  // the accumulating buffers instead of issuing draw calls.
  _bake(currentDepth, currentLength, currentThickness) {
    if (currentDepth === 0) {
      this._push();
      for (let i = 0; i < this.petalCount; i++) {
        const sizeJ = 1 + (this.rand() - 0.5) * 2 * this.petalJitter;
        const tiltJ = (this.rand() - 0.5) * 2 * this.petalJitter;
        const sBase = currentLength * this.petalSize * sizeJ;
        const sH    = sBase * 1.3;

        this._push();
        this._rotateY(i * (Math.PI * 2) / this.petalCount);
        this._rotateX(this.petalTilt + tiltJ);
        this._translate(0, sH * 0.5, 0);
        this._scale(sBase, sH, sBase);
        this._emitQuad();
        this._pop();
      }
      this._pop();
      return;
    }

    this._push();
    this._scale(currentThickness, currentLength, currentThickness);
    this._emitCylinder();
    this._pop();

    this._push();
    this._translate(0, currentLength, 0);

    const jitterL = (this.rand() - 0.5) * 2 * this.angleJitter;
    this._push();
    this._rotateZ(this.angle + jitterL);
    this._bake(currentDepth - 1,
               currentLength * this.lengthDecay,
               currentThickness * this.thicknessDecay);
    this._pop();

    const jitterR = (this.rand() - 0.5) * 2 * this.angleJitter;
    this._push();
    this._rotateZ(-this.angle + jitterR);
    this._bake(currentDepth - 1,
               currentLength * this.lengthDecay,
               currentThickness * this.thicknessDecay);
    this._pop();

    this._pop();
  }

  display() {
    this.scene.pushMatrix();
    this.scene.translate(this.x, this.y, this.z);
    this.scene.scale(this.scale, this.scale, this.scale);

    this.branchAppearance.apply();
    this.branchMesh.display();

    if (this.petalMesh) {
      this.petalAppearance.apply();
      this.petalMesh.display();
    }

    this.scene.popMatrix();
  }
}
