attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec2 aTextureCoord;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform mat4 uNMatrix;

// As nossas texturas
uniform sampler2D uSampler; // Textura de Cor (o WebCGF usa o uSampler por defeito)
uniform sampler2D uSampler2; // O nosso Height Map

varying vec2 vTextureCoord;

void main() {
    // Passar as coordenadas de textura para o Fragment Shader
    vTextureCoord = aTextureCoord;

    // 1. Ler a cor do mapa de alturas na coordenada atual
    // A cor vai de 0.0 (preto) a 1.0 (branco)
    vec4 heightMapColor = texture2D(uSampler2, aTextureCoord);

    // 2. Usar o canal vermelho (r) para saber a altura. 
    // Multiplicamos por um valor (ex: 8.0) para definir a altura máxima das colinas
    float offset = heightMapColor.r * 8.0;

    // 3. Criar a nova posição, somando o offset ao eixo Y do vértice original
    vec3 newPosition = aVertexPosition + vec3(0.0, offset, 0.0);

    // 4. Dizer ao WebGL onde colocar este vértice no ecrã
    gl_Position = uPMatrix * uMVMatrix * vec4(newPosition, 1.0);
}