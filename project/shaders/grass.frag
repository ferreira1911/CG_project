#ifdef GL_ES
precision highp float;
#endif

varying float vLocalY;
varying vec4 vGrassInfo;
varying vec3 vNormal;

uniform float uBladeHeight;

void main() {
    float t = clamp(vLocalY / uBladeHeight, 0.0, 1.0);
    
    float dryness = vGrassInfo.w;
    
    // High-end optimization: Pre-interpolate raw colors by dryness FIRST, saving 
    // multiple expensive smoothstep steps per pixel (Distributive property)
    vec3 rootFinal = mix(vec3(0.06, 0.15, 0.03), vec3(0.20, 0.18, 0.05), dryness);
    vec3 bodyFinal = mix(vec3(0.15, 0.35, 0.08), vec3(0.40, 0.35, 0.08), dryness);
    vec3 tipFinal  = mix(vec3(0.22, 0.50, 0.12), vec3(0.60, 0.55, 0.15), dryness);
    
    vec3 color = mix(rootFinal, bodyFinal, smoothstep(0.0, 0.4, t));
    color = mix(color, tipFinal, smoothstep(0.4, 1.0, t));
    
    // Add subtle variation per blade
    color += vec3(vGrassInfo.x * 0.05, vGrassInfo.x * 0.07, vGrassInfo.x * 0.02);

    // Robust lighting: Normalize interpolated normal vector on-the-fly
    vec3 lightDir = normalize(vec3(0.5, 0.8, 0.3));
    float diffuse = max(dot(normalize(vNormal), lightDir), 0.22);
    
    float ambient = 0.30;
    
    gl_FragColor = vec4(color * (diffuse + ambient), 1.0);
}
