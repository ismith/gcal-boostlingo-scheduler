// https://raw.githubusercontent.com/datejs/Datejs/master/build/date-en-US.js

// map from eventid to the <span> that is its icon
var iconMap = {};

function getEvents() {
  // NB: multi-day events (at least the all-day ones)  will have one node per
  // day, with the same data-eventid
  const events = Array.from(
    document.querySelectorAll('[data-eventid][data-eventchip]')
  );

  // this is not idempotent, and it should be
  events.forEach(function(e) {
    span = document.createElement('span');
    span.className = "boostlingo-icon fas " + "fa-spinner";
    span.style.marginRight = '5px';
    e.querySelector('div div span:first-of-type').before(span);
    iconMap[eventId(e)] = span;
  });

  return events;
}

// e is an event with data-eventid
function eventName(e) {
  return e.querySelector('span span').textContent;
}

function eventId(e) {
  return e.dataset.eventid;
}

function getEvent(id) {
  return document.querySelector(`body [data-eventid="${id}"][data-eventchip]`);
}

function getElementToPrepend(id) {
  // node div div span, span should be .ayClmf, but I'm not sure we can rely on
  // that if the SPA changes. Not that 'div div span' is terribly robust, but it
  // feels slightly less brittle.
  const span = getEvent(id).querySelector('div div span');

  return span;
}

function setIcon(node, icon) {
  var span = iconMap[eventId(node)];
  span.className = "fas " + icon;
  /*
  if (span === {}) {
    span = document.createElement('span');
    span.className = "fas " + icon;
    span.style.marginRight = '5px';
    node.querySelector('div div span:first-of-type').before(span);
    iconMap[eventId(node)] = span;
  }
  */
}

// QUESTIONABLE RELIABILITY
// I don't know what all day or cross-day events look like. This is fine.
function _eventTimes(e) {
  // first div, will be like: "3pm to 3:30pm, ❇️ Ian / Ben 1/1, Ian Smith,
  // Accepted, No location, September 9, 2021"
  var s = e.querySelector('div').textContent.split(', ');
  var dateStr = s.split(', ').slice(-2).join(', ');
  var timeStr = s[0];

  var beginStr;
  var endStr;
  [beginStr, endStr] = timeStr.split(' to ');

  return {
    begin: Date.parse(dateStr + " " + beginStr),
    end: Date.parse(dateStr + " " + endStr)
  };
}

// want to call these functions from devtools?
// https://stackoverflow.com/questions/48104433/how-to-import-es6-modules-in-content-script-for-chrome-extension
// has some ideas.

window.onload = function() {
  // console.log(getEvents());

  const events = getEvents();
  console.log(events);

  // all events get spinner icon
  const styles = events.map(function(e) {
    return setIcon(e, 'fa-spinner');
  });

  // demo: one event gets spinner replaced with circle-notch
  setIcon(events[11], 'fa-circle-notch');
}
