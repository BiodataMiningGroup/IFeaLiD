import Program from './Program';
import fragmentShaderSource from 'raw-loader!../shaders/similarity.fs';
import vertexShaderSource from 'raw-loader!../shaders/rectangle.vs';

let MAX_DISTANCE = Math.PI / 2;

export default class Similarity extends Program {
    constructor(dataset) {
        super(vertexShaderSource, fragmentShaderSource);
        this.mousePosition = [0, 0];
        this.mousePositionPointer = null;
        this.dataset = dataset;
        this.framebuffer = null;
        this.outputTexture = null;
        this.intensities = new Uint8Array(this.dataset.width * this.dataset.height * 4);
        this.intensityStats = {
            min: 0,
            max: 0,
        };
    }

    initialize(gl, handler) {
        let pointer = this.getPointer();
        handler.useVertexPositions(this);
        handler.useTexturePositions(this);
        handler.useTextures(this);

        let normalization = gl.getUniformLocation(pointer, 'u_normalization');
        gl.uniform1f(normalization, 1 / MAX_DISTANCE);

        this.mousePositionPointer = gl.getUniformLocation(pointer, 'u_mouse_position');

        this.framebuffer = handler.getFramebuffer('similarity');

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
        this.outputTexture = handler.getTexture('similarity');
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.dataset.width, this.dataset.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.outputTexture, 0);
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    beforeRender(gl, handler) {
        gl.uniform2f(this.mousePositionPointer, this.mousePosition[0], this.mousePosition[1]);
        handler.bindTextures();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    }

    afterRender(gl, handler) {
        gl.readPixels(0, 0, this.dataset.width, this.dataset.height, gl.RGBA, gl.UNSIGNED_BYTE, this.intensities);
        this.intensityStats.max = 0;
        this.intensityStats.min = 255;
        for (var i = this.intensities.length - 1; i >= 0; i -= 4) {
            this.intensityStats.max = Math.max(this.intensities[i], this.intensityStats.max);
            this.intensityStats.min = Math.min(this.intensities[i], this.intensityStats.min);
        }
    }

    setMousePosition(coordinate) {
        // Norm x and y values and prevent webgl coordinate interpolation.
        // Flip y-coordinates because the webgl textures are flipped, too.
        this.mousePosition = [
            (Math.floor(coordinate[0]) + 0.5) / this.dataset.width,
            1 - (Math.floor(coordinate[1]) + 0.5) / this.dataset.height,
        ];
    }

    getOutputTexture() {
        return this.outputTexture;
    }

    getIntensityStats() {
        return this.intensityStats;
    }
}
