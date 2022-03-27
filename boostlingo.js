chrome.runtime.onMessage.addListener(async function (
  request,
  sender
) {
  switch (request.type) {
    case "boostlingoPrefillAppointmentStep2":
      console.log(request)
      console.log("1")
      clickCreateNewAppointment()
      setTimeout(function() {
        console.log("2")
        prefillNumberOfInterpreters()
        console.log("3")
        prefillPrivateNotes(request.privateNotes)
        console.log("4")
        // TODO: date may need waits or sleeps or something between clicks
        prefillDate(request.startTime)
        console.log("5")
        // TODO: angular is not defined
        prefillStartTime(request.startTime)
        console.log("6")
        // TODO: angular is not defined
        prefillEndTime(request.endTime)
        console.log("7")
      }, 1000)

      // TODO: prefillSubject

      break;
    default:
      console.error("Unhandled request type", request.type);
  }

  return true;
});

function _clickPrevMonthButton() {
  document.querySelector(".mighty-picker__prev-month:not(.pull-left)").click();
}

function _clickNextMonthButton() {
  document.querySelector(".mighty-picker__next-month:not(.pull-right)").click();
}

function _monthNameAsIntMonths(mp) {
  let [month, year] = document.querySelector(".mighty-picker__month-name").textContent.split(" ")

  // eg, "March 2022"'s month in JS is 2, so add 1 (1-indexing of months)
  return ((new Date(month + " " + year).getMonth() + 1) + (year * 12))
}

function _dateISOStringAsIntMonths(dateISOString) {
  let date = new Date(dateISOString);
  let month = date.getMonth() + 1;
  let year = date.getFullYear();

  return month + year * 12;
}

function _clickDay(dayNumber) {
  // There are two tables containing div.mighty-picker-calendar__day-wrapper,
  // but only one is in a form. Not sure what the other one is for.
  Array.from(
    document.querySelector("form")
       .querySelectorAll("div.mighty-picker-calendar__day-wrapper")
  ).find(e => e.textContent == dayNumber)
   .click();
}


// This is done at https://app.boostlingo.com/app/client/scheduling/calendar
function clickCreateNewAppointment() {
  document.querySelector("span[ng-click='create()']").click()
}

function prefillDate(dateISOString) {
  // click "Create New Appointment" button
  // TODO

  // TODO wait for form to load (and other waits along the way)

  // open the datepicker
  let mpBox = document.querySelector("div[ng-click='clickPicker()']");
  mpBox.click();
  mpBox.click();

  // figure out how many months away we are
  let monthName = document.querySelector("div.mighty-picker__month-name").textContent;
  let currMonthInt = _monthNameAsIntMonths(monthName);
  let targetMonthInt = _dateISOStringAsIntMonths(dateISOString);
  let clicksToMonth = targetMonthInt - currMonthInt;

  if (clicksToMonth > 0) {
    for (var i = 0; i < clicksToMonth; i++) {
      _clickNextMonthButton()
    }
  } else if (clicksToMonth < 0) {
    let clicksToMonth = -clicksToMonth;
    for (var i = 0; i < clicksToMonth; i++) {
      _clickPrevMonthButton()
    }
  } else { // we're already on the right month
  }

  // getDate is the day-of-the-month; getDay is day-of-week (Mon=1, Tues=2)
  let day = (new Date(dateISOString)).getDate();
  _clickDay(day);
}

// '05:15 AM' is the format needed by Boostlingo
function _dateISOStringAsTime(dateISOString) {
  return (new Date(dateISOString)).toLocaleTimeString(undefined, {hour: '2-digit', minute: '2-digit'})
}

function prefillStartTime(dateISOString) {
  let time = _dateISOStringAsTime(dateISOString);
  angular.element(
    document.querySelector("input#startTime")
  ).val(time).trigger("input")
}

function prefillEndTime(dateISOString) {
  let time = _dateISOStringAsTime(dateISOString);
  angular.element(
    document.querySelector("input#endTime")
  ).val(time).trigger("input")
}

function _setCustomField(fieldName, value) {
  Array.from(document.querySelectorAll("label"))
    .find(e => e.textContent == fieldName)
    .parentElement
    .parentElement
    .querySelector("textarea")
    .value = value;
}

function prefillPrivateNotes(value) {
  _setCustomField("Private Notes:", value)
}

/*
// TODO
function _setDropdown(id, targetText) {
  let selectNode = document.querySelector("select#" + id);
  let optionValue = Array.from(selectNode.options)
    .find(e => e.textContent == targetText)
    .value;

  ang
  div[translation-texts="data.translationTexts.translationTypes"]
  div[ng-click=='toggleDropdown()']
}
*/

function prefillNumberOfInterpreters() {
  document.querySelector("input#numberOfInterpreters").value = 2
}


// TODO:
// x subject: input#subject
// x private Notes (zoom url): fn
// x description: textarea#description
//
// - communication type (3rd party platform)
// - Language To: "American Sign Language - ASL"
// x Number of Interpreters: 2 (?)

// TODO plan:
// [x] function to get a zoom link from the page
// [x] clicking in gcal, under some conditions, creates a tab at
// https://app.boostlingo.com/app/client/scheduling/calendar. We get a callback,
// which puts a message onto the bus with properties {startTime:, endTime:,
// subject:, description:, zoomLink:, tabId: }
// [ ] config values: zoom link on/off
// [ ] boostlingo pages listen for those messages and on its tabId. if a message is processed, it prefills the page
// [ ] bonus: can we, on save, send a message back to gcal? To populate the
// icon?
// [ ] bonus: we can do the zoom-link-missing-or-wrong thing from the main view
//     now, no need to click in to the event details!

