async function submitLogin(e) {
  e.preventDefault();
  console.log("SL");
  console.log(e);

  let form = e.srcElement;
  let email = e.srcElement['email'].value;
  let password = e.srcElement['password'].value;
  form.reset();
  const authData = await signin(email, password);
  console.log(authData);
}
console.log("HI bl.js");

window.onload = function() {
  var f = document.getElementById('boostlingoLoginForm');
  f.onsubmit = submitLogin
};

// http POST https://app.boostlingo.com/api/web/account/signin email=$EMAIL password="$PASSWORD"
async function signin(email, password) {
  const url = 'https://app.boostlingo.com/api/web/account/signin';
  const raw = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({email, password})
  });
  debugger;
  const response = raw.json();
  return {expiresAt: response.expiresAt, token: response.token}
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
