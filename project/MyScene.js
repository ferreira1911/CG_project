import { CGFscene, CGFcamera, CGFaxis, CGFtexture, CGFshader, CGFappearance } from "../lib/CGF.js";
import { MyPanorama } from "./elements/MyPanorama.js";
import { MyTerrain } from "./elements/MyTerrain.js";
import { MyRock } from "./elements/MyRock.js";
import { MyFlora } from "./elements/MyFlora.js";
import { MyGrass } from "./elements/MyGrass.js";
import { MyHorse } from "./elements/MyHorse.js";

const ROCK_COUNT   = 30;
const FLOWER_COUNT = 20;
const TREE_COUNT   = 0;


/**
 * MyScene
 * @constructor
 */
export class MyScene extends CGFscene {
  constructor() {
    super();
  }

  init(application) {
    super.init(application);

    this.initCameras();
    this.initLights();
    this.enableTextures(true);

    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    this.gl.clearDepth(100.0);
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.enable(this.gl.CULL_FACE);
    this.gl.depthFunc(this.gl.LEQUAL);

    this.initTextures();
    this.initShaders();
    this.initFloraMaterials();

    this.axis = new CGFaxis(this);
    this.panorama = new MyPanorama(this, this.panoramaTexture);
    this.terrain = new MyTerrain(this);

    this.rocks = [];
    this.floras = [];
    this._scattered = false;

    this.displayAxis = true;

    this.setUpdatePeriod(50);
  }

  // Rejection-sample a position inside [-range, +range] whose footprint stays off the path
  pickSpot(range, clearance = 0, maxTries = 30) {
    for (let i = 0; i < maxTries; i++) {
      const x = this.r(-range, range);
      const z = this.r(-range, range);
      if (this.terrain.isPathClear(x, z, clearance)) return [x, this.terrain.heightAt(x, z), z];
    }
    // Fallback: accept any position
    const x = this.r(-range, range);
    const z = this.r(-range, range);
    return [x, this.terrain.heightAt(x, z), z];
  }

  scatter() {
    // Color and normal arrays must stay aligned: index N = matching color+normal pair.
    const rockTextures = [this.rockColorMap1, this.rockColorMap2, this.rockColorMap3];
    const rockNormals  = [this.rockNormalMap1, this.rockNormalMap2, this.rockNormalMap3];

    // Rocks: smashed-disc shape — wide & flat with strong vertex perturbations.
    for (let i = 0; i < ROCK_COUNT; i++) {
      const baseXZ = this.r(1.4, 3.2);
      const elong  = this.r(1.0, 1.6);
      let sx = baseXZ;
      let sz = baseXZ * elong;
      if (Math.random() < 0.5) { const t = sx; sx = sz; sz = t; }
      const sy = baseXZ * this.r(0.65, 0.80);

      const clearance = Math.max(sx, sz) * 0.5 + 0.5;
      const [x, y, z] = this.pickSpot(100, clearance);
      const matIdx = Math.floor(this.r(0, rockTextures.length));
      const tex    = rockTextures[matIdx];
      const normal = rockNormals[matIdx];
      this.rocks.push(new MyRock(
        this,
        x, y, z,
        sx, sy, sz,
        this.r(0, Math.PI * 2),  // rotY — break Z-aligned elongation
        this.r(0, 100),          // seed
        this.r(0.55, 0.85),      // deform
        this.r(0.7, 1.6),        // bigFreq — bulky vs lumpy low-freq scale
        this.r(2.0, 5.0),        // detailFreq — fine cracks vs broad chunks
        this.r(0.5, 1.3),        // detailWeight — how carved vs how puffy
        this.r(-0.5, 0.6),       // topBias — <0 slab/flat-top, >0 peaked/pointy
        tex,
        normal
      ));
    }

    // 5 flowers — depth 3, short, with petals
    for (let i = 0; i < FLOWER_COUNT; i++) {
      const scale = this.r(1.5, 2.5);
      // Flower footprint is roughly its petal radius (petalSize * tip-branch length * scale)
      const clearance = scale * 1.0;
      const [x, y, z] = this.pickSpot(80, clearance);
      this.floras.push(new MyFlora(
        this,
        x, y, z,
        scale,
        3, 30, 0.5, 0.5,                  // depth, angle°, trunkLength, lengthDecay
        0.05, 0.6, 15,                    // initialThickness, thicknessDecay, angleJitter°
        this.r(5, 7) | 0,                 // petalCount
        1.5, 45, 0.3,                     // petalSize, petalTilt°, petalJitter
        null,                             // petalTexture
        null,                             // branchTexture
        this.r(0, 100),                   // seed
        false                             // isTree
      ));
    }

    // 3 trees — depth 5, tall trunks, denser branching
    for (let i = 0; i < TREE_COUNT; i++) {
      const scale = this.r(1.2, 1.8);
      // Trees splay wider — give them a generous buffer
      const clearance = scale * 3.0;
      const [x, y, z] = this.pickSpot(90, clearance);
      this.floras.push(new MyFlora(
        this,
        x, y, z,
        scale,
        5, 28, 5, 0.62,                 // depth, angle°, trunkLength, lengthDecay
        0.18, 0.72, 18,                   // initialThickness, thicknessDecay, angleJitter°
        8, 0.9, 35, 0.35,                 // petalCount, petalSize, petalTilt°, petalJitter
        null,                             // petalTexture
        this.barkTexture,                 // branchTexture
        this.r(0, 100),                   // seed
        true                              // isTree
      ));
    }

    this.grass = new MyGrass(this, this.grassTexture, this.terrain);

    // One horse on a clear spot. Tune scale + yaw to taste.
    const [hx, hy, hz] = this.pickSpot(60, 5);
    this.horse = new MyHorse(this, hx, hy, hz, 0.1, this.r(0, Math.PI * 2), this.horseTexture);
  }

  initLights() {
    this.lights[0].setPosition(-170, 200, -100, 0);
    this.lights[0].setDiffuse(1.0, 1.0, 1.0, 1.0);
    this.lights[0].setSpecular(1.0, 1.0, 1.0, 1.0);

    this.lights[0].enable();
    this.lights[0].update();
  }

  initCameras() {
  this.camera = new CGFcamera(
    1.0,           // Campo de visão (FOV)
    0.1,           // Distância mínima (Near)
    1000,          // Distância máxima (Far) - Aumentamos para 1000 para ver o horizonte
    vec3.fromValues(0, 40, 100), // Posição inicial: mais alta (Y=40) e afastada
    vec3.fromValues(0, 0, 0)     // Ponto para onde olha (o centro do terreno)
  );
}

  initTextures() {
    this.panoramaTexture = new CGFtexture(this, './resources/textures/panorama.jpg');
    this.cloudMap = new CGFtexture(this, './resources/textures/cloudMap.png');
    this.rockColorMap1 = new CGFtexture(this, './resources/textures/rockTexture1.jpg');
    this.rockColorMap2 = new CGFtexture(this, './resources/textures/rockTexture2.jpg');
    this.rockColorMap3 = new CGFtexture(this, './resources/textures/rockTexture3.jpg');
    this.rockNormalMap1 = new CGFtexture(this, './resources/textures/rockNormals1.jpg');
    this.rockNormalMap2 = new CGFtexture(this, './resources/textures/rockNormals2.jpg');
    this.rockNormalMap3 = new CGFtexture(this, './resources/textures/rockNormals3.jpg');
    this.rockNoiseMap = new CGFtexture(this, './resources/textures/rockNoise1.png');
    this.grassTexture = new CGFtexture(this, './resources/textures/grass.png');
    this.horseTexture = new CGFtexture(this, './resources/Horse/Tex_Horse.png');
    this.barkTexture = new CGFtexture(this, './resources/textures/rockTexture2.jpg');
  }

  // Four shared appearances cover all flora — every plant of the same kind reuses
  // the same CGFappearance, so we apply() 4 times per frame instead of 2 per plant.
  initFloraMaterials() {
    this.treeBranchApp = new CGFappearance(this);
    this.treeBranchApp.setAmbient(0.2, 0.15, 0.1, 1.0);
    this.treeBranchApp.setDiffuse(0.4, 0.3, 0.2, 1.0);
    this.treeBranchApp.setSpecular(0.02, 0.02, 0.02, 1.0);
    this.treeBranchApp.setShininess(2.0);
    this.treeBranchApp.setTexture(this.barkTexture);
    this.treeBranchApp.setTextureWrap('REPEAT', 'REPEAT');

    this.flowerBranchApp = new CGFappearance(this);
    this.flowerBranchApp.setAmbient(0.2, 0.15, 0.1, 1.0);
    this.flowerBranchApp.setDiffuse(0.4, 0.3, 0.2, 1.0);
    this.flowerBranchApp.setSpecular(0.02, 0.02, 0.02, 1.0);
    this.flowerBranchApp.setShininess(2.0);

    this.treePetalApp = new CGFappearance(this);
    this.treePetalApp.setAmbient(0.1, 0.2, 0.05, 1.0);
    this.treePetalApp.setDiffuse(0.2, 0.4, 0.1, 1.0);
    this.treePetalApp.setSpecular(0.05, 0.05, 0.05, 1.0);
    this.treePetalApp.setShininess(10.0);

    this.flowerPetalApp = new CGFappearance(this);
    this.flowerPetalApp.setAmbient(0.1, 0.3, 0.1, 1.0);
    this.flowerPetalApp.setDiffuse(0.3, 0.7, 0.3, 1.0);
    this.flowerPetalApp.setSpecular(0.1, 0.1, 0.1, 1.0);
    this.flowerPetalApp.setShininess(10.0);
  }

  initShaders() {
    this.panoramaShader = new CGFshader(this.gl, "./shaders/sky.vert", "./shaders/sky.frag");
    const lp = this.lights[0].position;
    this.panoramaShader.setUniformsValues({
      uSampler: 0,
      time: 0,
      uLightPos: [lp[0], lp[1], lp[2]]
    });

    this.rockShader = new CGFshader(this.gl, "./shaders/rock.vert", "./shaders/rock.frag");
    this.rockShader.setUniformsValues({
      uColorMap: 0,
      uNormalMap: 1,
      uNoiseMap: 2,
      uLightPos: [lp[0], lp[1], lp[2]],
      uDeformScale: 0.15,
      uSeed: 0.0
    });

    this.branchShader = new CGFshader(this.gl, "./shaders/branch.vert", "./shaders/branch.frag");
  }

  r(min, max) {
    return min + Math.random() * (max - min);
  }

  setDefaultAppearance() {
    this.setAmbient(0.2, 0.4, 0.8, 1.0);
    this.setDiffuse(0.2, 0.4, 0.8, 1.0);
    this.setSpecular(0.2, 0.4, 0.8, 1.0);
    this.setShininess(10.0);
  }

  update(t) {
    if (this.startTime === undefined) this.startTime = t;
    this.time = (t - this.startTime) / 1000;
    this.panoramaShader.setUniformsValues({ time: this.time });
    if (this.grass) this.grass.setTime(this.time);
  }

  display() {
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    this.updateProjectionMatrix();
    this.loadIdentity();
    this.applyViewMatrix();

    if (this.displayAxis) this.axis.display();

    this.setDefaultAppearance();

    // ---- BEGIN Primitive drawing section

    // Sky
    this.setActiveShader(this.panoramaShader);
    this.panoramaTexture.bind(0);
    this.panorama.display();
    this.setActiveShader(this.defaultShader);

    this.terrain.display();

    if (!this._scattered && this.terrain.ready) {
      this.scatter();
      this._scattered = true;
    }

    // Rocks — share noise across instances; each rock binds its own colour + normal
    if (this.rocks.length > 0) {
      this.setActiveShader(this.rockShader);
      this.rockNoiseMap.bind(2);
      for (const r of this.rocks) r.display();
      this.setActiveShader(this.defaultShader);
    }

    // Batch flora: one shader for all branches, one for all leaves; one appearance
    // per kind (tree vs flower). 4 apply() calls total instead of 2-per-plant.
    if (this.floras.length > 0) {
      this.setActiveShader(this.branchShader);
      this.branchShader.setUniformsValues({ uLength: 1.0 });
      this.flowerBranchApp.apply();
      for (const f of this.floras) if (!f.isTree) f.displayBranches();
      this.treeBranchApp.apply();
      for (const f of this.floras) if (f.isTree) f.displayBranches();

      this.setActiveShader(this.defaultShader);
      this.flowerPetalApp.apply();
      for (const f of this.floras) if (!f.isTree) f.displayLeaves();
      this.treePetalApp.apply();
      for (const f of this.floras) if (f.isTree) f.displayLeaves();
    }

    if (this.horse) this.horse.display();
    if (this.grass) this.grass.display();
    // ---- END Primitive drawing section
  }
}
