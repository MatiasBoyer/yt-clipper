$(document).ready(() => {
  var stdout = $("#stdout");
  var stderr = $("#stderr");

  function refresh() {
    $.ajax({
      type: "GET",
      url: window.location.origin + "/debug",
      data: {
        type: "stdout",
      },
    })
      .done((res) => {
        var txt = res.replace('\n', "|");
        stdout.text(txt);
      })
      .fail((res) => {
        stdout.val(`${stdout}\nCouldn't request file\n`);
      });
  }

  refresh();
});
