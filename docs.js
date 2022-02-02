fetch("/documentation.md").then(function(res) {
  res.text().then(function(s) {
  document.getElementById('content').innerHTML =
      marked.parse(s);
  Array.from(document.getElementsByTagName('table')).map(e =>  e.className = "table");
  });
});
