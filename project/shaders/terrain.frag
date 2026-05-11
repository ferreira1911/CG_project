#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTextureCoord;
varying vec3 vNormal;

uniform sampler2D uSampler;
uniform sampler2D uSampler3;
uniform sampler2D uSampler4;
uniform vec3 uLightPos;

void main() {
    // Tile terrain/path textures for detail; keep mask in base UV space.
    vec4 colorTerrain = texture2D(uSampler, vTextureCoord * 30.0);
    vec4 colorPath = texture2D(uSampler3, vTextureCoord * 30.0);
    vec4 mask = texture2D(uSampler4, vTextureCoord);

    // mask.r: 0.0 -> terrain, 1.0 -> path.
    float pathBlend = smoothstep(0.18, 0.82, mask.r);
    vec4 texColor = mix(colorTerrain, colorPath, pathBlend);
    
    // Slightly stronger directional lighting so the relief reads as terrain.
    vec3 lightDir = normalize(uLightPos);
    float diffuse = max(dot(normalize(vNormal), lightDir), 0.0);
    float lighting = 0.18 + 0.82 * diffuse;
    
    gl_FragColor = vec4(texColor.rgb * lighting, texColor.a);
}