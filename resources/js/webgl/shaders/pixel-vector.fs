#version 300 es

precision mediump float;
precision mediump int;
precision mediump usampler2D;

in vec2 v_texture_position;

uniform vec2 u_mouse_position;
uniform float u_texture_dimension;

out vec4 outColor;

<%=TEXTURE_3D=%>

void main() {
    // Texture coordinates are in [0, 1] and mark the center of a pixel of the texture.
    // Multiply with u_texture_dimension to get the pixel coordinates and use floor()
    // to shift the coordinates to the left corner of the pixel.
    float tile_number = floor(v_texture_position.t * u_texture_dimension) * u_texture_dimension + floor(v_texture_position.s * u_texture_dimension);

    outColor = texture3D(u_mouse_position, tile_number);
}
