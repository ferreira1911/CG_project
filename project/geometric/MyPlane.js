import {CGFobject} from '../../lib/CGF.js';
/**
* MyPlane
* @constructor
 * @param scene - Reference to MyScene object
 * @param nDivs - number of divisions in both directions of the surface
*/
export class MyPlane extends CGFobject {
    constructor(scene, nDivs) {
        super(scene);
        nDivs = typeof nDivs !== 'undefined' ? nDivs : 1;

        this.nDivs = nDivs;
        this.patchLength = 1.0 / nDivs;

        this.initBuffers();
    }

    initBuffers() {
        this.vertices = [];
        this.normals = [];
        this.texCoords = [];
        this.indices = [];

        let patchLength = 1.0 / this.nDivs;

        // Ciclo duplo: Z (linhas) e X (colunas)
        for (let j = 0; j <= this.nDivs; j++) {
            for (let i = 0; i <= this.nDivs; i++) {

                let x = -0.5 + (i * patchLength);
                let z = -0.5 + (j * patchLength);
                let y = 0; // O chão é perfeitamente plano para já

                this.vertices.push(x, y, z);

                this.normals.push(0, 1, 0);

                let u = i / this.nDivs;
                let v = j / this.nDivs;
                this.texCoords.push(u, v);
            }
        }

        // Quantos vértices há numa linha para saltar para a linha seguinte
        let numVerticesPerLine = this.nDivs + 1;

        for (let j = 0; j < this.nDivs; j++) {
            for (let i = 0; i < this.nDivs; i++) {
                // Descobrir o ID numérico dos 4 cantos do quadrado atual
                let bottomLeft = (j * numVerticesPerLine) + i;
                let bottomRight = bottomLeft + 1;
                let topLeft = ((j + 1) * numVerticesPerLine) + i;
                let topRight = topLeft + 1;

                // Metade inferior do quadrado
                // Ordem: Baixo-Esquerda -> Baixo-Direita -> Cima-Direita
                this.indices.push(bottomLeft, bottomRight, topRight);

                // Metade superior do quadrado
                // Ordem: Baixo-Esquerda -> Cima-Direita -> Cima-Esquerda
                this.indices.push(bottomLeft, topRight, topLeft);
            }
        }

        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }

    /**
     * Called when user interacts with GUI to change object's complexity.
     * @param {integer} complexity - changes number of nDivs
     */
    updateBuffers(complexity){
        this.nDivs = 1 +  Math.round(9 * complexity); //complexity varies 0-1, so nDivs varies 1-10
        this.patchLength = 1.0 / this. nDivs;

        // reinitialize buffers
        this.initBuffers();
        this.initNormalVizBuffers();
    }
}