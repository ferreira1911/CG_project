import { CGFobject, CGFappearance } from '../../lib/CGF.js';
import { MySphere } from '../geometric/MySphere.js';

export class MyDriver extends CGFobject {
  // Builds the driver from simple primitives and stores reusable materials.
  constructor(scene) {
    super(scene);

    this.head = new MySphere(scene, 0.5, 16, 8);

    this.skinApp = this._makeAppearance([0.52, 0.36, 0.22], [0.85, 0.62, 0.42]);
    this.shirtApp = this._makeAppearance([0.10, 0.16, 0.22], [0.22, 0.34, 0.42]);
    this.pantsApp = this._makeAppearance([0.08, 0.07, 0.06], [0.18, 0.16, 0.13]);
    this.hatApp = this._makeAppearance([0.20, 0.12, 0.05], [0.46, 0.28, 0.12]);
  }

  // Creates a flat-colour material for one driver body part.
  _makeAppearance(ambient, diffuse) {
    const app = new CGFappearance(this.scene);
    app.setAmbient(ambient[0], ambient[1], ambient[2], 1.0);
    app.setDiffuse(diffuse[0], diffuse[1], diffuse[2], 1.0);
    app.setSpecular(0.05, 0.05, 0.04, 1.0);
    app.setShininess(8.0);
    return app;
  }

  // Draws the full seated driver by composing all body parts.
  display() {
    this._displayBody();
    this._displayNeck();
    this._displayHead();
    this._displayHat();
    this._displayArms();
    this._displayLegs();
  }

  // Draws the torso as a slightly leaned cube.
  _displayBody() {
    this.shirtApp.apply();
    this.scene.pushMatrix();
    this.scene.translate(0, 0.95, 0);
    this.scene.rotate(-0.20, 0, 0, 1);
    this.scene.scale(0.50, 0.95, 0.70);
    this.scene.cube.display();
    this.scene.popMatrix();
  }

  // Draws the neck as a small cube between torso and head.
  _displayNeck() {
    this.skinApp.apply();
    this.scene.pushMatrix();
    this.scene.translate(0.04, 1.34, 0);
    this.scene.scale(0.18, 0.22, 0.18);
    this.scene.cube.display();
    this.scene.popMatrix();
  }

  // Draws the head using a scaled sphere primitive.
  _displayHead() {
    this.skinApp.apply();
    this.scene.pushMatrix();
    this.scene.translate(0.10, 1.65, 0);
    this.scene.scale(0.42, 0.46, 0.42);
    this.head.display();
    this.scene.popMatrix();
  }

  // Draws the hat brim and crown with two tilted cubes.
  _displayHat() {
    this.hatApp.apply();

    this.scene.pushMatrix();
    this.scene.translate(0.06, 1.80, 0);
    this.scene.rotate(0.18, 0, 0, 1);
    this.scene.scale(0.78, 0.07, 0.78);
    this.scene.cube.display();
    this.scene.popMatrix();

    this.scene.pushMatrix();
    this.scene.translate(0.03, 1.90, 0);
    this.scene.rotate(0.28, 0, 0, 1);
    this.scene.scale(0.36, 0.20, 0.36);
    this.scene.cube.display();
    this.scene.popMatrix();
  }

  // Draws both arms as angled thin cubes.
  _displayArms() {
    this.skinApp.apply();
    for (const side of [-1, 1]) {
      this.scene.pushMatrix();
      this.scene.translate(0.42, 1.06, side * 0.42);
      this.scene.rotate(-0.75, 0, 0, 1);
      this.scene.scale(0.16, 0.78, 0.16);
      this.scene.cube.display();
      this.scene.popMatrix();
    }
  }

  // Draws both seated legs as angled thin cubes.
  _displayLegs() {
    this.pantsApp.apply();
    for (const side of [-1, 1]) {
      this.scene.pushMatrix();
      this.scene.translate(0.42, 0.36, side * 0.20);
      this.scene.rotate(Math.PI / 2.8, 0, 0, 1);
      this.scene.scale(0.18, 0.78, 0.18);
      this.scene.cube.display();
      this.scene.popMatrix();
    }
  }
}
