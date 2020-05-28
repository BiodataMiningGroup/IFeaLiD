import {listen, unlistenByKey} from 'ol/events';
import PointerEventType from 'ol/pointer/EventType';
import {ObjectEvent} from 'ol/Object';
import ZoomSlider from 'ol/control/ZoomSlider';

const Direction = {
    VERTICAL: 0,
    HORIZONTAL: 1,
};

function render(mapEvent) {
    if (!mapEvent.frameState) {
       return;
    }

    if (!this.sliderInitialized_) {
        this.initSlider_();
        this.setThumbPosition_();
    }
}

export default class OpacitySlider extends ZoomSlider {
    constructor(opt_options) {
        const options = opt_options ? opt_options : {};
        options.render = render;

        super(opt_options);
        const opacity = options.opacity === undefined ? 1 : options.opacity;
        this.setProperties({opacity}, true);
        this.element.title = 'Adjust heatmap opacity';
    }

    handleContainerClick_(event) {
        const position = this.getRelativePosition_(
            event.offsetX - this.thumbSize_[0] / 2,
            event.offsetY - this.thumbSize_[1] / 2);
        this.set('opacity', position);
        this.setThumbPosition_();
    }

    handleDraggerStart_(event) {
        if (!this.dragging_ && event.target === this.element.firstElementChild) {
            const element = this.element.firstElementChild;
            this.startX_ = event.clientX - parseFloat(element.style.left || 0);
            this.startY_ = event.clientY - parseFloat(element.style.top || 0);
            this.dragging_ = true;

            if (this.dragListenerKeys_.length === 0) {
                const drag = this.handleDraggerDrag_;
                const end = this.handleDraggerEnd_;
                this.dragListenerKeys_.push(
                    listen(document, PointerEventType.POINTERMOVE, drag, this),
                    listen(document, PointerEventType.POINTERUP, end, this)
                );
            }
        }
    }

    handleDraggerDrag_(event) {
        if (this.dragging_) {
            const deltaX = event.clientX - this.startX_;
            const deltaY = event.clientY - this.startY_;
            const position = this.getRelativePosition_(deltaX, deltaY);
            this.set('opacity', position);
            this.setThumbPosition_();
        }
    }

    handleDraggerEnd_(event) {
        if (this.dragging_) {
            this.dragging_ = false;
            this.startX_ = undefined;
            this.startY_ = undefined;
            this.dragListenerKeys_.forEach(unlistenByKey);
            this.dragListenerKeys_.length = 0;
        }
    }

    setThumbPosition_() {
        const position = this.get('opacity');
        const thumb = this.element.firstElementChild;

        if (this.direction_ == Direction.HORIZONTAL) {
            thumb.style.left = this.widthLimit_ * position + 'px';
        } else {
            thumb.style.top = this.heightLimit_ * position + 'px';
        }
    }
}
