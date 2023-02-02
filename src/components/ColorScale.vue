<template>
<div class="color-scale">
    <div class="fill-top" :style="fillTopStyle"></div>
    <canvas ref="canvas" :style="canvasStyle"></canvas>
    <div class="fill-bottom" :style="fillBottomStyle"></div>
</div>
</template>

<script>
import {FIRE} from '../webgl/programs/colorMaps';

export default {
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
                display: 'block',
            };
        },
        canvasStyle() {
            let height = this.absoluteHeight * (this.maxIntensity - this.minIntensity);

            return `height: ${height}px`;
        },
        fillBottomStyle() {
            let height = this.absoluteHeight * this.minIntensity;

            if (height === 0) {
                return 'display: none;';
            }

            return {
                'background-color': this.getColorScaleColor(0),
                'border-top-color': this.getColorScaleColor(255),
                height: `${height}px`,
                display: 'block',
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
</script>

<style lang="scss" scoped>
.color-scale {
    width: 20px;
    height: 256px;
    padding: 1px;
    background-color: $dark;
    border-radius: 2px;
    position: relative;
    border: 1px solid $gray-900;
    display: flex;
    flex-direction: column;

    canvas {
        width: 100%;
        height: 100%;
    }

    .fill-top {
        border-bottom: 1px dotted;
        box-sizing: border-box;
    }

    .fill-bottom {
        border-top: 1px dotted;
        box-sizing: border-box;
    }
}

</style>
