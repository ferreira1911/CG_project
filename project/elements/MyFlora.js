import { CGFobject, CGFappearance } from '../../lib/CGF.js';

const CYLINDER_SLICES = 8;

// Local (untransformed) leaf-cluster geometry — three perpendicular quads.
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

// Simple hexagonal disk for flower center
const DISK = (() => {
  const verts = [0,0,0], norms = [0,1,0], uvs = [0.5, 0.5], inds = [];
  const sides = 8;
  for(let i=0; i<=sides; i++) {
    const a = (i/sides) * Math.PI * 2;
    verts.push(Math.cos(a)*0.5, 0, Math.sin(a)*0.5);
    norms.push(0, 1, 0);
    uvs.push(0.5 + Math.cos(a)*0.5, 0.5 + Math.sin(a)*0.5);
    if(i > 0) {
        const next = (i === sides) ? 1 : i + 1;
        inds.push(0, i, next);
    }
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




// Helper to wrap baked geometry
class SubMesh extends CGFobject {
    constructor(scene, v, n, i, t) {
        super(scene);
        this.vertices = v; this.normals = n; this.indices = i; this.texCoords = t;
        this.initGLBuffers();
    }
}

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
              petalColor = [0.8, 0.2, 0.2]) {
    super(scene);

    this.x = x; this.y = y; this.z = z;
    this.scale = scale;
    this.isTree = isTree;

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
    this.petalColor = petalColor;

    this.seed = seed;
    this.randCounter = 0;

    // Appearances
    this.branchApp = new CGFappearance(scene);
    if (isTree) {
        this.branchApp.setAmbient(0.2, 0.15, 0.1, 1.0);
        this.branchApp.setDiffuse(0.4, 0.3, 0.2, 1.0);
        if (branchTexture) this.branchApp.setTexture(branchTexture);
    } else {
        this.branchApp.setAmbient(0.1, 0.2, 0.1, 1.0);
        this.branchApp.setDiffuse(0.2, 0.5, 0.2, 1.0);
    }

    this.petalApp = new CGFappearance(scene);
    if (isTree) {
        this.petalApp.setAmbient(0.1, 0.3, 0.1, 1.0);
        this.petalApp.setDiffuse(0.3, 0.7, 0.3, 1.0);
    } else {
        this.petalApp.setAmbient(petalColor[0] * 0.6, petalColor[1] * 0.6, petalColor[2] * 0.6, 1.0);
        this.petalApp.setDiffuse(petalColor[0] * 0.9, petalColor[1] * 0.9, petalColor[2] * 0.9, 1.0);
        if (petalTexture) this.petalApp.setTexture(petalTexture);
    }
    this.petalApp.setSpecular(0.2, 0.2, 0.2, 1.0);

    this.petalApp.setShininess(10.0);

    if (!isTree) {
        this.centerApp = new CGFappearance(scene);
        this.centerApp.setAmbient(0.5, 0.5, 0.1, 1.0);
        this.centerApp.setDiffuse(0.9, 0.9, 0.2, 1.0);
        this.centerApp.setSpecular(0.2, 0.2, 0.2, 1.0);
    }

    // Baking
    this._bv = []; this._bn = []; this._bi = []; this._bt = [];
    this._pv = []; this._pn = []; this._pi = []; this._pt = [];
    this._cv = []; this._cn = []; this._ci = []; this._ct = [];
    
    this._mat = mat4.create();
    this._matStack = [];
    
    this._bake(this.maxDepth, this.trunkLength, this.initialThickness);

    this.branchMesh = new SubMesh(scene, this._bv, this._bn, this._bi, this._bt);
    this.petalMesh  = this._pi.length > 0 ? new SubMesh(scene, this._pv, this._pn, this._pi, this._pt) : null;
    this.centerMesh = this._ci.length > 0 ? new SubMesh(scene, this._cv, this._cn, this._ci, this._ct) : null;

    this._bv = this._bn = this._bi = this._bt = null;
    this._pv = this._pn = this._pi = this._pt = null;
    this._cv = this._cn = this._ci = this._ct = null;

    // Cache diffuse color slices so display() never allocates on the hot path.
    this._branchColor = this.branchApp.diffuse.slice(0, 3);
    this._petalColor  = this.petalApp.diffuse.slice(0, 3);
    this._centerColor = this.centerApp ? this.centerApp.diffuse.slice(0, 3) : [0.9, 0.9, 0.2];
  }

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
      this._bi.push(cur, nxt, top, nxt, topNext, top);
    }
  }

  _emitLeafCluster() {
    const nm = this._normalMatrix();
    const base = this._pv.length / 3;
    const tmp = [0, 0, 0];
    for (let i = 0; i < LEAF.verts.length / 3; i++) {
      this._txPos(LEAF.verts[i*3], LEAF.verts[i*3+1], LEAF.verts[i*3+2], tmp);
      this._pv.push(...tmp);
      this._txNorm(nm, LEAF.norms[i*3], LEAF.norms[i*3+1], LEAF.norms[i*3+2], tmp);
      this._pn.push(...tmp);
      this._pt.push(LEAF.uvs[i*2], LEAF.uvs[i*2+1]);
    }
    for (let k = 0; k < LEAF.inds.length; k++) this._pi.push(base + LEAF.inds[k]);
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
    if (this.isTree && currentDepth <= 3) {
      const count = this.petalCount * 4;
      for (let i = 0; i < count; i++) {
        const sizeJ = 1 + (this.rand() - 0.5) * 2 * this.petalJitter;
        const tiltJ = (this.rand() - 0.5) * 2 * this.petalJitter;
        const sBase = 0.2 * this.petalSize * sizeJ * 2.2;
        const sH    = sBase * 1.8;
        this._push();
        this._translate((this.rand()-0.5)*0.5, (this.rand()-0.5)*0.5, (this.rand()-0.5)*0.5);
        this._rotateY(i * (Math.PI * 2) / count + this.rand());
        this._rotateX(this.petalTilt + tiltJ);
        this._translate(0, sH * 0.5, 0);
        this._scale(sBase, sH, sBase);
        this._emitLeafCluster();
        this._pop();
      }
      if (currentDepth === 0) return;
    } else if (!this.isTree && currentDepth === 0) {
      const count = this.petalCount * 1.5;
      for (let i = 0; i < count; i++) {
        const sizeJ = 1 + (this.rand() - 0.5) * 2 * this.petalJitter;
        const tiltJ = (this.rand() - 0.5) * 2 * this.petalJitter;
        const sBase = 0.25 * this.petalSize * sizeJ;
        const sH    = sBase * 1.2;
        this._push();
        this._rotateY(i * (Math.PI * 2) / count + this.rand()*0.2);
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

    if (currentDepth > 0 && currentDepth <= 3) {
      const midLeafProb = this.isTree ? 0.9 : 0.2;
      if (this.rand() < midLeafProb) {
        const numMidLeaves = Math.floor(1 + this.rand() * (this.isTree ? 6 : 1));
        for (let i = 0; i < numMidLeaves; i++) {
          const heightPos = currentLength * (0.2 + this.rand() * 0.6);
          const sizeJ = 1 + (this.rand() - 0.5) * 2 * this.petalJitter;
          const tiltJ = (this.rand() - 0.5) * 2 * this.petalJitter;
          const angleY = this.rand() * Math.PI * 2;
          const sBase = 0.2 * this.petalSize * sizeJ * (this.isTree ? 1.5 : 0.4);
          const sH    = sBase * (this.isTree ? 1.5 : 2.0);
          this._push();
          this._translate(0, heightPos, 0);
          this._rotateY(angleY);
          this._rotateX(this.petalTilt + tiltJ + 0.5);
          this._translate(0, sH * 0.5, 0);
          this._scale(sBase, sH, sBase);
          if (this.isTree) this._emitLeafCluster(); else this._emitPetal();
          this._pop();
        }
      }
    }

    this._push();
    this._translate(0, currentLength, 0);
    this._push();
    this._rotateY(this.rand() * Math.PI * 2);
    this._rotateZ((this.angle * 0.2) + (this.rand() - 0.5) * this.angleJitter);
    this._bake(currentDepth - 1, currentLength * this.lengthDecay, currentThickness * this.thicknessDecay);
    this._pop();

    const branchFactor = this.isTree ? 2.0 : 0.4;
    const numSideBranches = Math.floor(branchFactor + this.rand() * (this.isTree ? 3.0 : 0.8));
    for (let b = 0; b < numSideBranches; b++) {
      this._push();
      this._rotateY(this.rand() * Math.PI * 2);
      this._rotateZ(this.angle * (1.0 + this.rand() * 0.5) + (this.rand() - 0.5) * 2 * this.angleJitter);
      this._bake(currentDepth - 1, currentLength * this.lengthDecay * (0.7 + this.rand() * 0.2), currentThickness * this.thicknessDecay * 0.75);
      this._pop();
    }
    this._pop();
  }

  displayBranches() {
    this.scene.pushMatrix();
    this.scene.translate(this.x, this.y, this.z);
    this.scene.scale(this.scale, this.scale, this.scale);

    const shader = this.scene.branchShader;
    this.branchApp.apply();
    shader.setUniformsValues({
        uUseTexture: !!this.branchApp.texture,
        uBaseColor: this._branchColor
    });

    this.branchMesh.display();
    this.scene.popMatrix();
  }

  displayLeaves() {
    this.scene.pushMatrix();
    this.scene.translate(this.x, this.y, this.z);
    this.scene.scale(this.scale, this.scale, this.scale);

    const shader = this.scene.branchShader;

    if (this.petalMesh) {
        this.petalApp.apply();
        shader.setUniformsValues({
            uUseTexture: !!this.petalApp.texture,
            uBaseColor: this._petalColor
        });
        this.petalMesh.display();
    }
    if (this.centerMesh) {
        this.centerApp.apply();
        shader.setUniformsValues({
            uUseTexture: !!this.centerApp.texture,
            uBaseColor: this._centerColor
        });
        this.centerMesh.display();
    }

    this.scene.popMatrix();
  }
}

