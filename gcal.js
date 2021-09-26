// https://raw.githubusercontent.com/datejs/Datejs/master/build/date-en-US.js


const ROOT_QUERY = "[role=main]";
const TITLE_SPAN_CLASS = 'ayClmf';
const DETAIL_ROOT_ID = "yDmH0d";

// map from eventid to the <span> that is its icon
var iconSpanMap = new Map();
// map from eventid to the name of its icon
var iconNameMap = new Map();
var iconTitleMap = new Map();
const nullSpans = new Map();
var getEventsCounter = 0;
var logDates = true;

function getRootNode() {
  let mainNode = document.querySelector(ROOT_QUERY);
  if (mainNode) return mainNode.parentNode;
}

function initObserver() {
  const rootNode = getRootNode();
  const observer = new MutationObserver(getEvents);
  observer.observe(rootNode, {
    attributes: true,
    childList: true,
    characterData: false,
    subtree: true,
  });
  observer.observe(document.getElementById(DETAIL_ROOT_ID), {
    subtree: true,
    childList: true,
  });

  return getEvents();
}

function getEvents() {
  getEventsCounter++;
  // console.log("getEventsCounter: " + getEventsCounter);

  // NB: multi-day events (at least the all-day ones)  will have one node per
  // day, with the same data-eventid
  const events = Array.from(
    document.querySelectorAll('[data-eventid][data-eventchip]')
  );

  events.forEach(function(e) {
    var targetSpan = e.querySelector('span.' + TITLE_SPAN_CLASS);
    if (targetSpan === null) {
      // I'm pretty sure based on count ('nullSpans.size' on my current calendar
      // view) that these are the 'hidden' spans for multi-day events. (A 5-day
      // event will have 1 real and 4 'hidden' spans.) Fine for now, might be nice
      // to ignore better somehow.
      nullSpans.set(eventId(e), true);
      // console.log("nullSpans size: " + nullSpans.size);
      return;
    }

    if (targetSpan.previousSibling !== undefined &&
        targetSpan.previousSibling !== null &&
        targetSpan.previousSibling.className.includes("boostlingo-icon")) {
      return;
    }

    if (iconNameMap.get(eventId(e)) === null ||
        iconNameMap.get(eventId(e)) === undefined) {
      iconNameMap.set(eventId(e), "fa-spinner");
      const spanTitle = e.querySelector('span.' + TITLE_SPAN_CLASS).textContent;
      iconTitleMap.set(eventId(e), spanTitle);
    }

    span = document.createElement('span');
    span.className = "boostlingo-icon fas " + iconNameMap.get(eventId(e));
    span.style.marginRight = '5px';
    targetSpan.before(span);
    iconSpanMap.set(eventId(e), span);
  });

  if (logDates && events.length > 0) {
    logDates = false;
    console.log("===================");
    console.log(_getEventsSpan(events));
    console.log("===================");
  }

  return events;
}

function _getEventsSpan(events) {
  const times = events.map(function(e) { return _eventTimes(e); });
  const begins = times.map(function(e) { return e.begin; }).filter(function(e) { return e != null });
  const ends = times.map(function(e) { return e.end; }).filter(function(e) { return e != null });

  const retval = {
    begin: new Date(Math.min(...begins)),
    end: new Date(Math.max(...ends))
  };

  return retval;
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

function setIcon(node, icon) {
  var span = iconSpanMap.get(eventId(node));
  console.log("setIcon", span);
  iconNameMap.set(eventId(node), icon);
  if (span === undefined) {
    // I'm pretty sure based on count ('nullSpans.size' on my current calendar
    // view) that these are the 'hidden' spans for multi-day events. (A 5-day
    // event will have 1 real and 4 'hidden' spans.) Fine for now, might be nice
    // to ignore better somehow.
    nullSpans.set(eventId(node), true);
    console.log("IN setIcon: nullSpans size: " + nullSpans.size);
    return;
  }
  // TODO: regex so we can do s/fa-[a-z-]*/fa-new-icon/?
  span.className = "boostlingo-icon fas " + icon;
}

// QUESTIONABLE RELIABILITY
// I don't know what all day or cross-day events look like. This is fine.
//
// NB: Date _must_ be date.js, the stdlib's Date.parse is not correct here.
//
// TODO: breaks on multi-day events (["September 6 [emdash] 10", "2021"]), can
// we handle that?
function _eventTimes(e) {
  // first div, will be like: "3pm to 3:30pm, ❇️ Ian / Ben 1/1, Ian Smith,
  // Accepted, No location, September 9, 2021"
  var s = e.querySelector('div').textContent.split(', ')
  var dateStr = s.slice(-2).join(', ');
  var timeStr = s[0];

  if (timeStr.endsWith('All day')) {
    var d = Date.parse(dateStr);
    return {
      begin: d,
      end: d
    };
  }

  var beginStr;
  var endStr;
  [beginStr, endStr] = timeStr.split(' to ');

  beginStr = dateStr + " " + beginStr;
  endStr = dateStr + " " + endStr;
  return {
    begin: Date.parse(beginStr),
    end: Date.parse(endStr)
  };
}

// want to call these functions from devtools?
// https://stackoverflow.com/questions/48104433/how-to-import-es6-modules-in-content-script-for-chrome-extension
// has some ideas.

window.onload = function() {
  const events = initObserver();
  console.log(events);

  // demo: one event gets spinner replaced with circle-notch
  // setIcon(events[11], 'fa-circle-notch');
}
