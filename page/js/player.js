const sv = window.location.origin;
const timeout = 3000;
const check_vid_ms = 5000;

function clamp(num, min, max) {
  return num <= min ? min : num >= max ? max : num;
}

function roundToFixed2(num) {
  return (Math.round(parseFloat(num) * 100) / 100).toFixed(2);
}

$(document).ready(function () {
  $("#img_header_href").attr("href", window.location.origin);

  var url_parse = new URL(window.location);
  var vID = url_parse.searchParams.get("v");

  CreateYTPlayer(vID);

  $("#loadinggif").hide();

  $("textarea")
    .attr("unselectable", "on")
    .css("-webkit-user-select", "none")
    .css("-moz-user-select", "none")
    .css("-ms-user-select", "none")
    .css("-o-user-select", "none")
    .css("user-select", "none")
    .on("selectstart", false)
    .on("mousedown", false);

  var info_text = $("#info_text");

  // ADD TO CMD LINE
  function add_to_info(line) {
    info_text.val(info_text.val() + line + "\n");
    info_text.scrollTop(info_text[0].scrollHeight - info_text.height());
  }
  add_to_info("$(document).ready() !");

  function enable_loadingfeedback(enable) {
    if (enable == true) {
      $("#loadinggif").show("slow");
    } else {
      $("#loadinggif").hide("slow");
    }
  }

  function doRangeCheck() {
    var f_fromTime = $("#f_fromTime");
    var f_toTime = $("#f_toTime");

    if(f_toTime.val() <= f_fromTime.val())
        {
            f_toTime.val(parseFloat(f_fromTime.val()) + 1);
        }
  }

  // CHECK REQUEST
  function check_request(reqid) {
    $.ajax({
      type: "GET",
      url: sv + "/video/status",
      data: {
        req_id: reqid,
      },
      timeout: timeout,
    }).done((res) => {
      var code = res["req_status"];
      add_to_info(`CHECK DONE -> ${code}`);

      if (code != "1002" && code != "1003") {
        add_to_info(`It did not finish. Re-running in ${check_vid_ms} ms..`);
        setTimeout(() => check_request(reqid), check_vid_ms);
      } else {
        if (code != "1003") {
          setTimeout(() => {
            var url = sv + `/video/download?req_id=${reqid}`;
            console.log(url);
            window.location = url;
          }, 1000);
        } else {
          add_to_info(`ERROR -> ${res["message"]}`);
        }
      }
    });
  }

  $("#f_from-set").click(() => {
    var num = roundToFixed2(player.getCurrentTime());
    $("#f_fromTime").val(num);

    doRangeCheck();
    player.seekTo($("#f_fromTime").val());
    return false;
  });

  $("#f_to-set").click(() => {
    var num = roundToFixed2(player.getCurrentTime());
    $("#f_toTime").val(num);

    doRangeCheck();
    player.seekTo($("#f_toTime").val());
    return false;
  });

  $("#f_videocontrols").focusout(() => {
    doRangeCheck();
  });

  $("#f_videocontrols").submit((ev) => {
    $(this).find("button[type='submit']").prop("disabled", true);

    doRangeCheck();

    var f_fromTime = $("#f_fromTime");
    var f_toTime = $("#f_toTime");

    var from = f_fromTime.val();
    var to = f_toTime.val();

    var obj_data = {
      vid_id: vID,
      from: from.toString(),
      to: to.toString(),
    };

    add_to_info(
      `[TASK]: $.ajax() requesting '${obj_data.vid_id}' ${obj_data.from}/${obj_data.to}`
    );
    enable_loadingfeedback(true);

    $.ajax({
      type: "POST",
      url: sv + "/video/request",
      data: obj_data,
      dataType: "json",
      timeout: timeout,
    })
      .done((res) => {
        add_to_info(`DONE -> ${res["req_id"]}`);
        add_to_info("Starting task checking progress");

        /*$(this).delay(1000).queue(() => 
            {
                check_request(res["req_id"])
                $(this).dequeue();
            });*/
        setTimeout(() => check_request(res["req_id"]), 4000);
      })
      .fail((err) => {
        var obj = JSON.parse(err.responseText);
        add_to_info(`ERROR -> ${obj["message"]}`);
        enable_loadingfeedback(false);

        $(this).find("button[type='submit']").prop("disabled", false);
      })
      .always(() => {
        add_to_info("[TASK] Completed $.ajax()");
      });

    return false;
  });
});
