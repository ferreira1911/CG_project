import { CGFscene, CGFcamera, CGFaxis, CGFtexture, CGFshader } from "../lib/CGF.js";
import { MyPanorama } from "./elements/MyPanorama.js";
import { MyRock } from "./elements/MyRock.js";
import { MySphere } from "./geometric/MySphere.js";
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

    
    // Rocks: positions + color texture manual, shape params randomized via randRange
    const r = (min, max) => this.randRange(min, max);
    const tex1 = this.rockColorMap1;
    const tex2 = this.rockColorMap2;
    this.rocks = [
      new MyRock(this, -3, 0, -2, r(0.8, 1.5), r(0, 100), r(0.25, 0.40), tex1),
      new MyRock(this,  4, 0,  1, r(0.8, 1.5), r(0, 100), r(0.25, 0.40), tex2),
      new MyRock(this,  0, 0,  4, r(0.8, 1.5), r(0, 100), r(0.25, 0.40), tex1),
      new MyRock(this, -5, 0,  3, r(0.8, 1.5), r(0, 100), r(0.25, 0.40), tex2),
      new MyRock(this,  2, 0, -4, r(0.8, 1.5), r(0, 100), r(0.25, 0.40), tex1),
    ];

    this.displayAxis = true;

    this.setUpdatePeriod(50);
  }

  initLights() {
    this.lights[0].setPosition(-170, 200, -100, 0);
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
    this.panoramaTexture = new CGFtexture(this, './resources/textures/panorama.jpg');
    this.cloudMap = new CGFtexture(this, './resources/textures/cloudMap.png');
    this.rockColorMap1 = new CGFtexture(this, './resources/textures/rockTexture1.jpg');
    this.rockColorMap2 = new CGFtexture(this, './resources/textures/rockTexture2.jpg');
    this.rockNormalMap = new CGFtexture(this, './resources/textures/rockNormals1.jpg');
    this.rockNoiseMap = new CGFtexture(this, './resources/textures/rockNoise1.png');
  }

  initShaders() {
    this.panoramaShader = new CGFshader(this.gl, "./shaders/sky.vert", "./shaders/sky.frag");
    const lp = this.lights[0].position;
    this.panoramaShader.setUniformsValues({
      uSampler: 0,
      time: 0,
      uLightPos: [lp[0], lp[1], lp[2]]
    });

    this.rockShader = new CGFshader(this.gl, "./shaders/rock.vert", "./shaders/rock.frag");
    this.rockShader.setUniformsValues({
      uColorMap: 0,
      uNormalMap: 1,
      uNoiseMap: 2,
      uLightPos: [lp[0], lp[1], lp[2]],
      uDeformScale: 0.15,
      uSeed: 0.0
    });
  }

  randRange(min, max) {
    return min + Math.random() * (max - min);
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

    // Sky
    this.setActiveShader(this.panoramaShader);
    this.panoramaTexture.bind(0);
    this.panorama.display();
    this.setActiveShader(this.defaultShader);

    // Rocks: activate shader and bind shared textures (normal + noise) ONCE.
    // Each rock binds its own color texture to unit 0 inside its display().
    this.setActiveShader(this.rockShader);
    this.rockNormalMap.bind(1);
    this.rockNoiseMap.bind(2);

    for (const rock of this.rocks) rock.display();

    this.setActiveShader(this.defaultShader);

    // ---- END Primitive drawing section
  }
}
