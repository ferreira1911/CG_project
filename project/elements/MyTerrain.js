import { CGFobject, CGFappearance, CGFshader, CGFtexture } from '../../lib/CGF.js';
import { MyPlane } from '../geometric/MyPlane.js';

export class MyTerrain extends CGFobject {
    constructor(scene) {
        super(scene);

        // 150 divisões (150x150 quadrados).
        this.plane = new MyPlane(scene, 150);

        // World extent of the terrain (matches the scale() in display())
        this.terrainSize = 400;
        // Must match `heightMapColor.r * 100.0` in terrain.vert
        this.maxHeight = 20.0;

        // Async CPU-side sampling of heightmap + mask
        this.ready = false;
        this._heightReady = false;
        this._maskReady = false;
        this.loadCpuTextures();

        this.initMaterials();
    }

    loadCpuTextures() {
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
        });
        grab("resources/textures/terrain/mask.jpg", (data, w, h) => {
            this._maskData = data; this._maskW = w; this._maskH = h;
            this._maskReady = true;
        });
    }

    // Bilinear sample of a texture image's red channel at world (x,z). Returns 0
    // if data not ready or the point is outside the terrain. Matches the GPU's
    // linear filtering so elements sit on the interpolated surface instead of
    // stepping per heightmap texel.
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

    // Mirrors `heightMap.r * 100.0` from terrain.vert
    heightAt(worldX, worldZ) {
        return (this._sampleR(this._heightData, this._heightW, this._heightH, worldX, worldZ) / 255) * this.maxHeight;
    }

    // White in mask = path (matches mix() in terrain.frag)
    isPath(worldX, worldZ) {
        return this._sampleR(this._maskData, this._maskW, this._maskH, worldX, worldZ) > 128;
    }

    // True if (x,z) — or any of 8 points around it within `radius` — is on the path
    isPathClear(worldX, worldZ, radius) {
        if (this.isPath(worldX, worldZ)) return false;
        if (radius <= 0) return true;
        for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2;
            if (this.isPath(worldX + Math.cos(a) * radius, worldZ + Math.sin(a) * radius)) return false;
        }
        return true;
    }

    initMaterials() {
        // Carrega todas as texturas necessárias
        this.colorMap = new CGFtexture(this.scene, "resources/textures/terrain/terrain_color.jpg");
        this.heightMap = new CGFtexture(this.scene, "resources/textures/terrain/terrain_height.jpg");
        this.dispMap = new CGFtexture(this.scene, "resources/textures/terrain/terrain_color_disp.jpg");
        this.pathMap = new CGFtexture(this.scene, "resources/textures/terrain/path_color.jpg");
        this.maskMap = new CGFtexture(this.scene, "resources/textures/terrain/mask.jpg");

        this.appearance = new CGFappearance(this.scene);
        this.appearance.setTexture(this.colorMap);
        this.appearance.setTextureWrap('REPEAT', 'REPEAT');

        this.terrainShader = new CGFshader(this.scene.gl, "shaders/terrain.vert", "shaders/terrain.frag");
        
        // Define em que "canal" (unidade) cada textura vai estar
        // uSampler (0) é o colorMap, definido automaticamente pelo appearance
        this.terrainShader.setUniformsValues({ uSampler2: 1, uSampler3: 2, uSampler4: 3, uSampler5: 4 });
    }

    display() {
        this.scene.pushMatrix();

        this.scene.setActiveShader(this.terrainShader);
        
        // Ligar as texturas aos canais correspondentes do shader
        this.heightMap.bind(1);
        this.pathMap.bind(2);
        this.maskMap.bind(3);
        this.dispMap.bind(4);

        this.appearance.apply();

        this.scene.scale(400, 1, 400);

        this.plane.display();

        // Restaura o shader normal para não afetar o resto da cena (carroça, pedras, etc)
        this.scene.setActiveShader(this.scene.defaultShader);

        this.scene.popMatrix();
    }
}