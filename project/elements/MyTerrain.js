import { CGFobject, CGFappearance, CGFshader, CGFtexture } from '../../lib/CGF.js';
import { MyPlane } from '../geometric/MyPlane.js';

const TERRAIN_SIZE = 300;
const MAX_HEIGHT   = 20.0;  // must match `heightMapColor.r * 100.0` exponent in terrain.vert

export class MyTerrain extends CGFobject {
  constructor(scene) {
    super(scene);

    this.plane        = new MyPlane(scene, 150);
    this.terrainSize  = TERRAIN_SIZE;
    this.maxHeight    = MAX_HEIGHT;

    // Heightmap + path mask load asynchronously. Other systems (rocks,
    // flowers, grass) query terrain.heightAt before this completes — they
    // get y=0 until `ready` flips.
    this.ready         = false;
    this._heightReady  = false;
    this._maskReady    = false;
    this._loadCpuTextures();

    this._initMaterials();
  }

  _loadCpuTextures() {
    const grab = (src, onDone) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = img.width; c.height = img.height;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0);
        onDone(ctx.getImageData(0, 0, c.width, c.height).data, c.width, c.height);
        if (this._heightReady && this._maskReady) this.ready = true;
      };
      img.src = src;
    };
    grab("resources/textures/terrain/terrain_height.jpg", (data, w, h) => {
      this._heightData = data; this._heightW = w; this._heightH = h;
      this._heightReady = true;
      this._syncShaderUniforms();
    });
    grab("resources/textures/terrain/mask.jpg", (data, w, h) => {
      this._maskData = data; this._maskW = w; this._maskH = h;
      this._maskReady = true;
    });
  }

  _syncShaderUniforms() {
    if (!this.terrainShader) return;

    // Heightmap may not be ready yet; fall back to a sane texel size so the
    // vertex normal estimation doesn't divide by zero.
    const texelSize = (this._heightReady && this._heightW && this._heightH)
      ? [1 / this._heightW, 1 / this._heightH]
      : [1 / 512, 1 / 512];

    this.terrainShader.setUniformsValues({
      uSampler2: 1,
      uSampler3: 2,
      uSampler4: 3,
      uSampler5: 4,
      uSampler6: 5,
      uSampler7: 6,
      uSampler8: 7,
      uSampler9: 8,
      uTerrainHeight: this.maxHeight,
      uHeightTexel:   texelSize,
    });
  }

  // Bilinear red-channel sample at world (x,z), matching the GPU's linear
  // filtering so meshes sit on the same interpolated surface the shader
  // displaces vertices onto. Returns 0 outside the terrain or if data
  // hasn't loaded yet.
  _sampleR(data, w, h, worldX, worldZ) {
    if (!data) return 0;
    const half = this.terrainSize / 2;
    const u = (worldX + half) / this.terrainSize;
    const v = (worldZ + half) / this.terrainSize;
    if (u < 0 || u > 1 || v < 0 || v > 1) return 0;

    const fx = u * (w - 1);
    const fy = v * (h - 1);
    const x0 = Math.floor(fx), y0 = Math.floor(fy);
    const x1 = Math.min(w - 1, x0 + 1);
    const y1 = Math.min(h - 1, y0 + 1);
    const tx = fx - x0;
    const ty = fy - y0;
    const r0 = data[(y0 * w + x0) * 4] * (1 - tx) + data[(y0 * w + x1) * 4] * tx;
    const r1 = data[(y1 * w + x0) * 4] * (1 - tx) + data[(y1 * w + x1) * 4] * tx;
    return r0 * (1 - ty) + r1 * ty;
  }

  heightAt(worldX, worldZ) {
    return (this._sampleR(this._heightData, this._heightW, this._heightH, worldX, worldZ) / 255) * this.maxHeight;
  }

  // White in the path mask = path (matches terrain.frag's mix()).
  isPath(worldX, worldZ) {
    return this._sampleR(this._maskData, this._maskW, this._maskH, worldX, worldZ) > 100;
  }

  // 8-direction probe around (x,z) so path edges fade into grass instead of
  // cutting off sharply when something is placed near them.
  isPathClear(worldX, worldZ, radius = 1.0) {
    if (!this.ready) return true;

    const numSamples = 8;
    for (let i = 0; i < numSamples; i++) {
      const angle = (i / numSamples) * Math.PI * 2;
      const sx = worldX + Math.cos(angle) * radius;
      const sz = worldZ + Math.sin(angle) * radius;
      if (this._sampleR(this._maskData, this._maskW, this._maskH, sx, sz) > 150) return false;
    }
    if (this._sampleR(this._maskData, this._maskW, this._maskH, worldX, worldZ) > 150) return false;
    return true;
  }

  // Single-tap variant used for grass placement (millions of calls per
  // regenerate). Probabilistic rejection in the soft-edge band softens
  // path borders without an 8-sample loop.
  isPathClearFast(worldX, worldZ) {
    if (!this.ready) return true;
    const maskVal = this._sampleR(this._maskData, this._maskW, this._maskH, worldX, worldZ);
    if (maskVal > 150) return false;
    if (maskVal > 30) {
      if (Math.random() < (maskVal - 30) / 120) return false;
    }
    return true;
  }

  _initMaterials() {
    this.colorMap  = new CGFtexture(this.scene, "resources/textures/terrain/terrain_color.jpg");
    this.heightMap = new CGFtexture(this.scene, "resources/textures/terrain/terrain_height.jpg");
    this.dispMap   = new CGFtexture(this.scene, "resources/textures/terrain/terrain_color_disp.jpg");
    this.pathMap   = new CGFtexture(this.scene, "resources/textures/terrain/path_color.jpg");
    this.maskMap   = new CGFtexture(this.scene, "resources/textures/terrain/mask.jpg");

    this.appearance = new CGFappearance(this.scene);
    this.appearance.setTexture(this.colorMap);
    this.appearance.setTextureWrap('REPEAT', 'REPEAT');

    this.terrainShader = new CGFshader(this.scene.gl, "shaders/terrain.vert", "shaders/terrain.frag");
    this._syncShaderUniforms();
  }

  display() {
    this.scene.pushMatrix();

    this.scene.setActiveShader(this.terrainShader);

    this.heightMap.bind(1);
    this.pathMap.bind(2);
    this.maskMap.bind(3);
    this.dispMap.bind(4);
    this.scene.pebbleTexture.bind(5);
    this.scene.flowerScatteredTexture.bind(6);
    this.scene.rockyTexture.bind(7);
    this.scene.decayLeavesTexture.bind(8);

    this.appearance.apply();
    this.scene.scale(this.terrainSize, 1, this.terrainSize);
    this.plane.display();

    this.scene.setActiveShader(this.scene.defaultShader);
    this.scene.popMatrix();
  }
}
