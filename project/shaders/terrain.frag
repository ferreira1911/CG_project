#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTextureCoord;
varying vec3 vNormal;
varying vec2 vWorldXZ;

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

#define MAX_TREES 12
uniform vec2 uTreePos[MAX_TREES]; // world XZ of each tree trunk
uniform int  uTreeCount;          // number of valid entries in uTreePos

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
    // Cut off the square corners so the terrain fits perfectly inside the skybox sphere
    if (dot(vWorldXZ, vWorldXZ) > 148.5 * 148.5) {
        discard;
    }
    
    // Tile terrain/path textures for detail; keep mask in base UV space.
    // Two-scale grass blend: wide tile for variety at distance, tight tile for
    // close-up detail. Eliminates the obvious wallpaper repeat.
    vec4 grassFar  = texture2D(uSampler, vTextureCoord * 30.0);
    vec4 grassNear = texture2D(uSampler, vTextureCoord * 120.0);
    vec4 colorTerrain = mix(grassFar, grassNear, 0.4);

    // Low-frequency tint variation breaks "uniform carpet" feel.
    float tintNoise = vnoise(vTextureCoord * 4.0 + vec2(99.1, 12.3));
    vec3 grassTint = mix(vec3(0.85, 0.95, 0.80), vec3(1.05, 1.05, 0.95), tintNoise);
    colorTerrain.rgb *= grassTint;

    // Dynamically tint the ground texture to perfectly match the base/root green
    // of our procedural grass palette, creating a seamless blended meadow.
    colorTerrain.rgb *= vec3(0.65, 0.78, 0.48);
    vec4 colorPath = texture2D(uSampler3, vTextureCoord * 30.0);
    vec4 mask = texture2D(uSampler4, vTextureCoord);
    float fineDisp = texture2D(uSampler5, vTextureCoord * 30.0).r;

    // mask.r: 0.0 -> terrain, 1.0 -> path.
    float pathBlend = smoothstep(0.18, 0.82, mask.r);
    vec4 texColor = mix(colorTerrain, colorPath, pathBlend);

    // Instead of 8 expensive per-fragment texture lookups to reconstruct
    // normals on the fly, we consume the highly accurate vertex-interpolated vNormal.
    vec3 terrainNormal = normalize(vNormal);
    
    // Slightly stronger directional lighting so the relief reads as terrain.
    vec3 lightDir = normalize(uLightPos);
    float diffuse = max(dot(normalize(terrainNormal), lightDir), 0.0);
    float lighting = 0.28 + 0.72 * diffuse;

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

    // Confine rocky to the map perimeter. rockyNoise still gates it, so it
    // appears as scattered patches near the edge rather than a solid ring.
    float rockyPerimeter = smoothstep(100.0, 142.0, length(vWorldXZ));
    rockyMask  *= rockyPerimeter;
    rockyMask  *= (1.0 - pathBlend);
    rockyMask  *= (1.0 - pebbleMask * 0.5);

    // Decay leaves only spawn next to trees: fade the leaf overlay by the
    // distance from this fragment to the nearest tree trunk.
    float treeDistSq = 1.0e9;
    for (int ti = 0; ti < MAX_TREES; ti++) {
        if (ti >= uTreeCount) break;
        vec2 dxz = vWorldXZ - uTreePos[ti];
        treeDistSq = min(treeDistSq, dot(dxz, dxz));
    }
    // Full litter within ~9 units of a trunk, gone by ~16 units.
    float treeNear = 1.0 - smoothstep(81.0, 256.0, treeDistSq);
    leafMask  *= treeNear;

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
