// https://raw.githubusercontent.com/datejs/Datejs/master/build/date-en-US.js

// map from eventid to the <span> that is its icon
var iconMap = {};
var mutationObserverMap = {};

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
    var targetSpan = e.querySelector('div div span:first-of-type');
    console.log(targetSpan);
    console.log(targetSpan.parentNode);
    targetSpan.before(span);
    iconMap[eventId(e)] = span;

    var observer = new MutationObserver(function(mutationList, observer) {
      console.log("observer!");
      // given element, check if it's already got an icon
      // if it does not, re-attach the icon span
      mutationList.forEach(function(m) {
          // console.log(m);
        if (m.removedNodes.length > 0) {
          console.log("REM", m.removedNodes[0].className);
        }
        if (m.addedNodes.length > 0) {
          console.log("ADD", m.addedNodes[0].className);
        }
      });

      var m = mutationList[0];
      if (m.target && ! m.target.children[0].className.startsWith("boostlingo-icon")) {
        console.log("eid: " + eventId(m.target) + " " + m.target.dataset.eventid);
        console.log(m.target)
        console.log(m.target.textContent)
        // observer.disconnect()
        // m.target.children[0].before(iconMap[eventId(m.target)]);
        // observer.observe(m.target, {childList: true})
      }
    });
    // observer.observe(span.parentNode, {childList: true})
    observer.observe(span.parentNode, {childList: true})
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

function setIcon(node, icon) {
  var span = iconMap[eventId(node)];
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
  const events = getEvents();
  console.log(events);

  // all events get spinner icon
  const styles = events.map(function(e) {
    return setIcon(e, 'fa-spinner');
  });

  // demo: one event gets spinner replaced with circle-notch
  setIcon(events[11], 'fa-circle-notch');

  events.forEach(function(e) {
    console.log(_eventTimes(e));
  });
}
