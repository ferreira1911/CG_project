#ifdef GL_ES
precision highp float;
#endif

varying float vLocalY;
varying vec4 vGrassInfo;
varying vec3 vNormal;

uniform float uBladeHeight;

void main() {
    float t = clamp(vLocalY / uBladeHeight, 0.0, 1.0);
    
    // Green grass palette
    vec3 rootColorG = vec3(0.06, 0.15, 0.03); 
    vec3 bodyColorG = vec3(0.15, 0.35, 0.08); 
    vec3 tipColorG  = vec3(0.22, 0.50, 0.12); 
    
    vec3 colorG = mix(rootColorG, bodyColorG, smoothstep(0.0, 0.4, t));
    colorG = mix(colorG, tipColorG, smoothstep(0.4, 1.0, t));

    // Dry grass palette (Yellow / Golden Straw)
    vec3 rootColorD = vec3(0.20, 0.18, 0.05); 
    vec3 bodyColorD = vec3(0.40, 0.35, 0.08); 
    vec3 tipColorD  = vec3(0.60, 0.55, 0.15); 
    
    vec3 colorD = mix(rootColorD, bodyColorD, smoothstep(0.0, 0.4, t));
    colorD = mix(colorD, tipColorD, smoothstep(0.4, 1.0, t));
    
    // Mix the two palettes based on the dryness factor computed in the CPU
    float dryness = vGrassInfo.w;
    vec3 color = mix(colorG, colorD, dryness);
    
    // Add subtle variation per blade
    color += vec3(vGrassInfo.x * 0.05, vGrassInfo.x * 0.07, vGrassInfo.x * 0.02);

    // Simple robust lighting logic
    vec3 lightDir = normalize(vec3(0.5, 0.8, 0.3));
    float diffuse = max(dot(vNormal, lightDir), 0.3);
    
    float ambient = 0.45; // Balanced ambient
    
    gl_FragColor = vec4(color * (diffuse + ambient), 1.0);
}
