#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTextureCoord;
varying vec3 vNormal;

uniform sampler2D uSampler;
uniform sampler2D uSampler2;
uniform sampler2D uSampler3;
uniform sampler2D uSampler4;
uniform sampler2D uSampler5;
uniform vec2 uHeightTexel;
uniform float uTerrainHeight;
uniform vec3 uLightPos;

float sampleHeight(vec2 uv) {
    vec2 clampedUV = clamp(uv, vec2(0.0), vec2(1.0));
    return texture2D(uSampler2, clampedUV).r * uTerrainHeight;
}

void main() {
    // Tile terrain/path textures for detail; keep mask in base UV space.
    vec4 colorTerrain = texture2D(uSampler, vTextureCoord * 30.0);
    vec4 colorPath = texture2D(uSampler3, vTextureCoord * 30.0);
    vec4 mask = texture2D(uSampler4, vTextureCoord);
    float fineDisp = texture2D(uSampler5, vTextureCoord * 30.0).r;

    // mask.r: 0.0 -> terrain, 1.0 -> path.
    float pathBlend = smoothstep(0.18, 0.82, mask.r);
    vec4 texColor = mix(colorTerrain, colorPath, pathBlend);

    // Recompute the terrain normal per fragment so the lighting follows the
    // actual slope continuously instead of interpolating across triangle faces.
    float hL = sampleHeight(vTextureCoord - vec2(uHeightTexel.x, 0.0));
    float hR = sampleHeight(vTextureCoord + vec2(uHeightTexel.x, 0.0));
    float hD = sampleHeight(vTextureCoord - vec2(0.0, uHeightTexel.y));
    float hU = sampleHeight(vTextureCoord + vec2(0.0, uHeightTexel.y));

    float dispL = texture2D(uSampler5, (vTextureCoord - vec2(uHeightTexel.x, 0.0)) * 30.0).r;
    float dispR = texture2D(uSampler5, (vTextureCoord + vec2(uHeightTexel.x, 0.0)) * 30.0).r;
    float dispD = texture2D(uSampler5, (vTextureCoord - vec2(0.0, uHeightTexel.y)) * 30.0).r;
    float dispU = texture2D(uSampler5, (vTextureCoord + vec2(0.0, uHeightTexel.y)) * 30.0).r;

    float hLFinal = hL + dispL * 0.8 * (1.0 - mask.r);
    float hRFinal = hR + dispR * 0.8 * (1.0 - mask.r);
    float hDFinal = hD + dispD * 0.8 * (1.0 - mask.r);
    float hUFinal = hU + dispU * 0.8 * (1.0 - mask.r);

    vec3 tangentX = vec3(2.0 * uHeightTexel.x, hRFinal - hLFinal, 0.0);
    vec3 tangentZ = vec3(0.0, hUFinal - hDFinal, 2.0 * uHeightTexel.y);
    vec3 terrainNormal = normalize(cross(tangentZ, tangentX));
    
    // Slightly stronger directional lighting so the relief reads as terrain.
    vec3 lightDir = normalize(uLightPos);
    float diffuse = max(dot(normalize(terrainNormal), lightDir), 0.0);
    float lighting = 0.38 + 0.62 * diffuse;

    vec3 shadedColor = texColor.rgb * lighting;
    vec3 finalColor = mix(texColor.rgb, shadedColor, 0.68);

    gl_FragColor = vec4(finalColor, texColor.a);
}