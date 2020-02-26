import Image from 'ol/source/Image';
import ImageStatic from 'ol/source/ImageStatic';
import ImageCanvas from 'ol/ImageCanvas';
import {listen} from 'ol/events';
import EventType from 'ol/events/EventType';
import {intersects} from 'ol/extent';

export default class Canvas extends ImageStatic {
  constructor(options) {
    super(options);
    this.image_ = new ImageCanvas(options.imageExtent, 1, 1, options.canvas);
    this.image_.addEventListener(EventType.CHANGE, this.handleImageChange.bind(this));
  }
}
