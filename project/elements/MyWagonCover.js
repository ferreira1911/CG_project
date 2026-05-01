import { CGFobject } from '../../lib/CGF.js';

// Cloth cover spanning half the wagon length, leaving the front half open
// so the hay bales remain visible.
export class MyWagonCover extends CGFobject {
  constructor(scene, length, width, height) {
    super(scene);
    this.length = length;
    this.width  = width;
    this.height = height;
  }

  display() {
  }
}
