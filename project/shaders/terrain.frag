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
uniform sampler2D uSampler6; // pebbles
uniform sampler2D uSampler7; // flowers
uniform sampler2D uSampler8; // rocky
uniform sampler2D uSampler9; // decay leaves
uniform vec2 uHeightTexel;
uniform float uTerrainHeight;
uniform vec3 uLightPos;

float sampleHeight(vec2 uv) {
    vec2 clampedUV = clamp(uv, vec2(0.0), vec2(1.0));
    return texture2D(uSampler2, clampedUV).r * uTerrainHeight;
}

// Cheap value noise: hash 4 lattice corners and bilinearly interpolate.
// Full 0-1 range so smoothstep cutoffs behave predictably.
float hash21(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
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

    // --- Procedural scatter overlay: pebbles, rocky, decay leaves, flowers ---
    // Procedural value noise per layer; different scales/offsets keep them apart.
    // Higher scale = smaller clumps.
    float pebbleNoise = vnoise(vTextureCoord * 90.0 + vec2(13.7, 71.3));
    float rockyNoise  = vnoise(vTextureCoord * 50.0 + vec2(83.5, 19.2));
    float leafNoise   = vnoise(vTextureCoord * 65.0 + vec2(57.8, 91.4));
    float flowerNoise = vnoise(vTextureCoord * 75.0 + vec2(41.1, 27.5));

    // Rarity: only fire on the high tail of the noise field.
    float pebbleMask = smoothstep(0.55, 0.78, pebbleNoise);
    float rockyMask  = smoothstep(0.70, 0.88, rockyNoise);
    float leafMask   = smoothstep(0.74, 0.90, leafNoise);
    float flowerMask = smoothstep(0.82, 0.94, flowerNoise);

    // Biome bias: pebbles concentrated near the path edge, others only on grass.
    float pathEdge = smoothstep(0.05, 0.30, mask.r) * (1.0 - pathBlend);
    pebbleMask *= mix(0.35, 1.0, pathEdge);
    pebbleMask *= (1.0 - pathBlend);

    rockyMask  *= (1.0 - pathBlend);
    rockyMask  *= (1.0 - pebbleMask * 0.5);

    leafMask   *= (1.0 - pathBlend);
    leafMask   *= (1.0 - pebbleMask * 0.6);
    leafMask   *= (1.0 - rockyMask * 0.6);

    flowerMask *= (1.0 - pathBlend);
    flowerMask *= (1.0 - pebbleMask * 0.7);
    flowerMask *= (1.0 - rockyMask * 0.7);
    flowerMask *= (1.0 - leafMask * 0.7);

    // Detail textures tiled tightly so individual elements don't smear.
    vec3 pebbleColor = texture2D(uSampler6, vTextureCoord * 50.0).rgb;
    vec3 rockyColor  = texture2D(uSampler8, vTextureCoord * 25.0).rgb;
    vec3 leafColor   = texture2D(uSampler9, vTextureCoord * 35.0).rgb;
    vec3 flowerColor = texture2D(uSampler7, vTextureCoord * 40.0).rgb;

    // Light overlays the same way as the base so they don't pop flat.
    vec3 pebbleLit = mix(pebbleColor, pebbleColor * lighting, 0.68);
    vec3 rockyLit  = mix(rockyColor,  rockyColor  * lighting, 0.68);
    vec3 leafLit   = mix(leafColor,   leafColor   * lighting, 0.68);
    vec3 flowerLit = mix(flowerColor, flowerColor * lighting, 0.68);

    finalColor = mix(finalColor, pebbleLit, pebbleMask * 0.95);
    finalColor = mix(finalColor, rockyLit,  rockyMask  * 0.95);
    finalColor = mix(finalColor, leafLit,   leafMask   * 0.92);
    finalColor = mix(finalColor, flowerLit, flowerMask * 0.90);

    gl_FragColor = vec4(finalColor, texColor.a);
}