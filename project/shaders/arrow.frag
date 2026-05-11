#ifdef GL_ES
precision highp float;
#endif

uniform float uTime;

void main() {
    // Luminance pulse between deep green and bright neon green
    float pulse = (sin(uTime * 8.0) + 1.0) / 2.0; 
    
    vec3 colorA = vec3(0.0, 0.6, 0.1); // Bright forest green
    vec3 colorB = vec3(0.4, 1.0, 0.5); // Intense neon glow green
    
    vec3 finalColor = mix(colorA, colorB, pulse);
    
    gl_FragColor = vec4(finalColor, 1.0);
}
