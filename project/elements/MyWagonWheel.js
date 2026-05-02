import { CGFobject, CGFappearance } from '../../lib/CGF.js';

const DEFAULT_THICKNESS = 0.15;

// Short cylinder lying on its side (axle along +z) with a disc cap on each
// face. Spokes/hub will eventually live in the cap texture, not in geometry.
export class MyWagonWheel extends CGFobject {
  constructor(scene, radius, thickness = DEFAULT_THICKNESS, texture) {
    super(scene);
    this.radius = radius;
    this.thickness = thickness;

    // Near-white ambient/diffuse so the wheel texture shows through unmodified.
    // Material × texture is multiplicative — tinted material = tinted, dim texture.
    this.appearance = new CGFappearance(scene);
    this.appearance.setAmbient(0.40, 0.40, 0.40, 1.0);
    this.appearance.setDiffuse(0.90, 0.90, 0.90, 1.0);
    this.appearance.setSpecular(0.05, 0.05, 0.05, 1.0);
    this.appearance.setShininess(5.0);
    if (texture) {
      this.appearance.setTexture(texture);
      this.appearance.setTextureWrap('REPEAT', 'REPEAT');
    }
  }

  display() {
    this.appearance.apply();

    const R = this.radius, T = this.thickness;
    const { cylinder, circle } = this.scene;

    // Rim: rotate the y-axis cylinder so its axis aligns with +z, then centre
    // it across the wheel thickness.
    this.scene.pushMatrix();
    this.scene.rotate(Math.PI / 2, 1, 0, 0);
    this.scene.translate(0, -T / 2, 0);
    this.scene.scale(R, T, R);
    cylinder.display();
    this.scene.popMatrix();

    // Front cap (+z), normal already faces outward.
    this.scene.pushMatrix();
    this.scene.translate(0, 0, T / 2);
    this.scene.scale(R, R, 1);
    circle.display();
    this.scene.popMatrix();

    // Back cap (-z), flipped 180° around y so its normal faces -z.
    this.scene.pushMatrix();
    this.scene.translate(0, 0, -T / 2);
    this.scene.rotate(Math.PI, 0, 1, 0);
    this.scene.scale(R, R, 1);
    circle.display();
    this.scene.popMatrix();
  }
}
