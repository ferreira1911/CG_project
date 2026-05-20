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
import { MyHayBaleAnimator } from "./animators/MyHayBaleAnimator.js";
import { MyTreeAnimator } from "./animators/MyTreeAnimator.js";
import { MyUnitCube } from "./geometric/MyUnitCube.js";
import { MyCylinder } from "./geometric/MyCylinder.js";
import { MyCircle } from "./geometric/MyCircle.js";
import { MySphere } from "./geometric/MySphere.js";
import { MyHayBale } from "./elements/MyHayBale.js";
import { MyArrow } from "./elements/MyArrow.js";
import { r, pickSpot } from "./utils.js";

const ROCK_COUNT    = 30;
const FLOWER_COUNT  = 80;
const HAYBALE_COUNT = 3;


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
    
    this.setGlobalAmbientLight(0.2, 0.2, 0.22, 1.0);

    this.initTextures();
    this.initPrimitives();
    this.initShaders();

    this.arrow = new MyArrow(this);

    this.axis = new CGFaxis(this);
    this.panorama = new MyPanorama(this, this.panoramaTexture);
    this.terrain = new MyTerrain(this);

    this.rocks    = [];
    this.floras   = [];
    this.haybales = [];
    this.flowerClusters = [];
    this.treeZones = [];
    this._scattered = false;

    this.displayAxis = false;
    this.displayHUD = true;
    this.displayWagon = true;
    this.displayFlora = true;
    this.displayArrows = true;
    this.displayRocks = true;
    this.displayHayBales = true;
    this.displayGrass = true;
    this.displaySky = true;
    this.displayTerrain = true;

    // Generation Parameters (Exposed to GUI)
    this.numRocks = 20;
    this.numHaybales = 3;
    this.numTrees = 4;
    
    // Flora Geometry Parameters
    this.numFlowers = 180;
    this.numFlowerClusters = 6;
    this.flowerClusterRadius = 3.8;
    this.flowerStemLength = 0.8;
    this.flowerPetals = 4;
    this.flowerPetalSize = 2.2;
    
    this.windAmp = 0.35;
    this.windFreq = 1.7;

    this.freeCamera  = false;  // follow-cam by default; toggle in GUI

    // Start 120 units high. Hold for 4 seconds (panorama shot), then drop over 4 seconds.
    this.introAnimator = new MyCameraAnimator(this, 120, 4.0, 4.0);

    this.setUpdatePeriod(16);  // ~60 Hz physics/input tick

    // Cache HUD DOM elements for performance
    this.hudContainerEl = document.getElementById('hud-container');
    if (this.hudContainerEl) this.hudContainerEl.style.display = 'none';
    
    this.hpNumEl = document.getElementById('hp-number');
    this.hpBarEl = document.getElementById('hp-bar');
    this.scoreValEl = document.getElementById('score-val');
    this.balesValEl = document.getElementById('bales-val');
    this.floatingTextAnchorEl = document.getElementById('floating-text-anchor');
    this.gameOverEl = document.getElementById('game-over-screen');
    
    this.lastRenderedHp = -1; // Force first update
    this.lastRenderedScore = -1;
    this.lastRenderedBales = -1;

    // GUI Stats variables
    this.uiHp = 150;
    this.uiDamage = 0;
    this.uiRestored = 0;
    this.uiBalesDelivered = 0;
    this.uiScore = 0;
    this.gameOver = false;
    
    // Native key listener for Game Over restart — CGF loses keyboard focus
    // when a full-screen HTML overlay is on top of the canvas.
    document.addEventListener('keydown', (e) => {
        if (e.code === 'KeyR' && this.gameOver) {
            this.restartGame();
        }
    });

    // Barn Placement (GUI)
    this.barnPosX = -85;
    this.barnPosZ = -90;
    this.barnYaw = Math.PI / 2;
  }

  scatter() {
    // 1. Reset arrays for safe real-time regeneration
    this.rocks = [];
    this.floras = [];
    this.haybales = [];
    this.flowerClusters = [];
    this.treeZones = [];
    this.grassPatches = [];

    // Place barn in the corner of the base where there is no path, facing the base
    const barnY = this.terrain.heightAt(this.barnPosX, this.barnPosZ);
    
    this.barn = new MyBarn(this, this.barnPosX, barnY, this.barnPosZ, this.barnYaw, {
        wood: this.barnRedWoodTexture,
        front: this.barnFrontTexture,
        roof: this.darkWoodTexture,
        window: this.barnWindowTexture
    });

    const spawnZ = this.barn.areaOffsetZ - 2.5;
    const cy = Math.cos(this.barnYaw);
    const sy = Math.sin(this.barnYaw);
    const wagonX = this.barnPosX + spawnZ * sy;
    const wagonZ = this.barnPosZ + spawnZ * cy;

    this.wagon = new MyWagon(this, wagonX, this.terrain.heightAt(wagonX, wagonZ), wagonZ, this.barnYaw, 1.0, this.horseTexture);

    // 2. Rocks: baked displaced geometry
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
      let x, y, z;
      do {
        x = r(-100, 100);
        z = r(-100, 100);
      } while (!this.terrain.isPathClear(x, z, clearance));
      y = this.terrain.heightAt(x, z);
      
      const matIdx = Math.floor(r(0, rockTextures.length));
      this.rocks.push(new MyRock(
        this, x, y, z, sx, sy, sz,
        r(0, Math.PI * 2), r(0, 100), r(0.55, 0.85),
        r(0.7, 1.6), r(2.0, 5.0), r(0.5, 1.3), r(-0.5, 0.6),
        rockTextures[matIdx], rockNormals[matIdx]
      ));
    }

    // 3. Hay Bales (Instantiate before Grass so grass can detect their presence!)
    for (let i = 0; i < this.numHaybales; i++) {
      this.spawnHayBale();
    }

    // 4. Grouped Flowers (Clusters)
    const FLOWER_COLORS = [
      [0.2, 0.4, 0.9], // Blue
      [0.9, 0.2, 0.2], // Red
      [0.9, 0.8, 0.2], // Yellow
      [0.9, 0.9, 0.9], // White
      [0.6, 0.2, 0.8]  // Purple
    ];

    const flowersPerCluster = Math.max(2, Math.floor(this.numFlowers / this.numFlowerClusters));

    for (let c = 0; c < this.numFlowerClusters; c++) {
      let cx, cz;
      do {
        cx = r(-90, 90);
        cz = r(-90, 90);
      } while (!this.terrain.isPathClear(cx, cz, this.flowerClusterRadius));

      // Assign ONE specific color to this entire cluster to represent a uniform floral patch!
      const clusterColor = FLOWER_COLORS[Math.floor(Math.random() * FLOWER_COLORS.length)];

      // Register center & radius of the floral cluster so Grass avoids this area
      this.flowerClusters.push({
          x: cx,
          z: cz,
          radius: this.flowerClusterRadius
      });

      for (let f = 0; f < flowersPerCluster; f++) {
         // Slightly wider dispersion (0.85) for seamless transition at the grass boundary
         const angle = r(0, Math.PI * 2);
         const dist = Math.sqrt(Math.random()) * (this.flowerClusterRadius * 0.85);
         const fx = cx + Math.cos(angle) * dist;
         const fz = cz + Math.sin(angle) * dist;

         if (!this.terrain.isPathClear(fx, fz, 0.5)) continue;
         
         const fy = this.terrain.heightAt(fx, fz);
         // Lowered scale and trunkLength slightly so flowers sit just at or slightly below the grass line (1.1 - 1.3)
         const scale = r(0.45, 0.8);
         
         const newFlower = new MyFlora(
            this, fx, fy, fz, scale,
            3, 30, this.flowerStemLength, 0.55, 0.05, 0.6, 15,
            this.flowerPetals | 0, this.flowerPetalSize, 35, 0.3,
            null, null, r(0, 100), false, clusterColor, true // deferGLInit
         );
         if (!this.flowersToBatch) this.flowersToBatch = [];
         this.flowersToBatch.push(newFlower);
      }
    }
    
    // Batch all flowers into a single VBO to reduce draw calls
    if (this.flowersToBatch && this.flowersToBatch.length > 0) {
        this.flowerBatch = new MyFloraBatch(this, this.flowersToBatch);
        this.flowersToBatch = null; // Free JS memory
    }

    // 4b. Trees — a few L-system conifers. Pushed into `floras` so they render
    // through the existing flora batch pass (no extra draw/shader code). Kept
    // sparse and spread out so they don't crowd the scene.
    for (let i = 0; i < this.numTrees; i++) {
      let tx, tz, tries = 0, ok = false;
      do {
        tx = r(-110, 110);
        tz = r(-110, 110);
        tries++;
        ok = this.terrain.isPathClear(tx, tz, 3.0);
        if (ok) {
          for (const zone of this.treeZones) {
            const dx = tx - zone.x, dz = tz - zone.z;
            if (dx * dx + dz * dz < 22 * 22) { ok = false; break; }
          }
        }
      } while (!ok && tries < 30);
      if (!ok) continue;

      const ty = this.terrain.heightAt(tx, tz);
      const scale = r(2, 3);
      const treeFlora = new MyFlora(
        this, tx, ty, tz, scale,
        3, 28, 1.6, 0.78, 0.28, 0.72, 22,
        1, 0.9, 30, 0.45,
        null, this.barkTexture, r(0, 100), true
      );
      this.floras.push(treeFlora);
      
      const treeAnimator = new MyTreeAnimator(treeFlora, 1.5);
      
      this.treeZones.push({ 
          x: tx, 
          z: tz, 
          radius: 2.0 * scale,
          flora: treeFlora,
          animator: treeAnimator,
          isFallen: false 
      });
    }

    // Feed tree trunk positions to the terrain shader so the decay-leaves
    // overlay only appears next to trees (must match MAX_TREES in terrain.frag).
    const MAX_TREES = 12;
    const treePos = new Array(MAX_TREES * 2).fill(0);
    const treeCount = Math.min(this.treeZones.length, MAX_TREES);
    for (let i = 0; i < treeCount; i++) {
      treePos[i * 2]     = this.treeZones[i].x;
      treePos[i * 2 + 1] = this.treeZones[i].z;
    }
    if (this.terrain && this.terrain.terrainShader) {
      this.terrain.terrainShader.setUniformsValues({
        uTreeCount: treeCount,
        uTreePos: treePos
      });
    }

    // 5. Grass Shader setup
    this.grassShader = new CGFshader(this.gl, 'shaders/grass.vert', 'shaders/grass.frag');
    this.grassShader.setUniformsValues({
      uTime:     0,
      uWindAmp:  this.windAmp,
      uWindFreq: this.windFreq,
      uBladeHeight: 1.3 * 1.3
    });

    // 6. Generate Grass Patches
    const gridSize = 9;
    const mapSize = 300;
    const halfMap = mapSize / 2;
    const step = mapSize / gridSize;

    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            const cx = -halfMap + step / 2 + i * step;
            const cz = -halfMap + step / 2 + j * step;
            if (cx * cx + cz * cz > halfMap * halfMap) continue; 
            
            // MyGrass constructor automatically calls isGrassSpawnBlocked(x, z)!
            const patch = new MyGrass(this, this.grassShader, this.terrain, cx, cz, step);
            this.grassPatches.push(patch);
        }
    }
  }

  /**
   * Helper called by MyGrass constructor to ensure grass is not spawned 
   * inside rocks, haybales, or floral cluster zones.
   */
  isGrassSpawnBlocked(x, z) {
    // Check intersection with Rocks
    for (let i = 0; i < this.rocks.length; i++) {
        const rock = this.rocks[i];
        const dx = x - rock.x;
        const dz = z - rock.z;
        const radius = Math.max(rock.sx, rock.sz) * 0.85; 
        if (dx * dx + dz * dz < radius * radius) return true;
    }
    
    // Check intersection with Hay Bales
    for (let i = 0; i < this.haybales.length; i++) {
        const hb = this.haybales[i];
        const dx = x - hb.x;
        const dz = z - hb.z;
        const radius = (hb.scale || 1.0) * 1.75; 
        if (dx * dx + dz * dz < radius * radius) return true;
    }

    // Check intersection with Tree trunks
    if (this.treeZones) {
        for (let i = 0; i < this.treeZones.length; i++) {
            const t = this.treeZones[i];
            const dx = x - t.x;
            const dz = z - t.z;
            if (dx * dx + dz * dz < t.radius * t.radius) return true;
        }
    }

    // Check intersection with Flower Grouping Zones
    if (this.flowerClusters) {
        for (let i = 0; i < this.flowerClusters.length; i++) {
            const cluster = this.flowerClusters[i];
            const dx = x - cluster.x;
            const dz = z - cluster.z;
            // Shrink the exclusion zone multiplier slightly (0.82) to allow the 
            // grass to overlap with the outermost flowers for a seamless transition.
            const exclusionRadius = cluster.radius * 0.82;
            if (dx * dx + dz * dz < exclusionRadius * exclusionRadius) return true;
        }
    }
    
    return false;
  }

  /**
   * Spawns a new hay bale at a random valid location.
   */
  spawnHayBale() {
    let bx, bz;
    let attempts = 0;
    do {
      bx = r(-80, 80);
      bz = r(-80, 80);
      attempts++;
    } while (!this.terrain.isPathClear(bx, bz, 2.0) && attempts < 50);
    
    const by    = this.terrain.heightAt(bx, bz);
    const rotY  = r(0, Math.PI * 2);     // Random orientation
    const scale = r(0.8, 1.3);           // Slight size variation
    this.haybales.push(new MyHayBale(this, bx, by, bz, rotY, scale, this.haybaleMaterial));
  }

  /**
   * Replaces a specific hay bale (e.g., after delivery) with a new one.
   */
  replaceBale(bale) {
    const index = this.haybales.indexOf(bale);
    if (index !== -1) {
        this.haybales.splice(index, 1);
        this.spawnHayBale();
    }
  }

  initLights() {
    // Posição: X, Y, Z, 0 (0 = luz direcional, como o Sol)
    this.lights[0].setPosition(-112.0, 135.0, -100.0, 0.0);
    // Cor do Sol (amarelo muito claro)
    this.lights[0].setDiffuse(1.0, 0.98, 0.9, 1.0);
    this.lights[0].setSpecular(1.0, 0.98, 0.9, 1.0);
    this.lights[0].setAmbient(0.18, 0.18, 0.2, 1.0);

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
    this.panoramaTexture = new CGFtexture(this, './resources/textures/environment/panorama.jpg');
    this.cloudMap = new CGFtexture(this, './resources/textures/environment/cloudMap.png');
    this.rockColorMap1 = new CGFtexture(this, './resources/textures/rocks/rockTexture1.jpg');
    this.rockColorMap2 = new CGFtexture(this, './resources/textures/rocks/rockTexture2.jpg');
    this.rockColorMap3 = new CGFtexture(this, './resources/textures/rocks/rockTexture3.jpg');
    this.rockNormalMap1 = new CGFtexture(this, './resources/textures/rocks/rockNormals1.jpg');
    this.rockNormalMap2 = new CGFtexture(this, './resources/textures/rocks/rockNormals2.jpg');
    this.rockNormalMap3 = new CGFtexture(this, './resources/textures/rocks/rockNormals3.jpg');
    this.rockNoiseMap = new CGFtexture(this, './resources/textures/rocks/rockNoise1.png');
    this.grassTexture = new CGFtexture(this, './resources/textures/environment/grass.png');
    this.horseTexture = new CGFtexture(this, './resources/Horse/Tex_Horse.png');
    this.barkTexture  = new CGFtexture(this, './resources/textures/rocks/rockTexture2.jpg');
    this.hayTexture   = new CGFtexture(this, './resources/textures/wagon/hay.jpg');
    this.blankTexture = new CGFtexture(this, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==');
    this.pebbleTexture = new CGFtexture(this, './resources/textures/terrain/pebbles.jpg');
    this.flowerScatteredTexture = new CGFtexture(this, './resources/textures/terrain/flower_scattered.jpg');
    this.decayLeavesTexture = new CGFtexture(this, './resources/textures/terrain/decayLeaves.jpg');
    this.rockyTexture = new CGFtexture(this, './resources/textures/terrain/rocky.jpg');
    this.barnFrontTexture = new CGFtexture(this, './resources/textures/barn/barn_front.png');
    this.barnRedWoodTexture = new CGFtexture(this, './resources/textures/barn/red_barn_wood.png');
    this.barnWindowTexture = new CGFtexture(this, './resources/textures/barn/barn_window.png');
    this.bedTexture = new CGFtexture(this, './resources/textures/wagon/woodBed.jpg');
    this.darkWoodTexture = new CGFtexture(this, './resources/textures/barn/dark_wood.png');
    
    // Shared material for all haybales to prevent WebGL stutter during spawns
    this.haybaleMaterial = new CGFappearance(this);
    this.haybaleMaterial.setAmbient(0.45, 0.35, 0.10, 1.0);
    this.haybaleMaterial.setDiffuse(0.80, 0.65, 0.20, 1.0);
    this.haybaleMaterial.setSpecular(0.05, 0.05, 0.02, 1.0);
    this.haybaleMaterial.setShininess(8);
    this.haybaleMaterial.setTexture(this.hayTexture);
    this.haybaleMaterial.setTextureWrap('REPEAT', 'REPEAT');
  }


  initPrimitives() {
    this.cube     = new MyUnitCube(this);
    this.cylinder = new MyCylinder(this, 24, 1);
    this.circle   = new MyCircle(this, 24);
    this.rockSphere = new MySphere(this, 0.5, 16, 8, false, 1, 0);
  }

  initShaders() {
    this.panoramaShader = new CGFshader(this.gl, "./shaders/sky.vert", "./shaders/sky.frag");
    this.panoramaShader.setUniformsValues({
      uSampler: 0,
      time: 0
    });

    this.rockShader = new CGFshader(this.gl, "./shaders/rock.vert", "./shaders/rock.frag");
    this.rockShader.setUniformsValues({
      uColorMap: 0,
      uNormalMap: 1,
      uNoiseMap: 2,
      uDeformScale: 0.15,
      uSeed: 0.0
    });

    this.branchShader = new CGFshader(this.gl, "./shaders/branch.vert", "./shaders/branch.frag");

    this.clothShader = new CGFshader(this.gl, "./shaders/cloth.vert", "./shaders/cloth.frag");
    this.clothShader.setUniformsValues({
      uSampler: 0,
      time: 0
    });

    this.arrowShader = new CGFshader(this.gl, "./shaders/arrow.vert", "./shaders/arrow.frag");
  }

  setDefaultAppearance() {
    this.setAmbient(0.22, 0.22, 0.22, 1.0); // Keep the base pass from flattening the scene
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
    
    if (this.grassShader) {
        // Simulate natural wind: blend two slow sinusoids at coprime periods
        // so the wind never feels perfectly periodic. windAmp acts as peak strength.
        // Simulate natural wind: windBreath is power-shaped so it rises fast,
        // lingers at full strength for a moment, then drops quickly — like a real gust.
        // Exponent < 1 biases the 0..1 sine value toward 1 (flat top effect).
        const rawBreath  = 0.5 + 0.5 * Math.sin(this.time * 0.5);            // 0..1, slow cycle (~12.5s)
        const windBreath = Math.pow(rawBreath, 0.25);                          // plateau: spends ~70% of time above 0.85
        const windGust   = 0.6 + 0.4 * Math.sin(this.time * 1.1 + 1.3);      // subtle irregular beat (never drops to 0)
        const liveAmp    = this.windAmp * windBreath * windGust;               // peak = windAmp, calm pockets near 0

        this.grassShader.setUniformsValues({ 
            uTime: this.time,
            uWindAmp: liveAmp,
            uWindFreq: this.windFreq
        });
    }
    
    if (this.arrowShader) {
        this.arrowShader.setUniformsValues({ uTime: this.time });
    }
    
    const isIntroActive = this.introAnimator && this.introAnimator.active;

    if (this.wagon) {
        if (!isIntroActive) {
            // If game over, block all gameplay — restart is handled by native keydown listener in init()
            if (this.gameOver) {
                return;
            }
            
            this.wagon.update(dt, this.interface);
            
            // Update tree falling animators and clean up fallen trees
            if (this.treeZones) {
                // Iterate backwards to allow safe removal from the array
                for (let i = this.treeZones.length - 1; i >= 0; i--) {
                    const zone = this.treeZones[i];
                    
                    if (zone.animator && zone.animator.active) {
                        zone.animator.update(this.time);
                    } else if (zone.isFallen) {
                        // The tree has finished falling. Start the disappear timer.
                        zone.disappearTimer = (zone.disappearTimer || 0) + dt;
                        if (zone.disappearTimer > 2.0) {
                            // Remove the tree's physical body from the rendering list
                            const fIndex = this.floras.indexOf(zone.flora);
                            if (fIndex > -1) this.floras.splice(fIndex, 1);
                            
                            // Remove the tree zone entirely so it stops processing
                            this.treeZones.splice(i, 1);
                        }
                    }
                }
            }
            
            // Barn: keep position in sync with GUI sliders
            if (this.barn) {
                this.barn.x = this.barnPosX;
                this.barn.z = this.barnPosZ;
                this.barn.y = this.terrain.heightAt(this.barnPosX, this.barnPosZ);
                this.barn.yaw = this.barnYaw;

                // Update drop-off zone highlight so it glows when wagon is near
                const wagonRadius = 1.6 * this.wagon.scale;
                this.barn.checkWagonIntersection(this.wagon.x, this.wagon.z, wagonRadius);

                // --- Drop-to-Deliver: check every bale that just landed ---
                // A bale sets _justLanded = true for exactly one frame when its
                // drop animation finishes. We test whether it landed inside the
                // barn drop-off circle and process the delivery if so.
                let totalRestored = 0;
                for (let i = this.haybales.length - 1; i >= 0; i--) {
                    const bale = this.haybales[i];
                    if (!bale._justLanded) continue;
                    bale._justLanded = false; // Consume the flag immediately

                    if (this.barn.checkPointInDropOff(bale.x, bale.z)) {
                        // Bale landed inside the barn — deliver it!
                        this.wagon.hp = Math.min(this.wagon.maxHp, this.wagon.hp + 50);
                        totalRestored += 50;
                        this.uiBalesDelivered++;

                        // Remove delivered bale and spawn a fresh one elsewhere
                        if (bale.dropAnimator) bale.dropAnimator.disable();
                        this.replaceBale(bale);
                    }
                }
                if (totalRestored > 0) this.uiRestored = totalRestored;
            }

            // Reveal HUD once the intro is over, if the toggle allows it
            if (this.displayHUD && this.hudContainerEl && this.hudContainerEl.style.display === 'none') {
                this.hudContainerEl.style.display = 'flex';
            } else if (!this.displayHUD && this.hudContainerEl && this.hudContainerEl.style.display !== 'none') {
                this.hudContainerEl.style.display = 'none';
            }
            
            // Sync UI stats
            this.uiHp = Math.ceil(this.wagon.hp);
            this.uiScore = Math.floor(this.time);
            
            // Trigger floating text for damage/healing
            if (this.uiDamage > 0) {
                this.spawnFloatingText("-" + this.uiDamage, "#ff4444");
                this.uiDamage = 0;
            }
            if (this.uiRestored > 0) {
                this.spawnFloatingText("+" + this.uiRestored, "#44ff44");
                this.uiRestored = 0;
            }
            
            // Game Over check — must be AFTER HP is synced
            if (this.wagon.hp <= 0 && !this.gameOver) {
                this.wagon.hp = 0;
                this.gameOver = true;
                if (this.gameOverEl) this.gameOverEl.style.display = 'flex';
            }
        } else {
            // During the intro, the terrain image might finish loading async.
            // We need to snap the wagon and horses to the correct height so they aren't buried!
            if (this.terrain && this.terrain.ready) {
                this.wagon.y = this.terrain.heightAt(this.wagon.x, this.wagon.z);
                this.wagon._updateHorsePositions();
            }
        }
        
        // Update HTML HUD using cached elements and value diffing (prevents DOM thrashing)
        const hpInt = Math.ceil(this.wagon.hp);
        if (hpInt !== this.lastRenderedHp && this.hpNumEl && this.hpBarEl) {
            this.lastRenderedHp = hpInt;
            const hpPercent = (this.wagon.hp / this.wagon.maxHp) * 100;
            
            this.hpNumEl.innerText = hpInt;
            this.hpBarEl.style.width = Math.max(0, hpPercent) + '%';
            
            // Color thresholds
            if (hpPercent > 50) {
                this.hpBarEl.style.background = 'linear-gradient(90deg, #4caf50, #8bc34a)';
            } else if (hpPercent > 20) {
                this.hpBarEl.style.background = 'linear-gradient(90deg, #ffb300, #ffd54f)';
            } else {
                this.hpBarEl.style.background = 'linear-gradient(90deg, #e53935, #ef5350)';
            }
        }
        
        // Sync Score and Bales
        if (this.uiScore !== this.lastRenderedScore && this.scoreValEl) {
            this.lastRenderedScore = this.uiScore;
            this.scoreValEl.innerText = this.uiScore;
        }
        if (this.uiBalesDelivered !== this.lastRenderedBales && this.balesValEl) {
            this.lastRenderedBales = this.uiBalesDelivered;
            this.balesValEl.innerText = this.uiBalesDelivered;
        }
    }
  }

  /**
   * Spawns animated floating text above the health bar.
   */
  spawnFloatingText(text, color) {
      if (!this.floatingTextAnchorEl) return;
      
      const el = document.createElement('div');
      el.className = 'floating-text';
      el.innerText = text;
      el.style.color = color;
      
      // Add slight random horizontal offset so numbers don't perfectly overlap
      const offsetX = (Math.random() - 0.5) * 40;
      el.style.left = `calc(50% + ${offsetX}px)`;
      
      this.floatingTextAnchorEl.appendChild(el);
      
      // Clean up DOM after animation finishes
      setTimeout(() => {
          if (el.parentNode) el.parentNode.removeChild(el);
      }, 1500);
  }

  /**
   * Resets all game state to starting values, hides the game over screen.
   */
  restartGame() {
      if (!this.wagon) return;

      // Restore health
      this.wagon.hp = this.wagon.maxHp;

      // Reset velocity / momentum
      this.wagon.speed = 0;
      this.wagon.steer = 0;
      this.wagon.carriedBales = [];

      // Teleport wagon back to its start position (near the barn)
      const spawnOffset = 10;
      const spawnCy = Math.cos(this.barnYaw);
      const spawnSy = Math.sin(this.barnYaw);
      this.wagon.x = this.barnPosX + spawnSy * spawnOffset;
      this.wagon.z = this.barnPosZ + spawnCy * spawnOffset;
      this.wagon.y = this.terrain ? this.terrain.heightAt(this.wagon.x, this.wagon.z) : 0;
      this.wagon.yaw = this.barnYaw;
      this.wagon._updateHorsePositions();

      // Reset UI counters
      this.uiBalesDelivered = 0;
      this.uiScore = 0;
      this.uiDamage = 0;
      this.uiRestored = 0;
      this.lastRenderedBales = -1;
      this.lastRenderedScore = -1;
      this.lastRenderedHp = -1;

      // Reset score timer
      this.startTime = undefined;
      this.time = 0;

      // Hide game over screen
      this.gameOver = false;
      if (this.gameOverEl) this.gameOverEl.style.display = 'none';
  }


  display() {
    // Update intro animation if active
    if (this.introAnimator && this.introAnimator.active) {
        this.introAnimator.update(this.time || 0);
    }

    // Follow-cam runs in display() at full render framerate (not the update tick).
    if (!this.freeCamera && this.wagon) {
      const w          = this.wagon;
      const introY     = this.introCameraOffset || 0;
      
      // 1. Elastic Camera Lag: Add up to 1.5 units of distance at max speed
      const speedLag   = (w.speed / 8.0) * 1.5; // 8.0 is MAX_SPEED

      // Camera shake from collisions
      let shakeY = 0;
      if (this.cameraShake > 0) {
          // Fast sine wave scaled by the current shake intensity
          shakeY = Math.sin(this.time * 40) * this.cameraShake;
          this.cameraShake = Math.max(0, this.cameraShake - 0.05); // decay
      }

      // When intro is running, start far back and high up, dropping smoothly into place
      const CAM_DIST   = 18 + speedLag + (introY * 0.4); 
      const CAM_HEIGHT =  9 + introY + shakeY;
      // Look at the horizon (sky/scenery) when high up, then pan down to the wagon (3.0)
      const CAM_LOOK   = 3.0 + (introY * 1.0) + (shakeY * 0.5); 
      
      // 2. Steering Lean (Centrifugal Force): Offset camera horizontally when turning
      // steeringAngle is positive when turning left, so camera swings right
      const lean = w.steeringAngle * 3;
      // Right vector is (+sin(yaw), 0, +cos(yaw))
      const rx = Math.sin(w.yaw);
      const rz = Math.cos(w.yaw);

      const bx = w.x - Math.cos(w.yaw) * CAM_DIST + (rx * lean);
      const bz = w.z + Math.sin(w.yaw) * CAM_DIST + (rz * lean);
      
      vec3.set(this.camera.position, bx, w.y + CAM_HEIGHT, bz);
      vec3.set(this.camera.target,   w.x, w.y + CAM_LOOK,  w.z);
      
      // 3. Dynamic FOV (Speed Zoom)
      // Base FOV is 1.0 rad. We zoom out slightly as speed increases.
      if (this.camera) {
          const baseFov = 1.0;
          const maxFovIncrease = 0.08; 
          this.camera.fov = baseFov + (w.speed / 8.0) * maxFovIncrease;
      }
    }

    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    this.updateProjectionMatrix();
    this.loadIdentity();
    this.applyViewMatrix();
    
    // ── Dynamic Lighting Update ──────────────────────────────────────────────
    // Calculate Sun's light direction in Eye Space so custom shaders know where the light is
    const sunWorld = vec4.fromValues(-112.0, 135.0, -100.0, 0.0);
    const sunEye = vec4.create();
    vec4.transformMat4(sunEye, sunWorld, this.camera.getViewMatrix());
    const lp = [sunEye[0], sunEye[1], sunEye[2]];
    
    // Pre-normalize the light direction on the CPU to save millions of fragment shader calculations
    const len = Math.sqrt(lp[0]*lp[0] + lp[1]*lp[1] + lp[2]*lp[2]);
    const ld = [lp[0]/len, lp[1]/len, lp[2]/len];
    
    this.rockShader.setUniformsValues({ uLightPos: lp });
    this.branchShader.setUniformsValues({ uLightDir: ld });
    this.clothShader.setUniformsValues({ uLightPos: lp });
    
    if (this.terrain && this.terrain.terrainShader) {
        this.terrain.terrainShader.setUniformsValues({ uLightPos: lp });
    }
    
    this.lights[0].update();

    if (this.displayAxis) this.axis.display();

    this.setDefaultAppearance();

    // Sky
    if (this.displaySky) {
        this.setActiveShader(this.panoramaShader);
        this.panoramaTexture.bind(0);
        this.panorama.display();
        this.setActiveShader(this.defaultShader);
    }

    if (this.displayTerrain) {
        this.terrain.display();
    }

    if (!this._scattered && this.terrain.ready) {
      this.scatter();
      this._scattered = true;
    }

    // ── Distance Culling (Draw Distance) ──────────────────────────────────
    // Only draw objects within a certain radius of the camera to save GPU cycles
    const DRAW_DIST_SQ = 135 * 135; // 135 units draw distance
    const cx = this.camera.position[0];
    const cz = this.camera.position[2];

    // Rocks
    if (this.displayRocks && this.rocks.length > 0) {
      this.setActiveShader(this.rockShader);
      this.rockNoiseMap.bind(2);
      for (const r of this.rocks) {
          const dx = r.x - cx;
          const dz = r.z - cz;
          if (dx * dx + dz * dz < DRAW_DIST_SQ) {
              r.display();
          }
      }
      this.setActiveShader(this.defaultShader);
    }

    // Flora Batch Rendering
    if (this.displayFlora) {
      this.setActiveShader(this.branchShader);
      
      this.branchShader.setUniformsValues({ uLength: 1.0 });
      // Draw dynamic individual trees
      if (this.floras.length > 0) {
          for (const f of this.floras) {
              const dx = f.x - cx;
              const dz = f.z - cz;
              if (dx * dx + dz * dz < DRAW_DIST_SQ) f.displayBranches();
          }
      }
      // Draw batched flowers in 1 draw call!
      if (this.flowerBatch) this.flowerBatch.displayBranches();

      this.gl.disable(this.gl.CULL_FACE);
      this.branchShader.setUniformsValues({ uLength: 0.5 });

      // Draw dynamic individual trees
      if (this.floras.length > 0) {
          for (const f of this.floras) {
              const dx = f.x - cx;
              const dz = f.z - cz;
              if (dx * dx + dz * dz < DRAW_DIST_SQ) f.displayLeaves();
          }
      }
      // Draw batched flowers in 1 draw call!
      if (this.flowerBatch) this.flowerBatch.displayLeaves();
      
      this.gl.enable(this.gl.CULL_FACE);
      this.setActiveShader(this.defaultShader);
    }

    if (this.displayWagon && this.wagon) this.wagon.display();
    if (this.barn) this.barn.display();

    // Hay bales — two batched passes so we switch shaders twice for the whole
    // bale set instead of twice per bale. Shader switching is one of the most
    // expensive GL ops on integrated GPUs (program rebind + pipeline flush).
    if (this.displayHayBales && this.haybales) {
      // Collect bales visible this frame so we only iterate twice over the
      // same filtered set, rather than recomputing the same predicates.
      const visibleBales = [];
      for (const bale of this.haybales) {
        if (bale.isPickedUp && !(bale.dropAnimator && bale.dropAnimator.active)) {
          if (this.wagon?.carriedBales.includes(bale)) continue;
        }
        const dx = bale.x - cx;
        const dz = bale.z - cz;
        if (dx * dx + dz * dz < DRAW_DIST_SQ) visibleBales.push(bale);
      }

      // Pass 1: bale meshes under the default shader.
      if (visibleBales.length > 0) {
        this.setActiveShader(this.defaultShader);
        for (const bale of visibleBales) bale.display();
      }

      // Pass 2: guidance arrows under the arrow shader.
      if (this.displayArrows && this.arrow) {
        let arrowShaderActive = false;
        for (const bale of visibleBales) {
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

    if (this.displayGrass && this.grassPatches && this.grassPatches.length > 0) {
        this.setActiveShader(this.grassShader);
        this.gl.disable(this.gl.CULL_FACE);
        
        for (const patch of this.grassPatches) {
            patch.displayShared();
        }
        
        this.gl.enable(this.gl.CULL_FACE);
        this.setActiveShader(this.defaultShader);
    }
  }
}
