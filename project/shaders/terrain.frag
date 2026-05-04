#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTextureCoord;

uniform sampler2D uSampler;
uniform sampler2D uSampler3;
uniform sampler2D uSampler4;

void main() {
    // Tile terrain/path textures for detail; keep mask in base UV space.
    vec4 colorTerrain = texture2D(uSampler, vTextureCoord * 50.0);
    vec4 colorPath = texture2D(uSampler3, vTextureCoord * 50.0);
    vec4 mask = texture2D(uSampler4, vTextureCoord);

    // mask.r: 0.0 -> terrain, 1.0 -> path.
    gl_FragColor = mix(colorTerrain, colorPath, mask.r);
}