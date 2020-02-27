export default class Program {
    constructor(vertexShaderSource, fragmentShaderSource) {
        this.pointer = null;
        this.vertexShaderSource = vertexShaderSource;
        this.fragmentShaderSource = fragmentShaderSource;
    }

    initialize(gl, handler) {
        //
    }

    beforeRender(gl, handler) {
        //
    }

    afterRender(gl, handler) {
        //
    }

    getPointer() {
        return this.pointer;
    }

    setPointer(pointer) {
        this.pointer = pointer;
    }

    getVertexShaderSource() {
        return this.vertexShaderSource;
    }

    getFragmentShaderSource() {
        return this.fragmentShaderSource;
    }
}
