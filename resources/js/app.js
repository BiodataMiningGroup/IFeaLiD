require('./bootstrap');
import {mount} from './utils';
import WebglHandler from './webgl/Handler';
import visualization from './components/visualization';
import intensityList from './components/intensityList';

mount('show-container', new Vue({
    data: {
        dataset: window.DATASET,
    },
    components: {
        visualization, visualization,
        intensityList: intensityList,
    },
    methods: {
        updatePixelVector(vector) {
            // Use a method instead of prop because the pixel vector array stays the
            // same object.
            this.$refs.intensityList.updatePixelVector(vector);
        },
    },
    created() {
        //
    },
    mounted() {
        //
    },
}));
