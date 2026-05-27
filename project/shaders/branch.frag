#ifdef GL_ES
precision mediump float;
#endif

varying vec2 vTextureCoord;
varying vec3 vNormal;

uniform sampler2D uSampler;
uniform bool uUseTexture;
uniform vec3 uBaseColor;
uniform vec3 uLightDir;

void main() {
    vec4 color = vec4(uBaseColor, 1.0);
    if (uUseTexture) {
        color *= texture2D(uSampler, vTextureCoord);
    }
    
    float d = dot(normalize(vNormal), uLightDir);
    float diffuse = max(d, 0.0);
    float backLight = max(-d, 0.0);
    float lighting = 0.14 + 0.78 * diffuse + 0.08 * backLight;

    gl_FragColor = vec4(color.rgb * lighting, color.a);
}
