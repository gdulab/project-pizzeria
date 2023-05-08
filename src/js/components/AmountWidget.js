import { settings, select } from '../settings.js';


class AmountWidget {
  constructor(element, defaultValue = settings.amountWidget.defaultValue) {
    const thisWidget = this;
    thisWidget.getElements(element);
    thisWidget.setValue(defaultValue);
    thisWidget.initActions();
  }

  getElements(element) {
    const thisWidget = this;

    thisWidget.element = element;
    thisWidget.input = thisWidget.element.querySelector(select.widgets.amount.input);
    thisWidget.linkDecrease = thisWidget.element.querySelector(select.widgets.amount.linkDecrease);
    thisWidget.linkIncrease = thisWidget.element.querySelector(select.widgets.amount.linkIncrease);
  }

  setValue(value) {
    const thisWidget = this;

    const newValue = parseInt(value);

    if (newValue !== thisWidget.value && newValue != null && newValue >= settings.amountWidget.defaultMin && newValue <= settings.amountWidget.defaultMax) {
      thisWidget.value = newValue;
      this.announce();
    }
    thisWidget.input.value = thisWidget.value;
  }

  initActions() {
    const thisWidget = this;
    thisWidget.input.addEventListener('change', function () {
      thisWidget.setValue(thisWidget.input.value);
    });

    thisWidget.linkIncrease.addEventListener('click', function () {
      thisWidget.setValue(parseInt(thisWidget.input.value) + 1);
    });

    thisWidget.linkDecrease.addEventListener('click', function () {
      thisWidget.setValue(parseInt(thisWidget.input.value) - 1);
    });

  }

  announce() {
    const thisWidget = this;
    const event = new Event('updated', {
      bubbles: true
    });
    thisWidget.element.dispatchEvent(event);
  }

}

export default AmountWidget;