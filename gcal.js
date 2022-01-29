// https://raw.githubusercontent.com/datejs/Datejs/master/build/date-en-US.js


const ROOT_QUERY = "[role=main]";
const TITLE_SPAN_CLASS = 'ayClmf';
const DETAIL_ROOT_ID = "yDmH0d";

// map from eventid to the <span> that is its icon
var iconSpanMap = new Map();
// map from eventid to the name of its icon
var iconNameMap = new Map();
var iconTitleMap = new Map();
var eventDataMap = new Map();
var blDataMap = new Map();
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

// for editing the modal ...
// data-eventid and classes jefcFd is (i think) the whole modal
// pdqVLc
// Mz3isd
// #xDtlDlgCt > div.kMp0We.OcVpRe.IyS93d.N1DhNb is the google header
// below it, add a div? with kMp0We.OcVpRe?
//
// alternative: can bootstrap or something put a popover on the span?

function createEventData(e) {
  const times = _eventTimes(e);
  return {
      lastRequested: new Date(Date.now()),
      begin: times.begin,
      end: times.end
  }
}

function getEvents() {
  getEventsCounter++;
  if (getEventsCounter === 1000) {
    console.log("getEventsCounter: " + getEventsCounter);
    getEventsCounter = 0;
  }

  // NB: multi-day events (at least the all-day ones)  will have one node per
  // day, with the same data-eventid
  const events = Array.from(
    document.querySelectorAll('[data-eventid][data-eventchip]')
  );

  events.filter(function(e) {
    // TODO: filter on ynRLnc contains Needs RSVP
    // might also be background-color isn't set?
    return true;
  }).forEach(function(e) {
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
    // bootstrap abandoned - onhover doesn't trigger
    span.dataset.toggle='tooltip';
    span.dataset.title='hello';
    span.dataset.placement="left";
    // span.dataset.template='<div class="tooltip" role="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>';
    span.dataset.content='world!';
    span.dataset.trigger='hover focus click';
    // span.onmouseover = function(evt) { console.log("show"); $(evt.target).tooltip("show");}
    span.className = "tooltip boostlingo-icon fas " + iconNameMap.get(eventId(e));
    span.style.marginRight = '5px';
    targetSpan.before(span);
    $(span).tooltip();
    //span.popover()
    iconSpanMap.set(eventId(e), span);
  });

  if (logDates && events.length > 0) {
    logDates = false;
    console.log("===================");
    console.log(_getEventsSpan(events));
    console.log("===================");
  }

  // Docs suggest (10).minutes().ago() should work, but it's broken:
  // https://github.com/datejs/Datejs/issues/140
  const tenMinutesAgo = (Date.today()).setTimeToNow().add(-10).minutes();

  const eventsNeedingData = events.filter(function(e) {
    eventData = eventDataMap.get(eventId(e));
    // console.log("E: " + eventId(e) + ", LR: " + JSON.stringify(eventData) + ".");
    if (eventData === undefined) {
      console.log("E LR: undefined")
      eventDataMap.set(eventId(e), createEventData(e));
      return true
    }

    if (eventData.lastRequested < tenMinutesAgo) {
      console.log("E LR: " + eventData.lastRequested + "TMA: " + tenMinutesAgo + "<: " + (eventData.lastRequested < tenMinutesAgo))
      eventDataMap.set(eventId(e), createEventData(e));
      return true
    }

    return false;
  });
  if (eventsNeedingData.length > 0) {
    const calSpan = _getEventsSpan(eventsNeedingData);
    const msg = {
      type: 'boostlingoRequest',
      begin: calSpan.begin.toISOString(),
      end: calSpan.end.toISOString(),
    };
    console.log("Request for boostlingo:", msg);
    chrome.runtime.sendMessage(msg);
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
  iconNameMap.set(eventId(node), icon);
  if (span === undefined) {
    // I'm pretty sure based on count ('nullSpans.size' on my current calendar
    // view) that these are the 'hidden' spans for multi-day events. (A 5-day
    // event will have 1 real and 4 'hidden' spans.) Fine for now, might be nice
    // to ignore better somehow.
    nullSpans.set(eventId(node), true);
    return;
  }
  // TODO: regex so we can do s/fa-[a-z-]*/fa-new-icon/?
  span.className = "tooltip boostlingo-icon fas " + icon;
}

// QUESTIONABLE RELIABILITY
// I don't know what all day or cross-day events look like. This is fine.
//
// NB: Date _must_ be date.js, the stdlib's Date.parse is not correct here.
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

function eventBLMatch(evt, bl) {
  blEnd = new Date(bl.endTime)
  blStart = new Date(bl.startTime)

  if (bl.endTime === undefined || bl.startTime === undefined) {
    console.log("endTime or startTime undefined - empty object from BL?", bl);
    return false
  }

  // begin times match exactly, BL event ends after end time
  if (evt.begin === null || evt.end === null || blStart === null || blEnd === null) {
    return false
  }

  return (Date.compare(evt.begin, blStart) ===  0 // ==
    && Date.compare(evt.end, blEnd) !== 1); // <=
    // removed this b/c I have a 25m meeting scheduled as a 1hr job
    // && evt.end.add(30).minutes() >= Date.parse(bl.endTime));
}

// want to call these functions from devtools?
// https://stackoverflow.com/questions/48104433/how-to-import-es6-modules-in-content-script-for-chrome-extension
// has some ideas.
chrome.runtime.onMessage.addListener(
  async function(request, sender, sendResponse) {
    switch (request.type) {
      case "boostlingoResponse":
        const appts = request.appointments;
        // debugger;

        console.log("Received " + appts.length + " appointments from boostlingo.");
        appts.forEach(function(appt) {
          for ([eid, evt] of eventDataMap) {
            if (eventBLMatch(evt, appt)) {
              // TODO: decouple appt.state from icon name
              iconNameMap.set(eid, appt.state);
              setIcon(getEvent(eid), appt.state);
              blDataMap.set(eid, appt);
              // TODO: add zoom id to overlay
              // TODO: icon if zoom mismatch?
            }
          }
        });
        break;
      default:
        console.error("Unhandled request type", request.type);
    }

    // do nothing with sendResponse
    return true;
  });

window.onload = function() {

  var jq = document.createElement("script");
  jq.src=chrome.runtime.getURL("third-party/jquery.min.js");
  document.getElementsByTagName('head')[0].appendChild(jq);

  var bootstrap = document.createElement("script");
  bootstrap.src=chrome.runtime.getURL("third-party/bootstrap.bundle.min.js");
  document.getElementsByTagName('head')[0].appendChild(bootstrap);

  var bsCSS = document.createElement("link");
  bsCSS.rel = chrome.runtime.getURL("third-party/bootstrap.min.css");
  document.getElementsByTagName('head')[0].appendChild(bsCSS);

  const events = initObserver();
  // console.log(events);

  // demo: one event gets spinner replaced with circle-notch
  // setIcon(events[11], 'fa-circle-notch');
}
