import { CGFscene, CGFcamera, CGFaxis, CGFtexture, CGFshader, CGFappearance } from "../lib/CGF.js";
import { MyPanorama } from "./elements/MyPanorama.js";
import { MyTerrain } from "./elements/MyTerrain.js";
import { MyRock } from "./elements/MyRock.js";
import { MyFlora } from "./elements/MyFlora.js";
import { MyFloraBatch } from "./elements/MyFloraBatch.js";
import { MyGrass } from "./elements/MyGrass.js";
import { MyWagon } from "./elements/MyWagon.js";
import { MyBarn } from "./elements/MyBarn.js";
import { MyCameraAnimator } from "./animators/MyCameraAnimator.js";
import { MyTreeAnimator } from "./animators/MyTreeAnimator.js";
import { MyUnitCube } from "./geometric/MyUnitCube.js";
import { MyCylinder } from "./geometric/MyCylinder.js";
import { MyCircle } from "./geometric/MyCircle.js";
import { MySphere } from "./geometric/MySphere.js";
import { MyHayBale } from "./elements/MyHayBale.js";
import { MyArrow } from "./elements/MyArrow.js";
import { r } from "./utils.js";

const SUN_WORLD_DIR  = [-112.0, 135.0, -100.0];
const MAP_HALF       = 150;
const DRAW_DIST         = 135;
const DRAW_DIST_SQ      = DRAW_DIST * DRAW_DIST;
const BALE_DRAW_DIST    = 85;
const BALE_DRAW_DIST_SQ = BALE_DRAW_DIST * BALE_DRAW_DIST;
const GRASS_GRID     = 9;
const GRASS_MAP_SIZE = 300;
const MAX_TREES      = 12;   // must match MAX_TREES in terrain.frag

const WAGON_SPAWN_FORWARD = 25.0;
const WAGON_SPAWN_RIGHT   = 0.0;
const MAX_SPAWN_ATTEMPTS  = 80;
const BARN_CLEARANCE_RADIUS  = 14.0;
const WAGON_CLEARANCE_RADIUS = 5.0;

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

    this.setGlobalAmbientLight(0.2, 0.2, 0.22, 1.0);

    this.initTextures();
    this.initPrimitives();
    this.initShaders();

    this.arrow    = new MyArrow(this);
    this.axis     = new CGFaxis(this);
    this.panorama = new MyPanorama(this, this.panoramaTexture);
    this.terrain  = new MyTerrain(this);

    this.rocks          = [];
    this.floras         = [];
    this.haybales       = [];
    this.flowerClusters = [];
    this.treeZones      = [];
    this._scattered     = false;

    this._initDisplayToggles();
    this._initGenerationParams();
    this._initGameplayState();
    this._initHUD();
    this._initInputListeners();

    // Intro camera swoops from 60 units up to ground level when the player
    // dismisses the menu. Starts inactive; startGame() enables it.
    this.introAnimator     = new MyCameraAnimator(this, 60, 4.0, 4.0);
    this.introCameraOffset = 60;

    this.setUpdatePeriod(16);
  }

  _initDisplayToggles() {
    this.displayAxis     = false;
    this.displayHUD      = true;
    this.displayWagon    = true;
    this.displayFlora    = true;
    this.displayArrows   = true;
    this.displayRocks    = true;
    this.displayHayBales = true;
    this.displayGrass    = true;
    this.displaySky      = true;
    this.displayTerrain  = true;
    this.freeCamera      = false;
  }

  _initGenerationParams() {
    this.numRocks    = 20;
    this.numHaybales = 3;
    this.numTrees    = 4;

    this.numFlowers          = 180;
    this.numFlowerClusters   = 6;
    this.flowerClusterRadius = 3.8;
    this.flowerStemLength    = 0.8;
    this.flowerPetals        = 4;
    this.flowerPetalSize     = 2.2;

    this.windAmp  = 0.35;
    this.windFreq = 1.7;

    this.barnPosX = -85;
    this.barnPosZ = -90;
    this.barnYaw  = Math.PI / 2;
  }

  _initGameplayState() {
    this.uiHp             = 150;
    this.uiDamage         = 0;
    this.uiRestored       = 0;
    this.uiBalesDelivered = 0;
    this.uiScore          = 0;
    this.gameplayTime     = 0;
    this.gameOver         = false;
    this.menuActive       = true;
    this.cameraShake      = 0;
  }

  _initHUD() {
    this.hudContainerEl       = document.getElementById('hud-container');
    this.hpNumEl              = document.getElementById('hp-number');
    this.hpBarEl              = document.getElementById('hp-bar');
    this.scoreValEl           = document.getElementById('score-val');
    this.balesValEl           = document.getElementById('bales-val');
    this.floatingTextAnchorEl = document.getElementById('floating-text-anchor');
    this.gameOverEl           = document.getElementById('game-over-screen');
    this.menuEl               = document.getElementById('main-menu');

    if (this.hudContainerEl) this.hudContainerEl.style.display = 'none';

    // Sentinel values force the first HUD write so initial state is rendered.
    this.lastRenderedHp      = -1;
    this.lastRenderedScore   = -1;
    this.lastRenderedBales   = -1;
    this.lastRenderedCarried = -1;
  }

  _initInputListeners() {
    // Listen on document, not the CGF canvas: HTML overlays (menu, HUD,
    // game-over screen) steal focus and would swallow canvas-level events.
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && this.menuActive) {
        e.preventDefault();
        this.startGame();
      }
      if (e.code === 'KeyR' && this.gameOver) this.restartGame();
      if (e.code === 'KeyF') this.freeCamera = !this.freeCamera;
    });
  }

  // Rebuilds all randomly placed scene objects.
  scatter() {
    this.rocks          = [];
    this.floras         = [];
    this.haybales       = [];
    this.flowerClusters = [];
    this.treeZones      = [];
    this.grassPatches   = [];

    this._spawnBarnAndWagon();
    this._spawnRocks();
    for (let i = 0; i < this.numHaybales; i++) this.spawnHayBale();
    this._spawnFlowerClusters();
    this._spawnTrees();
    this._pushTreePositionsToShader();
    this._initGrassShader();
    this._spawnGrassPatches();
  }

  // Places the barn and the starting wagon position.
  _spawnBarnAndWagon() {
    const barnY = this.terrain.heightAt(this.barnPosX, this.barnPosZ);
    this.barn = new MyBarn(this, this.barnPosX, barnY, this.barnPosZ, this.barnYaw, {
      wood:   this.barnRedWoodTexture,
      front:  this.barnFrontTexture,
      roof:   this.darkWoodTexture,
      window: this.barnWindowTexture
    });

    // Spawn wagon near the barn door, offset in barn-local coordinates.
    const spawnX = WAGON_SPAWN_RIGHT;
    const spawnZ = WAGON_SPAWN_FORWARD;
    const cy = Math.cos(this.barnYaw);
    const sy = Math.sin(this.barnYaw);
    const wagonX = this.barnPosX + spawnX * cy + spawnZ * sy;
    const wagonZ = this.barnPosZ - spawnX * sy + spawnZ * cy;

    this.wagon = new MyWagon(this, wagonX, this.terrain.heightAt(wagonX, wagonZ), wagonZ, this.barnYaw, 1.0, this.horseTexture);
  }

  // Spawns rocks away from paths and existing solid objects.
  _spawnRocks() {
    const rockTextures = [this.rockColorMap1, this.rockColorMap2, this.rockColorMap3];
    const rockNormals  = [this.rockNormalMap1, this.rockNormalMap2, this.rockNormalMap3];

    for (let i = 0; i < this.numRocks; i++) {
      const baseXZ = r(1.4, 3.2);
      const elong  = r(1.0, 1.6);
      let sx = baseXZ;
      let sz = baseXZ * elong;
      if (Math.random() < 0.5) { const t = sx; sx = sz; sz = t; }
      const sy = baseXZ * r(0.65, 0.80);

      const clearance = Math.max(sx, sz) * 0.5 + 0.5;
      const point = this._findFreeSpawnPoint(-100, 100, -100, 100, clearance);
      if (!point) continue;
      const [x, z] = point;
      const y = this.terrain.heightAt(x, z);

      const matIdx = Math.floor(r(0, rockTextures.length));
      this.rocks.push(new MyRock(
        this, x, y, z, sx, sy, sz,
        r(0, Math.PI * 2), r(0, 100), r(0.55, 0.85),
        r(0.7, 1.6), r(2.0, 5.0), r(0.5, 1.3), r(-0.5, 0.6),
        rockTextures[matIdx], rockNormals[matIdx]
      ));
    }
  }

  // Spawns flower patches, then bakes all flowers into one batch.
  _spawnFlowerClusters() {
    const FLOWER_COLORS = [
      [0.2, 0.4, 0.9],
      [0.9, 0.2, 0.2],
      [0.9, 0.8, 0.2],
      [0.9, 0.9, 0.9],
      [0.6, 0.2, 0.8],
    ];

    const flowersPerCluster = Math.max(2, Math.floor(this.numFlowers / this.numFlowerClusters));
    const toBatch = [];

    for (let c = 0; c < this.numFlowerClusters; c++) {
      const point = this._findFreeSpawnPoint(-90, 90, -90, 90, this.flowerClusterRadius);
      if (!point) continue;
      const [cx, cz] = point;

      // One color per cluster reads as a uniform floral patch.
      const clusterColor = FLOWER_COLORS[Math.floor(Math.random() * FLOWER_COLORS.length)];
      this.flowerClusters.push({ x: cx, z: cz, radius: this.flowerClusterRadius });

      for (let f = 0; f < flowersPerCluster; f++) {
        const angle = r(0, Math.PI * 2);
        // Sqrt-distance for uniform area distribution; 0.85 lets the cluster
        // edge bleed slightly past the registered radius for a soft border.
        const dist = Math.sqrt(Math.random()) * (this.flowerClusterRadius * 0.85);
        const fx = cx + Math.cos(angle) * dist;
        const fz = cz + Math.sin(angle) * dist;

        // Ignore flower clusters here so the current cluster does not block itself.
        if (this.isLocationOccupied(fx, fz, 0.5, { checkFlowerClusters: false })) continue;

        const fy = this.terrain.heightAt(fx, fz);
        toBatch.push(new MyFlora(
          this, fx, fy, fz, r(0.45, 0.8),
          3, 30, this.flowerStemLength, 0.55, 0.05, 0.6, 15,
          this.flowerPetals | 0, this.flowerPetalSize, 35, 0.3,
          null, null, r(0, 100), false, clusterColor, /* deferGLInit */ true
        ));
      }
    }

    // Single VBO across every flower in every cluster — one draw call total.
    if (toBatch.length > 0) this.flowerBatch = new MyFloraBatch(this, toBatch);
  }

  // Spawns trees away from paths and other generated objects.
  _spawnTrees() {
    for (let i = 0; i < this.numTrees; i++) {
      const scale = r(2, 3);
      const treeRadius = 2.0 * scale;
      const point = this._findFreeSpawnPoint(-110, 110, -110, 110, treeRadius);
      if (!point) continue;
      const [tx, tz] = point;
      const ty = this.terrain.heightAt(tx, tz);
      const treeFlora = new MyFlora(
        this, tx, ty, tz, scale,
        3, 28, 1.6, 0.78, 0.28, 0.72, 22,
        1, 0.9, 30, 0.45,
        null, this.barkTexture, r(0, 100), true
      );
      this.floras.push(treeFlora);

      this.treeZones.push({
        x: tx, z: tz,
        radius: treeRadius,
        flora: treeFlora,
        animator: new MyTreeAnimator(treeFlora, 1.5),
        isFallen: false,
      });
    }
  }

  // Sends tree positions to the terrain shader.
  _pushTreePositionsToShader() {
    // terrain.frag's decay-leaves overlay fades by distance from each trunk.
    const treePos   = new Array(MAX_TREES * 2).fill(0);
    const treeCount = Math.min(this.treeZones.length, MAX_TREES);
    for (let i = 0; i < treeCount; i++) {
      treePos[i * 2]     = this.treeZones[i].x;
      treePos[i * 2 + 1] = this.treeZones[i].z;
    }
    if (this.terrain && this.terrain.terrainShader) {
      this.terrain.terrainShader.setUniformsValues({
        uTreeCount: treeCount,
        uTreePos:   treePos,
      });
    }
  }

  // Creates the grass shader and its default uniforms.
  _initGrassShader() {
    this.grassShader = new CGFshader(this.gl, 'shaders/grass.vert', 'shaders/grass.frag');
    this.grassShader.setUniformsValues({
      uTime:        0,
      uWindAmp:     this.windAmp,
      uWindFreq:    this.windFreq,
      uBladeHeight: 1.3 * 1.3,
      uHorsePos:    [-1000.0, -1000.0],
      uWheelPos0:   [-1000.0, -1000.0],
      uWheelPos1:   [-1000.0, -1000.0],
      uWheelPos2:   [-1000.0, -1000.0],
      uWheelPos3:   [-1000.0, -1000.0],
    });
  }

  // Spawns baked grass patches over the terrain grid.
  _spawnGrassPatches() {
    const step = GRASS_MAP_SIZE / GRASS_GRID;
    for (let i = 0; i < GRASS_GRID; i++) {
      for (let j = 0; j < GRASS_GRID; j++) {
        const cx = -MAP_HALF + step / 2 + i * step;
        const cz = -MAP_HALF + step / 2 + j * step;
        // Circular map: drop patches whose centre lies outside the disc.
        if (cx * cx + cz * cz > MAP_HALF * MAP_HALF) continue;
        this.grassPatches.push(new MyGrass(this, this.grassShader, this.terrain, cx, cz, step));
      }
    }
  }


  // Finds a random free point inside the given rectangle.
  _findFreeSpawnPoint(minX, maxX, minZ, maxZ, radius, options = {}) {
    for (let i = 0; i < MAX_SPAWN_ATTEMPTS; i++) {
      const x = r(minX, maxX);
      const z = r(minZ, maxZ);
      if (!this.isLocationOccupied(x, z, radius, options)) return [x, z];
    }
    return null;
  }

  // Checks if a point overlaps terrain restrictions or generated objects.
  isLocationOccupied(x, z, radius = 0, options = {}) {
    const {
      checkTerrain = true,
      checkBarn = true,
      checkWagon = true,
      checkRocks = true,
      checkHaybales = true,
      checkTrees = true,
      checkFlowerClusters = true,
    } = options;

    if (checkTerrain && this.terrain && !this.terrain.isPathClear(x, z, radius)) return true;

    if (checkBarn) {
      const dx = x - this.barnPosX, dz = z - this.barnPosZ;
      if (this._circlesOverlap(dx, dz, radius, BARN_CLEARANCE_RADIUS)) return true;
    }

    if (checkWagon && this.wagon) {
      const dx = x - this.wagon.x, dz = z - this.wagon.z;
      if (this._circlesOverlap(dx, dz, radius, WAGON_CLEARANCE_RADIUS)) return true;
    }

    if (checkRocks) {
      for (const rock of this.rocks) {
        const dx = x - rock.x, dz = z - rock.z;
        const rockR = Math.max(rock.sx, rock.sz) * 0.7 + 0.5;
        if (this._circlesOverlap(dx, dz, radius, rockR)) return true;
      }
    }

    if (checkHaybales) {
      for (const hb of this.haybales) {
        const dx = x - hb.x, dz = z - hb.z;
        const baleR = (hb.scale || 1.0) * 1.5;
        if (this._circlesOverlap(dx, dz, radius, baleR)) return true;
      }
    }

    if (checkTrees) {
      for (const zone of this.treeZones) {
        const dx = x - zone.x, dz = z - zone.z;
        const treeR = zone.radius || 2.0;
        if (this._circlesOverlap(dx, dz, radius, treeR)) return true;
      }
    }

    if (checkFlowerClusters) {
      for (const cluster of this.flowerClusters) {
        const dx = x - cluster.x, dz = z - cluster.z;
        if (this._circlesOverlap(dx, dz, radius, cluster.radius)) return true;
      }
    }

    return false;
  }

  // Checks overlap between two circles from their delta and radii.
  _circlesOverlap(dx, dz, rA, rB) {
    const rSum = rA + rB;
    return dx * dx + dz * dz < rSum * rSum;
  }

  // Called by MyGrass to avoid paths and solid scene objects.
  isGrassSpawnBlocked(x, z) {
    if (this.terrain && !this.terrain.isPathClearFast(x, z)) return true;

    for (const rock of this.rocks) {
      const dx = x - rock.x, dz = z - rock.z;
      const radius = Math.max(rock.sx, rock.sz) * 0.85;
      if (dx * dx + dz * dz < radius * radius) return true;
    }

    for (const hb of this.haybales) {
      const dx = x - hb.x, dz = z - hb.z;
      const radius = (hb.scale || 1.0) * 1.75;
      if (dx * dx + dz * dz < radius * radius) return true;
    }

    for (const zone of this.treeZones) {
      const dx = x - zone.x, dz = z - zone.z;
      if (dx * dx + dz * dz < zone.radius * zone.radius) return true;
    }

    for (const cluster of this.flowerClusters) {
      const dx = x - cluster.x, dz = z - cluster.z;
      const radius = cluster.radius * 0.82;
      if (dx * dx + dz * dz < radius * radius) return true;
    }

    return false;
  }

  // Spawns one hay bale away from paths and existing objects.
  spawnHayBale() {
    const scale = r(0.8, 1.3);
    const clearance = scale * 1.75;
    const point = this._findFreeSpawnPoint(-80, 80, -80, 80, clearance);
    if (!point) return;

    const [bx, bz] = point;
    const by    = this.terrain.heightAt(bx, bz);
    const rotY  = r(0, Math.PI * 2);
    this.haybales.push(new MyHayBale(this, bx, by, bz, rotY, scale, this.haybaleMaterial));
  }

  // Replaces a delivered bale with a new valid one.
  replaceBale(bale) {
    const index = this.haybales.indexOf(bale);
    if (index !== -1) {
      this.haybales.splice(index, 1);
      this.spawnHayBale();
    }
  }

  initLights() {
    // Directional sun (w=0). Position is the world-space sun direction; the
    // wagon and terrain shaders transform it into eye space each frame.
    this.lights[0].setPosition(SUN_WORLD_DIR[0], SUN_WORLD_DIR[1], SUN_WORLD_DIR[2], 0.0);
    this.lights[0].setDiffuse(1.0, 0.98, 0.9, 1.0);
    this.lights[0].setSpecular(1.0, 0.98, 0.9, 1.0);
    this.lights[0].setAmbient(0.18, 0.18, 0.2, 1.0);
    this.lights[0].enable();
    this.lights[0].update();
  }

  initCameras() {
    this.camera = new CGFcamera(
      1.0,                            // FOV
      0.1,                            // near
      1000,                           // far (covers full panorama sphere)
      vec3.fromValues(0, 40, 100),
      vec3.fromValues(0, 0, 0)
    );
  }

  initTextures() {
    this.panoramaTexture        = new CGFtexture(this, './resources/textures/environment/panorama.jpg');
    this.cloudMap               = new CGFtexture(this, './resources/textures/environment/cloudMap.png');
    this.rockColorMap1          = new CGFtexture(this, './resources/textures/rocks/rockTexture1.jpg');
    this.rockColorMap2          = new CGFtexture(this, './resources/textures/rocks/rockTexture2.jpg');
    this.rockColorMap3          = new CGFtexture(this, './resources/textures/rocks/rockTexture3.jpg');
    this.rockNormalMap1         = new CGFtexture(this, './resources/textures/rocks/rockNormals1.jpg');
    this.rockNormalMap2         = new CGFtexture(this, './resources/textures/rocks/rockNormals2.jpg');
    this.rockNormalMap3         = new CGFtexture(this, './resources/textures/rocks/rockNormals3.jpg');
    this.rockNoiseMap           = new CGFtexture(this, './resources/textures/rocks/rockNoise1.png');
    this.grassTexture           = new CGFtexture(this, './resources/textures/environment/grass.png');
    this.horseTexture           = new CGFtexture(this, './resources/Horse/Tex_Horse.png');
    this.barkTexture            = new CGFtexture(this, './resources/textures/rocks/rockTexture2.jpg');
    this.hayTexture             = new CGFtexture(this, './resources/textures/wagon/hay.jpg');
    this.blankTexture           = new CGFtexture(this, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==');
    this.pebbleTexture          = new CGFtexture(this, './resources/textures/terrain/pebbles.jpg');
    this.flowerScatteredTexture = new CGFtexture(this, './resources/textures/terrain/flower_scattered.jpg');
    this.decayLeavesTexture     = new CGFtexture(this, './resources/textures/terrain/decayLeaves.jpg');
    this.rockyTexture           = new CGFtexture(this, './resources/textures/terrain/rocky.jpg');
    this.barnFrontTexture       = new CGFtexture(this, './resources/textures/barn/barn_front.png');
    this.barnRedWoodTexture     = new CGFtexture(this, './resources/textures/barn/red_barn_wood.png');
    this.barnWindowTexture      = new CGFtexture(this, './resources/textures/barn/barn_window.png');
    this.bedTexture             = new CGFtexture(this, './resources/textures/wagon/woodBed.jpg');
    this.darkWoodTexture        = new CGFtexture(this, './resources/textures/barn/dark_wood.png');

    // One shared material across all haybales; allocating new CGFappearance
    // instances mid-game caused WebGL stutter on respawn.
    this.haybaleMaterial = new CGFappearance(this);
    this.haybaleMaterial.setAmbient(0.45, 0.35, 0.10, 1.0);
    this.haybaleMaterial.setDiffuse(0.80, 0.65, 0.20, 1.0);
    this.haybaleMaterial.setSpecular(0.05, 0.05, 0.02, 1.0);
    this.haybaleMaterial.setShininess(8);
    this.haybaleMaterial.setTexture(this.hayTexture);
    this.haybaleMaterial.setTextureWrap('REPEAT', 'REPEAT');
  }

  initPrimitives() {
    this.cube       = new MyUnitCube(this);
    this.cylinder   = new MyCylinder(this, 24, 1);
    this.circle     = new MyCircle(this, 24);
    this.rockSphere = new MySphere(this, 0.5, 16, 8, false, 1, 0);
  }

  initShaders() {
    this.panoramaShader = new CGFshader(this.gl, "./shaders/sky.vert", "./shaders/sky.frag");
    this.panoramaShader.setUniformsValues({ uSampler: 0, time: 0 });

    this.rockShader = new CGFshader(this.gl, "./shaders/rock.vert", "./shaders/rock.frag");
    this.rockShader.setUniformsValues({
      uColorMap:    0,
      uNormalMap:   1,
      uNoiseMap:    2,
      uDeformScale: 0.15,
      uSeed:        0.0,
    });

    this.branchShader = new CGFshader(this.gl, "./shaders/branch.vert", "./shaders/branch.frag");

    this.clothShader = new CGFshader(this.gl, "./shaders/cloth.vert", "./shaders/cloth.frag");
    this.clothShader.setUniformsValues({ uSampler: 0, time: 0 });

    this.arrowShader = new CGFshader(this.gl, "./shaders/arrow.vert", "./shaders/arrow.frag");
  }

  setDefaultAppearance() {
    this.setAmbient(0.22, 0.22, 0.22, 1.0);
    this.setDiffuse(0.8, 0.8, 0.8, 1.0);
    this.setSpecular(0.1, 0.1, 0.1, 1.0);
    this.setShininess(10.0);
  }

  update(t) {
    if (this.startTime === undefined) this.startTime = t;
    const prevTime = this.time ?? 0;
    this.time = (t - this.startTime) / 1000;
    const dt = this.time - prevTime;

    this.panoramaShader.setUniformsValues({ time: this.time });
    this.clothShader.setUniformsValues({ time: this.time });
    if (this.arrowShader) this.arrowShader.setUniformsValues({ uTime: this.time });
    if (this.grassShader) this._updateGrassUniforms();

    if (!this.wagon) return;

    const isIntroActive = this.introAnimator && this.introAnimator.active;
    if (isIntroActive) {
      // Terrain heightmap loads async; once it's in, snap the wagon and
      // horses up to ground level so they don't render half-buried.
      if (this.terrain && this.terrain.ready) {
        this.wagon.y = this.terrain.heightAt(this.wagon.x, this.wagon.z);
        this.wagon._updateHorsePositions();
      }
      this._syncHUD();
      return;
    }

    if (this.gameOver || this.menuActive) return;

    this.gameplayTime += dt;
    this.wagon.update(dt, this.interface);
    this._updateTreeAnimators(dt);
    this._updateBarn();

    this._showHUDIfEnabled();
    this._syncGameplayUI();
    this._checkGameOver();
    this._syncHUD();
  }

  _updateGrassUniforms() {
    // Wind is the product of two slow sines at coprime periods, biased toward
    // its peak by Math.pow with exponent <1 — gusts plateau at full strength
    // before dropping, instead of looking like a clean sine.
    const rawBreath  = 0.5 + 0.5 * Math.sin(this.time * 0.5);
    const windBreath = Math.pow(rawBreath, 0.25);
    const windGust   = 0.6 + 0.4 * Math.sin(this.time * 1.1 + 1.3);
    const liveAmp    = this.windAmp * windBreath * windGust;

    let pHorse = [-1000.0, -1000.0];
    let pW0 = pHorse, pW1 = pHorse, pW2 = pHorse, pW3 = pHorse;

    if (this.wagon && this.wagon.horses && this.wagon.horses.length > 0) {
      pHorse = [this.wagon.horses[0].x, this.wagon.horses[0].z];

      // Wheel offsets duplicated from MyWagon — keep matched if BED_LENGTH /
      // BED_WIDTH / WHEEL_THICKNESS / scale change there.
      const cy = Math.cos(this.wagon.yaw);
      const sy = Math.sin(this.wagon.yaw);
      const wx = 8.0 * 0.35 * this.wagon.scale;
      const wz = (4.0 * 0.5 + 0.22 * 0.5 + 0.02) * this.wagon.scale;
      const toWorld = (lx, lz) => [
        this.wagon.x + lx * cy + lz * sy,
        this.wagon.z + -lx * sy + lz * cy,
      ];
      pW0 = toWorld( wx,  wz);
      pW1 = toWorld( wx, -wz);
      pW2 = toWorld(-wx,  wz);
      pW3 = toWorld(-wx, -wz);
    }

    this.grassShader.setUniformsValues({
      uTime:      this.time,
      uWindAmp:   liveAmp,
      uWindFreq:  this.windFreq,
      uHorsePos:  pHorse,
      uWheelPos0: pW0,
      uWheelPos1: pW1,
      uWheelPos2: pW2,
      uWheelPos3: pW3,
    });
  }

  _updateTreeAnimators(dt) {
    if (!this.treeZones) return;
    for (let i = this.treeZones.length - 1; i >= 0; i--) {
      const zone = this.treeZones[i];
      if (zone.animator && zone.animator.active) {
        zone.animator.update(this.time);
      } else if (zone.isFallen) {
        // Hold the felled tree on screen for 2 s, then drop it entirely so
        // the player can drive through.
        zone.disappearTimer = (zone.disappearTimer || 0) + dt;
        if (zone.disappearTimer > 2.0) {
          const fIndex = this.floras.indexOf(zone.flora);
          if (fIndex > -1) this.floras.splice(fIndex, 1);
          this.treeZones.splice(i, 1);
        }
      }
    }
  }

  _updateBarn() {
    if (!this.barn) return;

    // Keep barn synced to the GUI sliders even mid-game.
    this.barn.x   = this.barnPosX;
    this.barn.z   = this.barnPosZ;
    this.barn.y   = this.terrain.heightAt(this.barnPosX, this.barnPosZ);
    this.barn.yaw = this.barnYaw;

    const wagonRadius = 1.6 * this.wagon.scale;
    this.barn.checkWagonIntersection(this.wagon.x, this.wagon.z, wagonRadius);

    // A bale sets _justLanded for exactly one frame when its drop animation
    // ends. We test if it landed inside the barn drop-off circle.
    let totalRestored = 0;
    for (let i = this.haybales.length - 1; i >= 0; i--) {
      const bale = this.haybales[i];
      if (!bale._justLanded) continue;
      bale._justLanded = false;

      if (this.barn.checkPointInDropOff(bale.x, bale.z)) {
        this.wagon.hp = Math.min(this.wagon.maxHp, this.wagon.hp + 50);
        totalRestored += 50;
        this.uiBalesDelivered++;
        if (bale.dropAnimator) bale.dropAnimator.disable();
        this.replaceBale(bale);
      }
    }
    if (totalRestored > 0) this.uiRestored = totalRestored;
  }

  _showHUDIfEnabled() {
    if (!this.hudContainerEl) return;
    const wantsShown = this.displayHUD;
    const isShown    = this.hudContainerEl.style.display !== 'none';
    if (wantsShown !== isShown) {
      this.hudContainerEl.style.display = wantsShown ? 'flex' : 'none';
    }
  }

  _syncGameplayUI() {
    this.uiHp    = Math.ceil(this.wagon.hp);
    this.uiScore = Math.floor(this.gameplayTime);

    if (this.uiDamage > 0) {
      this.spawnFloatingText("-" + this.uiDamage, "#ff4444");
      this.uiDamage = 0;
    }
    if (this.uiRestored > 0) {
      this.spawnFloatingText("+" + this.uiRestored, "#44ff44");
      this.uiRestored = 0;
    }
  }

  _checkGameOver() {
    if (this.wagon.hp <= 0 && !this.gameOver) {
      this.wagon.hp = 0;
      this.gameOver = true;
      if (this.gameOverEl) this.gameOverEl.style.display = 'flex';
    }
  }

  // Diffed against last-rendered values so we don't thrash the DOM each frame.
  _syncHUD() {
    const hpInt = Math.ceil(this.wagon.hp);
    if (hpInt !== this.lastRenderedHp && this.hpNumEl && this.hpBarEl) {
      this.lastRenderedHp = hpInt;
      const hpPercent = (this.wagon.hp / this.wagon.maxHp) * 100;
      this.hpNumEl.innerText = hpInt;
      this.hpBarEl.style.width = Math.max(0, hpPercent) + '%';
      this.hpBarEl.style.background = this._hpBarGradient(hpPercent);
    }
    if (this.uiScore !== this.lastRenderedScore && this.scoreValEl) {
      this.lastRenderedScore = this.uiScore;
      this.scoreValEl.innerText = this.uiScore;
    }
    // Bale counter shows delivered + currently carried, so it ticks up the
    // moment the player picks one up rather than waiting for delivery.
    const carriedCount = this.wagon.carriedBales.length;
    const balesChanged = this.uiBalesDelivered !== this.lastRenderedBales
                      || carriedCount         !== this.lastRenderedCarried;
    if (balesChanged && this.balesValEl) {
      this.lastRenderedBales   = this.uiBalesDelivered;
      this.lastRenderedCarried = carriedCount;
      this.balesValEl.innerText = this.uiBalesDelivered + carriedCount;
    }
  }

  _hpBarGradient(pct) {
    if (pct > 50) return 'linear-gradient(90deg, #4caf50, #8bc34a)';
    if (pct > 20) return 'linear-gradient(90deg, #ffb300, #ffd54f)';
    return 'linear-gradient(90deg, #e53935, #ef5350)';
  }

  spawnFloatingText(text, color) {
    if (!this.floatingTextAnchorEl) return;

    const el = document.createElement('div');
    el.className = 'floating-text';
    el.innerText = text;
    el.style.color = color;
    el.style.left = `calc(50% + ${(Math.random() - 0.5) * 40}px)`;

    this.floatingTextAnchorEl.appendChild(el);
    setTimeout(() => el.parentNode && el.parentNode.removeChild(el), 1500);
  }

  startGame() {
    if (!this.menuActive) return;
    this.menuActive = false;

    if (this.menuEl) {
      this.menuEl.classList.add('menu-fade-out');
      setTimeout(() => { this.menuEl.style.display = 'none'; }, 600);
    }

    this.gameplayTime = 0;
    if (this.introAnimator) this.introAnimator.enable(this.time);
  }

  restartGame() {
    if (!this.terrain?.ready) return;

    this.scatter();

    this.uiBalesDelivered    = 0;
    this.uiScore             = 0;
    this.uiDamage            = 0;
    this.uiRestored          = 0;
    this.lastRenderedBales   = -1;
    this.lastRenderedScore   = -1;
    this.lastRenderedHp      = -1;
    this.lastRenderedCarried = -1;
    this.gameplayTime        = 0;

    this.gameOver   = false;
    this.menuActive = false;
    this.freeCamera = false;
    this.cameraShake = 0;
    if (this.introAnimator) this.introAnimator.disable();
    if (this.gameOverEl) this.gameOverEl.style.display = 'none';
  }

  display() {
    if (this.introAnimator && this.introAnimator.active) {
      this.introAnimator.update(this.time || 0);
    }

    // Follow-cam runs at render rate (not the 60 Hz update tick) for smoothness.
    if (!this.freeCamera && this.wagon) this._updateFollowCamera();

    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    this.updateProjectionMatrix();
    this.loadIdentity();
    this.applyViewMatrix();

    this._updateLightingUniforms();
    this.lights[0].update();

    if (this.displayAxis) this.axis.display();
    this.setDefaultAppearance();

    if (this.displaySky)     this._displaySky();
    if (this.displayTerrain) this.terrain.display();

    if (!this._scattered && this.terrain.ready) {
      this.scatter();
      this._scattered = true;
    }

    const cx = this.camera.position[0];
    const cz = this.camera.position[2];

    if (this.displayRocks && this.rocks.length > 0) this._displayRocks(cx, cz);
    if (this.displayFlora)                          this._displayFlora(cx, cz);
    if (this.displayWagon && this.wagon)            this.wagon.display();
    if (this.barn)                                  this.barn.display();
    if (this.displayHayBales && this.haybales)      this._displayHayBales(cx, cz);
    if (this.displayGrass && this.grassPatches && this.grassPatches.length > 0) {
      this._displayGrass();
    }
  }

  _updateFollowCamera() {
    const w      = this.wagon;
    const introY = this.introCameraOffset || 0;

    // Elastic camera lag: pulls back up to 1.5 units at top speed (8.0 = MAX_SPEED).
    const speedLag = (w.speed / 8.0) * 1.5;

    // Collision shake: decays per render frame.
    let shakeY = 0;
    if (this.cameraShake > 0) {
      shakeY = Math.sin(this.time * 40) * this.cameraShake;
      this.cameraShake = Math.max(0, this.cameraShake - 0.05);
    }

    // Intro phase pulls the camera high and aims at the horizon, then settles
    // onto the wagon as introY decays toward 0.
    const CAM_DIST   = 18 + speedLag + introY * 0.4;
    const CAM_HEIGHT =  9 + introY    + shakeY;
    const CAM_LOOK   = 3.0 + introY * 1.0 + shakeY * 0.5;

    // Centrifugal lean: shift camera laterally into the turn.
    const lean = w.steeringAngle * 3;
    const rx = Math.sin(w.yaw);
    const rz = Math.cos(w.yaw);

    const bx = w.x - Math.cos(w.yaw) * CAM_DIST + rx * lean;
    const bz = w.z + Math.sin(w.yaw) * CAM_DIST + rz * lean;

    vec3.set(this.camera.position, bx, w.y + CAM_HEIGHT, bz);
    vec3.set(this.camera.target,   w.x, w.y + CAM_LOOK,  w.z);

    // Speed-zoom: open the FOV slightly under throttle to telegraph speed.
    this.camera.fov = 1.0 + (w.speed / 8.0) * 0.08;
  }

  _updateLightingUniforms() {
    // Transform world-space sun direction into eye space for the custom
    // shaders (rock, branch, cloth, terrain) — they take eye-space lighting.
    const sunWorld = vec4.fromValues(SUN_WORLD_DIR[0], SUN_WORLD_DIR[1], SUN_WORLD_DIR[2], 0.0);
    const sunEye   = vec4.create();
    vec4.transformMat4(sunEye, sunWorld, this.camera.getViewMatrix());
    const lp = [sunEye[0], sunEye[1], sunEye[2]];

    // Normalize on the CPU once — fragment shaders read it as-is and skip
    // a per-pixel normalize.
    const len = Math.sqrt(lp[0] * lp[0] + lp[1] * lp[1] + lp[2] * lp[2]);
    const ld  = [lp[0] / len, lp[1] / len, lp[2] / len];

    this.rockShader.setUniformsValues({   uLightPos: lp });
    this.branchShader.setUniformsValues({ uLightDir: ld });
    this.clothShader.setUniformsValues({  uLightPos: lp });
    if (this.terrain && this.terrain.terrainShader) {
      this.terrain.terrainShader.setUniformsValues({ uLightPos: lp });
    }
  }

  _displaySky() {
    this.setActiveShader(this.panoramaShader);
    this.panoramaTexture.bind(0);
    this.panorama.display();
    this.setActiveShader(this.defaultShader);
  }

  _displayRocks(cx, cz) {
    this.setActiveShader(this.rockShader);
    this.rockNoiseMap.bind(2);
    for (const rock of this.rocks) {
      const dx = rock.x - cx, dz = rock.z - cz;
      if (dx * dx + dz * dz < DRAW_DIST_SQ) rock.display();
    }
    this.setActiveShader(this.defaultShader);
  }

  _displayFlora(cx, cz) {
    this.setActiveShader(this.branchShader);
    this.branchShader.setUniformsValues({ uLength: 1.0 });

    if (this.floras.length > 0) {
      for (const f of this.floras) {
        const dx = f.x - cx, dz = f.z - cz;
        if (dx * dx + dz * dz < DRAW_DIST_SQ) f.displayBranches();
      }
    }
    if (this.flowerBatch) this.flowerBatch.displayBranches();

    this.gl.disable(this.gl.CULL_FACE);
    this.branchShader.setUniformsValues({ uLength: 0.5 });

    if (this.floras.length > 0) {
      for (const f of this.floras) {
        const dx = f.x - cx, dz = f.z - cz;
        if (dx * dx + dz * dz < DRAW_DIST_SQ) f.displayLeaves();
      }
    }
    if (this.flowerBatch) this.flowerBatch.displayLeaves();

    this.gl.enable(this.gl.CULL_FACE);
    this.setActiveShader(this.defaultShader);
  }

  _displayHayBales(cx, cz) {
    const nearBales = [];
    const farBales  = [];

    for (const bale of this.haybales) {
      if (bale.isPickedUp && !(bale.dropAnimator && bale.dropAnimator.active)) {
        if (this.wagon?.carriedBales.includes(bale)) continue;
      }
      const dx = bale.x - cx, dz = bale.z - cz;
      const distSq = dx * dx + dz * dz;
      if (distSq < BALE_DRAW_DIST_SQ)      nearBales.push(bale);
      else if (distSq < DRAW_DIST_SQ)      farBales.push(bale);
    }

    // Pass 1: bale meshes (near only).
    if (nearBales.length > 0) {
      this.setActiveShader(this.defaultShader);
      for (const bale of nearBales) bale.display();
    }

    // Pass 2: arrows over all visible bales (near + far).
    if (this.displayArrows && this.arrow) {
      let arrowShaderActive = false;
      const allVisible = nearBales.concat(farBales);
      for (const bale of allVisible) {
        if (bale.isPickedUp) continue;
        if (!arrowShaderActive) {
          this.setActiveShader(this.arrowShader);
          arrowShaderActive = true;
        }
        this.pushMatrix();
        const [ax, ay, az] = bale.getTopCenter();
        this.translate(ax, ay, az);
        this.arrow.display();
        this.popMatrix();
      }
      if (arrowShaderActive) this.setActiveShader(this.defaultShader);
    }
  }

  _displayGrass() {
    this.setActiveShader(this.grassShader);
    this.gl.disable(this.gl.CULL_FACE);
    for (const patch of this.grassPatches) patch.displayShared();
    this.gl.enable(this.gl.CULL_FACE);
    this.setActiveShader(this.defaultShader);
  }
}
