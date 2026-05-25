#ifdef GL_ES
precision highp float;
#endif

uniform float uTime;

void main() {
    // Pulse between deep forest green and a bright neon-green glow so the
    // arrow reads as "active waypoint" even at distance.
    float pulse = 0.5 + 0.5 * sin(uTime * 8.0);
    vec3 colorA = vec3(0.0, 0.6, 0.1);
    vec3 colorB = vec3(0.4, 1.0, 0.5);
    gl_FragColor = vec4(mix(colorA, colorB, pulse), 1.0);
}
