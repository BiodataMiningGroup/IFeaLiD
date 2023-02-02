import IntensityProgram from './IntensityProgram';
import fragmentShaderSource from '../shaders/similarity.fs';
import vertexShaderSource from '../shaders/rectangle.vs';

let MAX_DISTANCE = Math.PI / 2;

export default class Similarity extends IntensityProgram {
    constructor(options) {
        super(vertexShaderSource, fragmentShaderSource, options);
        this.mousePosition = [0.5, 0.5];
        this.mousePositionPointer = null;
    }

    initialize(gl, handler) {
        super.initialize(gl, handler);
        let pointer = this.getPointer();
        let normalization = gl.getUniformLocation(pointer, 'u_normalization');
        gl.uniform1f(normalization, 1 / MAX_DISTANCE);

        this.mousePositionPointer = gl.getUniformLocation(pointer, 'u_mouse_position');
    }

    beforeRender(gl, handler) {
        super.beforeRender(gl, handler);
        gl.uniform2f(this.mousePositionPointer, this.mousePosition[0], this.mousePosition[1]);
    }

    afterRender(gl, handler) {
        super.afterRender(gl, handler);
    }

    getMousePosition() {
        return this.mousePosition;
    }

    setMousePosition(position) {
        // Move position to center of pixels.
        // Flip y-coordinates because the webgl textures are flipped, too.
        this.mousePosition = [
            (position[0] + 0.5) / this.width,
            1 - (position[1] + 0.5) / this.height,
        ];
    }
}
