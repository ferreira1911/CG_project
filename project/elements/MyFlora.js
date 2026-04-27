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

// Local (untransformed) leaf-cluster geometry — three perpendicular quads,
// 24 verts, both winding orders for double-sidedness. Mirrors MyLeafCluster.
const LEAF = (() => {
  const verts = [], norms = [], uvs = [], inds = [];
  const angles = [0, Math.PI / 3, 2 * Math.PI / 3];
  for (let qi = 0; qi < angles.length; qi++) {
    const a = angles[qi];
    const ca = Math.cos(a), sa = Math.sin(a);
    const r  = (x, y, z) => [x * ca + z * sa, y, -x * sa + z * ca];
    const v0 = r(-0.5, -0.5, 0);
    const v1 = r( 0.5, -0.5, 0);
    const v2 = r(-0.5,  0.5, 0);
    const v3 = r( 0.5,  0.5, 0);
    const nF = r(0, 0,  1);
    const nB = r(0, 0, -1);
    const off = verts.length / 3;
    verts.push(...v0, ...v1, ...v2, ...v3, ...v0, ...v1, ...v2, ...v3);
    norms.push(...nF, ...nF, ...nF, ...nF, ...nB, ...nB, ...nB, ...nB);
    uvs.push(0,1, 1,1, 0,0, 1,0, 0,1, 1,1, 0,0, 1,0);
    inds.push(
      off + 0, off + 1, off + 2,
      off + 1, off + 3, off + 2,
      off + 6, off + 5, off + 4,
      off + 6, off + 7, off + 5
    );
  }
  return { verts, norms, uvs, inds };
})();

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
   * @param petalSize: Petal size as a multiplier of the tip-branch length
   * @param petalTilt: Petal upward tilt in degrees
   * @param petalJitter: ±fraction applied to per-petal size and tilt
   * @param petalTexture: CGFtexture for the petals, or null
   * @param branchTexture: CGFtexture for the branches, or null
   * @param seed: Per-instance seed; same seed → same shape every time
   */
  constructor(scene,
              x, y, z, scale,
              depth, angle, trunkLength, lengthDecay,
              initialThickness, thicknessDecay, angleJitter,
              petalCount, petalSize, petalTilt, petalJitter,
              petalTexture,
              branchTexture,
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
    if (branchTexture) {
      this.branchAppearance.setTexture(branchTexture);
      this.branchAppearance.setTextureWrap('REPEAT', 'REPEAT');
    }

    this.branchShader = this.scene.branchShader;

    // Bake the entire L-system into two static meshes (branches, leaves).
    // After this, display() is two draw calls regardless of recursion depth.
    this._bv = []; this._bn = []; this._bt = []; this._bi = [];
    this._pv = []; this._pn = []; this._pt = []; this._pi = [];
    this._mat = mat4.create();
    this._matStack = [];
    this.randCounter = 0;

    this._bake(this.maxDepth, this.trunkLength, this.initialThickness);

    this.branchMesh = new BakedMesh(scene, this._bv, this._bn, this._bi, this._bt);
    this.petalMesh  = this._pi.length > 0
      ? new BakedMesh(scene, this._pv, this._pn, this._pi, this._pt)
      : null;

    this._bv = this._bn = this._bt = this._bi = null;
    this._pv = this._pn = this._pt = this._pi = null;
    this._mat = null;
    this._matStack = null;
  }

  initMaterials() {
    this.branchAppearance = new CGFappearance(this.scene);
    this.branchAppearance.setAmbient(0.2, 0.15, 0.1, 1.0);
    this.branchAppearance.setDiffuse(0.4, 0.3, 0.2, 1.0);
    this.branchAppearance.setSpecular(0.02, 0.02, 0.02, 1.0);
    this.branchAppearance.setShininess(2.0);

    this.petalAppearance = new CGFappearance(this.scene);
    this.petalAppearance.setAmbient(0.1, 0.3, 0.1, 1.0);
    this.petalAppearance.setDiffuse(0.2, 0.6, 0.2, 1.0);
    this.petalAppearance.setSpecular(0.1, 0.1, 0.1, 1.0);
    this.petalAppearance.setShininess(10.0);
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
  // Inlined because the CGF gl-matrix bundle is missing mat3.fromMat4.
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

  // Emit one cylinder under the current matrix. Branch normals are LOCAL
  // (untransformed) to match branch.vert which doesn't apply uNMatrix.
  // V texcoord is pre-multiplied by currentLength so we can keep the shader
  // contract intact while setting uLength once per draw instead of per-branch.
  _emitCylinder(currentLength) {
    const base = this._bv.length / 3;
    const tmp = [0, 0, 0];
    for (let s = 0; s <= 1; s++) {
      for (let i = 0; i <= CYLINDER_SLICES; i++) {
        const a = (i / CYLINDER_SLICES) * Math.PI * 2;
        const lx = Math.cos(a), lz = Math.sin(a);
        this._txPos(lx, s, lz, tmp);
        this._bv.push(tmp[0], tmp[1], tmp[2]);
        this._bn.push(lx, 0, lz);
        this._bt.push(i / CYLINDER_SLICES, (1 - s) * currentLength);
      }
    }
    const ring = CYLINDER_SLICES + 1;
    for (let i = 0; i < CYLINDER_SLICES; i++) {
      const cur = base + i, nxt = cur + 1;
      const top = cur + ring, topNext = top + 1;
      this._bi.push(cur, nxt, top, nxt, topNext, top);
    }
  }

  _emitLeafCluster() {
    const nm = this._normalMatrix();
    const base = this._pv.length / 3;
    const tmp = [0, 0, 0];
    for (let i = 0; i < 24; i++) {
      this._txPos(LEAF.verts[i*3], LEAF.verts[i*3+1], LEAF.verts[i*3+2], tmp);
      this._pv.push(tmp[0], tmp[1], tmp[2]);
      this._txNorm(nm, LEAF.norms[i*3], LEAF.norms[i*3+1], LEAF.norms[i*3+2], tmp);
      this._pn.push(tmp[0], tmp[1], tmp[2]);
      this._pt.push(LEAF.uvs[i*2], LEAF.uvs[i*2+1]);
    }
    for (let k = 0; k < LEAF.inds.length; k++) {
      this._pi.push(base + LEAF.inds[k]);
    }
  }

  // Same recursion shape and rand consumption as the merged drawBranch with
  // pass='both', but emits geometry into the accumulating buffers instead of
  // issuing draw calls.
  _bake(currentDepth, currentLength, currentThickness) {
    // Leaves on inner branches (depths 0, 1, 2)
    if (currentDepth <= 2) {
      const drawLeaves = currentDepth === 0 || this.rand() < 0.6;
      if (drawLeaves) {
        for (let i = 0; i < this.petalCount; i++) {
          const sizeJ = 1 + (this.rand() - 0.5) * 2 * this.petalJitter;
          const tiltJ = (this.rand() - 0.5) * 2 * this.petalJitter;
          const sBase = 0.2 * this.petalSize * sizeJ;
          const sH    = sBase * 1.5;

          this._push();
          this._rotateY(i * (Math.PI * 2) / this.petalCount);
          this._rotateX(this.petalTilt + tiltJ);
          this._translate(0, sH * 0.5, 0);
          this._scale(sBase, sH, sBase);
          this._emitLeafCluster();
          this._pop();
        }
      }

      if (currentDepth === 0) return;
    }

    // Branch cylinder
    this._push();
    this._scale(currentThickness, currentLength, currentThickness);
    this._emitCylinder(currentLength);
    this._pop();

    // Mid-branch leaves
    let numMidLeaves = 0;
    if (currentDepth > 0 && currentDepth <= 3) {
      if (this.rand() < 0.6) {
        numMidLeaves = Math.floor(1 + this.rand() * 2);
      }
    }
    for (let i = 0; i < numMidLeaves; i++) {
      const heightPos = currentLength * (0.2 + this.rand() * 0.6);
      const sizeJ = 1 + (this.rand() - 0.5) * 2 * this.petalJitter;
      const tiltJ = (this.rand() - 0.5) * 2 * this.petalJitter;
      const angleY = this.rand() * Math.PI * 2;

      const sBase = 0.2 * this.petalSize * sizeJ * 0.7;
      const sH    = sBase * 1.5;

      this._push();
      this._translate(0, heightPos, 0);
      this._rotateY(angleY);
      this._rotateX(this.petalTilt + tiltJ + 0.5);
      this._translate(0, sH * 0.5, 0);
      this._scale(sBase, sH, sBase);
      this._emitLeafCluster();
      this._pop();
    }

    // Recurse: leader + side branches
    this._push();
    this._translate(0, currentLength, 0);

    this._push();
    this._rotateY(this.rand() * Math.PI * 2);
    const jitterMain = (this.rand() - 0.5) * this.angleJitter;
    this._rotateZ((this.angle * 0.2) + jitterMain);
    this._bake(currentDepth - 1,
               currentLength * this.lengthDecay,
               currentThickness * this.thicknessDecay);
    this._pop();

    const numSideBranches = Math.floor(1.2 + this.rand() * 1.5);
    for (let b = 0; b < numSideBranches; b++) {
      this._push();
      this._rotateY(this.rand() * Math.PI * 2);
      const jitterSide = (this.rand() - 0.5) * 2 * this.angleJitter;
      this._rotateZ(this.angle * (1.0 + this.rand() * 0.5) + jitterSide);

      const sideLengthDecay = this.lengthDecay * (0.7 + this.rand() * 0.2);
      const sideThicknessDecay = this.thicknessDecay * 0.75;

      this._bake(currentDepth - 1,
                 currentLength * sideLengthDecay,
                 currentThickness * sideThicknessDecay);
      this._pop();
    }

    this._pop();
  }

  // Caller is responsible for setting the branch shader + uLength uniform once
  // for the whole batch of floras, so we don't pay shader/uniform churn per plant.
  displayBranches() {
    this.scene.pushMatrix();
    this.scene.translate(this.x, this.y, this.z);
    this.scene.scale(this.scale, this.scale, this.scale);
    this.branchAppearance.apply();
    this.branchMesh.display();
    this.scene.popMatrix();
  }

  // Caller is responsible for setting the default shader once for the batch.
  displayLeaves() {
    if (!this.petalMesh) return;
    this.scene.pushMatrix();
    this.scene.translate(this.x, this.y, this.z);
    this.scene.scale(this.scale, this.scale, this.scale);
    this.petalAppearance.apply();
    this.petalMesh.display();
    this.scene.popMatrix();
  }

  // Standalone path — slower, only used if MyScene hasn't been updated to batch.
  display() {
    this.scene.setActiveShader(this.branchShader);
    this.branchShader.setUniformsValues({ uLength: 1.0 });
    this.displayBranches();
    this.scene.setActiveShader(this.scene.defaultShader);
    this.displayLeaves();
  }
}
