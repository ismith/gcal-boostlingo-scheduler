chrome.runtime.onMessage.addListener(async function (
  request,
  sender,
  sendResponse
) {
  switch (request.type) {
    case "auth":
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
    default:
      console.error("Unhandled request type", request.type);
  }

  // sendResponse(Promise.resolve({status: 200, expiresAt: "NEVAR)"}))
  return true;
});

// http POST https://app.boostlingo.com/api/web/account/signin email=$EMAIL password="$PASSWORD"
async function signin(email, password) {
  const url = "https://app.boostlingo.com/api/web/account/signin";
  const body = JSON.stringify({ email, password });
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
  switch (state) {
    case 4:
      str = "Confirmation Pending By Admin";
      str = "fas fa-tasks";
      break;
    case 5:
      str = "Scheduled";
      str = "fas fa-american-sign-language-interpreting";
      break;
    case 7:
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
    //interpreters: response.interpreters.map(function(i) { return i.name }),
    //endTime: response.endTime,
    //startTime: response.startTime
  };

  return appointment;
}
