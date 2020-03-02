precision mediump float;

varying vec2 v_texture_position;

uniform vec2 u_mouse_position;
uniform float u_texture_dimension;

<%=TEXTURE_3D=%>

void main() {
    float tile_number =
        floor(
            (v_texture_position.t * u_texture_dimension + v_texture_position.s)
            * u_texture_dimension - u_texture_dimension / 2.0
        );
    gl_FragColor = texture3D(u_mouse_position, tile_number);
}
