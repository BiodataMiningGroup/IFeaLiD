import Program from './Program';
import fragmentShaderSource from 'raw-loader!../shaders/pixel-vector.fs';
import vertexShaderSource from 'raw-loader!../shaders/rectangle.vs';


export default class PixelVector extends Program {
    constructor(dataset) {
        super(vertexShaderSource, fragmentShaderSource);
        // Dimension of a square texture that can contain all values of the pixel vector.
        this.textureDimension = Math.ceil(Math.sqrt(Math.ceil(dataset.features / 4)));
        this.texture = null;
        this.inputTexture = null;
        this.mousePosition = [0, 0];
        this.mousePositionPointer = null;
        this.dataset = dataset;
        this.framebuffer = null;
        this.pixelVector = new Float32Array(this.textureDimension * this.textureDimension * 4);
    }

    initialize(gl, handler) {
        let pointer = this.getPointer();
        handler.useVertexPositions(this);
        handler.useTexturePositions(this);
        handler.useTextures(this);

        this.mousePositionPointer = gl.getUniformLocation(pointer, 'u_mouse_position');

        let texture_dimension = gl.getUniformLocation(pointer, 'u_texture_dimension');
        gl.uniform1f(texture_dimension, this.textureDimension);

        this.framebuffer = handler.getFramebuffer('pixelVector');

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
        this.texture = handler.getTexture('pixelVector');
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, this.textureDimension, this.textureDimension, 0, gl.RGBA, gl.FLOAT, null);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0);
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    beforeRender(gl, handler) {
        gl.viewport(0, 0, this.textureDimension, this.textureDimension);
        gl.uniform2f(this.mousePositionPointer, this.mousePosition[0], this.mousePosition[1]);
        handler.bindTextures();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    }

    afterRender(gl, handler) {
        gl.readPixels(0, 0, this.textureDimension, this.textureDimension, gl.RGBA, gl.FLOAT, this.pixelVector);
        gl.viewport(0, 0, this.dataset.width, this.dataset.height);
    }

    link(program) {
        this.inputTexture = program.getOutputTexture();
    }

    getMousePosition() {
        return this.mousePosition;
    }

    setMousePosition(position) {
        // Move position to center of pixels.
        // Flip y-coordinates because the webgl textures are flipped, too.
        this.mousePosition = [
            (position[0] + 0.5) / this.dataset.width,
            1 - (position[1] + 0.5) / this.dataset.height,
        ];
    }

    getPixelVector() {
        return this.pixelVector.subarray(0, this.dataset.features);
    }
}
