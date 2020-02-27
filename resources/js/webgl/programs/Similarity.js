import Program from './Program';
import fragmentShaderSource from 'raw-loader!../shaders/similarity.glsl.frag';
import vertexShaderSource from 'raw-loader!../shaders/rectangle.glsl.vert';

let MAX_DISTANCE = Math.PI / 2;

export default class Similarity extends Program {
    constructor(id, dataset) {
        super(id);

        this.mousePosition = [0, 0];
        this.mousePositionPointer = null;
        this.dataset = dataset;
        this.framebuffer = null;
    }

    initialize(gl, handler) {
        let pointer = this.getPointer();
        handler.useVertexPositions(this);
        handler.useTexturePositions(this);
        handler.useTextures(this);

        let normalization = gl.getUniformLocation(pointer, 'u_normalization');
        gl.uniform1f(normalization, 1 / MAX_DISTANCE);

        this.mousePositionPointer = gl.getUniformLocation(pointer, 'u_mouse_position');

        this.framebuffer = handler.getFramebuffer('distances');

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
        let texture = handler.getTexture('distanceTexture');
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.dataset.width, this.dataset.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    beforeRender(gl, handler) {
        gl.uniform2f(this.mousePositionPointer, this.mousePosition[0], this.mousePosition[2]);
        handler.bindTextures();
        // gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    afterRender(gl, handler) {
        // TODO update feature channel intensities
    }

    getVertexShaderSource() {
        return vertexShaderSource;
    }

    getFragmentShaderSource() {
        return fragmentShaderSource;
    }

    setMousePosition(mousePosition) {
        this.mousePosition = mousePosition;
    }
}
