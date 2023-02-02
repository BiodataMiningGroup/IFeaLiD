import Control from 'ol/control/Control';
import EventType from 'ol/events/EventType';
import {CLASS_CONTROL, CLASS_UNSELECTABLE} from 'ol/css';

export default class ColorButton extends Control {

  /**
   * @param {Options=} opt_options Options.
   */
  constructor(opt_options) {
    const options = opt_options ? opt_options : {};

    super({
      element: document.createElement('div'),
      target: options.target
    });

    const className = options.className !== undefined ? options.className : 'ol-grayscale-button';

    const label = options.label !== undefined ? options.label : 'C';
    const tipLabel = options.tipLabel !== undefined ? options.tipLabel : 'Show overlay image in color';
    const button = document.createElement('button');
    button.setAttribute('type', 'button');
    button.title = tipLabel;
    button.appendChild(
      typeof label === 'string' ? document.createTextNode(label) : label
    );

    button.addEventListener(EventType.CLICK, this.handleClick_.bind(this), false);

    const cssClasses = className + ' ' + CLASS_UNSELECTABLE + ' ' + CLASS_CONTROL;
    const element = this.element;
    element.className = cssClasses;
    element.appendChild(button);

    this.active = false;
  }

  /**
   * @param {MouseEvent} event The event to handle
   * @private
   */
  handleClick_(event) {
    event.preventDefault();
    if (this.active) {
        this.dispatchEvent('showgrayscale');
        this.active = false;
        this.element.classList.remove('active');
    } else {
        this.dispatchEvent('showcolor');
        this.active = true;
        this.element.classList.add('active');
    }
  }
}
