#ifdef GL_ES
precision mediump float;
#endif

varying vec2 vTextureCoord;
varying vec3 vNormal;

uniform sampler2D uSampler;
uniform vec3 uBaseColor;
uniform vec3 uLightDir;

void main() {
    vec4 texColor = texture2D(uSampler, vTextureCoord);
    
    float d = dot(normalize(vNormal), uLightDir);
    float diffuse = max(d, 0.0);
    float backLight = max(-d, 0.0);
    float lighting = 0.2 + 0.72 * diffuse + 0.08 * backLight;

    gl_FragColor = vec4(uBaseColor * texColor.rgb * lighting, texColor.a);
}
