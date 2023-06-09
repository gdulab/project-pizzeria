import { select, templates, settings, classNames } from '../settings.js';
import { utils } from '../utils.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';


class Booking {
  constructor(element) {
    const thisBooking = this;

    thisBooking.activeTable = '';

    thisBooking.render(element);
    thisBooking.initWidgets();
    thisBooking.getData();
  }

  getData() {
    const thisBooking = this;

    const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePickerWidget.minDate);
    const endDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePickerWidget.maxDate);
    const params = {
      booking: [
        startDateParam,
        endDateParam,
      ],
      eventsCurrent: [
        settings.db.notRepeatParam,
        startDateParam,
        endDateParam,
      ],
      eventsRepeat: [
        settings.db.repeatParam,
        endDateParam,
      ],
    };

    // console.log('getData params', params);

    const urls = {
      booking:
                settings.db.url + '/' +
                settings.db.booking + '?' +
                params.booking.join('&'),
      eventsCurrent:
                settings.db.url + '/' +
                settings.db.event + '?' +
                params.eventsCurrent.join('&'),
      eventsRepeat:
                settings.db.url + '/' +
                settings.db.event + '?' +
                params.eventsRepeat.join('&'),
    };

    // console.log('getData urls', urls);

    Promise.all([
      fetch(urls.booking),
      fetch(urls.eventsCurrent),
      fetch(urls.eventsRepeat),
    ])
      .then(function (allResponses) {
        const bookingsResponse = allResponses[0];
        const eventsCurrentResponse = allResponses[1];
        const eventsRepeatResponse = allResponses[2];
        return Promise.all([
          bookingsResponse.json(),
          eventsCurrentResponse.json(),
          eventsRepeatResponse.json(),
        ]);
      })
      .then(function ([bookings, eventsCurrent, eventsRepeat]) {
        // console.log(bookings);
        // console.log(eventsCurrent);
        // console.log(eventsRepeat);
        thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
      });

  }

  parseData(bookings, eventsCurrent, eventsRepeat) {
    const thisBooking = this;

    thisBooking.booked = {};

    for (let item of eventsCurrent) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    for (let item of bookings) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    const minDate = thisBooking.datePickerWidget.minDate;
    const maxDate = thisBooking.datePickerWidget.maxDate;

    for (let item of eventsRepeat) {
      if (item.repeat === 'daily') {
        for (let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)) {
          thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
        }
      }
    }

    // console.log('thisbooking.booked', thisBooking.booked);

    thisBooking.updateDOM();
  }

  makeBooked(date, hour, duration, table) {
    const thisBooking = this;

    if (typeof thisBooking.booked[date] == 'undefined') {
      thisBooking.booked[date] = {};
    }

    const startHour = utils.hourToNumber(hour);

    for (let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5) {
      // console.log('loop', hourBlock);
      if (typeof thisBooking.booked[date][hourBlock] == 'undefined') {
        thisBooking.booked[date][hourBlock] = [];
      }

      thisBooking.booked[date][hourBlock].push(table);

    }
  }

  resetSelectTable() {
    const thisBooking = this;

    for (let table of thisBooking.dom.tables) {
      table.classList.remove('selected');
      thisBooking.activeTable = '';
    }
  }

  updateDOM() {
    const thisBooking = this;

    thisBooking.date = thisBooking.datePickerWidget.value;
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPickerWidget.value);

    let allAvailable = false;

    if (
      typeof thisBooking.booked[thisBooking.date] == 'undefined'
            ||
            typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined'
    ) {
      allAvailable = true;
    }

    for (let table of thisBooking.dom.tables) {
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);
      if (!isNaN(tableId)) {
        tableId = parseInt(tableId);
      }

      if (
        !allAvailable
                &&
                thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)
      ) {
        table.classList.add(classNames.booking.tableBooked);
      } else {
        table.classList.remove(classNames.booking.tableBooked);
      }
    }

    // remove 'selected' class after date change
    thisBooking.resetSelectTable();
  }

  render(element) {
    const thisBooking = this;

    const generatedHTML = templates.bookingWidget(element);


    thisBooking.dom = {};
    thisBooking.dom.wrapper = element;
    thisBooking.dom.wrapper.innerHTML = generatedHTML;

    thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector(select.booking.peopleAmount);
    thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(select.booking.hoursAmount);
    thisBooking.dom.datePicker = thisBooking.dom.wrapper.querySelector(select.widgets.datePicker.wrapper);
    thisBooking.dom.hourPicker = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.wrapper);
    thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(select.booking.tables);
    thisBooking.dom.floorPlan = thisBooking.dom.wrapper.querySelector(select.booking.floorPlan);
    thisBooking.dom.phoneNumber = thisBooking.dom.wrapper.querySelector(select.booking.phone);
    thisBooking.dom.address = thisBooking.dom.wrapper.querySelector(select.booking.address);
    thisBooking.dom.submit = thisBooking.dom.wrapper.querySelector(select.booking.submit);
    thisBooking.dom.starters = thisBooking.dom.wrapper.querySelectorAll(select.booking.starters);
    thisBooking.dom.bookingForm = thisBooking.dom.wrapper.querySelector(select.booking.bookingForm);
  }

  initTables(event) {
    const thisBooking = this;

    // remove 'selected' class after every click
    for (let table of thisBooking.dom.tables) {
      table.classList.remove('selected');
    }

    const clickedElement = event.target;
    if (clickedElement.offsetParent.classList.contains('floor-plan')) {
      if (clickedElement.classList.contains('booked')) {
        alert('This table is already booked.');
      } else {
        clickedElement.classList.add('selected');
        thisBooking.activeTable = clickedElement.getAttribute('data-table');
        console.log('thisBooking.activeTable', thisBooking.activeTable);
      }
    }
  }

  sendBooking(event) {
    event.preventDefault();
    const thisBooking = this;
    const url = settings.db.url + '/' + settings.db.booking;
    const booking = {
      'date': thisBooking.date,
      'hour': thisBooking.hourPickerWidget.value,
      'table': thisBooking.activeTable ? parseInt(thisBooking.activeTable) : '',
      'duration': thisBooking.hoursAmountWidget.value,
      'ppl': thisBooking.peopleAmountWidget.value,
      'starters': [],
      'phone': thisBooking.dom.phoneNumber.value,
      'address': thisBooking.dom.address.value
    };

    for (let starter of thisBooking.dom.starters) {
      if (starter.checked) {
        booking.starters.push(starter.value);
      }
    }



    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(booking),
    };

    fetch(url, options)
      .then(function (response) {
        return response.json();
      }).then(function (parsedRespose) {
        console.log(parsedRespose);
        thisBooking.makeBooked(booking.date, booking.hour, booking.duration, booking.table);
        thisBooking.updateDOM();
        alert('Your reservation at: ' + thisBooking.date + ', ' + thisBooking.hourPickerWidget.value + ' is confirmed.');
      });


  }

  initWidgets() {
    const thisBooking = this;
    thisBooking.peopleAmountWidget = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.dom.peopleAmount.addEventListener('updated', function () {

    });

    thisBooking.hoursAmountWidget = new AmountWidget(thisBooking.dom.hoursAmount);
    thisBooking.dom.hoursAmount.addEventListener('updated', function () {

    });

    thisBooking.datePickerWidget = new DatePicker(thisBooking.dom.datePicker);
    thisBooking.hourPickerWidget = new HourPicker(thisBooking.dom.hourPicker);

    thisBooking.dom.wrapper.addEventListener('updated', function () {
      thisBooking.updateDOM();
    });

    thisBooking.dom.floorPlan.addEventListener('click', function (event) {
      thisBooking.initTables(event);
    });

    thisBooking.dom.bookingForm.addEventListener('submit', function (event) {
      thisBooking.sendBooking(event);
    });

  }
}

export default Booking;
