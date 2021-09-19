console.log("HI background job");
chrome.runtime.onMessage.addListener(
  async function(request, sender, sendResponse) {
    console.log(sender);
    console.log(request);

    switch (request.type) {
      case "auth":
        const resp = await signin(request.email, request.password);
        console.log("resp", resp);
        sendResponse(resp);
        break;
      default:
        console.error("Unhandled request type", request.type);
    }
  }
);

// http POST https://app.boostlingo.com/api/web/account/signin email=$EMAIL password="$PASSWORD"
async function signin(email, password) {
  const url = 'https://app.boostlingo.com/api/web/account/signin';
  const body = JSON.stringify({email, password});
  console.log("boDY", body);
  const raw = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({email, password})
  });
  console.log("fetched?")
  const status = raw.status;
  var error = "";
  var response = {};
  var retval = {};
  if (status == 200) {
    const json = await raw.json();
    console.log("200", json);
    response = json;
    error = "";
    retval = {status: status, expiresAt: response.expiresAt, token: response.token}
  } else {
    const text = await raw.text();
    error = text;
    response = {};
    retval = {status: status, error: error}
  }

  return retval;
}

// http -v POST https://app.boostlingo.com/api/web/appointment/appointments start="$START" end="$END" authorization="Bearer $TOKEN"
//
// start and end are both RFC3339. SPA uses UTC/Z, unclear if that's required
function getAppointments(token, start, end) {
  const url = 'https://app.boostlingo.com/api/web/appointment/appointments';
  const response = fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authentication': "Bearer " + token
    },
    body: JSON.stringify({start, end})
  }).json();

  const appointments = response.appointments.map(function(appt) {
    return {
      endTime: appt.endTime,
      startTime: appt.startTime,
      id: appt.id,
      title: appt.title,
      state: appointmentStateToString(appt.state),
      interpreters: interpreters.map(function(i) { return i.name; })
    };
  })

  return appointments;
}

function appointmentStateToString(state) {
  var str = '';
  switch(state) {
    case 4:
      str = "Confirmation Pending By Admin";
      break;
    case 5:
      str = "Scheduled";
      break;
    case 7:
      str = "Completed";
      break;
    default:
      console.log("Unhandled appointment.state: " + str + ".");
      str = JSON.stringify(state);
  }

  return str;
}

// http -v  https://app.boostlingo.com/api/web/appointment/appointment q=='{"appointmentId":$ID}' "authorization: Bearer $TOKEN"
function getAppointment(token, id) {
  var url = 'https://app.boostlingo.com/api/web/appointment/appointment';
  const response = fetch(url + new URLSearchParams({
      q: JSON.stringify({appointmentId: id})
    }),
    {
    method: "GET",
    headers: {
      'Authentication': "Bearer " + token
    }
  }).json();

  // jq: .customForm.fields[] | select(.label == "Private Notes:").value
  const privateNotes = response.customForm.fields.find(function(f) {
    return f.label == "Private Notes:";
  }).value;

  const appointment = {
    state: response.appointmentStateName,
    subject: response.subject,
    description: response.description,
    privateNotes: privateNotes,
    interpreters: response.interpreters.map(function(i) { return i.name }),
    endTime: response.endTime,
    startTime: response.startTime
  };

  return appointment;
}
