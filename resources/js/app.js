require('./bootstrap');
import {mount} from './utils';
import visualization from './components/visualization';

mount('show-container', new Vue({
  data: {
    dataset: window.DATASET,
  },
  components: {
    visualization, visualization,
  },
  created: function () {
    //
  },
}));
