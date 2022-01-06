import { ShaderChunk, ShaderMaterial } from 'three';
import glsl from './glsl';

const outlineVert = glsl`
#define STANDARD
uniform float outlineThickness;

void main() {
	${ShaderChunk.beginnormal_vertex}
	${ShaderChunk.begin_vertex}
  transformed += objectNormal * outlineThickness;
	${ShaderChunk.project_vertex}
}`;

const outlineFrag  = glsl`
uniform vec3 color;

void main() {
  vec4 diffuseColor = vec4(color, 1.0);
  gl_FragColor = diffuseColor;
}
`;

export class OutlineMaterial extends ShaderMaterial {
  constructor(width: number) {
    super({
      uniforms: {
        outlineThickness: { value: width },
      },
      vertexShader: outlineVert,
      fragmentShader: outlineFrag,
    });
  }
}
