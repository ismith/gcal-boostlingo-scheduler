// https://raw.githubusercontent.com/datejs/Datejs/master/build/date-en-US.js

const ROOT_QUERY = "[role=main]";
const TITLE_SPAN_CLASS = "ayClmf";
const DETAIL_ROOT_ID = "yDmH0d";

// map from eventid to the <span> that is its icon
var iconSpanMap = new Map();
// map from eventid to the name of its icon
var iconNameMap = new Map();
var iconTitleMap = new Map();
var eventDataMap = new Map();
var blDataMap = new Map();
var settingsMap = new Map();
const nullSpans = new Map();
var getEventsCounter = 0;

function getRootNode() {
  let mainNode = document.querySelector(ROOT_QUERY);
  if (mainNode) return mainNode.parentNode;
}

function initObserver() {
  chrome.storage.local.get(
    "warnOnZoomLinkMismatch",
    function (items) {
      if (chrome.runtime.lastError) {
        settingsMap.set("warnOnZoomLinkMismatch", false);
      } else if (items.warnOnZoomLinkMismatch) {
        settingsMap.set("warnOnZoomLinkMismatch", items.warnOnZoomLinkMismatch);
      }

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
  );
}

// sets details on the popover/modal of a calendar event
function setDetails() {
  const targetDivs = document.querySelectorAll(
    "[data-eventid].jefcFd > .pdqVLc div.Mz3isd div.kMp0We.OcVpRe"
  );

  const targetDiv = targetDivs[0];

  if (
    targetDiv.nextSibling !== undefined &&
    targetDiv.nextSibling !== null &&
    targetDiv.nextSibling.className.includes("boostlingo-details")
  ) {
    return;
  }

  const eventid =
    targetDiv.parentElement.parentElement.parentElement.dataset.eventid;
  const newDiv = document.createElement("div");
  const blData = blDataMap.get(eventid);
  if (blData === undefined) {
    return;
  }

  const gcalZoomLink = Array.from(targetDiv.parentElement.querySelectorAll("a"))
    .map(function (e) {
      return e.href;
    })
    .filter(function (s) {
      return s.includes("zoom.us/j");
    })
    .map(function (s) {
      const u = new URL(s);
      return u.searchParams.get("q");
    })[0];

  const blText = [blData.description, blData.subject, blData.privateNotes].join(
    " "
  );

  const blZoomLinkMatches =
    gcalZoomLink !== undefined && blText.includes(gcalZoomLink);

  let warnings = [];
  if (!blZoomLinkMatches && settingsMap.get("warnOnZoomLinkMismatch")) {
    warnings.push("Zoom link in Boostlingo is missing or wrong.");
  }
  warnings = warnings.map(function (s) {
    return "WARNING: " + s;
  });

  // TODO: this needs cleanup, and some better templating would be nice.
  newDiv.innerHTML = `<div aria-hidden="true" class="nGJqzd OLw7vb"><span class="DPvwYc rL6ose" aria-hidden="true"><div class="T7dzVe" style=""></div></span></div> <div class="NI2kfb "><div class="agOyMd Q3pZ0e"><div class="JAPzS"><span role="heading" aria-level="1" id="rAECCd">Interpreting</span></div><div class="DN1TJ fX8Pqc CyPPBf">${blData.interpreters.join(
    ", "
  )}<br>${warnings.join("<br>")}</div></div></div>`;

  newDiv.style = "color: white;";
  newDiv.className = "boostlingo-details kMp0We 0cVpRe";

  targetDiv.after(newDiv);
}

function createEventData(e) {
  const times = _eventTimes(e);
  return {
    lastRequested: new Date(Date.now()),
    begin: times.begin,
    end: times.end,
  };
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
    document.querySelectorAll("[data-eventid][data-eventchip]")
  );

  events.forEach(function (e) {
    var targetSpan = e.querySelector("span." + TITLE_SPAN_CLASS);
    if (targetSpan === null) {
      // I'm pretty sure based on count ('nullSpans.size' on my current calendar
      // view) that these are the 'hidden' spans for multi-day events. (A 5-day
      // event will have 1 real and 4 'hidden' spans.) Fine for now, might be nice
      // to ignore better somehow.
      nullSpans.set(eventId(e), true);
      return;
    }

    if (
      targetSpan.previousSibling !== undefined &&
      targetSpan.previousSibling !== null &&
      targetSpan.previousSibling.className.includes("boostlingo-icon")
    ) {
      return;
    }

    if (
      iconNameMap.get(eventId(e)) === null ||
      iconNameMap.get(eventId(e)) === undefined
    ) {
      iconNameMap.set(eventId(e), "far fa-circle");
      const spanTitle = e.querySelector("span." + TITLE_SPAN_CLASS).textContent;
      iconTitleMap.set(eventId(e), spanTitle);
    }

    let span = document.createElement("span");
    span.className = "boostlingo-icon " + iconNameMap.get(eventId(e));
    span.style.marginRight = "5px";
    targetSpan.before(span);
    iconSpanMap.set(eventId(e), span);
  });

  // Docs suggest (10).minutes().ago() should work, but it's broken:
  // https://github.com/datejs/Datejs/issues/140
  const tenMinutesAgo = Date.today().setTimeToNow().add(-10).minutes();

  const eventsNeedingData = events.filter(function (e) {
    const eventData = eventDataMap.get(eventId(e));
    if (eventData === undefined) {
      eventDataMap.set(eventId(e), createEventData(e));
      return true;
    }

    if (eventData.lastRequested < tenMinutesAgo) {
      eventDataMap.set(eventId(e), createEventData(e));
      return true;
    }

    return false;
  });
  if (eventsNeedingData.length > 0) {
    const calSpan = _getEventsSpan(eventsNeedingData);
    const msg = {
      type: "boostlingoRequest",
      begin: calSpan.begin.toISOString(),
      end: calSpan.end.toISOString(),
    };
    chrome.runtime.sendMessage(msg);
  }

  setDetails();

  return events;
}

function _getEventsSpan(events) {
  const times = events.map(function (e) {
    return _eventTimes(e);
  });
  const begins = times
    .map(function (e) {
      return e.begin;
    })
    .filter(function (e) {
      return e != null;
    });
  const ends = times
    .map(function (e) {
      return e.end;
    })
    .filter(function (e) {
      return e != null;
    });

  const retval = {
    begin: new Date(Math.min(...begins)),
    end: new Date(Math.max(...ends)),
  };

  return retval;
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
  span.className = "boostlingo-icon " + icon;
}

// QUESTIONABLE RELIABILITY
// I don't know what all day or cross-day events look like. This is fine.
//
// NB: Date _must_ be date.js, the stdlib's Date.parse is not correct here.
function _eventTimes(e) {
  // first div, will be like: "3pm to 3:30pm, ❇️ Ian / Ben 1/1, Ian Smith,
  // Accepted, No location, September 9, 2021"
  var s = e.querySelector("div").textContent.split(", ");
  var dateStr = s.slice(-2).join(", ");
  var timeStr = s[0];

  if (timeStr.endsWith("All day")) {
    var d = Date.parse(dateStr);
    return {
      begin: d,
      end: d,
    };
  }

  var beginStr;
  var endStr;
  [beginStr, endStr] = timeStr.split(" to ");

  beginStr = dateStr + " " + beginStr;
  endStr = dateStr + " " + endStr;
  return {
    begin: Date.parse(beginStr),
    end: Date.parse(endStr),
  };
}

function eventBLMatch(evt, bl) {
  if (bl.endTime === undefined || bl.startTime === undefined) {
    console.log("endTime or startTime undefined - empty object from BL?", bl);
    return false;
  }

  const blEnd = new Date(bl.endTime);
  const blStart = new Date(bl.startTime);

  // begin times match exactly, BL event ends after end time
  if (
    evt.begin === null ||
    evt.end === null ||
    blStart === null ||
    blEnd === null
  ) {
    return false;
  }

  return (
    Date.compare(evt.begin, blStart) === 0 && Date.compare(evt.end, blEnd) !== 1 // ==
  ); // <=
  // removed this b/c I have a 25m meeting scheduled as a 1hr job
  // && evt.end.add(30).minutes() >= Date.parse(bl.endTime));
}

// want to call these functions from devtools?
// https://stackoverflow.com/questions/48104433/how-to-import-es6-modules-in-content-script-for-chrome-extension
// has some ideas.
chrome.runtime.onMessage.addListener(async function (
  request
) {
  switch (request.type) {
    case "boostlingoResponse": {
      const appts = request.appointments;

      console.log(
        "Received " + appts.length + " appointments from boostlingo."
      );
      appts.forEach(function (appt) {
        for (const [eid, evt] of eventDataMap) {
          if (eventBLMatch(evt, appt)) {
            // TODO: decouple appt.state from icon name
            iconNameMap.set(eid, appt.state);
            setIcon(getEvent(eid), appt.state);
            blDataMap.set(eid, appt);
          }
        }
      });

      break;
    }
    default:
      console.error("Unhandled request type", request.type);
  }

  // do nothing with sendResponse
  return true;
});

window.onload = function () {
  initObserver();
};
