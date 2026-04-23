#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTextureCoord;
varying vec3 vObjPos;

uniform sampler2D uSampler;
uniform float time;
uniform vec3 uLightPos;

float hash(vec3 p) {
    p = fract(p * vec3(0.16532, 0.17369, 0.15787));
    p += dot(p.xyz, p.yzx + 19.19);
    return fract((p.x + p.y) * p.z);
}

float noise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash(i + vec3(0.0, 0.0, 0.0)), hash(i + vec3(1.0, 0.0, 0.0)), f.x),
                   mix(hash(i + vec3(0.0, 1.0, 0.0)), hash(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
               mix(mix(hash(i + vec3(0.0, 0.0, 1.0)), hash(i + vec3(1.0, 0.0, 1.0)), f.x),
                   mix(hash(i + vec3(0.0, 1.0, 1.0)), hash(i + vec3(1.0, 1.0, 1.0)), f.x), f.y), f.z);
}

const mat3 rot = mat3(
     0.00,  0.80,  0.60,
    -0.80,  0.36, -0.48,
    -0.60, -0.48,  0.64
);

float fbm(vec3 p) {
    float f = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 5; i++) {
        f += amp * noise(p);
        p = rot * p * 2.17;
        amp *= 0.5;
    }
    return f;
}

void main() {
    vec4 baseSky = texture2D(uSampler, vTextureCoord);
    vec3 dir = normalize(vObjPos);

    vec3 base = rot * dir * 2.3 + vec3(100.0);
    base.x += time * 0.05;
    base.z += time * 0.02;

    float clouds = fbm(base);

    float cloudMask = smoothstep(0.38, 0.52, clouds);
    cloudMask *= smoothstep(0.02, 0.35, dir.y);

    vec3 sunDir = normalize(uLightPos);
    float sunFacing = max(dot(dir, sunDir), 0.0);
    float halo = pow(sunFacing, 8.0);
    float silver = pow(sunFacing, 3.0);

    vec3 sunTint = vec3(1.0, 0.88, 0.70);
    vec3 skyWithHalo = baseSky.rgb + sunTint * halo * 0.35;

    float cloudShadowTerm = 1.0 - 0.15 * (1.0 - sunFacing);
    vec3 cloudColor = vec3(cloudShadowTerm);
    cloudColor += sunTint * silver * 0.35;

    vec3 finalColor = mix(skyWithHalo, cloudColor, cloudMask);

    gl_FragColor = vec4(finalColor, 1.0);
}
