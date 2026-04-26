import { CGFobject, CGFappearance } from '../../lib/CGF.js';
import { MyCylinder } from "../geometric/MyCylinder.js";
import { MyLeafCluster } from "../geometric/MyLeafCluster.js";
import { MySphere } from "../geometric/MySphere.js";

export class MyFlora extends CGFobject {
  /**
   * @param scene
   * @param x, y, z: World position of the trunk base
   * @param scale: Overall scale multiplier for the whole plant
   * @param depth: How many times the branches split
   * @param angle: Branch split angle in degrees
   * @param trunkLength: Height of the bottom branch
   * @param lengthDecay: How much shorter the next branch gets (e.g., 0.75)
   * @param initialThickness: Trunk thickness
   * @param thicknessDecay: How much thinner the next branch gets (e.g., 0.6)
   * @param angleJitter: Max random branch-angle deviation, in degrees
   * @param petalCount: Number of petals per flower
   * @param petalSize: Petal size as a multiplier of the tip-branch length (e.g. 1.5)
   * @param petalTilt: Petal upward tilt in degrees (0 = flat, 90 = vertical)
   * @param petalJitter: ±fraction applied to per-petal size and tilt (e.g., 0.3 = ±30%)
   * @param petalTexture: CGFtexture for the petals, or null
   * @param seed: Per-instance seed; same seed → same shape every frame
   */
  constructor(scene,
              x, y, z, scale,
              depth, angle, trunkLength, lengthDecay,
              initialThickness, thicknessDecay, angleJitter,
              petalCount, petalSize, petalTilt, petalJitter,
              petalTexture,
              branchTexture,
              seed) {
    super(scene);

    this.x = x; this.y = y; this.z = z;
    this.scale = scale;

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

    this.seed = seed;

    this.initMaterials();

    if (petalTexture) {
      this.petalAppearance.setTexture(petalTexture);
      this.petalAppearance.setTextureWrap('REPEAT', 'REPEAT');
    }

    if (branchTexture) {
      this.branchAppearance.setTexture(branchTexture);
      this.branchAppearance.setTextureWrap('REPEAT', 'REPEAT');
    }

    this.branchGeometry = new MyCylinder(this.scene, 8, 1);
    this.petalGeometry = new MyLeafCluster(this.scene);
    this.branchShader = this.scene.branchShader;
  }

  initMaterials() {
    this.branchAppearance = new CGFappearance(this.scene);
    this.branchAppearance.setAmbient(0.2, 0.15, 0.1, 1.0);
    this.branchAppearance.setDiffuse(0.4, 0.3, 0.2, 1.0);
    this.branchAppearance.setSpecular(0.02, 0.02, 0.02, 1.0);
    this.branchAppearance.setShininess(2.0);

    // Petals/Leaves: green color
    this.petalAppearance = new CGFappearance(this.scene);
    this.petalAppearance.setAmbient(0.1, 0.3, 0.1, 1.0);
    this.petalAppearance.setDiffuse(0.2, 0.6, 0.2, 1.0);
    this.petalAppearance.setSpecular(0.1, 0.1, 0.1, 1.0);
    this.petalAppearance.setShininess(10.0);
  }

  // Deterministic pseudo-random in [0,1) keyed by (seed, call index).
  // Reset randCounter each display() so the same plant is identical every frame.
  rand() {
    this.randCounter++;
    const x = Math.sin(this.randCounter * 12.9898 + this.seed * 78.233) * 43758.5453;
    return x - Math.floor(x);
  }

  display() {
    // Pass 1: Branches
    this.randCounter = 0;
    this.scene.pushMatrix();
    this.scene.translate(this.x, this.y, this.z);
    this.scene.scale(this.scale, this.scale, this.scale);

    this.branchAppearance.apply();
    this.scene.setActiveShader(this.branchShader);
    this.drawBranch(this.maxDepth, this.trunkLength, this.initialThickness, 'branches');

    this.scene.popMatrix();

    // Pass 2: Petals
    this.randCounter = 0;
    this.scene.pushMatrix();
    this.scene.translate(this.x, this.y, this.z);
    this.scene.scale(this.scale, this.scale, this.scale);

    this.scene.setActiveShader(this.scene.defaultShader);
    this.petalAppearance.apply();
    this.drawBranch(this.maxDepth, this.trunkLength, this.initialThickness, 'petals');

    this.scene.popMatrix();
  }

  drawBranch(currentDepth, currentLength, currentThickness, pass = 'both') {
    if (currentDepth <= 2) {
      if (pass === 'both' || pass === 'petals') {
        if (pass === 'both') {
          this.scene.setActiveShader(this.scene.defaultShader);
          this.petalAppearance.apply();
        }
        this.scene.pushMatrix();
      }

      // Draw leaves on more inner branches to increase density
      const drawLeaves = currentDepth === 0 || this.rand() < 0.6;
      if (drawLeaves) {
        for (let i = 0; i < this.petalCount; i++) {
          const sizeJ = 1 + (this.rand() - 0.5) * 2 * this.petalJitter;
          const tiltJ = (this.rand() - 0.5) * 2 * this.petalJitter;
          
          if (pass === 'both' || pass === 'petals') {
            const sBase = 0.2 * this.petalSize * sizeJ;
            const sH    = sBase * 1.5;

            this.scene.pushMatrix();
            this.scene.rotate(i * (Math.PI * 2) / this.petalCount, 0, 1, 0);
            this.scene.rotate(this.petalTilt + tiltJ, 1, 0, 0);
            this.scene.translate(0, sH * 0.5, 0);
            this.scene.scale(sBase, sH, sBase);
            this.petalGeometry.display();
            this.scene.popMatrix();
          }
        }
      }

      if (pass === 'both' || pass === 'petals') {
        this.scene.popMatrix();
      }

      if (pass === 'both') {
        this.scene.setActiveShader(this.branchShader);
        this.branchAppearance.apply();
      }
      
      if (currentDepth === 0) return;
    }

    if (pass === 'both' || pass === 'branches') {
      this.branchShader.setUniformsValues({ uLength: currentLength });
      this.scene.pushMatrix();
      this.scene.scale(currentThickness, currentLength, currentThickness);
      this.branchGeometry.display();
      this.scene.popMatrix();
    }

    let numMidLeaves = 0;
    if (currentDepth > 0 && currentDepth <= 3) {
      if (this.rand() < 0.6) {
        numMidLeaves = Math.floor(1 + this.rand() * 2);
      }
    }
    
    for (let i = 0; i < numMidLeaves; i++) {
      const heightPos = currentLength * (0.2 + this.rand() * 0.6);
      const sizeJ = 1 + (this.rand() - 0.5) * 2 * this.petalJitter;
      const tiltJ = (this.rand() - 0.5) * 2 * this.petalJitter;
      const angleY = this.rand() * Math.PI * 2;
      
      if (pass === 'both' || pass === 'petals') {
        if (pass === 'both') {
          this.scene.setActiveShader(this.scene.defaultShader);
          this.petalAppearance.apply();
        }

        const sBase = 0.2 * this.petalSize * sizeJ * 0.7;
        const sH    = sBase * 1.5;

        this.scene.pushMatrix();
        this.scene.translate(0, heightPos, 0);
        this.scene.rotate(angleY, 0, 1, 0);
        this.scene.rotate(this.petalTilt + tiltJ + 0.5, 1, 0, 0);
        this.scene.translate(0, sH * 0.5, 0);
        this.scene.scale(sBase, sH, sBase);
        this.petalGeometry.display();
        this.scene.popMatrix();

        if (pass === 'both') {
          this.scene.setActiveShader(this.branchShader);
          this.branchAppearance.apply();
        }
      }
    }

    this.scene.pushMatrix();
    this.scene.translate(0, currentLength, 0);

    // Leader branch of the tree
    this.scene.pushMatrix();
    this.scene.rotate(this.rand() * Math.PI * 2, 0, 1, 0);
    const jitterMain = (this.rand() - 0.5) * this.angleJitter;
    // Leader branch goes mostly straight up, bending slightly
    this.scene.rotate((this.angle * 0.2) + jitterMain, 0, 0, 1);
    
    this.drawBranch(currentDepth - 1,
                    currentLength * this.lengthDecay,
                    currentThickness * this.thicknessDecay, pass);
    this.scene.popMatrix();

    // side branches
    const numSideBranches = Math.floor(1.2 + this.rand() * 1.5); // Usually 1 or 2 side branches
    for (let b = 0; b < numSideBranches; b++) {
      this.scene.pushMatrix();
      this.scene.rotate(this.rand() * Math.PI * 2, 0, 1, 0);
      const jitterSide = (this.rand() - 0.5) * 2 * this.angleJitter;
      // Side branches point outwards
      this.scene.rotate(this.angle * (1.0 + this.rand() * 0.5) + jitterSide, 0, 0, 1);
      
      // Side branches are shorter and thinner than the leader branch

    
      const sideLengthDecay = this.lengthDecay * (0.7 + this.rand() * 0.2);
      const sideThicknessDecay = this.thicknessDecay * 0.75;

      this.drawBranch(currentDepth - 1,
                      currentLength * sideLengthDecay,
                      currentThickness * sideThicknessDecay, pass);
      this.scene.popMatrix();
    }

    this.scene.popMatrix();
  }
}
