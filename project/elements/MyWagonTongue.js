import { CGFobject, CGFappearance } from '../../lib/CGF.js';

const THICKNESS = 0.09;
const SPLIT_X = 1.15;
const SPLIT_Z = 0.48;

// Double-shaft wagon tongue: the horse stays between the side shafts instead
// of being pierced by one central pole.
export class MyWagonTongue extends CGFobject {
  // Builds the wooden tongue material used by every shaft segment.
  constructor(scene, texture) {
    super(scene);

    // Near-white diffuse lets the wood texture supply its own colour.
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

  // Draws the short central shaft when no horse targets are provided.
  display() {
    this.appearance.apply();
    this._displayBar([0, 0, 0], [SPLIT_X, 0, 0], THICKNESS);
  }

  // Draws the full double-shaft tongue between the wagon split and horse hitch.
  displayToTargets(leftTarget, rightTarget) {
    this.appearance.apply();

    const leftSplit  = [SPLIT_X, 0,  SPLIT_Z];
    const rightSplit = [SPLIT_X, 0, -SPLIT_Z];

    this._displayBar([0, 0, 0], [SPLIT_X, 0, 0], THICKNESS);
    this._displayBar(leftSplit, rightSplit, THICKNESS * 1.2);
    this._displayBar(leftSplit,  leftTarget,  THICKNESS);
    this._displayBar(rightSplit, rightTarget, THICKNESS);

    // Harness crossbar joins the two side shafts at the horse body.
    this._displayBar(leftTarget, rightTarget, THICKNESS * 1.15);
  }

  // Draws one cube bar between two 3D points, with yaw and pitch alignment.
  _displayBar(a, b, thickness) {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const dz = b[2] - a[2];
    const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const yaw = Math.atan2(-dz, dx);
    const pitch = Math.atan2(dy, Math.sqrt(dx * dx + dz * dz));

    this.scene.pushMatrix();
    this.scene.translate((a[0] + b[0]) * 0.5, (a[1] + b[1]) * 0.5, (a[2] + b[2]) * 0.5);
    this.scene.rotate(yaw, 0, 1, 0);
    this.scene.rotate(pitch, 0, 0, 1);
    this.scene.scale(len, thickness, thickness);
    this.scene.cube.display();
    this.scene.popMatrix();
  }
}
