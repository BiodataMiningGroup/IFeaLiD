precision mediump float;

varying vec2 v_texture_position;

uniform sampler2D u_intensities;

uniform float u_min_intensity;
uniform float u_max_intensity;

void main() {
   float intensity = texture2D(u_intensities, v_texture_position).r;
   intensity = (intensity - u_min_intensity) / (u_max_intensity - u_min_intensity);

   gl_FragColor = vec4(vec3(intensity), 1.0);
}
