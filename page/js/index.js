$(document).ready(function () {
  $("#img_header_href").attr("href", window.location.origin);

  $("#f_videoSelect").submit((ev) => {
    try {
      var url_parse = new URL($("#f_videoUrl").val());
      var vID = url_parse.searchParams.get("v");

      window.location = window.location.origin + "/player.html?v=" + vID;
    } catch (e) {
      alert(`Error -> ${e}`);
    }

    return false;
  });
});
