import {Map, View} from 'ol';
import ImageLayer from 'ol/layer/Image';
import VectorLayer from 'ol/layer/Vector';
import CanvasSource from '../ol/source/Canvas';
import ImageSource from 'ol/source/ImageStatic';
import VectorSource from 'ol/source/Vector';
import Projection from 'ol/proj/Projection';
import {containsCoordinate} from 'ol/extent';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import CircleStyle from 'ol/style/Circle';
import FillStyle from 'ol/style/Fill';
import Style from 'ol/style/Style';
import WebglHandler from '../webgl/Handler';
import SimilarityProgram from '../webgl/programs/Similarity';
import StretchIntensityProgram from '../webgl/programs/StretchIntensity';
import ColorMapProgram from '../webgl/programs/ColorMap';
import PixelVectorProgram from '../webgl/programs/PixelVector';
import SingleFeatureProgram from '../webgl/programs/SingleFeature';
import loadingIndicator from './loadingIndicator';
import colorScale from './colorScale';
import ImageHandler from '../ImageHandler';

export default {
    template: `
        <div class="visualization" ref="map">
            <div v-if="!ready" class="loading-overlay">
                <loading-indicator :size="120" :progress="loaded"></loading-indicator>
            </div>
            <color-scale v-show="ready" ref="colorScale"></color-scale>
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
            let imageHandler = new ImageHandler(this.dataset);
            let parallel = 3;
            let tilesLoaded = 0;

            let promises = imageHandler.load(parallel).map((promise) => {
                return promise.then((args) => {
                        this.handler.storeTile(...args);
                    })
                    .then(() => {
                        tilesLoaded += 1
                        this.loaded = tilesLoaded / promises.length;
                    });
            });

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
                precision: this.dataset.precision,
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

            this.markerFeature = new Feature(new Point([0, 0]));
            this.markerLayer = new VectorLayer({
                visible: false,
                source: new VectorSource({features: [this.markerFeature]}),
                style: [
                    new Style({
                        image: new CircleStyle({
                            radius: 7,
                            fill: new FillStyle({color: 'white'}),
                        }),
                    }),
                    new Style({
                        image: new CircleStyle({
                            radius: 4,
                            fill: new FillStyle({color: '#fc6600'}),
                        }),
                    }),
                ],
            });

            this.map = new Map({
                target: this.$refs.map,
                layers: [this.imageLayer, this.markerLayer],
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
            this.singleFeatureProgram = new SingleFeatureProgram(this.dataset);
            this.handler.addProgram(this.similarityProgram);
            this.handler.addProgram(this.stretchIntensityProgram);
            this.handler.addProgram(this.colorMapProgram);
            this.handler.addProgram(this.pixelVectorProgram);
            this.handler.addProgram(this.singleFeatureProgram);

            this.stretchIntensityProgram.link(this.similarityProgram);
            this.colorMapProgram.link(this.stretchIntensityProgram);
        },
        renderSimilarity() {
            this.handler.render([
                    this.similarityProgram,
                    this.stretchIntensityProgram,
                    this.colorMapProgram,
                ])
                .then(this.map.render.bind(this.map))
                .then(this.updateSimilarityColorScale);
        },
        renderPixelVector() {
            return this.handler.render([this.pixelVectorProgram]);
        },
        renderSingleFeature() {
            this.handler.render([
                    this.singleFeatureProgram,
                    this.stretchIntensityProgram,
                    this.colorMapProgram,
                ])
                .then(this.map.render.bind(this.map))
                .then(this.updateFeatureColorScale);
        },
        emitHover() {
            this.$emit('hover', this.pixelVectorProgram.getPixelVector());
        },
        emitSelect() {
            this.$emit('select', this.pixelVectorProgram.getPixelVector().slice());
        },
        emitUnselect() {
            this.$emit('select', []);
        },
        updateFeatureColorScale() {
            this.$refs.colorScale.updateStretching(this.singleFeatureProgram.getIntensityStats());
        },
        updateSimilarityColorScale() {
            this.$refs.colorScale.updateStretching(this.similarityProgram.getIntensityStats());
        },
        updateMousePosition(event) {
            if (containsCoordinate(this.extent, event.coordinate)) {
                let oldPosition = this.similarityProgram.getMousePosition();
                let newPosition = event.coordinate.map(Math.floor);
                this.similarityProgram.setMousePosition(newPosition);
                this.pixelVectorProgram.setMousePosition(newPosition);
                if (oldPosition[0] !== newPosition[0] || oldPosition[1] !== newPosition[1]) {
                    this.renderSimilarity();
                    this.renderPixelVector().then(this.emitHover);
                }
            }
        },
        updateMarkerPosition(event) {
            if (containsCoordinate(this.extent, event.coordinate)) {
                if (this.map.hasFeatureAtPixel(event.pixel)) {
                    this.markerLayer.setVisible(false);
                    this.emitUnselect();
                } else {
                    this.markerLayer.setVisible(true);
                    this.markerFeature.getGeometry().setCoordinates(event.coordinate);
                    let oldPosition = this.pixelVectorProgram.getMousePosition();
                    let newPosition = event.coordinate.map(Math.floor);
                    this.pixelVectorProgram.setMousePosition(newPosition);
                    if (oldPosition[0] !== newPosition[0] || oldPosition[1] !== newPosition[1]) {
                        this.renderPixelVector().then(this.emitSelect);
                    }
                }
            }
        },
        setReady() {
            this.ready = true;
        },
        showFeature(index) {
            if (this.ready) {
                if (index === null) {
                    this.stretchIntensityProgram.link(this.similarityProgram);
                    this.renderSimilarity();
                } else {
                    this.singleFeatureProgram.setFeatureIndex(index);
                    this.stretchIntensityProgram.link(this.singleFeatureProgram);
                    this.renderSingleFeature();
                }
            }
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
            .then(this.renderSimilarity)
            .then(this.setReady)
            .then(() => {
                this.map.on('pointermove', this.updateMousePosition);
                this.map.on('click', this.updateMarkerPosition);
            })
            .catch(function (error) {
                console.error(error);
            });
    },
};
