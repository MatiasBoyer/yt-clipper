const WRONG_ID_ERR = new Error("VideoID is invalid!");

$(document).ready(function () {
  $("#img_header_href").attr("href", window.location.origin);

  $("#f_videoSelect").submit((ev) => {
    try 
    {
      var url_parse = new URL($("#f_videoUrl").val());

      console.log(url_parse.pathname);

      if(url_parse.pathname.includes("watch"))
      {
        var vID = url_parse.searchParams.get("v");
      }
      else
      {
        vID = url_parse.pathname.replace("/", "");
      }

      if(vID == null || vID.length <= 6)
      {
        throw WRONG_ID_ERR;
        return;
      }

      window.location = window.location.origin + "/player.html?v=" + vID;
    } 
    catch (e) 
    {
      if(e instanceof TypeError)
      {
        alert("Wrong URL!");
      }
      else
      {
        alert(e);
      }
    }

    return false;
  });
});
