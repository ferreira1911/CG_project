#ifdef GL_ES
precision mediump float;
#endif

varying vec2 vTextureCoord;
varying vec3 vNormal;

uniform sampler2D uSampler;
uniform bool uUseTexture;
uniform vec3 uBaseColor;
uniform vec3 uLightPos;

void main() {
    vec4 color = vec4(uBaseColor, 1.0);
    if (uUseTexture) {
        color *= texture2D(uSampler, vTextureCoord);
    }

    float d = dot(normalize(vNormal), normalize(uLightPos));
    float lighting = 0.4 + 0.6 * max(d, 0.0) + 0.2 * max(-d, 0.0);

    gl_FragColor = vec4(color.rgb * lighting, color.a);
}
