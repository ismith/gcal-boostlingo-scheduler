chrome.runtime.onMessage.addListener(async function (
  request,
  sender
) {
  switch (request.type) {
    case "authResponse":
      clearLoginWarning();
      break;
    case "auth": {
      const resp = await signin(request.email, request.password);
      if (resp.status === 200) {
        chrome.storage.local.set({ auth: resp });
      }
      chrome.runtime.sendMessage({
        type: "authResponse",
        status: resp.status,
        error: resp.error,
        expiresAt: resp.expiresAt,
      });
      // sendResponse(resp);
      break;
    }
    case "boostlingoRequest":
      chrome.storage.local.get("auth", async function (items) {
        const token = items.auth.token;
        const appts = await getAppointments(token, request.begin, request.end);
        const msg = {
          type: "boostlingoResponse",
          appointments: appts,
        };
        // if you have more than one gcal tab open, we _could_ make this
        // broadcast to all of them with chrome.tabs.query(...). Though I'd
        // have to think harder about race conditions on the gcal.js side.
        chrome.tabs.sendMessage(sender.tab.id, msg);
      });
      break;
    case "boostlingoPrefillAppointmentStep1":
      // TODO: should we/can we make this tab open right after the calendar tab
      // it came from?
      chrome.tabs.create({
        url: "https://app.boostlingo.com/app/client/scheduling/calendar",
        active: true, // new tab is active tab
      }, function(tab) {
        request.type = 'boostlingoPrefillAppointmentStep2'

        // This is a bit gross. We need to send this message _after_ the
        // boostlingo.js content script has had a chance to load, which will be
        // after this callback starts. So ... sleep a short time to give it a
        // chance.
        //
        // TODO: The more correct thing to do might be to persist the message in
        // a map here with the tab id; have boostlingo.js send a "gimme the
        // message" message once it loads, and have background.js get the
        // message out of the map and send it. But this works for now.
        //
        // Alternative: https://stackoverflow.com/a/30086947 suggests using
        // executeScript to inject boostlingo.js, and sending the message from
        // _its_ callback. I couldn't quite get the permissions right for that.
        setTimeout(function() {
          chrome.tabs.sendMessage(tab.id, request);
        }, 2000)
      })
      break;
    default:
      console.error("Unhandled request type", request.type);
  }

  // sendResponse(Promise.resolve({status: 200, expiresAt: "NEVAR)"}))
  return true;
});

// http POST https://app.boostlingo.com/api/web/account/signin email=$EMAIL password="$PASSWORD"
async function signin(email, password) {
  const url = "https://app.boostlingo.com/api/web/account/signin";
  const raw = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
  const status = raw.status;
  var error = "";
  var response = {};
  var retval = {};
  if (status == 200) {
    const json = await raw.json();
    response = json;
    error = "";
    retval = {
      status: status,
      expiresAt: response.expiresAt,
      token: response.token,
    };
    clearLoginWarning();
  } else {
    const text = await raw.text();
    error = text;
    response = {};
    retval = { status: status, error: error };
  }

  return retval;
}

// http -v POST https://app.boostlingo.com/api/web/appointment/appointments start="$START" end="$END" authorization="Bearer $TOKEN"
//
// start and end are both RFC3339. SPA uses UTC/Z, unclear if that's required
async function getAppointments(token, start, end) {
  const url = "https://app.boostlingo.com/api/web/appointment/appointments";
  const raw = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    body: JSON.stringify({ start, end }),
  });
  const response = await raw.json();

  const appointments = await Promise.all(
    response.appointments.map(async function (appt) {
      // null-check for interpreters
      const interpreters = !appt.interpreters
        ? []
        : appt.interpreters.map(function (i) {
            return i.name;
          });

      const details = await getAppointment(token, appt.id);

      const apptObj = {
        endTime: appt.endTime,
        startTime: appt.startTime,
        id: appt.id,
        title: appt.title,
        state: appointmentStateToString(appt.state),
        interpreters: interpreters,
      };

      return {
        ...apptObj,
        ...details,
      };
    })
  );

  return appointments;
}

function appointmentStateToString(state) {
  var str = "";
  // from https://app.boostlingo.com/api/web/dictionary/appointment-dictionaries
  // | jq '.statesInfo[] |{id, name: .stateDisplayNames[0].displayName}'
  // 1: draft approval
  // 2: new
  // 3: broadcasted
  // 4: confirm interpreters (by admin?)
  // 5: scheduled
  // 6: in progress
  // 7: completed
  // 8: canceled
  switch (state) {
    case 1:
    case 2:
    case 3:
    case 4:
      str = "Confirmation Pending By Admin";
      str = "fas fa-tasks";
      break;
    case 5:
      str = "Scheduled";
      str = "fas fa-american-sign-language-interpreting";
      break;
    case 6:
    case 7:
    case 8:
    case 9:
      str = "Completed";
      str = "fas fa-check";
      break;
    default:
      console.log("Unhandled appointment.state: " + str + ".");
      str = JSON.stringify(state);
  }

  return str;
}

// http -v  https://app.boostlingo.com/api/web/appointment/appointment q=='{"appointmentId":$ID}' "authorization: Bearer $TOKEN"
async function getAppointment(token, id) {
  var url = "https://app.boostlingo.com/api/web/appointment/appointment";
  const raw = await fetch(
    url +
      "?" +
      new URLSearchParams({
        q: JSON.stringify({ appointmentId: id }),
      }),
    {
      method: "GET",
      headers: {
        Authorization: "Bearer " + token,
      },
    }
  );

  const response = await raw.json();

  // jq: .customForm.fields[] | select(.label == "Private Notes:").value
  const privateNotes = response.customForm.fields.find(function (f) {
    return f.label == "Private Notes:";
  }).value;

  const appointment = {
    //state: response.appointmentStateName,
    subject: response.subject,
    description: response.description,
    privateNotes: privateNotes,
    accountUniqueId: response.accountUniqueId,
    //interpreters: response.interpreters.map(function(i) { return i.name }),
    //endTime: response.endTime,
    //startTime: response.startTime
  };

  return appointment;
}

function setLoginWarning() {
  chrome.action.setBadgeText({text: "login"})
  chrome.action.setBadgeBackgroundColor({color: "red"})
}

function clearLoginWarning() {
  chrome.action.setBadgeText({text: ""})
}

function checkAndSetOrClearLoginWarning() {
  chrome.storage.local.get("auth", async function (items) {
    if (chrome.runtime.lastError || items.auth === undefined) {
      setLoginWarning()
    } else {
      const expiresDate = new Date(items.auth.expiresAt)
      if ( expiresDate < Date.now() ) {
        setLoginWarning()
      }
    }
  })
}

// run immediately (in addition to on an interval)
checkAndSetOrClearLoginWarning()
// ServiceWorkers don't run forever, but this should run when it reactivates due
// to a message from gcal.js
setInterval(checkAndSetOrClearLoginWarning, 5*60*1000)
