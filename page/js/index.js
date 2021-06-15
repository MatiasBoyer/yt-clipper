const sv = "http://190.55.15.72:25565";
const timeout = 3000;

$(document).ready(function()
{
    var f_url = $("#f_url");
    var f_from = $("#f_from");
    var f_to = $("#f_to");

    var info_text = $("#info_text");

    // ADD TO CMD LINE
    function add_to_info(line)
    {
        info_text.val(info_text.val() + line + '\n');
        info_text.scrollTop(info_text[0].scrollHeight - info_text.height());
    }
    add_to_info("$(document).ready() !");

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

    // SUBMIT REQUEST
    $("#request_form").submit((ev) =>
    {
        var obj_data = {
            vid_id: f_url.val(),
            from: f_from.val(),
            to: f_to.val()
        }

        add_to_info(`[TASK]: $.ajax() requesting '${obj_data.vid_id}' ${obj_data.from}/${obj_data.to}`);

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
        })
        .always(() =>
        {
            add_to_info("[TASK] Completed $.ajax()");
        });
        return false;
    });
});