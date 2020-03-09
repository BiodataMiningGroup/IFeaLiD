import Program from './programs/Program';

let TEXTURE_PREFIX = 'texture_';

let numberToFloatString = function (number) {
    return ((number % 1) === 0) ? `${number}.0` : `${number}`;
};

class WebglError extends Error {}

export default class Handler {
    constructor(options) {
        this.canvas_ = options.canvas;
        this.gl_ = this.getWebglContext_(this.canvas_, {
            preserveDrawingBuffer: true,
            premultipliedAlpha: false,
        });

        this.dataset_ = {
            width: options.width === undefined ? 0 : options.width,
            height: options.height === undefined ? 0 : options.height,
            depth: options.depth === undefined ? 0 : options.depth,
            precision: options.precision === undefined ? 0 : options.precision,
        };

        this.props_ = this.getProps_(this.gl_, this.dataset_, options);
        this.tilesToStore_ = {};
        for (let i = 0; i < this.props_.tiles; i++) {
            this.tilesToStore_[i] = null;
        }
        this.initializedTextures_ = new Array(this.props_.requiredUnits);
        this.initializedTextures_.fill(false);

        this.programs_ = [];

        this.assets_ = {
            buffers: {},
            framebuffers: {},
            textures: {},
        };

        this.renderPromises_ = {};

        this.prepareWebgl_(this.gl_, this.assets_);
    }

    handleContextLost_(event) {
        event.preventDefault();
        throw new WebglError('The rendering context was lost.');
    }

    getWebglContext_(canvas, attributes) {
        if (!(canvas instanceof HTMLCanvasElement)) {
            throw new WebglError('The canvas must be a HTMLCanvasElement.');
        }

        if (!window.WebGLRenderingContext) {
            throw new WebglError('Your browser does not support WebGL.');
        }

        let gl = canvas.getContext('webgl2', attributes);
        gl.getExtension("EXT_color_buffer_float");

        if (!gl) {
            throw new WebglError('Your browser does not support WebGL 2.');
        }

        canvas.addEventListener('webglcontextlost', this.handleContextLost);

        return gl;
    }

    getProps_(gl, dataset, options) {
        let props = {
            // Units that are reserved for use outside of this instance.
            reservedUnits: options.reservedUnits === undefined ? 0 : options.reservedUnits,
            // Total number of tiles.
            tiles: Math.ceil(dataset.depth / 4),
            // Number of valid channels of the last tile as the dataset depth may not be
            // divisible by 4.
            depthLastTile: dataset.depth % 4,
        };

        let maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);

        let maxTilesPerTexture = Math.floor(maxTextureSize / dataset.width) * Math.floor(maxTextureSize / dataset.height);

        // Use only as few units as possible, since switching between many units in the
        // fragment shader is slow.
        props.requiredUnits = Math.ceil(props.tiles / maxTilesPerTexture);
        let availableUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS) - props.reservedUnits;

        if (props.requiredUnits > availableUnits) {
            throw new WebglError(`Not enough memory available for this dataset. Required: ${props.requiredUnits} texture image units. Available: ${availableUnits} texture image units.`);
        }

        props.tilesPerTexture = Math.ceil(props.tiles / props.requiredUnits);

        if (dataset.width === 0 || dataset.height === 0 || props.tilesPerTexture === 0) {
            props.colsPerTexture = 0;
            props.rowsPerTexture = 0;
        } else {
            // Lay out the tiles as an approximate square in the texture.
            // Explanation: Compute the total area of all tiles. The square root is the
            // edge length of the perfect square that has the total area. Then divide by
            // the width to get the number of tiles that can be put in a row and have
            // approximately the same width than the perfect square.
            props.colsPerTexture = Math.ceil(Math.sqrt(dataset.width * dataset.height * props.tilesPerTexture) / dataset.width);
            props.rowsPerTexture = Math.ceil(props.tilesPerTexture / props.colsPerTexture);
        }

        return props;
    }

    prepareWebgl_(gl, assets) {
        // We only draw a simple rectangular canvas that consists of two triangles.
        let buffer = this.getBuffer('textureCoordinateBuffer');
        let array = new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]);
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, array, gl.STATIC_DRAW);

        buffer = this.getBuffer('vertexCoordinateBuffer');
        array = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, array, gl.STATIC_DRAW);
    }

    forTextureWithNumber_(number, callback) {
        let index = number + this.props_.reservedUnits;
        let name = `${TEXTURE_PREFIX}${index}`;
        callback(name, index, number);
    }

    forEachTexture_(callback) {
        let number = this.props_.requiredUnits;

        while (number-- > 0) {
            this.forTextureWithNumber_(number, callback);
        }
    }

    compileSamplerDefinition_() {
        let output = '';

        this.forEachTexture_(function (name) {
            output += `uniform sampler2D ${name};\n`;
        });

        return output;
    }

    compileSamplerQueries_() {
        let output = '';

        this.forEachTexture_(function (name, index, absIndex) {
            output += `if (sampler_index == ${numberToFloatString(absIndex)}) {
                return texture(${name}, coords_2d);
            }
            `;
        });

        return output;
    }

    compileDynamicSamplerQueries_(code) {
        if (!code) {
            return '';
        }

        let output = '';

        this.forEachTexture_(function (name, index, absIndex) {
            output += `if (sampler_index == ${numberToFloatString(absIndex)}) {
                ${code.replace(/<%=SAMPLER=%>/g, name)}
            }
            `;
        });

        return output;
    }

    compileTexture3dFunction_(props) {
        let output = "\n";

        let columns = numberToFloatString(props.colsPerTexture);
        let tilesPerTexture = numberToFloatString(props.tilesPerTexture);
        let tileWidth = numberToFloatString(1 / props.colsPerTexture);
        let tileHeight = numberToFloatString(1 / props.rowsPerTexture);

        output += this.compileSamplerDefinition_();
        output += `
        vec4 texture3D(vec2 position, float tileIdx) {
            float index_on_sampler = mod(tileIdx, ${tilesPerTexture});
            float column = mod(index_on_sampler, ${columns});
            float row = floor(index_on_sampler / ${columns});
            vec2 coords_2d = vec2(
                ${tileWidth} * (column + position.x),
                ${tileHeight} * (row + position.y)
            );

            float sampler_index = floor(tileIdx / ${tilesPerTexture});
        `;

        output += this.compileSamplerQueries_();
        output += `
            return vec4(0);
        }
        `;

        return output;
    }

    compileFragmentShader_(source, props) {
        // Normalize linebreaks (e.g. for Windows).
        source = source.replace(/\r\n/g, "\n");

        source = source.replace(/<%=TILES=%>/g, props.tiles);
        source = source.replace(/<%=CHANNELS_LAST_TILE=%>/g, props.depthLastTile);
        source = source.replace(/<%=TILE_COLUMNS=%>/g, numberToFloatString(props.colsPerTexture));
        source = source.replace(/<%=TILES_PER_TEXTURE=%>/g, numberToFloatString(props.tilesPerTexture));
        source = source.replace(/<%=TILE_WIDTH=%>/g, numberToFloatString(1 / props.colsPerTexture));
        source = source.replace(/<%=TILE_HEIGHT=%>/g, numberToFloatString(1 / props.rowsPerTexture));

        source = source.replace(/<%=TEXTURE_3D=%>/, this.compileTexture3dFunction_(props));
        source = source.replace(/<%=SAMPLER_DEFINITION=%>/, this.compileSamplerDefinition_());
        source = source.replace(/<%=SAMPLER_QUERIES=%>/, this.compileSamplerQueries_());

        let dynamicSamplerQueryRegexp = /<%=DYNAMIC_SAMPLER_QUERIES([\s\S]*)\n\s*=%>\n/;
        let code = dynamicSamplerQueryRegexp.exec(source);
        if (code && code.length > 1) {
            source = source.replace(dynamicSamplerQueryRegexp, this.compileDynamicSamplerQueries_(code[1]))
        }

        return source;
    }

    compileShader_(gl, shader, source) {
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS) || gl.isContextLost()) {
            throw new WebglError(gl.getShaderInfoLog(shader));
        }

        return shader;
    }

    createVertexShader_(gl, source) {
        return this.compileShader_(gl, gl.createShader(gl.VERTEX_SHADER), source);
    }

    createFragmentShader_(gl, source, props) {
        source = this.compileFragmentShader_(source, props);

        return this.compileShader_(gl, gl.createShader(gl.FRAGMENT_SHADER), source);
    }

    createShaderProgram_(gl, vertexShader, fragmentShader) {
        let program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS) || gl.isContextLost()) {
            throw new WebglError(gl.getProgramInfoLog(program));
        }

        return program;
    }

    addTexture_(gl, id) {
        let texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);

        // Set the parameters so images that are NPOT (not power of two) can be
        // rendered, too. Do this every time anew because external shader setUp methods
        // may change this.
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        // Disable texture filtering.
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        return texture;
    }

    useTextures_(gl, program) {
        if (!(program instanceof WebGLProgram)) {
            throw new WebglError('The program must be a WebGLProgram');
        }

        this.forEachTexture_(function (name, index) {
            let texture = gl.getUniformLocation(program, name);
            gl.uniform1i(texture, index);
        });
    }

    usePositions_(gl, program, name, buffer) {
        if (!(program instanceof WebGLProgram)) {
            throw new WebglError('The program must be a WebGLProgram');
        }

        let location = gl.getAttribLocation(program, name);
        gl.enableVertexAttribArray(location);
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0);
    }

    bindTextures_(gl) {
        this.forEachTexture_((name, index) => {
            gl.activeTexture(gl.TEXTURE0 + index);
            gl.bindTexture(gl.TEXTURE_2D, this.getTexture(name));
        });
    }

    renderSync_(gl, programs) {
        programs.forEach((program) => {
            gl.useProgram(program.getPointer());
            // let date = Date.now();
            program.beforeRender(gl, this);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            program.afterRender(gl, this);
            // console.log(program.constructor.name, Date.now() - date);
        });
    }

    initializeTexture_(gl, texture, dataset, props) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        let width = props.colsPerTexture * dataset.width;
        let height = props.rowsPerTexture * dataset.height;
        let format;
        let type;
        let emptyArray;

        if (dataset.precision === 8) {
            format = gl.RGBA;
            type = gl.UNSIGNED_BYTE;
            emptyArray = new Uint8Array(width * height * 4);
        } else if (dataset.precision === 16) {
            format = gl.RGBA16F;
            type = gl.HALF_FLOAT;
            emptyArray = new Float32Array(width * height * 4);
        } else {
            format = gl.RGBA32F;
            type = gl.FLOAT;
            emptyArray = new Float32Array(width * height * 4);
        }

        gl.texImage2D(gl.TEXTURE_2D, 0, format, width, height, 0, gl.RGBA, type, emptyArray);
    }

    storeTileSubImage_(gl, dataset, x, y, width, height, tile) {
        let type;

        if (dataset.precision === 8) {
            type = gl.UNSIGNED_BYTE;
        } else if (dataset.precision === 16) {
            type = gl.HALF_FLOAT;
        } else {
            type = gl.FLOAT;
        }

        gl.texSubImage2D(gl.TEXTURE_2D, 0, x, y, width, height, gl.RGBA, type, tile);
    }

    storeTile_(gl, tile, index, dataset, props) {
        if (dataset.precision === 8 && !(tile instanceof Uint8Array)) {
            throw new WebglError('Each tile image must be a Uint8Array.');
        } else if (dataset.precision !== 8 && !(tile instanceof Float32Array)) {
            throw new WebglError('Each tile image must be a Float32Array.');
        }

        let textureNumber = Math.floor(index / props.tilesPerTexture);
        if (textureNumber > props.requiredUnits) {
            throw new WebglError('Invalid tile index.');
        }

        let indexOnTexture = index % props.tilesPerTexture;

        this.forTextureWithNumber_(textureNumber, (name) => {
            let texture = this.getTexture(name);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, texture);

            if (!this.initializedTextures_[textureNumber]) {
                this.initializeTexture_(gl, texture, dataset, props);
                this.initializedTextures_[textureNumber] = true;
            }

            this.storeTileSubImage_(
                gl,
                dataset,
                (indexOnTexture % props.colsPerTexture) * dataset.width,
                Math.floor(indexOnTexture / props.colsPerTexture) * dataset.height,
                dataset.width,
                dataset.height,
                tile
            );
        });
    }

    destruct_(gl, assets, programs, canvas) {
        Object.keys(assets.buffers).forEach(function (key) {
            gl.deleteBuffer(assets.buffers[key]);
        });

        Object.keys(assets.framebuffers).forEach(function (key) {
            gl.deleteFramebuffer(assets.framebuffers[key]);
        });

        Object.keys(assets.textures).forEach(function (key) {
            gl.deleteTexture(assets.textures[key]);
        });

        programs.forEach(function (program) {
            let shaders = gl.getAttachedShaders(program.getPointer());
            shaders.forEach(function (shader) {
                gl.deleteShader(shader);
            });
            gl.deleteProgram(program.getPointer());
        });

        canvas.removeEventListener('webglcontextlost', this.handleContextLost);
    }

    createFramebuffer_(gl) {
        return gl.createFramebuffer();
    }

    getFramebuffer(id) {
        if (!this.assets_.framebuffers[id]) {
            this.assets_.framebuffers[id] = this.createFramebuffer_(this.gl_);
        }

        return this.assets_.framebuffers[id];
    }

    createBuffer_(gl) {
        return gl.createBuffer();
    }

    getBuffer(id) {
        if (!this.assets_.buffers[id]) {
            this.assets_.buffers[id] = this.createBuffer_(this.gl_);
        }

        return this.assets_.buffers[id];
    }

    getTexture(id) {
        id = `${id}`;
        if (!this.assets_.textures[id]) {
            this.assets_.textures[id] = this.addTexture_(this.gl_, id);
        }

        return this.assets_.textures[id];
    }

    useTextures(program) {
        this.useTextures_(this.gl_, program.getPointer());
    }

    useVertexPositions(program) {
        this.usePositions_(this.gl_, program.getPointer(), 'a_vertex_position', this.getBuffer('vertexCoordinateBuffer'));
    }

    useTexturePositions(program) {
        this.usePositions_(this.gl_, program.getPointer(), 'a_texture_position', this.getBuffer('textureCoordinateBuffer'));
    }

    bindTextures() {
        this.bindTextures_(this.gl_);
    }

    addProgram_(gl, program) {
        if (!(program instanceof Program)) {
            throw new WebglError('A program must be a Program');
        }

        try {
            let vertexShader = this.createVertexShader_(gl, program.getVertexShaderSource());
            let fragmentShader = this.createFragmentShader_(gl, program.getFragmentShaderSource(), this.props_);
            var programPointer = this.createShaderProgram_(gl, vertexShader, fragmentShader);
        } catch (e) {
            throw new WebglError(`Error compiling program ${program.constructor.name}. ${e}`);
        }

        gl.useProgram(programPointer);
        program.setPointer(programPointer);
        program.initialize(gl, this);
        gl.useProgram(null);

        return program;
    }

    addProgram(program) {
        this.programs_.push(this.addProgram_(this.gl_, program));
    }

    storeTile(tile, index) {
        if (this.tilesToStore_[index] === undefined) {
            throw new WebglError(`Unexpected tile index ${index}.`);
        }

        this.storeTile_(this.gl_, tile, index, this.dataset_, this.props_);
        delete this.tilesToStore_[index];
    }

    renderSync(programs) {
        let remainingTiles = Object.keys(this.tilesToStore_).length;
        if (remainingTiles > 0) {
            throw new WebglError(`The tiles must be stored first (${remainingTiles} remaining).`);
        }

        this.renderSync_(this.gl_, programs || []);
    }

    render(programs) {
        let programsHash = (programs || []).map(function (program) {
                return program.constructor.name;
            })
            .join('-');

        if (!this.renderPromises_[programsHash]) {
            this.renderPromises_[programsHash] = new Promise((resolve, reject) => {
                window.requestAnimationFrame(() => {
                    this.renderSync(programs);
                    this.renderPromises_[programsHash] = null;
                    resolve();
                });
            });
        }

        return this.renderPromises_[programsHash];
    }

    destruct() {
        this.destruct_(this.gl_, this.assets_, this.programs_, this.canvas_);
    }

    getCanvas() {
        return this.canvas_;
    }

    getGl() {
        return this.gl_;
    }
}
