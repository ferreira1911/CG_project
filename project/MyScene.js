import { CGFscene, CGFcamera, CGFaxis, CGFtexture } from "../lib/CGF.js";
import { MyPanorama } from "./elements/MyPanorama.js";
import { MyTerrain } from "./elements/MyTerrain.js";
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

    this.axis = new CGFaxis(this);
    this.panorama = new MyPanorama(this, this.panoramaTexture);
    this.terrain = new MyTerrain(this);

    this.displayAxis = true;
  }


  initLights() {
    this.lights[0].setPosition(-200, 200, 200, 0);
    this.lights[0].setDiffuse(1.0, 1.0, 1.0, 1.0);
    this.lights[0].setSpecular(1.0, 1.0, 1.0, 1.0);

    this.lights[0].enable();
    this.lights[0].update();
  }


  initCameras() {
  this.camera = new CGFcamera(
    1.0,           // Campo de visão (FOV)
    0.1,           // Distância mínima (Near)
    1000,          // Distância máxima (Far) - Aumentamos para 1000 para ver o horizonte
    vec3.fromValues(0, 40, 100), // Posição inicial: mais alta (Y=40) e afastada
    vec3.fromValues(0, 0, 0)     // Ponto para onde olha (o centro do terreno)
  );
}

  initTextures() {
    this.panoramaTexture =  new CGFtexture(this, './resources/textures/panorama.jpg');
  }

  setDefaultAppearance() {
    this.setAmbient(0.2, 0.4, 0.8, 1.0);
    this.setDiffuse(0.2, 0.4, 0.8, 1.0);
    this.setSpecular(0.2, 0.4, 0.8, 1.0);
    this.setShininess(10.0);
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
    this.panorama.display();
    this.terrain.display();
    // ---- END Primitive drawing section
  }
}
