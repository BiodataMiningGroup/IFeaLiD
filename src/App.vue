<template>
<div id="show-container" class="show-container">
    <nav class="navbar navbar-dark bg-dark">
        <a class="navbar-brand" href="#">
            <img src="/logo.svg" width="30" height="30" class="d-inline-block align-top" alt=""> IFeaLiD
        </a>
        <span v-show="initialized" class="navbar-text text-light font-weight-bold">
            {{dataset.name}} <small>{{dataset.width}}&times;{{dataset.height}}&times;{{dataset.features}} @ {{dataset.precision}}bit</small>
        </span>
        <span></span>
    </nav>
    <div class="main">
        <div class="main-content">
            <visualization
                ref="visualization"
                v-bind:dataset="dataset"
                v-on:hover="updateHoverPixelVector"
                v-on:select="updateSelectPixelVector"
            ></visualization>
        </div>
        <div class="main-aside">
            <pixel-vector-display
                ref="pixelVectorDisplay"
                v-bind:dataset="dataset"
                v-on:hover="updateHoveredFeature"
            ></pixel-vector-display>
        </div>
    </div>
    <input type="file" name="file" accept="application/zip" ref="fileInput" @change="selectFile">
</div>
</template>

<script>
import WebglHandler from './webgl/Handler';
import Visualization from './components/Visualization.vue';
import PixelVectorDisplay from './components/PixelVectorDisplay.vue';
import {ZipReader, BlobReader, TextWriter} from "@zip.js/zip.js";

export default {
    components: {
        Visualization,
        PixelVectorDisplay,
    },
    data() {
        return {
            dataset: {},
            initialized: false,
        };
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
        async selectFile(e) {
            let selectedFile = e.target.files[0];
            let reader = new ZipReader(new BlobReader(selectedFile));
            let entries = await reader.getEntries();
            let entryMap = {};
            entries.forEach(e => entryMap[e.filename] = e);
            let metaEntry = entryMap['metadata.json'];
            delete entryMap['metadata.json'];
            let meta = await metaEntry.getData(new TextWriter());
            this.dataset = JSON.parse(meta);

            if (this.dataset.overlay && entryMap['overlay.jpg']) {
                this.dataset.overlayEntry = entryMap['overlay.jpg'];
                delete entryMap['overlay.jpg'];
            }

            this.dataset.entries = entryMap;
            this.initialized = true;
        },
    },
    mouted() {
        this.$refs.fileInput.click();
    },
}
</script>

<style lang="scss" scoped>
.show-container {
    width: 100vw;
    height: 100vh;
    display: flex;
    flex-direction: column;
}

.navbar {
    border-bottom: 1px solid $gray-900;
}
.main {
    display: flex;
    flex: 1;
    overflow: hidden;
    position: relative;
}

.main-content {
    width: 100%;
    height: 100%;
    position: relative;
    flex: 1;
    background-image: url('/noise.png');
}

.main-aside {
    height: 100%;
    width: 200px;
    border-left: 1px solid $gray-900;
    position: relative;
    overflow: hidden;
    padding: 10px 0;
    box-sizing: border-box;
}
</style>
