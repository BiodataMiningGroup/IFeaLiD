import {Map, View} from 'ol';
import ImageLayer from 'ol/layer/Image';
import CanvasSource from '../ol/source/Canvas';
import ImageSource from 'ol/source/ImageStatic';
import Projection from 'ol/proj/Projection';
import {containsCoordinate} from 'ol/extent';
import WebglHandler from '../webgl/Handler';
import SimilarityProgram from '../webgl/programs/Similarity';
import StretchIntensityProgram from '../webgl/programs/StretchIntensity';
import ColorMapProgram from '../webgl/programs/ColorMap';
import PixelVectorProgram from '../webgl/programs/PixelVector';
import loadingIndicator from './loadingIndicator';
import colorScale from './colorScale';

export default {
    template: `
        <div class="visualization" ref="map">
            <div v-if="!ready" class="loading-overlay">
                <loading-indicator :size="120" :progress="loaded"></loading-indicator>
            </div>
            <color-scale ref="colorScale"></color-scale>
        </div>
    `,
    props: {
        dataset: {
            required: true,
            type: Object,
        },
    },
    components: {
        loadingIndicator: loadingIndicator,
        colorScale: colorScale,
    },
    data () {
        return {
            loaded: 0,
            ready: false,
        };
    },
    computed: {
        extent() {
            return [0, 0, this.dataset.width, this.dataset.height];
        },
    },
    methods: {
        fetchImages() {
            let count = Math.ceil(this.dataset.features / 4);
            let promises = [];
            let images = [];

            while (count--) {
                let image = new Image();
                promises.push(new Promise(function (resolve, reject) {
                    image.addEventListener('error', reject);
                    image.addEventListener('load', function () {
                        resolve(image);
                    });
                }))
                images.push(image);
            }

            let loadImage = () => {
                this.loaded = 1 - (images.length / promises.length);
                if (images.length > 0) {
                    let image = images.pop();
                    let index = images.length;
                    image.addEventListener('load', loadImage);
                    image.src = `${this.dataset.url}/${index}.png`;
                }
            };

            // Load images with multiple parallel connections.
            let parallel = 3;
            while (parallel--) {
                loadImage();
            }

            return Promise.all(promises);
        },
        initializeCanvas() {
            let canvas = document.createElement('canvas');
            canvas.width = this.dataset.width;
            canvas.height = this.dataset.height;

            return canvas;
        },
        initializeWebgl(canvas) {
            this.handler = new WebglHandler({
                canvas: canvas,
                width: this.dataset.width,
                height: this.dataset.height,
                depth: this.dataset.features,
                // Reserve units for the similarity, stretch intensity, color map and pixel vector textures.
                reservedUnits: 4,
            });

            window.addEventListener('beforeunload', this.handler.destruct.bind(this.handler));
        },
        initializeOpenLayers(canvas) {
            let projection = new Projection({
                code: 'image',
                units: 'pixels',
                extent: this.extent,
            });

            this.canvasSource = new CanvasSource({
                canvas: canvas,
                projection: projection,
                imageExtent: this.extent,
            });

            this.imageLayer = new ImageLayer({
                source: this.canvasSource,
                extent: this.extent,
            });

            // Prevent image smoothing.
            this.imageLayer.on('prerender', function (event) {
                event.context.imageSmoothingEnabled = false;
            });

            this.map = new Map({
                target: this.$refs.map,
                layers: [this.imageLayer],
                view: new View({
                    projection: projection,
                }),
            });


            this.map.getView().fit(this.extent, {
                padding: [10, 10, 10, 10],
            });
        },
        initializePrograms() {
            this.similarityProgram = new SimilarityProgram(this.dataset);
            this.stretchIntensityProgram = new StretchIntensityProgram(this.dataset);
            this.colorMapProgram = new ColorMapProgram();
            this.pixelVectorProgram = new PixelVectorProgram(this.dataset);
            this.handler.addProgram(this.similarityProgram);
            this.handler.addProgram(this.stretchIntensityProgram);
            this.handler.addProgram(this.colorMapProgram);
            this.handler.addProgram(this.pixelVectorProgram);

            this.stretchIntensityProgram.link(this.similarityProgram);
            this.colorMapProgram.link(this.stretchIntensityProgram);
        },
        render() {
            this.handler.render([
                    this.similarityProgram,
                    this.stretchIntensityProgram,
                    this.colorMapProgram,
                ])
                .then(this.map.render.bind(this.map))
                .then(this.updateColorScale);
        },
        emitPixelVector() {
            this.$emit('select', this.pixelVectorProgram.getPixelVector());
        },
        updateColorScale() {
            this.$refs.colorScale.updateStretching(this.similarityProgram.getIntensityStats());
        },
        updateMousePosition(event) {
            if (containsCoordinate(this.extent, event.coordinate)) {
                let oldPosition = this.similarityProgram.getMousePosition();
                let newPosition = event.coordinate.map(Math.floor);
                this.similarityProgram.setMousePosition(newPosition);
                if (oldPosition[0] !== newPosition[0] || oldPosition[1] !== newPosition[1]) {
                    this.render();
                }
            }

            this.updateMarkerPosition(event);
        },
        updateMarkerPosition(event) {
            if (containsCoordinate(this.extent, event.coordinate)) {
                let oldPosition = this.pixelVectorProgram.getMousePosition();
                let newPosition = event.coordinate.map(Math.floor);
                this.pixelVectorProgram.setMousePosition(newPosition);
                if (oldPosition[0] !== newPosition[0] || oldPosition[1] !== newPosition[1]) {
                    this.handler.render([this.pixelVectorProgram])
                        .then(this.emitPixelVector);
                }
            }
        },
        setReady() {
            this.ready = true;
        },
    },
    watch: {
        //
    },
    created() {
        //
    },
    mounted() {
        let canvas = this.initializeCanvas();
        this.initializeOpenLayers(canvas);
        this.initializeWebgl(canvas);
        this.initializePrograms();
        this.fetchImages()
            .then(this.handler.storeTiles.bind(this.handler))
            .then(this.render)
            .then(this.setReady)
            .then(() => {
                this.map.on('pointermove', this.updateMousePosition);
                this.map.on('click', this.updateMarkerPosition);
            });
    },
};
