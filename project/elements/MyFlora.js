import { CGFobject, CGFappearance } from '../../lib/CGF.js';

const CYLINDER_SLICES = 8;

// Conifer needle spray: a fan of blunt-tipped tapered blades radiating from a
// twig tip. Defined once at module load; per-tip variety comes from the
// transform applied in _emitSprig's callers (rotateY + rotateX + scale).
const SPRIG = (() => {
  const verts = [], norms = [], uvs = [], inds = [];
  const SPIKES = 7;
  const SPREAD = 0.85;  // radial splay of each blade
  const LIFT   = 0.80;  // forward component (along the branch axis +Y)
  const DROOP  = 0.32;  // how far the blade tip sags below the lift
  const WROOT  = 0.17;  // half-width at the root (wide → not needle-like)
  const WTIP   = 0.07;  // half-width at the tip (blunt — non-zero)

  for (let s = 0; s < SPIKES; s++) {
    const a  = (s / SPIKES) * Math.PI * 2;
    const ca = Math.cos(a), sa = Math.sin(a);
    const tc = [SPREAD * ca, LIFT - DROOP, SPREAD * sa];
    const px = -sa, pz = ca;
    const r0 = [ px * WROOT, 0,  pz * WROOT];
    const r1 = [-px * WROOT, 0, -pz * WROOT];
    const t0 = [tc[0] + px * WTIP, tc[1], tc[2] + pz * WTIP];
    const t1 = [tc[0] - px * WTIP, tc[1], tc[2] - pz * WTIP];
    const o  = verts.length / 3;
    verts.push(...r0, ...r1, ...t1, ...t0);

    const e1 = [r1[0]-r0[0], r1[1]-r0[1], r1[2]-r0[2]];
    const e2 = [t0[0]-r0[0], t0[1]-r0[1], t0[2]-r0[2]];
    let nx = e1[1]*e2[2]-e1[2]*e2[1];
    let ny = e1[2]*e2[0]-e1[0]*e2[2];
    let nz = e1[0]*e2[1]-e1[1]*e2[0];
    const L = Math.sqrt(nx*nx+ny*ny+nz*nz) || 1;
    nx /= L; ny /= L; nz /= L;
    norms.push(nx,ny,nz, nx,ny,nz, nx,ny,nz, nx,ny,nz);
    uvs.push(0,0, 1,0, 1,1, 0,1);
    inds.push(o, o+1, o+2,  o, o+2, o+3);
  }
  return { verts, norms, uvs, inds };
})();

// Single flower petal: two-sided crescent fan with vertex 0 at the stalk
// attachment, fanning outward to a half-circle.
const PETAL = (() => {
  const verts = [0,0,0], norms = [0,0,1], uvs = [0.5,1], inds = [];
  const sides = 8;
  for (let i = 0; i <= sides; i++) {
    const a = Math.PI + (i / sides) * Math.PI;
    const x = Math.cos(a) * 0.5;
    const y = Math.sin(a) * -1.0;
    verts.push(x, y, 0);
    norms.push(0, 0, 1);
    uvs.push(0.5 + x, 1.0 - y);
    if (i > 0) inds.push(0, i, i + 1);
  }
  const off = verts.length / 3;
  for (let i = 0; i < off; i++) {
    verts.push(verts[i*3], verts[i*3+1], -verts[i*3+2]);
    norms.push(0, 0, -1);
    uvs.push(uvs[i*2], uvs[i*2+1]);
  }
  const baseInds = [...inds];
  for (let k = 0; k < baseInds.length; k += 3) {
    inds.push(baseInds[k] + off, baseInds[k+2] + off, baseInds[k+1] + off);
  }
  return { verts, norms, uvs, inds };
})();

// Octagonal disc at the centre of the flower.
const DISK = (() => {
  const verts = [0,0,0], norms = [0,1,0], uvs = [0.5, 0.5], inds = [];
  const sides = 8;
  for (let i = 0; i <= sides; i++) {
    const a = (i / sides) * Math.PI * 2;
    verts.push(Math.cos(a)*0.5, 0, Math.sin(a)*0.5);
    norms.push(0, 1, 0);
    uvs.push(0.5 + Math.cos(a)*0.5, 0.5 + Math.sin(a)*0.5);
    if (i > 0) inds.push(0, i, i === sides ? 1 : i + 1);
  }
  const off = verts.length / 3;
  for (let i = 0; i < off; i++) {
    verts.push(verts[i*3], -verts[i*3+1], verts[i*3+2]);
    norms.push(0, -1, 0);
    uvs.push(uvs[i*2], uvs[i*2+1]);
  }
  const baseInds = [...inds];
  for (let k = 0; k < baseInds.length; k += 3) {
    inds.push(baseInds[k] + off, baseInds[k+2] + off, baseInds[k+1] + off);
  }
  return { verts, norms, uvs, inds };
})();


// Wraps an interleaved CGFobject around already-built buffer arrays.
class SubMesh extends CGFobject {
  constructor(scene, v, n, i, t) {
    super(scene);
    this.vertices = v; this.normals = n; this.indices = i; this.texCoords = t;
    this.initGLBuffers();
  }
}

// L-system flora — flowers (isTree=false) or conifers (isTree=true). At
// construct time the recursive _bake walks the structure with a software
// matrix stack, accumulating one CPU-side vertex list per material slot
// (branches / petals / centers), and uploads them once. After bake, the
// per-instance display() is two or three draw calls — no recursion runs.
export class MyFlora extends CGFobject {
  constructor(scene,
              x, y, z, scale,
              depth, angle, trunkLength, lengthDecay,
              initialThickness, thicknessDecay, angleJitter,
              petalCount, petalSize, petalTilt, petalJitter,
              petalTexture,
              branchTexture,
              seed,
              isTree = false,
              petalColor = [0.8, 0.2, 0.2],
              deferGLInit = false) {
    super(scene);

    this.x = x; this.y = y; this.z = z;
    this.scale = scale;

    this.fallAngle = 0;
    this.fallAxis  = [1, 0, 0];
    this.isTree    = isTree;

    this.maxDepth         = depth;
    this.angle            = angle * (Math.PI / 180);
    this.trunkLength      = trunkLength;
    this.lengthDecay      = lengthDecay;
    this.initialThickness = initialThickness;
    this.thicknessDecay   = thicknessDecay;
    this.angleJitter      = angleJitter * (Math.PI / 180);

    this.petalCount  = petalCount;
    this.petalSize   = petalSize;
    this.petalTilt   = petalTilt * (Math.PI / 180);
    this.petalJitter = petalJitter;
    this.petalColor  = petalColor;

    this.seed        = seed;
    this.randCounter = 0;

    this._initAppearances(branchTexture, petalTexture, petalColor);
    this._bakeMesh(deferGLInit, scene);

    // Cache diffuse color slices so display() never allocates on the hot path.
    this._branchColor = this.branchApp.diffuse.slice(0, 3);
    this._petalColor  = this.petalApp.diffuse.slice(0, 3);
    this._centerColor = this.centerApp ? this.centerApp.diffuse.slice(0, 3) : [0.9, 0.9, 0.2];
  }

  _initAppearances(branchTexture, petalTexture, petalColor) {
    this.branchApp = new CGFappearance(this.scene);
    if (this.isTree) {
      this.branchApp.setAmbient(0.2, 0.15, 0.1, 1.0);
      this.branchApp.setDiffuse(0.4, 0.3, 0.2, 1.0);
      if (branchTexture) this.branchApp.setTexture(branchTexture);
    } else {
      this.branchApp.setAmbient(0.1, 0.2, 0.1, 1.0);
      this.branchApp.setDiffuse(0.2, 0.5, 0.2, 1.0);
    }

    this.petalApp = new CGFappearance(this.scene);
    if (this.isTree) {
      // Deep desaturated pine green so it reads as conifer foliage rather
      // than bright flat leaves.
      this.petalApp.setAmbient(0.05, 0.14, 0.08, 1.0);
      this.petalApp.setDiffuse(0.12, 0.34, 0.18, 1.0);
    } else {
      this.petalApp.setAmbient(petalColor[0] * 0.6, petalColor[1] * 0.6, petalColor[2] * 0.6, 1.0);
      this.petalApp.setDiffuse(petalColor[0] * 0.9, petalColor[1] * 0.9, petalColor[2] * 0.9, 1.0);
      if (petalTexture) this.petalApp.setTexture(petalTexture);
    }
    this.petalApp.setSpecular(0.2, 0.2, 0.2, 1.0);
    this.petalApp.setShininess(10.0);

    if (!this.isTree) {
      this.centerApp = new CGFappearance(this.scene);
      this.centerApp.setAmbient(0.5, 0.5, 0.1, 1.0);
      this.centerApp.setDiffuse(0.9, 0.9, 0.2, 1.0);
      this.centerApp.setSpecular(0.2, 0.2, 0.2, 1.0);
    }
  }

  _bakeMesh(deferGLInit, scene) {
    this._bv = []; this._bn = []; this._bi = []; this._bt = [];
    this._pv = []; this._pn = []; this._pi = []; this._pt = [];
    this._cv = []; this._cn = []; this._ci = []; this._ct = [];

    this._mat = mat4.create();
    this._matStack = [];

    this._bake(this.maxDepth, this.trunkLength, this.initialThickness);

    // deferGLInit=true lets MyFloraBatch take ownership of the CPU buffers
    // and concatenate them before uploading; without it we upload immediately.
    if (deferGLInit) return;

    this.branchMesh = new SubMesh(scene, this._bv, this._bn, this._bi, this._bt);
    this.petalMesh  = this._pi.length > 0 ? new SubMesh(scene, this._pv, this._pn, this._pi, this._pt) : null;
    this.centerMesh = this._ci.length > 0 ? new SubMesh(scene, this._cv, this._cn, this._ci, this._ct) : null;

    this._bv = this._bn = this._bi = this._bt = null;
    this._pv = this._pn = this._pi = this._pt = null;
    this._cv = this._cn = this._ci = this._ct = null;
  }

  // Deterministic hashed RNG keyed on seed + counter so two trees with the
  // same parameters but different seeds bake to different shapes.
  rand() {
    this.randCounter++;
    const x = Math.sin(this.randCounter * 12.9898 + this.seed * 78.233) * 43758.5453;
    return x - Math.floor(x);
  }

  _push() { this._matStack.push(mat4.clone(this._mat)); }
  _pop()  { this._mat = this._matStack.pop(); }
  _translate(x, y, z) { mat4.translate(this._mat, this._mat, [x, y, z]); }
  _rotateX(r) { mat4.rotateX(this._mat, this._mat, r); }
  _rotateY(r) { mat4.rotateY(this._mat, this._mat, r); }
  _rotateZ(r) { mat4.rotateZ(this._mat, this._mat, r); }
  _scale(x, y, z) { mat4.scale(this._mat, this._mat, [x, y, z]); }

  // Inverse-transpose of the upper 3x3 of the model matrix — used to bring
  // local normals into the baked world frame without applying the matrix's
  // non-uniform scale to them.
  _normalMatrix() {
    const m = this._mat;
    const a = m[0], b = m[4], c = m[8], d = m[1], e = m[5], f = m[9], g = m[2], h = m[6], i = m[10];
    const det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
    const k = det !== 0 ? 1 / det : 0;
    return [
      (e * i - f * h) * k, (c * h - b * i) * k, (b * f - c * e) * k,
      (f * g - d * i) * k, (a * i - c * g) * k, (c * d - a * f) * k,
      (d * h - e * g) * k, (b * g - a * h) * k, (a * e - b * d) * k,
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
    const len = Math.sqrt(x*x + y*y + z*z) || 1;
    out[0] = x / len; out[1] = y / len; out[2] = z / len;
  }

  _emitCylinder(currentLength) {
    const nm = this._normalMatrix();
    const base = this._bv.length / 3;
    const tmp = [0, 0, 0];
    for (let s = 0; s <= 1; s++) {
      for (let i = 0; i <= CYLINDER_SLICES; i++) {
        const a = (i / CYLINDER_SLICES) * Math.PI * 2;
        const lx = Math.cos(a), lz = Math.sin(a);
        this._txPos(lx, s, lz, tmp);
        this._bv.push(...tmp);
        this._txNorm(nm, lx, 0, lz, tmp);
        this._bn.push(...tmp);
        this._bt.push(i / CYLINDER_SLICES, (1 - s) * currentLength);
      }
    }
    const ring = CYLINDER_SLICES + 1;
    for (let i = 0; i < CYLINDER_SLICES; i++) {
      const cur = base + i, nxt = cur + 1, top = cur + ring, topNext = top + 1;
      // Outward winding under CCW front + back-face culling. Order (cur,nxt,top)
      // would face inward and get culled.
      this._bi.push(cur, top, nxt, nxt, top, topNext);
    }
  }

  _emitSprig() {
    const nm = this._normalMatrix();
    const base = this._pv.length / 3;
    const tmp = [0, 0, 0];
    for (let i = 0; i < SPRIG.verts.length / 3; i++) {
      this._txPos(SPRIG.verts[i*3], SPRIG.verts[i*3+1], SPRIG.verts[i*3+2], tmp);
      this._pv.push(...tmp);
      this._txNorm(nm, SPRIG.norms[i*3], SPRIG.norms[i*3+1], SPRIG.norms[i*3+2], tmp);
      this._pn.push(...tmp);
      this._pt.push(SPRIG.uvs[i*2], SPRIG.uvs[i*2+1]);
    }
    for (let k = 0; k < SPRIG.inds.length; k++) this._pi.push(base + SPRIG.inds[k]);
  }

  _emitPetal() {
    const nm = this._normalMatrix();
    const base = this._pv.length / 3;
    const tmp = [0, 0, 0];
    for (let i = 0; i < PETAL.verts.length / 3; i++) {
      this._txPos(PETAL.verts[i*3], PETAL.verts[i*3+1], PETAL.verts[i*3+2], tmp);
      this._pv.push(...tmp);
      this._txNorm(nm, PETAL.norms[i*3], PETAL.norms[i*3+1], PETAL.norms[i*3+2], tmp);
      this._pn.push(...tmp);
      this._pt.push(PETAL.uvs[i*2], PETAL.uvs[i*2+1]);
    }
    for (let k = 0; k < PETAL.inds.length; k++) this._pi.push(base + PETAL.inds[k]);
  }

  _emitCenter() {
    const nm = this._normalMatrix();
    const base = this._cv.length / 3;
    const tmp = [0, 0, 0];
    for (let i = 0; i < DISK.verts.length / 3; i++) {
      this._txPos(DISK.verts[i*3], DISK.verts[i*3+1], DISK.verts[i*3+2], tmp);
      this._cv.push(...tmp);
      this._txNorm(nm, DISK.norms[i*3], DISK.norms[i*3+1], DISK.norms[i*3+2], tmp);
      this._cn.push(...tmp);
      this._ct.push(DISK.uvs[i*2], DISK.uvs[i*2+1]);
    }
    for (let k = 0; k < DISK.inds.length; k++) this._ci.push(base + DISK.inds[k]);
  }

  _bake(currentDepth, currentLength, currentThickness) {
    if (this.isTree && currentDepth === 0) {
      // Conifer foliage lives only at twig tips — placing it deeper would
      // bury it inside bark cylinders.
      const n = 2 + Math.floor(this.rand() * 2);
      for (let i = 0; i < n; i++) {
        const sz = this.petalSize * (0.8 + this.rand() * 0.5);
        this._push();
        this._rotateY(this.rand() * Math.PI * 2);
        this._rotateX((this.rand() - 0.5) * 0.6);
        this._scale(sz, sz, sz);
        this._emitSprig();
        this._pop();
      }
      return;
    }

    if (!this.isTree && currentDepth === 0) {
      // Flower head: petal ring + central disc.
      const count = this.petalCount * 1.5;
      for (let i = 0; i < count; i++) {
        const sizeJ = 1 + (this.rand() - 0.5) * 2 * this.petalJitter;
        const tiltJ = (this.rand() - 0.5) * 2 * this.petalJitter;
        const sBase = 0.25 * this.petalSize * sizeJ;
        const sH    = sBase * 1.2;
        this._push();
        this._rotateY(i * (Math.PI * 2) / count + this.rand() * 0.2);
        this._rotateX(this.petalTilt + tiltJ);
        this._translate(0, 0, 0.05);
        this._scale(sBase, sH, sBase);
        this._emitPetal();
        this._pop();
      }
      this._push();
      const sCenter = 0.15 * this.petalSize;
      this._scale(sCenter, sCenter, sCenter);
      this._emitCenter();
      this._pop();
      return;
    }

    this._push();
    this._scale(currentThickness, currentLength, currentThickness);
    this._emitCylinder(currentLength);
    this._pop();

    // Mid-branch flower petals (20% probability, depth 1..3) so flowers
    // aren't all clustered at the tip.
    if (!this.isTree && currentDepth > 0 && currentDepth <= 3 && this.rand() < 0.2) {
      const numMidLeaves = Math.floor(1 + this.rand());
      for (let i = 0; i < numMidLeaves; i++) {
        const heightPos = currentLength * (0.2 + this.rand() * 0.6);
        const sizeJ = 1 + (this.rand() - 0.5) * 2 * this.petalJitter;
        const tiltJ = (this.rand() - 0.5) * 2 * this.petalJitter;
        const sBase = 0.2 * this.petalSize * sizeJ * 0.4;
        const sH    = sBase * 2.0;
        this._push();
        this._translate(0, heightPos, 0);
        this._rotateY(this.rand() * Math.PI * 2);
        this._rotateX(this.petalTilt + tiltJ + 0.5);
        this._translate(0, sH * 0.5, 0);
        this._scale(sBase, sH, sBase);
        this._emitPetal();
        this._pop();
      }
    }

    // Recurse: main branch continues straight up; conifers branch much more
    // aggressively than flowers (branchFactor 2.0 vs 0.4).
    this._push();
    this._translate(0, currentLength, 0);

    this._push();
    this._rotateY(this.rand() * Math.PI * 2);
    this._rotateZ((this.angle * 0.2) + (this.rand() - 0.5) * this.angleJitter);
    this._bake(currentDepth - 1, currentLength * this.lengthDecay, currentThickness * this.thicknessDecay);
    this._pop();

    const branchFactor    = this.isTree ? 2.0 : 0.4;
    const numSideBranches = Math.floor(branchFactor + this.rand() * (this.isTree ? 3.0 : 0.8));
    for (let b = 0; b < numSideBranches; b++) {
      this._push();
      this._rotateY(this.rand() * Math.PI * 2);
      this._rotateZ(this.angle * (1.0 + this.rand() * 0.5) + (this.rand() - 0.5) * 2 * this.angleJitter);
      this._bake(
        currentDepth - 1,
        currentLength * this.lengthDecay * (0.7 + this.rand() * 0.2),
        currentThickness * this.thicknessDecay * 0.75
      );
      this._pop();
    }
    this._pop();
  }

  displayBranches() {
    this.scene.pushMatrix();
    this.scene.translate(this.x, this.y, this.z);
    if (this.fallAngle > 0) {
      this.scene.rotate(this.fallAngle, this.fallAxis[0], this.fallAxis[1], this.fallAxis[2]);
    }
    this.scene.scale(this.scale, this.scale, this.scale);

    this.branchApp.apply();
    this.scene.branchShader.setUniformsValues({
      uUseTexture: !!this.branchApp.texture,
      uBaseColor:  this._branchColor,
    });
    this.branchMesh.display();
    this.scene.popMatrix();
  }

  displayLeaves() {
    this.scene.pushMatrix();
    this.scene.translate(this.x, this.y, this.z);
    if (this.fallAngle > 0) {
      this.scene.rotate(this.fallAngle, this.fallAxis[0], this.fallAxis[1], this.fallAxis[2]);
    }
    this.scene.scale(this.scale, this.scale, this.scale);

    const shader = this.scene.branchShader;
    if (this.petalMesh) {
      this.petalApp.apply();
      shader.setUniformsValues({ uUseTexture: !!this.petalApp.texture, uBaseColor: this._petalColor });
      this.petalMesh.display();
    }
    if (this.centerMesh) {
      this.centerApp.apply();
      shader.setUniformsValues({ uUseTexture: !!this.centerApp.texture, uBaseColor: this._centerColor });
      this.centerMesh.display();
    }

    this.scene.popMatrix();
  }
}
