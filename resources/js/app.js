require('./bootstrap');
import {mount} from './utils';
import WebglHandler from './webgl/Handler';
import visualization from './components/visualization';
import pixelVectorDisplay from './components/pixelVectorDisplay';
import {PNG} from 'pngjs/browser';

mount('show-container', new Vue({
    data: {
        dataset: window.DATASET,
    },
    components: {
        visualization, visualization,
        pixelVectorDisplay: pixelVectorDisplay,
    },
    methods: {
        updateHoverPixelVector(vector) {
            // Use a method instead of prop because the pixel vector array stays the
            // same object.
            this.$refs.pixelVectorDisplay.updatePixelVector(vector);
        },
        updateSelectPixelVector(vector) {
            // Use a method instead of prop because the pixel vector array stays the
            // same object.
            this.$refs.pixelVectorDisplay.updateReferencePixelVector(vector);
        },
        updateHoveredFeature(feature) {
            this.$refs.visualization.showFeature(feature);
        },
    },
    created() {
        //
    },
    mounted() {
        //
    },
}));

// new PNG().parse('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGPg2T3JDgADyAGYmiSbAQAAAABJRU5ErkJggg==', function (err, png) {
//     console.log(err, png);
// });
