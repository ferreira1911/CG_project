import { CGFobject } from '../../lib/CGF.js';

class SubMesh extends CGFobject {
    constructor(scene, v, n, i, t) {
        super(scene);
        this.vertices = v; this.normals = n; this.indices = i; this.texCoords = t;
        this.initGLBuffers();
    }
}

/**
 * MyFloraBatch - A static batcher for MyFlora objects.
 * Takes an array of MyFlora objects (that were created with deferGLInit = true),
 * applies their world transformations on the CPU, and concatenates their vertices
 * into a single massive WebGL buffer to reduce draw calls.
 */
export class MyFloraBatch extends CGFobject {
    constructor(scene, floras) {
        super(scene);
        this.scene = scene;

        let branchVerts = [], branchNorms = [], branchInds = [], branchUVs = [];
        let petalVerts = [], petalNorms = [], petalInds = [], petalUVs = [];
        let centerVerts = [], centerNorms = [], centerInds = [], centerUVs = [];

        let branchOffset = 0, petalOffset = 0, centerOffset = 0;

        // Assuming all floras in the batch share the same appearances
        if (floras.length > 0) {
            this.branchApp = floras[0].branchApp;
            this.petalApp  = floras[0].petalApp;
            this.centerApp = floras[0].centerApp;
        }

        for (let f of floras) {
            const tx = f.x, ty = f.y, tz = f.z;
            const s = f.scale;

            // --- Branches ---
            if (f._bv) {
                const vertCount = f._bv.length / 3;
                for (let i = 0; i < f._bv.length; i += 3) {
                    branchVerts.push(f._bv[i]*s + tx, f._bv[i+1]*s + ty, f._bv[i+2]*s + tz);
                    branchNorms.push(f._bn[i], f._bn[i+1], f._bn[i+2]);
                }
                for (let i = 0; i < f._bt.length; i++) branchUVs.push(f._bt[i]);
                for (let i = 0; i < f._bi.length; i++) branchInds.push(f._bi[i] + branchOffset);
                branchOffset += vertCount;
            }

            // --- Petals ---
            if (f._pv) {
                const vertCount = f._pv.length / 3;
                for (let i = 0; i < f._pv.length; i += 3) {
                    petalVerts.push(f._pv[i]*s + tx, f._pv[i+1]*s + ty, f._pv[i+2]*s + tz);
                    petalNorms.push(f._pn[i], f._pn[i+1], f._pn[i+2]);
                }
                for (let i = 0; i < f._pt.length; i++) petalUVs.push(f._pt[i]);
                for (let i = 0; i < f._pi.length; i++) petalInds.push(f._pi[i] + petalOffset);
                petalOffset += vertCount;
            }

            // --- Centers ---
            if (f._cv) {
                const vertCount = f._cv.length / 3;
                for (let i = 0; i < f._cv.length; i += 3) {
                    centerVerts.push(f._cv[i]*s + tx, f._cv[i+1]*s + ty, f._cv[i+2]*s + tz);
                    centerNorms.push(f._cn[i], f._cn[i+1], f._cn[i+2]);
                }
                for (let i = 0; i < f._ct.length; i++) centerUVs.push(f._ct[i]);
                for (let i = 0; i < f._ci.length; i++) centerInds.push(f._ci[i] + centerOffset);
                centerOffset += vertCount;
            }
            
            // Clean up original arrays to free memory!
            f._bv = f._bn = f._bi = f._bt = null;
            f._pv = f._pn = f._pi = f._pt = null;
            f._cv = f._cn = f._ci = f._ct = null;
        }

        // Build massive WebGL Buffers
        this.branchMesh = branchInds.length > 0 ? new SubMesh(scene, branchVerts, branchNorms, branchInds, branchUVs) : null;
        this.petalMesh  = petalInds.length > 0 ? new SubMesh(scene, petalVerts, petalNorms, petalInds, petalUVs) : null;
        this.centerMesh = centerInds.length > 0 ? new SubMesh(scene, centerVerts, centerNorms, centerInds, centerUVs) : null;

        // Cache diffuse color slices for the shader
        if (this.branchApp) this._branchColor = this.branchApp.diffuse.slice(0, 3);
        if (this.petalApp)  this._petalColor  = this.petalApp.diffuse.slice(0, 3);
        if (this.centerApp) this._centerColor = this.centerApp.diffuse.slice(0, 3);
        else this._centerColor = [0.9, 0.9, 0.2];
    }

    displayBranches() {
        if (!this.branchMesh) return;
        this.scene.pushMatrix(); // No translation needed, baked in!
        
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
