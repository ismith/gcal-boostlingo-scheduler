// https://raw.githubusercontent.com/datejs/Datejs/master/build/date-en-US.js

function getEvents() {
  // NB: multi-day events (at least the all-day ones)  will have one node per
  // day, with the same data-eventid
  const events = Array.from(
    document.querySelectorAll('[data-eventid][data-eventchip]')
  );
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
  console.log(getEvents());
}
