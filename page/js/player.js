const sv = window.location.origin;
const timeout = 60 * 15;
const check_vid_ms = 5000;
const fixed_decimals = 1;

function clamp(num, min, max) {
  return num <= min ? min : num >= max ? max : num;
}

function roundToFixed(num, fixed) {
  return (Math.round(parseFloat(num) * 100) / 100).toFixed(fixed);
}

$(document).ready(function () {
  var url_parse = new URL(window.location);
  var vID = url_parse.searchParams.get("v");

  var f_fromTime = $("#f_fromTime");
  var f_toTime = $("#f_toTime");

  var loading_back = $(".loading_back");

  CreateYTPlayer(vID, () => {
    f_fromTime.attr("max", player.getDuration());
    f_toTime.attr("max", player.getDuration());
  });

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
    //info_text.val(info_text.val() + line + "\n");
    //info_text.scrollTop(info_text[0].scrollHeight - info_text.height());
    console.log(line);
  }
  add_to_info("$(document).ready() !");

  loading_back.css("z-index", -100);
  loading_back.fadeOut(1);

  function enable_loadingfeedback(enable) {
    if (enable == true) {
      loading_back.fadeIn("slow");
      loading_back.css("z-index", 1000);
    } else {
      loading_back.fadeOut("fast");
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
            var url = sv + `/video/${reqid}.mp4`;
            window.location = url;

            enable_loadingfeedback(false);
          }, 1000);
        } else {
          add_to_info(`ERROR -> ${res["message"]}`);
          enable_loadingfeedback(false);
        }
      }
    });
  }

  $("#f_from-set").click(() => {
    var curr = parseFloat(player.getCurrentTime());
    var num = parseFloat(roundToFixed(curr, fixed_decimals));

    if (curr > f_toTime.val()) {
      f_toTime.val(num + 1);
    }

    f_fromTime.val(num);
    player.seekTo(num);
    return false;
  });

  $("#f_to-set").click(() => {
    var curr = parseFloat(player.getCurrentTime());
    var num = parseFloat(roundToFixed(curr, fixed_decimals));

    if (curr < f_fromTime.val()) {
      f_fromTime.val(num - 1);
    }

    f_toTime.val(num);
    player.seekTo(num);
    return false;
  });

  $("#f_videocontrols").focusout(() => {
    var from = parseFloat(f_fromTime.val());
    var to = parseFloat(f_toTime.val());

    if (from > to) {
      f_fromTime.val(to - 1);
    }

    if (from < 0) {
      f_fromTime.val(0);
    }

    if (to > player.getDuration()) {
      f_toTime.val(player.getDuration());
    }

    if (from > player.getDuration()) {
      f_toTime.val(5);
      f_fromTime.val(0);
    }
  });

  $("#f_submit").click((ev) => {
    $("#f_submit").prop("disabled", true);

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
      dataType: "json"
    })
      .done((res) => {
        console.log(res);
        var code = parseInt(res["code"]);
        
        switch(code)
        {
          case 1002:
            window.location = window.origin + `/video/${res["req_id"]}.mp4`;
            break;
        }
      })
      .fail((err) => {
        console.log(err["message"]);
        enable_loadingfeedback(false);

        $(this).find("button[type='submit']").prop("disabled", false);
      })
      .always(() => {
        add_to_info("[TASK] Completed $.ajax()");
      });

    return false;
  });

  $("#f_from-goto").click((ev) => {
    player.seekTo(f_fromTime.val());
    return false;
  });

  $("#f_to-goto").click((ev) => {
    player.seekTo(f_toTime.val());
    return false;
  });
});
