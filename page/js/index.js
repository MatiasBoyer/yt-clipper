const sv = window.location.origin;
const timeout = 3000;

function clamp(num, min, max)
{
return num <= min 
? min 
: num >= max 
  ? max 
  : num
}

$(document).ready(function()
{
    var f_url = $("#f_url");

    var f_from_mm = $("#f_from_mm");
    var f_from_ss = $("#f_from_ss");

    var f_to_mm = $("#f_to_mm");
    var f_to_ss = $("#f_to_ss");

    $("#loadinggif").hide();

    $('textarea')
    .attr('unselectable', 'on')
    .css('-webkit-user-select', 'none')
    .css('-moz-user-select', 'none')
    .css("-ms-user-select","none")
    .css("-o-user-select","none")
    .css("user-select",'none')
    .on('selectstart', false)
    .on('mousedown', false);

    var info_text = $("#info_text");

    // ADD TO CMD LINE
    function add_to_info(line)
    {
        info_text.val(info_text.val() + line + '\n');
        info_text.scrollTop(info_text[0].scrollHeight - info_text.height());
    }
    add_to_info("$(document).ready() !");

    function enable_loadingfeedback(enable)
    {
        if(enable == true)
        {
            $("#loadinggif").show("slow");
        }
        else
        {
            $("#loadinggif").hide("slow");
        }
    }

    // CHECK REQUEST
    function check_request(reqid)
    {
        $.ajax({
            type: 'GET',
            url: sv + "/video/status",
            data: {
                req_id: reqid
            },
            timeout: timeout
        })
        .done((res) =>
        {
            var code = res["req_status"];
            add_to_info(`CHECK DONE -> ${code}`);

            if(code != "1002" && code != "1003")
            {
                add_to_info("It did not finish. Re-running in 3 sec..");
                setTimeout(() => check_request(reqid), 3000);
            }
            else
            {
                if(code != "1003")
                {
                setTimeout(() =>
                {
                    var url = sv + `/video/download?req_id=${reqid}`;
                    console.log(url);
                    window.location = url;
                }, 1000);
                }
                else
                {
                    add_to_info(`ERROR -> ${res["message"]}`);
                }
            }
        });
    }

    $("#request_form").focusout(() =>
    {
        f_from_mm.val(clamp(parseInt(f_from_mm.val()), 0, 300));
        f_from_ss.val(clamp(parseFloat(f_from_ss.val()), 0, 59.5));

        f_to_mm.val(clamp(parseInt(f_to_mm.val()), 0, 350));
        f_to_ss.val(clamp(parseInt(f_to_ss.val()), 0, 59.5));

        if(parseFloat(f_from_ss.val()) > parseFloat(f_to_ss.val()))
        {
            f_to_ss.val(f_from_ss.val());
        }

        if(parseInt(f_from_mm.val()) > parseInt(f_to_mm.val()))
        {
            f_to_mm.val(f_from_mm.val());
        }
    });

    // SUBMIT REQUEST
    $("#request_form").submit((ev) =>
    {
        $(this).find("button[type='submit']").prop('disabled', true);

        var url_parse = new URL(f_url.val());

        var from = ((parseInt(f_from_mm.val()) * 60) + parseFloat(f_from_ss.val()));
        var to = ((parseInt(f_to_mm.val()) * 60) + parseFloat(f_to_ss.val()));

        var obj_data = {
            vid_id: url_parse.searchParams.get('v'),
            from: from.toString(),
            to: to.toString()
        }

        add_to_info(`[TASK]: $.ajax() requesting '${obj_data.vid_id}' ${obj_data.from}/${obj_data.to}`);
        enable_loadingfeedback(true);

        $.ajax({
            type: 'POST',
            url: sv + "/video/request",
            data: obj_data,
            dataType: 'json',
            timeout: timeout
        })
        .done((res) =>
        {
            add_to_info(`DONE -> ${res["req_id"]}`);
            add_to_info("Starting task checking progress");

            /*$(this).delay(1000).queue(() => 
            {
                check_request(res["req_id"])
                $(this).dequeue();
            });*/
            setTimeout(() => check_request(res["req_id"]), 3000);
        })
        .fail((err) =>
        {
            var obj = JSON.parse(err.responseText);
            add_to_info(`ERROR -> ${obj["message"]}`);
            enable_loadingfeedback(false);

            $(this).find("button[type='submit']").prop('disabled', true);
        })
        .always(() =>
        {
            add_to_info("[TASK] Completed $.ajax()");
        });
        return false;
    });
});