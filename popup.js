function submitLogin(e) {
  e.preventDefault();
  console.log("SL");
  console.log(e);

  let form = e.srcElement;
  let email = e.srcElement['email'].value;
  let password = e.srcElement['password'].value;
  form.reset();
  // const authData = await signin(email, password);
  chrome.runtime.sendMessage(
    {type: "auth", email: email, password:password},
    function(resp) {
      console.log(resp)
    }
  );
  // console.log(authData);
}
console.log("HI bl.js");

window.onload = function() {
  var f = document.getElementById('boostlingoLoginForm');
  f.onsubmit = submitLogin
};
