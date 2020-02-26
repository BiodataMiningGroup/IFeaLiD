import {Map, View} from 'ol';
import ImageLayer from 'ol/layer/Image';
import CanvasSource from '../ol/source/Canvas';
import ImageSource from 'ol/source/ImageStatic';
import Projection from 'ol/proj/Projection';
import WebglHandler from '../webgl/Handler';

export default {
    template: `
        <div class="visualization" ref="map"></div>
    `,
    props: {
        dataset: {
            required: true,
            type: Object,
        },
    },
    computed: {
        extent: function () {
            return [0, 0, this.dataset.width, this.dataset.height];
        },
    },
    methods: {
        initializeCanvas: function () {
            this.canvas = document.createElement('canvas');
            this.canvas.width = this.dataset.width;
            this.canvas.height = this.dataset.height;
        },
        initializeOpenLayers: function () {

            let projection = new Projection({
                code: 'image',
                units: 'pixels',
                extent: this.extent,
            });

            this.canvasSource = new CanvasSource({
                canvas: this.canvas,
                projection: projection,
                imageExtent: this.extent,
            });

            this.imageLayer = new ImageLayer({
                source: this.canvasSource,
                extent: this.extent,
            });

            this.map = new Map({
                target: this.$refs.map,
                layers: [this.imageLayer],
                view: new View({
                    center: [0, 0],
                    zoom: 0,
                    projection: projection,
                }),
            });

            this.map.getView().fit(this.extent, {
                padding: [10, 10, 10, 10],
            });
        },
        initializeWebgl: function () {
            this.handler = new WebglHandler({
                canvas: this.canvas,
                width: this.dataset.width,
                height: this.dataset.height,
                depth: this.dataset.features,
                reservedUnits: 0,
            });

            console.log(this.handler);
        },
    },
    created: function () {
        //
    },
    mounted: function () {
        this.initializeCanvas();
        this.initializeOpenLayers();
        this.initializeWebgl();
    },
};
