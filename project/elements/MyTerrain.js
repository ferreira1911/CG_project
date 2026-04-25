import { CGFobject, CGFappearance, CGFshader, CGFtexture } from '../../lib/CGF.js';
import { MyPlane } from '../geometric/MyPlane.js';

export class MyTerrain extends CGFobject {
    constructor(scene) {
        super(scene);
        
        // 50 divisões (50x50 quadrados).
        this.plane = new MyPlane(scene, 50); 

        this.initMaterials();
    }

    initMaterials() {
        // Carrega todas as texturas necessárias
        this.colorMap = new CGFtexture(this.scene, "resources/textures/terrain/terrain_color.jpg");
        this.heightMap = new CGFtexture(this.scene, "resources/textures/terrain/terrain_height.jpg");
        this.pathMap = new CGFtexture(this.scene, "resources/textures/terrain/path_color.jpg");
        this.maskMap = new CGFtexture(this.scene, "resources/textures/terrain/mask.jpg");

        this.appearance = new CGFappearance(this.scene);
        this.appearance.setTexture(this.colorMap);
        this.appearance.setTextureWrap('REPEAT', 'REPEAT');

        this.terrainShader = new CGFshader(this.scene.gl, "shaders/terrain.vert", "shaders/terrain.frag");
        
        // Define em que "canal" (unidade) cada textura vai estar
        // uSampler (0) é o colorMap, definido automaticamente pelo appearance
        this.terrainShader.setUniformsValues({ uSampler2: 1, uSampler3: 2, uSampler4: 3 });
    }

    display() {
        this.scene.pushMatrix();

        this.scene.setActiveShader(this.terrainShader);
        
        // Ligar as texturas aos canais correspondentes do shader
        this.heightMap.bind(1);
        this.pathMap.bind(2);
        this.maskMap.bind(3);

        this.appearance.apply();

        this.scene.scale(400, 1, 400);

        this.plane.display();

        // Restaura o shader normal para não afetar o resto da cena (carroça, pedras, etc)
        this.scene.setActiveShader(this.scene.defaultShader);

        this.scene.popMatrix();
    }
}