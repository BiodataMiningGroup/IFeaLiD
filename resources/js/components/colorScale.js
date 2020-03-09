import {FIRE} from '../webgl/programs/colorMaps';

export default {
    template: `
        <div class="color-scale">
            <div class="fill-top" :style="fillTopStyle"></div>
            <canvas ref="canvas" :style="canvasStyle"></canvas>
            <div class="fill-bottom" :style="fillBottomStyle"></div>
        </div>
    `,
    props: {
        //
    },
    components: {
        //
    },
    data () {
        return {
            absoluteHeight: 256,
            minIntensity: 0,
            maxIntensity: 1,
        };
    },
    computed: {
        fillTopStyle() {
            let height = this.absoluteHeight * (1 - this.maxIntensity);

            if (height === 0) {
                return 'display: none;';
            }

            return {
                'background-color': this.getColorScaleColor(255),
                'border-bottom-color': this.getColorScaleColor(0),
                height: `${height}px`,
            };
        },
        canvasStyle() {
            let height = this.absoluteHeight * (this.maxIntensity - this.minIntensity);

            return `height: ${height}px`;
        },
        fillBottomStyle() {
            let height = this.absoluteHeight * this.minIntensity;

            if (this.height === 0) {
                return 'display: none;';
            }

            return {
                'background-color': this.getColorScaleColor(0),
                'border-top-color': this.getColorScaleColor(255),
                height: `${height}px`,
            };
        },
    },
    methods: {
        getColorScaleColor(i) {
            return `rgb(${FIRE[i * 3]}, ${FIRE[i * 3 + 1]}, ${FIRE[i * 3 + 2]})`;
        },
        updateCanvas() {
            let width = this.canvas.width;
            let height = this.canvas.height;

            for (let i = 0; i < height; i++) {
                this.ctx.fillStyle = this.getColorScaleColor(i);
                this.ctx.fillRect(0, height - i, width, 1);
            }
        },
        updateStretching(stats) {
            this.minIntensity = stats.min;
            this.maxIntensity = stats.max;
        },
    },
    watch: {
        //
    },
    created() {
        //
    },
    mounted() {
        this.canvas = this.$refs.canvas;
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 1;
        this.canvas.height = this.absoluteHeight;
        this.updateCanvas();
    },
};
