import { CGFobject } from '../../lib/CGF.js';

class SubMesh extends CGFobject {
  constructor(scene, v, n, i, t) {
    super(scene);
    this.vertices = v; this.normals = n; this.indices = i; this.texCoords = t;
    this.initGLBuffers();
  }
}

// Static batcher for MyFlora. Takes an array of MyFlora built with
// deferGLInit=true, applies their world transforms on the CPU, and
// concatenates every flora's vertices into one VBO per material slot
// (branches / petals / centers). Result: 3 draw calls total for the whole
// meadow regardless of flower count, and the source flora arrays are nulled
// so the JS heap doesn't keep duplicate data.
//
// Every flora in the batch must already share the same appearances.
export class MyFloraBatch extends CGFobject {
  constructor(scene, floras) {
    super(scene);
    this.scene = scene;

    let branchVerts = [], branchNorms = [], branchInds = [], branchUVs = [];
    let petalVerts  = [], petalNorms  = [], petalInds  = [], petalUVs  = [];
    let centerVerts = [], centerNorms = [], centerInds = [], centerUVs = [];
    let branchOffset = 0, petalOffset = 0, centerOffset = 0;

    if (floras.length > 0) {
      this.branchApp = floras[0].branchApp;
      this.petalApp  = floras[0].petalApp;
      this.centerApp = floras[0].centerApp;
    }

    for (const f of floras) {
      const tx = f.x, ty = f.y, tz = f.z, s = f.scale;

      if (f._bv) {
        const vertCount = f._bv.length / 3;
        for (let i = 0; i < f._bv.length; i += 3) {
          branchVerts.push(f._bv[i] * s + tx, f._bv[i+1] * s + ty, f._bv[i+2] * s + tz);
          branchNorms.push(f._bn[i], f._bn[i+1], f._bn[i+2]);
        }
        for (let i = 0; i < f._bt.length; i++) branchUVs.push(f._bt[i]);
        for (let i = 0; i < f._bi.length; i++) branchInds.push(f._bi[i] + branchOffset);
        branchOffset += vertCount;
      }

      if (f._pv) {
        const vertCount = f._pv.length / 3;
        for (let i = 0; i < f._pv.length; i += 3) {
          petalVerts.push(f._pv[i] * s + tx, f._pv[i+1] * s + ty, f._pv[i+2] * s + tz);
          petalNorms.push(f._pn[i], f._pn[i+1], f._pn[i+2]);
        }
        for (let i = 0; i < f._pt.length; i++) petalUVs.push(f._pt[i]);
        for (let i = 0; i < f._pi.length; i++) petalInds.push(f._pi[i] + petalOffset);
        petalOffset += vertCount;
      }

      if (f._cv) {
        const vertCount = f._cv.length / 3;
        for (let i = 0; i < f._cv.length; i += 3) {
          centerVerts.push(f._cv[i] * s + tx, f._cv[i+1] * s + ty, f._cv[i+2] * s + tz);
          centerNorms.push(f._cn[i], f._cn[i+1], f._cn[i+2]);
        }
        for (let i = 0; i < f._ct.length; i++) centerUVs.push(f._ct[i]);
        for (let i = 0; i < f._ci.length; i++) centerInds.push(f._ci[i] + centerOffset);
        centerOffset += vertCount;
      }

      // Release per-flora CPU buffers — the batch now owns the data.
      f._bv = f._bn = f._bi = f._bt = null;
      f._pv = f._pn = f._pi = f._pt = null;
      f._cv = f._cn = f._ci = f._ct = null;
    }

    this.branchMesh = branchInds.length > 0 ? new SubMesh(scene, branchVerts, branchNorms, branchInds, branchUVs) : null;
    this.petalMesh  = petalInds.length  > 0 ? new SubMesh(scene, petalVerts,  petalNorms,  petalInds,  petalUVs)  : null;
    this.centerMesh = centerInds.length > 0 ? new SubMesh(scene, centerVerts, centerNorms, centerInds, centerUVs) : null;

    // Cache diffuse color slices so display() doesn't allocate every frame.
    if (this.branchApp) this._branchColor = this.branchApp.diffuse.slice(0, 3);
    if (this.petalApp)  this._petalColor  = this.petalApp.diffuse.slice(0, 3);
    if (this.centerApp) this._centerColor = this.centerApp.diffuse.slice(0, 3);
    else                this._centerColor = [0.9, 0.9, 0.2];
  }

  displayBranches() {
    if (!this.branchMesh) return;
    // World coords are already baked into the vertices — no model transform.
    this.scene.pushMatrix();
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
