#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTextureCoord;
varying vec3 vObjPos;

uniform sampler2D uSampler;
uniform float time;

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

float fbm_cheap(vec3 p) {
    float f = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 2; i++) {
        f += amp * noise(p);
        p = rot * p * 2.17;
        amp *= 0.5;
    }
    return f;
}

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

    
    vec3 p = rot * dir * 4.5 + vec3(100.0);
    p.x += time * (0.01 + dir.y * 0.01);
    p.z += time * 0.01;

    vec3 q = vec3(
        fbm_cheap(p),
        fbm_cheap(p + vec3(5.2, 1.3, 2.7)),
        fbm_cheap(p + vec3(8.1, 3.7, 1.2))
    );
    q = (q - 0.5) * 1.0;

    vec3 r = vec3(
        fbm_cheap(p + 1.0 * q + vec3(1.7, 9.2, 4.3)),
        fbm_cheap(p + 1.0 * q + vec3(8.3, 2.8, 6.1)),
        fbm_cheap(p + 1.0 * q + vec3(3.9, 5.5, 0.8))
    );
    r = (r - 0.5) * 0.8;

    float clouds = fbm(p + 0.8 * r);

    float cloudMask = smoothstep(0.50, 0.63, clouds);
    
    
    cloudMask *= smoothstep(0.15, 0.45, dir.y);

    float cloudThickness = smoothstep(0.50, 0.75, clouds);
    vec3 shadowColor = vec3(0.55, 0.60, 0.70);
    vec3 litColor = vec3(1.0, 0.98, 0.95);
    vec3 cloudColor = mix(shadowColor, litColor, cloudThickness);

    vec3 finalColor = mix(baseSky.rgb, cloudColor, cloudMask);

    gl_FragColor = vec4(finalColor, 1.0);
}