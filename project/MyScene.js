import { CGFscene, CGFcamera, CGFaxis, CGFtexture, CGFshader } from "../lib/CGF.js";
import { MyPanorama } from "./elements/MyPanorama.js";
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

    this.initTextures();
    this.initShaders();

    

    this.axis = new CGFaxis(this);
    this.panorama = new MyPanorama(this, this.panoramaTexture);

    this.displayAxis = true;



    this.setUpdatePeriod(50);
  }


  initLights() {
    this.lights[0].setPosition(-200, 200, 200, 1);
    this.lights[0].setDiffuse(1.0, 1.0, 1.0, 1.0);
    this.lights[0].setSpecular(1.0, 1.0, 1.0, 1.0);

    this.lights[0].enable();
    this.lights[0].update();
  }


  initCameras() {
    this.camera = new CGFcamera(
      1.0,
      0.1,
      500,
      vec3.fromValues(5, 5, 5),
      vec3.fromValues(0, 0, 0)
    );
  }

  initTextures() {
    this.panoramaTexture =  new CGFtexture(this, './resources/textures/panorama.jpg');
    this.cloudMap = new CGFtexture(this, './resources/textures/cloudMap.png');
  }

  initShaders() {
    this.panoramaShader = new CGFshader(this.gl, "./shaders/sky.vert", "./shaders/sky.frag");
    this.panoramaShader.setUniformsValues({ uSampler: 0, time: 0 });
  }

  setDefaultAppearance() {
    this.setAmbient(0.2, 0.4, 0.8, 1.0);
    this.setDiffuse(0.2, 0.4, 0.8, 1.0);
    this.setSpecular(0.2, 0.4, 0.8, 1.0);
    this.setShininess(10.0);
  }

  update(t) {
    if (this.startTime === undefined) this.startTime = t;
    this.time = (t - this.startTime) / 1000;
    this.panoramaShader.setUniformsValues({ time: this.time });
  }

  display() {
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    this.updateProjectionMatrix();
    this.loadIdentity();
    this.applyViewMatrix();

    if (this.displayAxis) this.axis.display();

    this.setDefaultAppearance();

    // ---- BEGIN Primitive drawing section
    this.setActiveShader(this.panoramaShader);
    this.panoramaTexture.bind(0);
    this.panorama.display();
    this.setActiveShader(this.defaultShader);
    // ---- END Primitive drawing section
  }
}
