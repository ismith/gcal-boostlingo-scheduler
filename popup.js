function submitLogin(e) {
  e.preventDefault();

  let form = e.srcElement;
  let email = e.srcElement["email"].value;
  let password = e.srcElement["password"].value;
  form.reset();
  chrome.runtime.sendMessage({
    type: "auth",
    email: email,
    password: password,
  });
}

function logout(e) {
  e.preventDefault();
  var f = document.getElementById("boostlingoLoginForm");
  f.reset();
  chrome.storage.local.remove("auth");
  var loginStatus = document.getElementById("loginStatus");
  loginStatus.textContent = "";
  loginStatus.style.border = "none";
}

function settingsForm(e) {
  e.preventDefault();

  let form = e.srcElement;
  let warnOnZoomLinkMismatch = e.srcElement["warnOnZoomLinkMismatch"].checked;
  chrome.storage.local.set({ warnOnZoomLinkMismatch: warnOnZoomLinkMismatch });
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  switch (request.type) {
    // I don't know why I can't get the callback in sendMessage to work, so  here's a
    // workaround
    case "authResponse":
      var loginStatus = document.getElementById("loginStatus");
      if (request.status === 200) {
        // TODO: format timestamp nicely
        loginStatus.textContent = "Auth good until: " + request.expiresAt;
        loginStatus.style.color = "blue";
        loginStatus.style.border = "1px solid blue";
      } else {
        loginStatus.style.color = "red";
        loginStatus.style.border = "1px dashed red";
        loginStatus.textContent = "Error: " + request.error;
      }
      break;
    case "boostlingoRequest":
      // do nothing - this is handled by other listeners
      break;
    default:
      console.error("Unhandled request type", request.type);
  }
});

window.onload = function () {
  var f = document.getElementById("boostlingoLoginForm");
  f.onsubmit = submitLogin;

  var logoutBtn = document.getElementById("logout");
  logoutBtn.onclick = logout;

  var settingsF = document.getElementById("settingsForm");
  settingsF.onsubmit = settingsForm;

  var auth = chrome.storage.local.get("auth", function (items) {
    if (chrome.runtime.lastError) {
      // not found, do nothing?
    } else if (items.auth !== undefined) {
      var loginStatus = document.getElementById("loginStatus");
      // TODO: format timestamp nicely
      loginStatus.textContent = "Auth good until: " + items.auth.expiresAt;
      loginStatus.style.color = "blue";
      loginStatus.style.border = "1px solid blue";
    }
  });

  var warnOnZoomLinkMismatch = chrome.storage.local.get(
    "warnOnZoomLinkMismatch",
    function (items) {
      if (chrome.runtime.lastError) {
        // not found, do nothing?
      } else if (items.warnOnZoomLinkMismatch !== undefined) {
        document.getElementById("warnOnZoomLinkMismatch").checked =
          items.warnOnZoomLinkMismatch;
      }
    }
  );
};
