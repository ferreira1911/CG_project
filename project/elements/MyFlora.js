import { CGFobject, CGFappearance } from '../../lib/CGF.js';
import { MyCylinder } from "../geometric/MyCylinder.js";
import { MyQuad } from "../geometric/MyQuad.js";

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

    this.branchGeometry = new MyCylinder(this.scene, 8, 1);
    this.petalGeometry = new MyQuad(this.scene);
  }

  initMaterials() {
    // Branches: green stem material, no texture
    this.branchAppearance = new CGFappearance(this.scene);
    this.branchAppearance.setAmbient(0.10, 0.30, 0.10, 1.0);
    this.branchAppearance.setDiffuse(0.20, 0.55, 0.20, 1.0);
    this.branchAppearance.setSpecular(0.05, 0.10, 0.05, 1.0);
    this.branchAppearance.setShininess(8.0);

    // Petals: white-ish base so the texture's colour is preserved when applied
    this.petalAppearance = new CGFappearance(this.scene);
    this.petalAppearance.setAmbient(0.6, 0.6, 0.6, 1.0);
    this.petalAppearance.setDiffuse(1.0, 1.0, 1.0, 1.0);
    this.petalAppearance.setSpecular(0.2, 0.2, 0.2, 1.0);
    this.petalAppearance.setShininess(20.0);
  }

  // Deterministic pseudo-random in [0,1) keyed by (seed, call index).
  // Reset randCounter each display() so the same plant is identical every frame.
  rand() {
    this.randCounter++;
    const x = Math.sin(this.randCounter * 12.9898 + this.seed * 78.233) * 43758.5453;
    return x - Math.floor(x);
  }

  display() {
    this.randCounter = 0;

    this.scene.pushMatrix();
    this.scene.translate(this.x, this.y, this.z);
    this.scene.scale(this.scale, this.scale, this.scale);
    this.drawBranch(this.maxDepth, this.trunkLength, this.initialThickness);
    this.scene.popMatrix();
  }

  drawBranch(currentDepth, currentLength, currentThickness) {
    if (currentDepth === 0) {
      this.petalAppearance.apply();

      this.scene.pushMatrix();
      for (let i = 0; i < this.petalCount; i++) {
        // Per-petal jitter: same param drives both size and tilt deviation
        const sizeJ = 1 + (this.rand() - 0.5) * 2 * this.petalJitter;
        const tiltJ = (this.rand() - 0.5) * 2 * this.petalJitter; // small angle in radians
        // Scale petals to the tip branch so a smaller plant gets smaller flowers
        const sBase = currentLength * this.petalSize * sizeJ;
        const sH    = sBase * 1.3;

        this.scene.pushMatrix();
        this.scene.rotate(i * (Math.PI * 2) / this.petalCount, 0, 1, 0);
        this.scene.rotate(this.petalTilt + tiltJ, 1, 0, 0);
        this.scene.translate(0, sH * 0.5, 0);
        this.scene.scale(sBase, sH, sBase);
        this.petalGeometry.display();
        this.scene.popMatrix();
      }
      this.scene.popMatrix();
      return;
    }

    this.branchAppearance.apply();

    this.scene.pushMatrix();
    this.scene.scale(currentThickness, currentLength, currentThickness);
    this.branchGeometry.display();
    this.scene.popMatrix();

    this.scene.pushMatrix();
    this.scene.translate(0, currentLength, 0);

    const jitterL = (this.rand() - 0.5) * 2 * this.angleJitter;
    this.scene.pushMatrix();
    this.scene.rotate(this.angle + jitterL, 0, 0, 1);
    this.drawBranch(currentDepth - 1,
                    currentLength * this.lengthDecay,
                    currentThickness * this.thicknessDecay);
    this.scene.popMatrix();

    const jitterR = (this.rand() - 0.5) * 2 * this.angleJitter;
    this.scene.pushMatrix();
    this.scene.rotate(-this.angle + jitterR, 0, 0, 1);
    this.drawBranch(currentDepth - 1,
                    currentLength * this.lengthDecay,
                    currentThickness * this.thicknessDecay);
    this.scene.popMatrix();

    this.scene.popMatrix();
  }
}
