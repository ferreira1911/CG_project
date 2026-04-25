#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTextureCoord;

uniform sampler2D uSampler;  // Terreno Base (Canal 0)
uniform sampler2D uSampler3; // Caminho (Canal 2)
uniform sampler2D uSampler4; // Máscara B&W (Canal 3)

void main() {
    // Lemos as cores repetindo as texturas 5x para terem detalhe
    vec4 colorTerrain = texture2D(uSampler, vTextureCoord * 5.0);
    vec4 colorPath = texture2D(uSampler3, fract(vTextureCoord * 5.0));
    
    // A máscara não se repete, cobre o terreno todo (1x)
    vec4 mask = texture2D(uSampler4, vTextureCoord);

    // mix() mistura o terreno e o caminho com base na cor da máscara (mask.r)
    // 0.0 (Preto) = Mostra Terreno | 1.0 (Branco) = Mostra Caminho
    gl_FragColor = mix(colorTerrain, colorPath, mask.r);
}