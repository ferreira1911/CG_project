import { CGFscene, CGFcamera, CGFaxis, CGFtexture, CGFshader, CGFappearance } from "../lib/CGF.js";
import { MyPanorama } from "./elements/MyPanorama.js";
import { MyTerrain } from "./elements/MyTerrain.js";
import { MyRock } from "./elements/MyRock.js";
import { MyFlora } from "./elements/MyFlora.js";
import { MyGrass } from "./elements/MyGrass.js";
import { MyWagon } from "./elements/MyWagon.js";
import { MyUnitCube } from "./geometric/MyUnitCube.js";
import { MyCylinder } from "./geometric/MyCylinder.js";
import { MyCircle } from "./geometric/MyCircle.js";
import { r, pickSpot } from "./utils.js";

const ROCK_COUNT   = 25;
const FLOWER_COUNT = 40;


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
    this.initPrimitives();

    this.axis = new CGFaxis(this);
    this.panorama = new MyPanorama(this, this.panoramaTexture);
    this.terrain = new MyTerrain(this);

    this.rocks    = [];
    this.floras   = [];
    this._scattered = false;

    this.displayAxis = true;
    this.freeCamera  = false;  // follow-cam by default; toggle in GUI

    this.setUpdatePeriod(50);
  }

  scatter() {
    const [wx, wy, wz] = pickSpot(this.terrain, 60, 6);
    this.wagon = new MyWagon(this, wx, wy, wz, r(0, Math.PI * 2), 1.0, this.horseTexture);

    // Color and normal arrays must stay aligned: index N = matching color+normal pair.
    const rockTextures = [this.rockColorMap1, this.rockColorMap2, this.rockColorMap3];
    const rockNormals  = [this.rockNormalMap1, this.rockNormalMap2, this.rockNormalMap3];

    // Rocks: smashed-disc shape — wide & flat with strong vertex perturbations.
    for (let i = 0; i < ROCK_COUNT; i++) {
      const baseXZ = r(1.4, 3.2);
      const elong  = r(1.0, 1.6);
      let sx = baseXZ;
      let sz = baseXZ * elong;
      if (Math.random() < 0.5) { const t = sx; sx = sz; sz = t; }
      const sy = baseXZ * r(0.65, 0.80);

      const clearance = Math.max(sx, sz) * 0.5 + 0.5;
      const [x, y, z] = pickSpot(this.terrain,100, clearance);
      const matIdx = Math.floor(r(0, rockTextures.length));
      const tex    = rockTextures[matIdx];
      const normal = rockNormals[matIdx];
      this.rocks.push(new MyRock(
        this,
        x, y, z,
        sx, sy, sz,
        r(0, Math.PI * 2),  // rotY — break Z-aligned elongation
        r(0, 100),          // seed
        r(0.55, 0.85),      // deform
        r(0.7, 1.6),        // bigFreq — bulky vs lumpy low-freq scale
        r(2.0, 5.0),        // detailFreq — fine cracks vs broad chunks
        r(0.5, 1.3),        // detailWeight — how carved vs how puffy
        r(-0.5, 0.6),       // topBias — <0 slab/flat-top, >0 peaked/pointy
        tex,
        normal
      ));
    }

    // 5 flowers — depth 3, short, with petals
    const FLOWER_COLORS = [
      [0.2, 0.4, 0.9], // Blue
      [0.9, 0.2, 0.2], // Red
      [0.9, 0.8, 0.2], // Yellow
      [0.9, 0.9, 0.9], // White
      [0.6, 0.2, 0.8]  // Purple
    ];

    for (let i = 0; i < FLOWER_COUNT; i++) {
      const scale = r(0.35, 0.75);
      const clearance = scale * 1.0;
      const [x, y, z] = pickSpot(this.terrain,80, clearance);

      
      const color = FLOWER_COLORS[Math.floor(Math.random() * FLOWER_COLORS.length)];
      
      this.floras.push(new MyFlora(
        this,
        x, y, z,
        scale,
        3, 30, 0.7, 0.5,
        0.05, 0.6, 15,
        r(6, 10) | 0,
        1.2, 35, 0.3,
        null, null,
        r(0, 100),
        false,
        color
      ));
    }


    this.grass = new MyGrass(this, this.grassTexture, this.terrain);
  }

  initLights() {
    // Posição: X, Y, Z, 0 (0 = luz direcional, como o Sol)
    this.lights[0].setPosition(-112.0, 135.0, -100.0, 0.0);
    // Cor do Sol (amarelo muito claro)
    this.lights[0].setDiffuse(1.0, 0.98, 0.9, 1.0);
    this.lights[0].setSpecular(1.0, 0.98, 0.9, 1.0);
    this.lights[0].setAmbient(0.4, 0.4, 0.45, 1.0);

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

  initFloraMaterials() {
      // appearances are now handled per-instance or shared in MyFlora
  }

  initPrimitives() {
    this.cube     = new MyUnitCube(this);
    this.cylinder = new MyCylinder(this, 24, 1);
    this.circle   = new MyCircle(this, 24);
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
    this.branchShader.setUniformsValues({

      uLightPos: [lp[0], lp[1], lp[2]]
    });

    this.clothShader = new CGFshader(this.gl, "./shaders/cloth.vert", "./shaders/cloth.frag");
    this.clothShader.setUniformsValues({
      uSampler: 0,
      time: 0,
      uLightPos: [lp[0], lp[1], lp[2]]
    });
  }

  setDefaultAppearance() {
    this.setAmbient(0.2, 0.4, 0.8, 1.0);
    this.setDiffuse(0.2, 0.4, 0.8, 1.0);
    this.setSpecular(0.2, 0.4, 0.8, 1.0);
    this.setShininess(10.0);
  }

  update(t) {
    if (this.startTime === undefined) this.startTime = t;
    const prevTime = this.time ?? 0;
    this.time = (t - this.startTime) / 1000;
    const dt = this.time - prevTime;

    this.panoramaShader.setUniformsValues({ time: this.time });
    this.clothShader.setUniformsValues({ time: this.time });
    if (this.grass) this.grass.setTime(this.time);
    if (this.wagon) this.wagon.update(dt, this.interface);

    if (!this.freeCamera && this.wagon) {
      const w          = this.wagon;
      const CAM_DIST   = 18;
      const CAM_HEIGHT =  9;
      const CAM_LOOK   =  3;
      const bx = w.x - Math.cos(w.yaw) * CAM_DIST;
      const bz = w.z + Math.sin(w.yaw) * CAM_DIST;
      vec3.set(this.camera.position, bx, w.y + CAM_HEIGHT, bz);
      vec3.set(this.camera.target,   w.x, w.y + CAM_LOOK,  w.z);
    }
  }

  display() {
    // Follow-cam runs in display() at full render framerate (not the update tick).
    if (!this.freeCamera && this.wagon) {
      const w          = this.wagon;
      const CAM_DIST   = 18;
      const CAM_HEIGHT =  9;
      const CAM_LOOK   =  3;
      const bx = w.x - Math.cos(w.yaw) * CAM_DIST;
      const bz = w.z + Math.sin(w.yaw) * CAM_DIST;
      vec3.set(this.camera.position, bx, w.y + CAM_HEIGHT, bz);
      vec3.set(this.camera.target,   w.x, w.y + CAM_LOOK,  w.z);
    }

    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    this.updateProjectionMatrix();
    this.loadIdentity();
    this.applyViewMatrix();

    if (this.displayAxis) this.axis.display();

    this.setDefaultAppearance();

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

    // Rocks
    if (this.rocks.length > 0) {
      this.setActiveShader(this.rockShader);
      this.rockNoiseMap.bind(2);
      for (const r of this.rocks) r.display();
      this.setActiveShader(this.defaultShader);
    }

    // Flora Batch Rendering
    if (this.floras.length > 0) {
      this.setActiveShader(this.branchShader);
      
      this.branchShader.setUniformsValues({ uLength: 1.0 });
      for (const f of this.floras) f.displayBranches();

      this.gl.disable(this.gl.CULL_FACE);

      this.branchShader.setUniformsValues({ uLength: 0.5 });


      for (const f of this.floras) f.displayLeaves();
      
      this.gl.enable(this.gl.CULL_FACE);


      this.setActiveShader(this.defaultShader);
    }

    if (this.wagon) this.wagon.display();
    if (this.grass) this.grass.display();
  }
}
