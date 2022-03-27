chrome.runtime.onMessage.addListener(async function (
  request,
  sender
) {
  switch (request.type) {
    case "boostlingoPrefillAppointmentStep2":
      console.log(request)
      break;
    default:
      console.error("Unhandled request type", request.type);
  }

  return true;
});

window.onload = function() {
  console.log("Hello from boostlingo!")
}
