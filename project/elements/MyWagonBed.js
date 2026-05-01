import { CGFobject } from '../../lib/CGF.js';

export class MyWagonBed extends CGFobject {
  constructor(scene, length, width, height) {
    super(scene);
    this.length = length;
    this.width  = width;
    this.height = height;
  }

  display() {
  }
}
