#version 300 es

precision mediump float;

in vec2 a_vertex_position;
in vec2 a_texture_position;

out vec2 v_texture_position;

void main() {
    gl_Position = vec4(a_vertex_position, 0, 1);
    v_texture_position = a_texture_position;
}
