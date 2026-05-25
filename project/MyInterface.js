import { CGFinterface, dat } from '../lib/CGF.js';

export class MyInterface extends CGFinterface {
  constructor() {
    super();
  }

  init(application) {
    super.init(application);
    this.gui = new dat.GUI();

    this._buildGlobalFolder();
    this._buildWorldElementsFolder();
    this._buildGrassFolder();
    this._buildFloraFolder();
    this._buildWorldGeneratorFolder();
    this._buildBarnFolder();
    this._buildGameStatsFolder();
    this._buildDebugFolder();

    this._initKeys();
    return true;
  }

  _buildGlobalFolder() {
    const f = this.gui.addFolder('Global Scene');
    f.add(this.scene, 'displaySky').name('Sky / Panorama');
    f.add(this.scene, 'displayTerrain').name('Terrain');
    f.add(this.scene, 'displayGrass').name('Grass');
  }

  _buildWorldElementsFolder() {
    const f = this.gui.addFolder('World Elements');
    f.add(this.scene, 'displayWagon').name('Wagon & Horses');
    f.add(this.scene, 'displayFlora').name('Flowers / Flora');
    f.add(this.scene, 'displayRocks').name('Rocks');
    f.add(this.scene, 'displayHayBales').name('Hay Bales');
  }

  _buildGrassFolder() {
    const f = this.gui.addFolder('Grass Parameters');
    f.add(this.scene, 'windAmp',  0.0, 1.0, 0.01).name('Wind Strength');
    f.add(this.scene, 'windFreq', 0.1, 5.0, 0.1).name('Wind Frequency');
  }

  _buildFloraFolder() {
    const f = this.gui.addFolder('Flora Shape/Geometry');
    f.add(this.scene, 'flowerStemLength', 0.3, 2.5, 0.05).name('Stem Length');
    f.add(this.scene, 'flowerPetals',       3,  16, 1   ).name('Petal Count');
    f.add(this.scene, 'flowerPetalSize',   0.4, 3.0, 0.1).name('Petal Size');
  }

  _buildWorldGeneratorFolder() {
    const f = this.gui.addFolder('World Generator');
    f.add(this.scene, 'numRocks',             0,  80, 1   ).name('Num Rocks');
    f.add(this.scene, 'numHaybales',          0,  15, 1   ).name('Num Haybales');
    f.add(this.scene, 'numTrees',             0,  12, 1   ).name('Num Trees');
    f.add(this.scene, 'numFlowers',          10, 300, 5   ).name('Total Flowers');
    f.add(this.scene, 'numFlowerClusters',    1,  20, 1   ).name('Flora Groups');
    f.add(this.scene, 'flowerClusterRadius', 1.5, 12.0, 0.1).name('Group Radius');
    f.add(this.scene, 'scatter').name('Regenerate World');
  }

  _buildBarnFolder() {
    const f = this.gui.addFolder('Barn Placement');
    f.add(this.scene, 'barnPosX', -150,      150,    0.5).name('X Position');
    f.add(this.scene, 'barnPosZ', -150,      150,    0.5).name('Z Position');
    f.add(this.scene, 'barnYaw',  -Math.PI,  Math.PI, 0.05).name('Yaw Angle');
  }

  _buildGameStatsFolder() {
    const f = this.gui.addFolder('Game Stats');
    f.add(this.scene, 'uiHp').name('Current HP').listen();
    f.add(this.scene, 'uiDamage').name('Inst. Damage').listen();
    f.add(this.scene, 'uiRestored').name('Inst. Restored').listen();
    f.add(this.scene, 'uiBalesDelivered').name('Bales Delivered').listen();
    f.add(this.scene, 'uiScore').name('Score (Time)').listen();
  }

  _buildDebugFolder() {
    const f = this.gui.addFolder('Tools & Debug');
    f.add(this.scene, 'displayAxis').name('Display Axis');
    f.add(this.scene, 'displayHUD').name('Display HUD (HP)');
    f.add(this.scene, 'displayArrows').name('Direction Arrows');
    f.add(this.scene, 'freeCamera').name('Free Camera');
  }

  _initKeys() {
    this.scene.gui = this.gui;
    this.scene.interface = this;
    this.processKeyboard = function () {};
    this.activeKeys = {};
  }

  processKeyDown(event) { this.activeKeys[event.code] = true; }
  processKeyUp(event)   { this.activeKeys[event.code] = false; }

  isKeyPressed(code) {
    return this.activeKeys[code] === true;
  }
}
