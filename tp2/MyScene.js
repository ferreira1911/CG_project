import { CGFscene, CGFcamera, CGFaxis, CGFtexture, CGFappearance, } from "../lib/CGF.js";
import { MyFEUP } from "./MyFEUP.js";

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

    //Background color
    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);

    this.gl.clearDepth(100.0);
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.enable(this.gl.CULL_FACE);
    this.gl.depthFunc(this.gl.LEQUAL);
    this.enableTextures(true);


    //Initialize scene objects
    this.axis = new CGFaxis(this);
    this.feup = new MyFEUP(this);

    //Objects connected to MyInterface
    this.displayAxis = true;
    this.scaleFactor = 1.0;
    this.translateX = 0.0;
    this.translateY = 0.0;
    this.translateZ = 0.0;
    this.rotateZ = 0.0;
    this.rotateY = 0.0;
    this.rotateX = 0.0;

    // textures
    this.materialFEUP = new CGFappearance(this);
    this.materialFEUP.setAmbient(0.5, 0.5, 0.5, 1);
    this.materialFEUP.setDiffuse(0.7, 0.7, 0.7, 1);
    this.materialFEUP.loadTexture('feup.jpg');
    this.materialFEUP.setTextureWrap('REPEAT', 'REPEAT');
  }
  initLights() {
    this.lights[0].setPosition(15, 2, 5, 1);
    this.lights[0].setDiffuse(1.0, 1.0, 1.0, 1.0);
    this.lights[0].enable();
    this.lights[0].update();
  }
  initCameras() {
    this.camera = new CGFcamera(
      0.4,
      0.1,
      500,
      vec3.fromValues(15, 15, 15),
      vec3.fromValues(0, 0, 0)
    );
  }
  setDefaultAppearance() {
    this.setAmbient(0.2, 0.4, 0.8, 1.0);
    this.setDiffuse(0.2, 0.4, 0.8, 1.0);
    this.setSpecular(0.2, 0.4, 0.8, 1.0);
    this.setShininess(10.0);
  }
  display() {
    // ---- BEGIN Background, camera and axis setup
    // Clear image and depth buffer everytime we update the scene
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    // Initialize Model-View matrix as identity (no transformation
    this.updateProjectionMatrix();
    this.loadIdentity();
    // Apply transformations corresponding to the camera position relative to the origin
    this.applyViewMatrix();

    // Draw axis
    if (this.displayAxis) this.axis.display();

    this.setDefaultAppearance();

    var sca = [
      this.scaleFactor, 0.0,              0.0,              0.0,
      0.0,              this.scaleFactor,  0.0,              0.0,
      0.0,              0.0,              this.scaleFactor,  0.0,
      0.0,              0.0,              0.0,              1.0,
    ];

    var trans = [
      1.0,             0.0,             0.0,             0.0,
      0.0,             1.0,             0.0,             0.0,
      0.0,             0.0,             1.0,             0.0,
      this.translateX,  this.translateY,  this.translateZ,  1.0,
    ];
    
    this.multMatrix(trans);
    this.rotate(Math.PI*this.rotateX/180.0, 1, 0, 0);
    this.rotate(Math.PI*this.rotateY/180.0, 0, 1, 0);
    this.rotate(Math.PI*this.rotateZ/180.0, 0, 0, 1);
    this.multMatrix(sca);

    // ---- BEGIN Primitive drawing section

    //this.materialFEUP.apply();
    //this.feup.display();

    

    // ---- END Primitive drawing section
  }
}
