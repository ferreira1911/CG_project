#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D uSampler;

varying vec2 vTextureCoord;
varying float vTipness;

void main() {
    vec4 c = texture2D(uSampler, vTextureCoord);

    // Alpha test — discard transparent fragments instead of blending,
    // so order-independence is automatic and depth writes remain correct.
    if (c.a < 0.5) discard;

    // Pull the saturation down a touch — texture grass tends to be too vivid.
    float luma = dot(c.rgb, vec3(0.299, 0.587, 0.114));
    c.rgb = mix(vec3(luma), c.rgb, 0.65);

    // Tint warmer toward the root (drier base, greener tip) and darken slightly.
    vec3 rootTint = vec3(0.55, 0.50, 0.30);
    c.rgb = mix(c.rgb * rootTint, c.rgb, vTipness);
    c.rgb *= mix(0.7, 0.82, vTipness);

    gl_FragColor = c;
}
