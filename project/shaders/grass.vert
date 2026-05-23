attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;
attribute float aLocalY;
attribute vec4 aGrassInfo;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform mat4 uNMatrix;
uniform float uTime;
uniform float uWindAmp;
uniform float uWindFreq;
uniform vec2 uHorsePos;
uniform vec2 uWheelPos0;
uniform vec2 uWheelPos1;
uniform vec2 uWheelPos2;
uniform vec2 uWheelPos3;

varying float vLocalY;
varying vec4 vGrassInfo;
varying vec3 vNormal;

vec2 calcPush(vec2 vertexPos, vec2 interactorPos, float radius, float maxP) {
    vec2 toVertex = vertexPos - interactorPos;
    float distSq = dot(toVertex, toVertex);
    if(distSq < radius * radius) {
        float dist = sqrt(distSq);
        float strength = smoothstep(radius, 0.0, dist);
        vec2 dir = (dist > 0.001) ? (toVertex / dist) : vec2(1.0, 0.0);
        return dir * maxP * strength;
    }
    return vec2(0.0);
}

void main() {
    vLocalY = aLocalY;
    vGrassInfo = aGrassInfo;
    // Optimization: Skip matrix multiply since light is computed in static model coords
    vNormal = aVertexNormal;

    float phase = aGrassInfo.y;
    float stiffness = aGrassInfo.z;
    
    // Fast polynomial approximation replaces slow GPU exponent pow()
    float windFactor = aLocalY * aLocalY * 0.3;
    
    float swayX = sin(uTime * uWindFreq * stiffness + phase + aVertexPosition.x * 0.1) * uWindAmp * windFactor;
    float swayZ = cos(uTime * uWindFreq * stiffness * 0.8 + phase + aVertexPosition.z * 0.1) * uWindAmp * windFactor;

    vec3 pos = aVertexPosition;
    pos.x += swayX;
    pos.z += swayZ;

    vec2 totalPush = vec2(0.0);
    // Push away from the horse (slightly larger radius/push)
    totalPush += calcPush(aVertexPosition.xz, uHorsePos, 2.0, 0.7);
    // Push away from the 4 wheels
    totalPush += calcPush(aVertexPosition.xz, uWheelPos0, 1.5, 0.5);
    totalPush += calcPush(aVertexPosition.xz, uWheelPos1, 1.5, 0.5);
    totalPush += calcPush(aVertexPosition.xz, uWheelPos2, 1.5, 0.5);
    totalPush += calcPush(aVertexPosition.xz, uWheelPos3, 1.5, 0.5);
    
    float heightFactor = clamp(aLocalY, 0.0, 1.3) * 0.7; 
    pos.x += totalPush.x * heightFactor;
    pos.z += totalPush.y * heightFactor;

    gl_Position = uPMatrix * uMVMatrix * vec4(pos, 1.0);
}
