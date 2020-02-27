precision mediump float;

varying vec2 v_texture_position;

uniform sampler2D u_input;
uniform sampler2D u_color_map;

void main() {
   float intensity = texture2D(u_input, v_texture_position).r;
   gl_FragColor = texture2D(u_color_map, vec2(intensity, 0.5));
}
