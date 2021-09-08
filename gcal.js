// https://raw.githubusercontent.com/datejs/Datejs/master/build/date-en-US.js

// map from eventid to the <style> that controls its icon
var iconMap = {};

function getEvents() {
  // NB: multi-day events (at least the all-day ones)  will have one node per
  // day, with the same data-eventid
  const events = Array.from(
    document.querySelectorAll('[data-eventid][data-eventchip]')
  );

  events.forEach(function(e) {
    var style = document.createElement('style');
    iconMap[eventId(e)] = style;
    document.head.appendChild(style);
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

// https://fontawesome.com/v5/cheatsheet
function _faIconToCode(icon) {
  switch(icon) {
    case 'fa-spinner':
      return "\\f110";
      break;
    case 'fa-circle-notch':
      return "\\f1ce";
      break;
    case 'fa-pause-circle':
      return "\\f28b";
      break;
    case 'fa-american-sign-language-interpreting':
      return "\\f2a3";
      break;
    case 'fa-archive':
      return "\\f1c6";
      break;
    default:
      console.log("Unhandled fontawesome icon name: " + icon + ".");
      return "";
      break;
  }
}

// todo: do I need Commmn Properties from
// https://fontawesome.com/v5.15/how-to-use/on-the-web/advanced/css-pseudo-elements?

function setIcon(node, icon) {
  style = iconMap[eventId(node)]
  const str = `
div[data-eventid="${eventId(node)}"][data-eventchip] div div span:first-of-type ::before {
  font-family: 'Font Awesome 5 Free';
  font-weight: 900;
  content: '${ _faIconToCode(icon)}';
}
`;
  style.innerHTML = str;
}

function createDOMNode(html) {
  var t = document.createElement('template');
  t.innerHTML = html;
  return t.content.firstChild;
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

  const events = getEvents();

  // all events get spinner icon
  const styles = events.map(function(e) {
    return setIcon(e, 'fa-spinner');
  });

  // demo: one event gets spinner replaced with circle-notch
  setIcon(events[11], 'fa-circle-notch');
}
