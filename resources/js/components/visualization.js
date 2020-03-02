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

export default {
    template: `
        <div class="visualization" ref="map">

        </div>
    `,
    props: {
        handler: {
            required: true,
            type: WebglHandler,
        },
        dataset: {
            required: true,
            type: Object,
        },
    },
    components: {
        //
    },
    data () {
        return {
            //
        };
    },
    computed: {
        extent() {
            return [0, 0, this.dataset.width, this.dataset.height];
        },
    },
    methods: {
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

        initializeWebgl() {
            this.similarityProgram = new SimilarityProgram(this.dataset);
            this.stretchIntensityProgram = new StretchIntensityProgram(this.dataset);
            this.colorMapProgram = new ColorMapProgram();
            this.handler.addProgram(this.similarityProgram);
            this.handler.addProgram(this.stretchIntensityProgram);
            this.handler.addProgram(this.colorMapProgram);

            this.stretchIntensityProgram.link(this.similarityProgram);
            this.colorMapProgram.link(this.stretchIntensityProgram);


            this.handler.ready()
                .then(this.render)
                .then(() => {
                    this.map.on('pointermove', this.updateMousePosition);
                });
        },
        render() {
            this.handler.render([
                this.similarityProgram,
                this.stretchIntensityProgram,
                this.colorMapProgram,
            ]);
            this.map.render();
        },
        updateMousePosition(event) {
            if (containsCoordinate(this.extent, event.coordinate)) {
                this.similarityProgram.setMousePosition(event.coordinate);
                this.render();
            }
        },
    },
    created() {
        //
    },
    mounted() {
        this.initializeOpenLayers(this.handler.getCanvas());
        this.initializeWebgl();
    },
};
